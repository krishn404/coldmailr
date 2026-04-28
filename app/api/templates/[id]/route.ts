import { NextRequest, NextResponse } from 'next/server'
import { requireApiAuth } from '@/lib/api-auth'
import { supabaseAdmin } from '@/lib/supabase-admin'
import { requireOnboardingComplete } from '@/lib/onboarding/require-onboarding'

export async function GET(_req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const authResult = await requireApiAuth()
  if (!authResult.ok) return authResult.response
  const { userId } = authResult.auth
  const onboarding = await requireOnboardingComplete(authResult.auth)
  if (!onboarding.ok) return onboarding.response
  const { id } = await params

  const { data, error } = await supabaseAdmin
    .from('templates')
    .select('*')
    .eq('id', id)
    .eq('user_id', userId)
    .single()

  if (error) return NextResponse.json({ error: 'Not found' }, { status: 404 })
  return NextResponse.json({ data })
}

export async function PUT(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const authResult = await requireApiAuth()
  if (!authResult.ok) return authResult.response
  const { userId } = authResult.auth
  const onboarding = await requireOnboardingComplete(authResult.auth)
  if (!onboarding.ok) return onboarding.response
  const { id } = await params

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
    note?: string
    markUsed?: boolean
  }

  const { data: existing } = await supabaseAdmin
    .from('templates')
    .select('id, subject, context, body')
    .eq('id', id)
    .eq('user_id', userId)
    .single()
  if (!existing) return NextResponse.json({ error: 'Not found' }, { status: 404 })

  const updatePayload = {
    name: payload.name?.trim(),
    subject: payload.subject?.trim(),
    context: payload.context?.trim(),
    body: payload.body,
    tags: payload.tags,
    use_case: payload.useCase?.trim() || null,
    industry: payload.industry?.trim() || null,
    tone: payload.tone?.trim() || null,
    length_hint: payload.lengthHint?.trim() || null,
    is_pinned: payload.isPinned,
    last_used_at: payload.markUsed ? new Date().toISOString() : undefined,
  }

  const { data, error } = await supabaseAdmin
    .from('templates')
    .update(updatePayload)
    .eq('id', id)
    .eq('user_id', userId)
    .select('*')
    .single()

  if (error) return NextResponse.json({ error: 'Update failed' }, { status: 500 })

  const subjectChanged = payload.subject !== undefined && payload.subject !== existing.subject
  const contextChanged = payload.context !== undefined && payload.context !== existing.context
  const bodyChanged = payload.body !== undefined && payload.body !== existing.body

  if (subjectChanged || contextChanged || bodyChanged) {
    await supabaseAdmin.from('template_versions').insert({
      template_id: id,
      user_id: userId,
      subject: data.subject,
      context: data.context,
      body: data.body,
      note: payload.note?.trim() || 'manual update',
    })
  }

  return NextResponse.json({ data })
}

export async function DELETE(_req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const authResult = await requireApiAuth()
  if (!authResult.ok) return authResult.response
  const { userId } = authResult.auth
  const onboarding = await requireOnboardingComplete(authResult.auth)
  if (!onboarding.ok) return onboarding.response
  const { id } = await params

  const { error } = await supabaseAdmin.from('templates').delete().eq('id', id).eq('user_id', userId)
  if (error) return NextResponse.json({ error: 'Delete failed' }, { status: 500 })
  return NextResponse.json({ success: true })
}
