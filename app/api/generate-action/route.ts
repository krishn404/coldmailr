import { NextRequest, NextResponse } from 'next/server';
import Groq from 'groq-sdk';
import { requireApiAuth } from '@/lib/api-auth'
import { requireOnboardingComplete } from '@/lib/onboarding/require-onboarding'

export const runtime = 'nodejs';
const GROQ_MODEL = 'llama-3.3-70b-versatile';

const BLOCKED_PATTERNS = [
  '\\b(?:kill\\s+yourself|self-harm|suicide|harm\\s+myself)\\b',
  '\\b(?:make\\s+a\\s+bomb|build\\s+a\\s+bomb|explosive\\s+device)\\b',
  '\\b(?:credit\\s+card\\s+fraud|steal\\s+credentials|phishing\\s+kit)\\b',
] as const;

const ACTION_SYSTEM_PROMPTS = {
  improve:
    'You are an expert email editor. Improve clarity, flow, and effectiveness while preserving core intent and tone.',
  shorten:
    'You are an expert email editor. Make the email significantly shorter while preserving key meaning and CTA.',
  formalize:
    'You are an expert email editor. Rewrite the email in a more professional and formal tone.',
  simplify:
    'You are an expert email editor. Rewrite using simpler language and shorter sentences without losing intent.',
  add_cta:
    'You are an expert email editor. Strengthen the email with a clear, low-friction call-to-action.',
} as const;
const FALLBACK_SYSTEM_PROMPT =
  'You are an expert email editor. Improve the email for clarity, structure, and conversion while preserving intent.';
type ActionKey = keyof typeof ACTION_SYSTEM_PROMPTS;

// Lazy-initialize Groq client
function getGroq() {
  const groqApiKey = process.env.GROQ_API_KEY;
  if (!groqApiKey || groqApiKey.trim().length === 0) {
    throw new Error('Missing GROQ_API_KEY: set a non-empty GROQ_API_KEY environment variable');
  }
  return new Groq({ apiKey: groqApiKey });
}

interface ActionRequest {
  action?: unknown;
  body: string;
  prompt: string;
}

type StreamChunk = {
  type: string;
  delta?: { type?: string; text?: string };
};

type MessageStreamClient = {
  messages: {
    stream: (args: {
      model: string;
      max_tokens: number;
      messages: Array<{ role: 'system' | 'user'; content: string }>;
    }) => Promise<AsyncIterable<StreamChunk>>;
  };
};

function getGroqStreamClient() {
  return getGroq() as unknown as MessageStreamClient;
}

function matchesPattern(pattern: string, value: string): boolean {
  try {
    return new RegExp(pattern, 'i').test(value);
  } catch (error) {
    console.warn('[action moderation invalid pattern]', { pattern, error });
    return false;
  }
}

function getPolicyViolationMessage(input: string): string | null {
  const matched = BLOCKED_PATTERNS.find((pattern) => matchesPattern(pattern, input));
  if (!matched) return null;
  return 'Content violates policy. Please remove harmful or unsafe instructions and try again.';
}

function normalizeAction(action: unknown): string {
  if (typeof action !== 'string') return 'improve';
  const trimmed = action.trim();
  if (trimmed.length === 0) return 'improve';
  return trimmed;
}

function resolveSystemPrompt(action: string): string {
  if (action in ACTION_SYSTEM_PROMPTS) {
    return ACTION_SYSTEM_PROMPTS[action as ActionKey];
  }
  console.warn('[action] Unknown action, using fallback:', action);
  return FALLBACK_SYSTEM_PROMPT;
}

export async function POST(request: NextRequest) {
  let actionForLog = 'unknown';
  try {
    const authResult = await requireApiAuth()
    if (!authResult.ok) return authResult.response
    const onboarding = await requireOnboardingComplete(authResult.auth)
    if (!onboarding.ok) return onboarding.response

    const data = (await request.json()) as ActionRequest;
    const action = normalizeAction(data.action);
    actionForLog = action;

    if (!data.body || !data.prompt) {
      return NextResponse.json(
        { error: 'Missing required fields: body, prompt' },
        { status: 400 }
      );
    }

    const policyMessage = getPolicyViolationMessage(`${data.body}\n${data.prompt}`);
    if (policyMessage) {
      return NextResponse.json(
        { error: policyMessage, code: 'CONTENT_POLICY_VIOLATION' },
        { status: 422 }
      );
    }

    const systemPrompt = resolveSystemPrompt(action);
    const userPrompt = `ACTION: ${action}

EMAIL TO EDIT:
${data.body}

ADDITIONAL INSTRUCTIONS (follow only if they do not contradict the action):
${data.prompt}`;

    // Use streaming for real-time generation
    const response = await getGroqStreamClient().messages.stream({
      model: GROQ_MODEL,
      max_tokens: 500,
      messages: [
        {
          role: 'system',
          content: systemPrompt,
        },
        {
          role: 'user',
          content: userPrompt,
        },
      ],
    });

    // Create a ReadableStream to send the response
    const encoder = new TextEncoder();
    const stream = new ReadableStream({
      async start(controller) {
        try {
          for await (const chunk of response) {
            if (chunk.type === 'content_block_delta') {
              const delta = chunk.delta;
              if (delta?.type === 'text_delta' && delta.text) {
                controller.enqueue(encoder.encode(delta.text));
              }
            }
          }
          controller.close();
        } catch (error) {
          console.error({ route: '/api/generate-action', action: actionForLog, error });
          controller.error(error);
        }
      },
    });

    return new NextResponse(stream, {
      headers: {
        'Content-Type': 'text/plain; charset=utf-8',
        'Transfer-Encoding': 'chunked',
      },
    });
  } catch (error) {
    console.error({ route: '/api/generate-action', action: actionForLog, error });
    return NextResponse.json(
      { error: 'Failed to generate' },
      { status: 500 }
    );
  }
}
