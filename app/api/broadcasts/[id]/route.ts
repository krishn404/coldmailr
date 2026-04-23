// /app/api/broadcasts/[id]/route.ts

import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
)

// GET: single broadcast
export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params
    const { data, error } = await supabase
      .from('broadcasts')
      .select(`
        id,
        from_email,
        to_email,
        subject,
        body,
        content,
        context,
        status,
        audience_count,
        sent_count,
        failed_count,
        sent_at,
        created_at,
        updated_at,
        message_id
      `)
      .eq('id', id)
      .single()

    if (error) {
      console.error('[API] broadcast GET error:', error)
      return NextResponse.json({ error: 'Not found' }, { status: 404 })
    }

    return NextResponse.json({ data })
  } catch (err) {
    console.error('[API] broadcast GET fatal:', err)
    return NextResponse.json({ error: 'Unexpected server error' }, { status: 500 })
  }
}

// PUT: update status or content
export async function PUT(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params
    const body = await req.json()

    const {
      status,
      subject,
      body: emailBody,
      content,
      context,
      to_email,
      toEmail,
      from_email,
      fromEmail,
    } = body

    const { data: existing, error: fetchError } = await supabase
      .from('broadcasts')
      .select('id, status')
      .eq('id', id)
      .single()

    if (fetchError || !existing) {
      return NextResponse.json({ error: 'Broadcast not found' }, { status: 404 })
    }

    if (existing.status === 'sent' && status === 'sent') {
      return NextResponse.json({ error: 'Already sent' }, { status: 400 })
    }

    const updates: Record<string, any> = {
      updated_at: new Date().toISOString()
    }

    if (status) updates.status = status
    if (subject !== undefined) updates.subject = subject
    const resolvedContent = content ?? emailBody
    if (resolvedContent !== undefined) {
      updates.body = resolvedContent
      updates.content = resolvedContent
    }
    if (context !== undefined) updates.context = context
    const resolvedToEmail = to_email ?? toEmail
    const resolvedFromEmail = from_email ?? fromEmail
    if (resolvedToEmail !== undefined) updates.to_email = resolvedToEmail
    if (resolvedFromEmail !== undefined) updates.from_email = resolvedFromEmail

    if (status === 'sent') {
      updates.sent_at = new Date().toISOString()
    }

    let { data, error } = await supabase
      .from('broadcasts')
      .update(updates)
      .eq('id', id)
      .select()
      .single()

    // fallback if sent_at column missing
    if (error && error.code === '42703') {
      delete updates.sent_at

      const retry = await supabase
        .from('broadcasts')
        .update(updates)
        .eq('id', id)
        .select()
        .single()

      if (retry.error) {
        console.error('[API] broadcasts PUT retry error:', retry.error)
        return NextResponse.json({ error: 'Update failed' }, { status: 500 })
      }

      return NextResponse.json({ data: retry.data })
    }

    if (error) {
      console.error('[API] broadcasts PUT error:', error)
      return NextResponse.json({ error: 'Update failed' }, { status: 500 })
    }

    return NextResponse.json({ data })
  } catch (err) {
    console.error('[API] broadcasts PUT fatal:', err)
    return NextResponse.json({ error: 'Unexpected server error' }, { status: 500 })
  }
}

// DELETE: remove broadcast
export async function DELETE(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params
    const { error } = await supabase
      .from('broadcasts')
      .delete()
      .eq('id', id)

    if (error) {
      console.error('[API] broadcasts DELETE error:', error)
      return NextResponse.json({ error: 'Delete failed' }, { status: 500 })
    }

    return NextResponse.json({ success: true })
  } catch (err) {
    console.error('[API] broadcasts DELETE fatal:', err)
    return NextResponse.json({ error: 'Unexpected server error' }, { status: 500 })
  }
}