import { NextRequest, NextResponse } from 'next/server'
import Groq from 'groq-sdk'

export const runtime = 'nodejs'

const groq = new Groq({
  apiKey: process.env.GROQ_API_KEY,
})

interface GenerateRequest {
  to: string
  mode: 'cold' | 'freelance' | 'follow-up'
  context: string
  recipient_name?: string
  role?: string
  company?: string
  opportunity_type?: 'career' | 'freelance' | 'follow-up'
  prior_context?: string
  portfolio_links?: string
  key_skills?: string
  value_prop?: string
  proof?: string
  constraints?: string
  forbidden_phrases?: string
  goal?: 'reply' | 'meeting'
  variations?: number
}

const MODE_LIMITS: Record<GenerateRequest['mode'], { min: number; max: number }> = {
  cold: { min: 80, max: 130 },
  freelance: { min: 90, max: 130 },
  'follow-up': { min: 60, max: 100 },
}

const MODE_INSTRUCTIONS: Record<GenerateRequest['mode'], string> = {
  cold: 'cold mode: 80-130 words, light personalization + value + low-friction CTA.',
  freelance:
    'freelance mode: 90-130 words, emphasize fit + proof + portfolio mention where available.',
  'follow-up': 'follow-up mode: 60-100 words, recap + value reminder + soft nudge CTA.',
}

function buildSystemPrompt(mode: GenerateRequest['mode']): string {
  const limits = MODE_LIMITS[mode]
  return `You write concise, high-conversion emails for career outreach, freelance pitches, and follow-ups.
Use only the provided context. Do not invent facts.
${MODE_INSTRUCTIONS[mode]}
Start with a specific opener tied to the recipient/company/prior context.
State one clear value proposition.
Include one concrete proof/example only if provided.
End with a simple, low-friction CTA.
Tone: natural, slightly informal, credible.
Avoid buzzwords, generic AI phrasing, placeholders, emojis, and over-formatting.
Output plain text only.
Line 1 must be "Subject: ...".
Body must be 3-6 sentences and ${limits.min}-${limits.max} words.`
}

function buildUserPrompt(req: GenerateRequest): string {
  return `recipient_name: ${req.recipient_name || ''}
role: ${req.role || ''}
company: ${req.company || ''}
opportunity_type: ${req.opportunity_type || req.mode}
prior_context: ${req.prior_context || ''}
portfolio_links: ${req.portfolio_links || ''}
key_skills: ${req.key_skills || ''}
value_prop: ${req.value_prop || ''}
proof: ${req.proof || ''}
constraints: ${req.constraints || ''}
forbidden_phrases: ${req.forbidden_phrases || ''}
goal: ${req.goal || 'reply'}
recipient_email: ${req.to}

context_notes:
${req.context}`
}

function wordCount(text: string): number {
  return text.trim().split(/\s+/).filter(Boolean).length
}

function enforceLengthRange(output: string, mode: GenerateRequest['mode']): string {
  const limits = MODE_LIMITS[mode]
  const lines = output.replace(/\r/g, '').split('\n')
  const subjectLine = lines[0]?.startsWith('Subject:') ? lines[0] : 'Subject: Quick note'
  const body = lines.slice(1).join('\n').trim()
  const words = wordCount(body)

  if (words <= limits.max) return `${subjectLine}\n${body}`

  const trimmedBody = body
    .split(/\s+/)
    .slice(0, limits.max)
    .join(' ')
    .replace(/[;,:\-]$/, '.')
  return `${subjectLine}\n${trimmedBody}`
}

async function generateDraft(req: GenerateRequest): Promise<string> {
  const completion = await groq.chat.completions.create({
    model: 'llama-3.3-70b-versatile',
    temperature: 0.7,
    top_p: 0.9,
    max_tokens: 220,
    frequency_penalty: 0.2,
    presence_penalty: 0.1,
    messages: [
      { role: 'system', content: buildSystemPrompt(req.mode) },
      { role: 'user', content: buildUserPrompt(req) },
    ],
  })

  const text = completion.choices?.[0]?.message?.content?.trim() || ''
  return enforceLengthRange(text, req.mode)
}

function toTextResponse(text: string) {
  const encoder = new TextEncoder()
  const stream = new ReadableStream({
    start(controller) {
      controller.enqueue(encoder.encode(text))
      controller.close()
    },
  })

  return new NextResponse(stream, {
    headers: {
      'Content-Type': 'text/plain; charset=utf-8',
      'Transfer-Encoding': 'chunked',
    },
  })
}

function modeFromOpportunityType(value?: GenerateRequest['opportunity_type']): GenerateRequest['mode'] {
  if (value === 'follow-up') return 'follow-up'
  if (value === 'freelance') return 'freelance'
  return 'cold'
}

export async function POST(request: NextRequest) {
  try {
    const body = (await request.json()) as GenerateRequest
    if (!body.to || !body.context) {
      return NextResponse.json({ error: 'Missing required fields: to, context' }, { status: 400 })
    }

    const normalized: GenerateRequest = {
      ...body,
      mode: body.mode || modeFromOpportunityType(body.opportunity_type),
      variations: Math.min(Math.max(body.variations ?? 1, 1), 3),
    }

    const drafts = await Promise.all(
      Array.from({ length: normalized.variations! }, () => generateDraft(normalized)),
    )

    const finalText =
      drafts.length === 1
        ? drafts[0]
        : drafts.map((draft, index) => `Variation ${index + 1}\n${draft}`).join('\n\n')

    return toTextResponse(finalText)
  } catch (error) {
    console.error('[API] Generation error:', error)
    return NextResponse.json({ error: 'Failed to generate email' }, { status: 500 })
  }
}
