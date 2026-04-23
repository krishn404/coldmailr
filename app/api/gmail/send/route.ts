import { NextResponse } from 'next/server'
import { google } from 'googleapis'
import { getAuthorizedClient, getSessionCookie } from '@/lib/gmail-auth'
import { supabaseAdmin } from '@/lib/supabase-admin'
import { fromDbStatus, toDbStatus } from '@/lib/broadcast-status'

type SendBody = {
  to: string
  subject: string
  body: string
  broadcastId?: string
  idempotencyKey?: string
  context?: string
  fromEmail?: string
}

async function updateBroadcastWithMessageIdFallback(
  broadcastId: string,
  values: Record<string, unknown>,
) {
  const primary = await supabaseAdmin
    .from('broadcasts')
    .update(values)
    .eq('id', broadcastId)
    .neq('status', 'sent')
    .select('id, status, updated_at, sent_at, message_id')
    .single()

  if (!primary.error) return primary
  if (primary.error.code !== '42703') return primary

  const fallbackValues = { ...values }
  delete fallbackValues.message_id

  return supabaseAdmin
    .from('broadcasts')
    .update(fallbackValues)
    .eq('id', broadcastId)
    .neq('status', 'sent')
    .select('id, status, updated_at, sent_at')
    .single()
}

function toBase64Url(input: string) {
  return Buffer.from(input)
    .toString('base64')
    .replace(/\+/g, '-')
    .replace(/\//g, '_')
    .replace(/=+$/g, '')
}

export async function POST(request: Request) {
  const url = new URL(request.url)
  const redirectUri = process.env.GOOGLE_REDIRECT_URI ?? `${url.origin}/api/google/callback`

  try {
    const payload = (await request.json()) as SendBody
    if (!payload.to || !payload.subject || !payload.body) {
      return NextResponse.json({ error: 'Missing to, subject, or body' }, { status: 400 })
    }
    if (!payload.broadcastId) {
      return NextResponse.json({ error: 'broadcastId is required for send consistency' }, { status: 400 })
    }
    if (!payload.idempotencyKey) {
      return NextResponse.json({ error: 'idempotencyKey is required' }, { status: 400 })
    }
    try {
      const recovery = await supabaseAdmin
        .from('broadcast_send_recovery_jobs')
        .select('id, status, message_id')
        .eq('broadcast_id', payload.broadcastId)
        .eq('message_id', payload.idempotencyKey)
        .maybeSingle()
      if (recovery.data) {
        return NextResponse.json(
          {
            error: 'Duplicate send prevented by idempotency key',
            recoveryQueued: recovery.data.status === 'pending',
          },
          { status: 409 },
        )
      }
    } catch {
      // Recovery table may not exist in fresh environments.
    }

    const lookup = await supabaseAdmin
      .from('broadcasts')
      .select('id, status, message_id, sent_at')
      .eq('id', payload.broadcastId)
      .single()

    if (lookup.error) {
      return NextResponse.json({ error: 'Broadcast not found' }, { status: 404 })
    }

    const existingStatus = fromDbStatus(lookup.data.status)
    if (existingStatus === 'sent') {
      return NextResponse.json(
        {
          error: 'Broadcast is already sent. Duplicate it to send again.',
          id: lookup.data.id,
          status: 'sent',
          sentAt: lookup.data.sent_at,
          messageId: lookup.data.message_id,
        },
        { status: 409 },
      )
    }

    const auth = await getAuthorizedClient(redirectUri)
    const session = await getSessionCookie()
    if (!auth || !session?.email) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const gmail = google.gmail({ version: 'v1', auth })
    const nowIso = new Date().toISOString()
    const audienceCount = 1
    await supabaseAdmin
      .from('broadcasts')
      .update({
        status: 'sending',
        content: payload.body,
        body: payload.body,
        context: payload.context || '',
        to_email: payload.to,
        subject: payload.subject,
        from_email: payload.fromEmail || session.email || '',
        audience_count: audienceCount,
        updated_at: nowIso,
      })
      .eq('id', payload.broadcastId)

    const rawMessage = [
      `From: ${session.email}`,
      `To: ${payload.to}`,
      `Subject: ${payload.subject}`,
      'Content-Type: text/plain; charset="UTF-8"',
      '',
      payload.body,
    ].join('\r\n')

    const encodedMessage = toBase64Url(rawMessage)

    const sent = await gmail.users.messages.send({
      userId: 'me',
      requestBody: {
        raw: encodedMessage,
      },
    })

    const sentAt = new Date().toISOString()
    const messageId = sent.data.id ?? null
    let persisted = false
    let retryError: unknown = null
    for (let attempt = 1; attempt <= 3; attempt += 1) {
      const values: Record<string, unknown> = {
        status: toDbStatus('sent'),
        sent_at: sentAt,
        updated_at: sentAt,
        audience_count: audienceCount,
        sent_count: audienceCount,
        failed_count: 0,
        to_email: payload.to,
        subject: payload.subject,
        body: payload.body,
        content: payload.body,
        context: payload.context || '',
        from_email: payload.fromEmail || session.email || '',
      }
      if (messageId || payload.idempotencyKey) {
        values.message_id = messageId || payload.idempotencyKey
      }
      const update = await updateBroadcastWithMessageIdFallback(payload.broadcastId, values)

      if (!update.error) {
        persisted = true
        return NextResponse.json({
          success: true,
          id: update.data.id,
          status: fromDbStatus(update.data.status),
          updatedAt: update.data.updated_at,
          sentAt: update.data.sent_at,
          messageId: (update.data as { message_id?: string | null })?.message_id ?? null,
          threadId: sent.data.threadId ?? null,
        })
      }
      retryError = update.error
    }

    // Recovery fallback: queue retry metadata for async repair.
    try {
      await supabaseAdmin.from('broadcast_send_recovery_jobs').insert({
        broadcast_id: payload.broadcastId,
        message_id: messageId || payload.idempotencyKey,
        sent_at: sentAt,
        payload: payload,
      })
    } catch (queueError) {
      console.error('[API] gmail/send recovery queue failed', queueError)
    }

    if (!persisted) {
      console.error('[API] gmail/send db persistence failed after send', {
        broadcastId: payload.broadcastId,
        idempotencyKey: payload.idempotencyKey,
        retryError,
      })
      return NextResponse.json(
        {
          error: 'Email sent, but broadcast status persistence is delayed. Recovery queued.',
          recoveryQueued: true,
          messageId: messageId || payload.idempotencyKey,
        },
        { status: 502 },
      )
    }

    return NextResponse.json({
      success: true,
      id: sent.data.id ?? null,
      threadId: sent.data.threadId ?? null,
    })
  } catch (error) {
    try {
      const payload = (await request.clone().json()) as SendBody
      if (payload?.broadcastId) {
        await supabaseAdmin
          .from('broadcasts')
          .update({
            status: 'failed',
            content: payload.body,
            body: payload.body,
            context: payload.context || '',
            failed_count: 1,
            audience_count: 1,
            updated_at: new Date().toISOString(),
          })
          .eq('id', payload.broadcastId)
      }
    } catch {
      // best-effort status fallback
    }
    console.error('[API] gmail/send error', error)
    return NextResponse.json({ error: 'Failed to send Gmail message' }, { status: 500 })
  }
}
