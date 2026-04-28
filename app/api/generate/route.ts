import { NextRequest, NextResponse } from 'next/server'
import Groq from 'groq-sdk'
import { requireApiAuth } from '@/lib/api-auth'
import { requireOnboardingComplete } from '@/lib/onboarding/require-onboarding'

export const runtime = 'nodejs'
const GROQ_MODEL = 'llama-3.3-70b-versatile'

const BLOCKED_PATTERNS = [
  '\\b(?:kill\\s+yourself|self-harm|suicide|harm\\s+myself)\\b',
  '\\b(?:make\\s+a\\s+bomb|build\\s+a\\s+bomb|explosive\\s+device)\\b',
  '\\b(?:credit\\s+card\\s+fraud|steal\\s+credentials|phishing\\s+kit)\\b',
] as const

// Lazy-initialize Groq client
function getGroq() {
  const groqApiKey = process.env.GROQ_API_KEY
  if (!groqApiKey || groqApiKey.trim().length === 0) {
    throw new Error('Missing GROQ_API_KEY: set a non-empty GROQ_API_KEY environment variable')
  }
  return new Groq({ apiKey: groqApiKey })
}

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

function buildSystemPrompt(mode: GenerateRequest['mode'], forbiddenPhrases?: string): string {
  const limits = MODE_LIMITS[mode]
  const forbiddenSection = forbiddenPhrases?.trim()
    ? `Forbidden phrases (must not appear verbatim): ${forbiddenPhrases}`
    : 'Forbidden phrases: none provided.'
  return `You write concise, high-conversion emails for career outreach, freelance pitches, and follow-ups.
Use only the provided context. Do not invent facts.
${MODE_INSTRUCTIONS[mode]}
Start with a specific opener tied to the recipient/company/prior context.
State one clear value proposition.
Include one concrete proof/example only if provided.
End with a simple, low-friction CTA.
Tone: natural, slightly informal, credible.
Avoid buzzwords, generic AI phrasing, placeholders, emojis, and over-formatting.
${forbiddenSection}
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
goal: ${req.goal || 'reply'}
recipient_email: ${req.to}

context_notes:
${req.context}`
}

function wordCount(text: string): number {
  return text.trim().split(/\s+/).filter(Boolean).length
}

function parseSubjectAndBody(output: string): { subjectLine: string; body: string } {
  const lines = output.replace(/\r/g, '').split('\n')
  const nonEmptyLines = lines.map((line) => line.trim()).filter(Boolean)
  if (nonEmptyLines.length === 0) {
    throw new Error('Model returned empty output')
  }

  const firstRaw = lines[0]?.trim() ?? ''
  if (firstRaw.toLowerCase().startsWith('subject:')) {
    return {
      subjectLine: firstRaw,
      body: lines.slice(1).join('\n').trim(),
    }
  }

  const firstNonEmpty = nonEmptyLines[0]
  const firstNonEmptyIndex = lines.findIndex((line) => line.trim() === firstNonEmpty)
  const remainingBody =
    firstNonEmptyIndex >= 0 ? lines.slice(firstNonEmptyIndex + 1).join('\n').trim() : lines.slice(1).join('\n').trim()

  return {
    subjectLine: `Subject: ${firstNonEmpty}`,
    body: remainingBody,
  }
}

function enforceLengthRange(output: string, mode: GenerateRequest['mode']): string {
  const limits = MODE_LIMITS[mode]
  const { subjectLine, body } = parseSubjectAndBody(output)
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
  const minWords = MODE_LIMITS[req.mode].min
  let bestDraft = ''
  let bestWordCount = 0

  for (let attempt = 0; attempt < 2; attempt += 1) {
    const completion = await getGroq().chat.completions.create({
      model: GROQ_MODEL,
      temperature: attempt === 0 ? 0.7 : 0.6,
      top_p: 0.9,
      max_tokens: attempt === 0 ? 220 : 260,
      frequency_penalty: 0.2,
      presence_penalty: 0.1,
      messages: [
        { role: 'system', content: buildSystemPrompt(req.mode, req.forbidden_phrases) },
        { role: 'user', content: buildUserPrompt(req) },
      ],
    })

    const text = completion.choices?.[0]?.message?.content?.trim() || ''
    const enforced = enforceLengthRange(text, req.mode)
    const body = enforced.replace(/\r/g, '').split('\n').slice(1).join('\n').trim()
    const words = wordCount(body)

    if (words > bestWordCount) {
      bestDraft = enforced
      bestWordCount = words
    }

    if (words >= minWords) {
      return enforced
    }
  }

  console.warn('[generate short draft fallback]', {
    mode: req.mode,
    minWords,
    bestWordCount,
  })
  return bestDraft
}

function matchesPattern(pattern: string, value: string): boolean {
  try {
    return new RegExp(pattern, 'i').test(value)
  } catch (error) {
    console.warn('[generate moderation invalid pattern]', { pattern, error })
    return false
  }
}

function getPolicyViolationMessage(input: string): string | null {
  const matched = BLOCKED_PATTERNS.find((pattern) => matchesPattern(pattern, input))
  if (!matched) return null
  return 'Content violates policy. Please remove harmful or unsafe instructions and try again.'
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
  // "career" is mapped to "cold" because career outreach uses the same generation constraints.
  if (value === 'career') return 'cold'
  if (value === 'follow-up') return 'follow-up'
  if (value === 'freelance') return 'freelance'
  return 'cold'
}

export async function POST(request: NextRequest) {
  let modeForLog: GenerateRequest['mode'] | 'unknown' = 'unknown'
  try {
    const authResult = await requireApiAuth()
    if (!authResult.ok) return authResult.response
    const onboarding = await requireOnboardingComplete(authResult.auth)
    if (!onboarding.ok) return onboarding.response

    const body = (await request.json()) as GenerateRequest
    if (!body.to || !body.context) {
      return NextResponse.json({ error: 'Missing required fields: to, context' }, { status: 400 })
    }

    const normalized: GenerateRequest = {
      ...body,
      mode: body.mode || modeFromOpportunityType(body.opportunity_type),
      variations: Math.min(Math.max(body.variations ?? 1, 1), 3),
    }
    modeForLog = normalized.mode

    const moderationInput = [
      normalized.to,
      normalized.context,
      normalized.recipient_name ?? '',
      normalized.role ?? '',
      normalized.company ?? '',
      normalized.prior_context ?? '',
      normalized.portfolio_links ?? '',
      normalized.key_skills ?? '',
      normalized.value_prop ?? '',
      normalized.proof ?? '',
      normalized.constraints ?? '',
      normalized.forbidden_phrases ?? '',
    ].join('\n')
    const policyMessage = getPolicyViolationMessage(moderationInput)
    if (policyMessage) {
      return NextResponse.json(
        { error: policyMessage, code: 'CONTENT_POLICY_VIOLATION' },
        { status: 422 },
      )
    }

    const drafts = await Promise.all(
      Array.from({ length: normalized.variations! }, () => generateDraft(normalized)),
    )

    const finalText =
      drafts.length === 1
        ? drafts[0]
        : drafts
            .map((draft, index) => `--- Variation ${index + 1} of ${drafts.length} ---\n${draft}`)
            .join('\n\n')

    return toTextResponse(finalText)
  } catch (error) {
    console.error({ route: '/api/generate', mode: modeForLog, error })
    return NextResponse.json({ error: 'Failed to generate email' }, { status: 500 })
  }
}
