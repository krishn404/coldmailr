// /app/api/broadcasts/route.ts

import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'
import { requireApiAuth } from '@/lib/api-auth'
import { requireOnboardingComplete } from '@/lib/onboarding/require-onboarding'

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
)

// GET: list broadcasts with filters
export async function GET(req: NextRequest) {
  try {
    const authResult = await requireApiAuth()
    if (!authResult.ok) return authResult.response
    const { userId } = authResult.auth
    const onboarding = await requireOnboardingComplete(authResult.auth)
    if (!onboarding.ok) return onboarding.response

    const { searchParams } = new URL(req.url)

    const search = searchParams.get('search') || ''
    const status = searchParams.get('status') || 'all'

    let query = supabase
      .from('broadcasts')
      .select(
        'id, subject, status, content, context, message_id, audience_count, sent_count, failed_count, created_at, updated_at, sent_at, to_email, from_email, body, body_structure, strategy_id, context_id, intent',
      )
      .eq('user_id', userId)
      .order('created_at', { ascending: false })

    if (status !== 'all') {
      query = query.eq('status', status)
    }

    if (search) {
      query = query.ilike('subject', `%${search}%`)
    }

    const { data, error } = await query

    if (error) {
      console.error('[broadcasts GET]', error)
      return NextResponse.json({ data: [], error: null })
    }

    return NextResponse.json({ data: data ?? [], error: null })
  } catch (err) {
    console.error('[broadcasts GET]', err)
    return NextResponse.json({ data: [], error: null })
  }
}

// POST: create new broadcast
export async function POST(req: NextRequest) {
  try {
    const authResult = await requireApiAuth()
    if (!authResult.ok) return authResult.response
    const { userId } = authResult.auth
    const onboarding = await requireOnboardingComplete(authResult.auth)
    if (!onboarding.ok) return onboarding.response

    const body = await req.json()

  const {
    from_email,
    fromEmail,
    to_email,
    toEmail,
    subject,
    body: emailBody,
    content,
    context,
    status,
    body_structure,
    strategy_id,
    context_id,
    intent,
    sent_at,
  } = body

    const resolvedBody = content ?? emailBody ?? ''
    const resolvedContext = context ?? ''

    const { data, error } = await supabase
      .from('broadcasts')
      .insert([
        {
          user_id: userId,
          from_email: from_email ?? fromEmail ?? '',
          to_email: to_email ?? toEmail ?? '',
          subject,
          body: resolvedBody,
          content: resolvedBody,
          context: resolvedContext,
          status: status ?? 'draft',
          body_structure: body_structure || null,
          strategy_id: strategy_id || null,
          context_id: context_id || null,
          intent: intent || null,
          sent_at: sent_at || null,
          updated_at: new Date().toISOString(),
        },
      ])
      .select()
      .single()

    if (error) {
      console.error('[API] broadcasts POST error:', error)
      return NextResponse.json({ error: 'Failed to create broadcast' }, { status: 500 })
    }

    return NextResponse.json({ data })
  } catch (err) {
    console.error('[API] broadcasts POST fatal:', err)
    return NextResponse.json({ error: 'Unexpected server error' }, { status: 500 })
  }
}
