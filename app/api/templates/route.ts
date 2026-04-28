import { NextRequest, NextResponse } from 'next/server'
import { requireApiAuth } from '@/lib/api-auth'
import { supabaseAdmin } from '@/lib/supabase-admin'
import { DEFAULT_TEMPLATE_CATALOG } from '@/lib/default-template-catalog'
import { requireOnboardingComplete } from '@/lib/onboarding/require-onboarding'

function parseCsv(input: string | null): string[] {
  if (!input) return []
  return input
    .split(',')
    .map((item) => item.trim())
    .filter(Boolean)
}

export async function GET(req: NextRequest) {
  try {
    const authResult = await requireApiAuth()
    if (!authResult.ok) return authResult.response
    const { userId } = authResult.auth
    const onboarding = await requireOnboardingComplete(authResult.auth)
    if (!onboarding.ok) return onboarding.response

    const { searchParams } = new URL(req.url)
    const search = searchParams.get('search')?.trim() ?? ''
    const useCase = searchParams.get('useCase')?.trim() ?? ''
    const industry = searchParams.get('industry')?.trim() ?? ''
    const tone = searchParams.get('tone')?.trim() ?? ''
    const length = searchParams.get('length')?.trim() ?? ''
    const tags = parseCsv(searchParams.get('tags'))

    let query = supabaseAdmin
      .from('templates')
      .select('*')
      .eq('user_id', userId)
      .order('is_pinned', { ascending: false })
      .order('last_used_at', { ascending: false, nullsFirst: false })
      .order('updated_at', { ascending: false })

    if (search) {
      query = query.or(`name.ilike.%${search}%,subject.ilike.%${search}%,context.ilike.%${search}%,body.ilike.%${search}%`)
    }
    if (useCase) query = query.eq('use_case', useCase)
    if (industry) query = query.eq('industry', industry)
    if (tone) query = query.eq('tone', tone)
    if (length) query = query.eq('length_hint', length)
    if (tags.length) query = query.contains('tags', tags)

    let { data, error } = await query
    if (error) throw error
    if (!data || data.length === 0) {
      const seedRows = DEFAULT_TEMPLATE_CATALOG.map((template) => ({
        user_id: userId,
        name: template.name,
        subject: template.subject,
        context: template.context,
        body: template.body,
        tags: template.tags,
        use_case: template.use_case,
        industry: null,
        tone: template.tone,
        length_hint: template.length_hint,
        is_pinned: Boolean(template.is_pinned),
      }))
      const inserted = await supabaseAdmin.from('templates').insert(seedRows).select('*')
      if (!inserted.error && inserted.data?.length) {
        data = inserted.data
      }
    }
    return NextResponse.json({ data: data ?? [] })
  } catch (error) {
    console.error('[templates GET]', error)
    return NextResponse.json({ error: 'Failed to fetch templates' }, { status: 500 })
  }
}

export async function POST(req: NextRequest) {
  try {
    const authResult = await requireApiAuth()
    if (!authResult.ok) return authResult.response
    const { userId } = authResult.auth
    const onboarding = await requireOnboardingComplete(authResult.auth)
    if (!onboarding.ok) return onboarding.response

    const payload = (await req.json()) as {
      name?: string
      subject?: string
      context?: string
      body?: string
      tags?: string[]
      useCase?: string
      industry?: string
      tone?: string
      lengthHint?: string
      isPinned?: boolean
      sourceBroadcastId?: string
    }

    if (!payload.subject?.trim() || !payload.context?.trim() || !payload.body?.trim()) {
      return NextResponse.json({ error: 'subject, context, and body are required' }, { status: 400 })
    }

    const insertPayload = {
      user_id: userId,
      name: payload.name?.trim() || payload.subject.trim(),
      subject: payload.subject.trim(),
      context: payload.context.trim(),
      body: payload.body,
      tags: payload.tags?.filter(Boolean) ?? [],
      use_case: payload.useCase?.trim() || null,
      industry: payload.industry?.trim() || null,
      tone: payload.tone?.trim() || null,
      length_hint: payload.lengthHint?.trim() || null,
      is_pinned: Boolean(payload.isPinned),
      source_broadcast_id: payload.sourceBroadcastId || null,
      last_used_at: null as string | null,
    }

    const { data, error } = await supabaseAdmin.from('templates').insert(insertPayload).select('*').single()
    if (error) throw error

    await supabaseAdmin.from('template_versions').insert({
      template_id: data.id,
      user_id: userId,
      subject: data.subject,
      context: data.context,
      body: data.body,
      note: 'initial',
    })

    return NextResponse.json({ data }, { status: 201 })
  } catch (error) {
    console.error('[templates POST]', error)
    return NextResponse.json({ error: 'Failed to create template' }, { status: 500 })
  }
}
