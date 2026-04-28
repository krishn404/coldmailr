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

  const { data: owner } = await supabaseAdmin
    .from('templates')
    .select('id')
    .eq('id', id)
    .eq('user_id', userId)
    .maybeSingle()
  if (!owner) return NextResponse.json({ error: 'Not found' }, { status: 404 })

  const { data, error } = await supabaseAdmin
    .from('template_versions')
    .select('*')
    .eq('template_id', id)
    .eq('user_id', userId)
    .order('created_at', { ascending: false })

  if (error) return NextResponse.json({ error: 'Failed to load versions' }, { status: 500 })
  return NextResponse.json({ data: data ?? [] })
}

export async function POST(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const authResult = await requireApiAuth()
  if (!authResult.ok) return authResult.response
  const { userId } = authResult.auth
  const onboarding = await requireOnboardingComplete(authResult.auth)
  if (!onboarding.ok) return onboarding.response
  const { id } = await params
  const payload = (await req.json()) as { versionId?: string; note?: string }

  if (!payload.versionId) return NextResponse.json({ error: 'versionId is required' }, { status: 400 })

  const { data: version } = await supabaseAdmin
    .from('template_versions')
    .select('id, subject, context, body')
    .eq('id', payload.versionId)
    .eq('template_id', id)
    .eq('user_id', userId)
    .single()
  if (!version) return NextResponse.json({ error: 'Version not found' }, { status: 404 })

  const { data, error } = await supabaseAdmin
    .from('templates')
    .update({
      subject: version.subject,
      context: version.context,
      body: version.body,
      updated_at: new Date().toISOString(),
    })
    .eq('id', id)
    .eq('user_id', userId)
    .select('*')
    .single()
  if (error) return NextResponse.json({ error: 'Rollback failed' }, { status: 500 })

  await supabaseAdmin.from('template_versions').insert({
    template_id: id,
    user_id: userId,
    subject: data.subject,
    context: data.context,
    body: data.body,
    note: payload.note?.trim() || `rollback:${payload.versionId}`,
  })

  return NextResponse.json({ data })
}
