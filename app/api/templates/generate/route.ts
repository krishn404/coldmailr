import { NextRequest, NextResponse } from 'next/server'
import { createHash } from 'crypto'
import Groq from 'groq-sdk'
import { requireApiAuth } from '@/lib/api-auth'
import { supabaseAdmin } from '@/lib/supabase-admin'
import { requireOnboardingComplete } from '@/lib/onboarding/require-onboarding'

const groqApiKey = process.env.GROQ_API_KEY
const model = 'llama-3.3-70b-versatile'

function cacheKey(input: { userId: string; context: string; tone: string; length: string }) {
  const raw = `${input.userId}|${input.context}|${input.tone}|${input.length}`
  return createHash('sha256').update(raw).digest('hex')
}

export async function POST(req: NextRequest) {
  const authResult = await requireApiAuth()
  if (!authResult.ok) return authResult.response
  const { userId } = authResult.auth
  const onboarding = await requireOnboardingComplete(authResult.auth)
  if (!onboarding.ok) return onboarding.response

  const payload = (await req.json()) as { context?: string; tone?: string; length?: string }
  const context = payload.context?.trim() || ''
  const tone = payload.tone?.trim() || 'professional'
  const length = payload.length?.trim() || 'medium'
  if (!context) return NextResponse.json({ error: 'context is required' }, { status: 400 })

  const key = cacheKey({ userId, context, tone, length })
  const { data: cached } = await supabaseAdmin
    .from('template_ai_cache')
    .select('subject, body')
    .eq('user_id', userId)
    .eq('cache_key', key)
    .maybeSingle()

  if (cached) return NextResponse.json({ data: { subject: cached.subject, body: cached.body, cached: true } })
  if (!groqApiKey) return NextResponse.json({ error: 'Missing GROQ_API_KEY' }, { status: 500 })

  const groq = new Groq({ apiKey: groqApiKey })
  const completion = await groq.chat.completions.create({
    model,
    temperature: 0.6,
    messages: [
      {
        role: 'system',
        content:
          'Generate a concise email template. Output plain text only with line 1 exactly "Subject: ...". Then body as 3-6 short sentences. Keep placeholders like {{firstName}} untouched.',
      },
      {
        role: 'user',
        content: `Context:\n${context}\n\nTone: ${tone}\nLength: ${length}\n\nReturn one polished outreach template.`,
      },
    ],
    max_tokens: 260,
  })

  const text = completion.choices?.[0]?.message?.content?.trim() || ''
  const lines = text.replace(/\r/g, '').split('\n')
  const first = lines[0]?.trim() || ''
  const subject = first.toLowerCase().startsWith('subject:') ? first.replace(/^subject:\s*/i, '').trim() : first
  const body = lines.slice(1).join('\n').trim()

  await supabaseAdmin.from('template_ai_cache').upsert({
    user_id: userId,
    cache_key: key,
    context,
    tone,
    length_hint: length,
    subject,
    body,
    updated_at: new Date().toISOString(),
  })

  return NextResponse.json({ data: { subject, body, cached: false } })
}
