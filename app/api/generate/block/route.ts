import { NextRequest, NextResponse } from 'next/server';
import Groq from 'groq-sdk';
import { requireApiAuth } from '@/lib/api-auth';
import { BlockType, EmailContext } from '@/lib/types/block-system';

export const runtime = 'nodejs';

const GROQ_MODEL = 'llama-3.3-70b-versatile';

interface GenerateBlockRequest {
  block_type: BlockType;
  strategy_id: string;
  context: Partial<EmailContext>;
  previous_content?: string;
  tone?: string;
}

const BLOCK_PROMPTS: Record<BlockType, string> = {
  hook: `Write a compelling opening hook for a cold email (1-2 sentences, max 30 words).
The hook should grab attention by referencing something specific about the recipient or their company.
Make it personal, specific, and value-focused.
Do not use generic openers like "I hope this email finds you well".
Output only the hook text, no prefix or explanation.`,

  personalization: `Write a personalization sentence that connects the sender to the recipient (1 sentence, max 25 words).
Reference something specific: a recent achievement, shared connection, mutual interest, or relevant detail.
Make it feel natural and credible, not forced.
Output only the personalization text, no prefix or explanation.`,

  value: `Write a clear value proposition explaining why the recipient should care (2-3 sentences, max 50 words).
Focus on the benefit to the recipient, not about the sender.
Be specific and concrete, not generic.
Avoid marketing buzzwords.
Output only the value proposition text, no prefix or explanation.`,

  cta: `Write a clear, low-friction call-to-action (1 sentence, max 20 words).
The CTA should be easy to say yes to (e.g., "brief call", "quick chat", "feedback").
Avoid pushy language.
Output only the CTA text, no prefix or explanation.`,

  signature: `Write a professional email signature (2-3 lines).
Include: sender name, title/role, company, phone, website/LinkedIn (optional).
Keep it concise and professional.
Output only the signature text, no prefix or explanation.`,

  custom: `Write relevant custom email content based on the context provided (2-3 sentences, max 100 words).
Output only the content text, no prefix or explanation.`,
};

function buildBlockSystemPrompt(blockType: BlockType, tone?: string): string {
  const basePrompt = BLOCK_PROMPTS[blockType];
  const toneSection = tone ? `\nTone: ${tone}` : '';
  return `You are an expert cold email copywriter specializing in short, high-converting email blocks.
${basePrompt}${toneSection}
Be concise, natural, and authentic. Avoid AI-sounding language, buzzwords, and placeholder text.`;
}

function buildBlockUserPrompt(context: Partial<EmailContext>): string {
  return `Recipient: ${context.recipient_name || 'Unknown'}
Company: ${context.company_name || 'Unknown'}
Role: ${context.recipient_role || 'Not specified'}
Industry: ${context.company_industry || 'Not specified'}
Additional Context: ${context.context_insights || 'None provided'}

Generate the content based on this information.`;
}

async function generateBlockContent(
  blockType: BlockType,
  context: Partial<EmailContext>,
  tone?: string,
): Promise<string> {
  const groqApiKey = process.env.GROQ_API_KEY;
  if (!groqApiKey || groqApiKey.trim().length === 0) {
    console.error('[generate/block] Missing GROQ_API_KEY');
    return '';
  }

  const groq = new Groq({ apiKey: groqApiKey });
  const completion = await groq.chat.completions.create({
    model: GROQ_MODEL,
    temperature: 0.7,
    top_p: 0.9,
    max_tokens: 150,
    messages: [
      { role: 'system', content: buildBlockSystemPrompt(blockType, tone) },
      { role: 'user', content: buildBlockUserPrompt(context) },
    ],
  });

  return completion.choices?.[0]?.message?.content?.trim() || '';
}

async function generateBlockVariants(
  blockType: BlockType,
  context: Partial<EmailContext>,
  tone?: string,
  count: number = 2,
): Promise<string[]> {
  const groqApiKey = process.env.GROQ_API_KEY;
  if (!groqApiKey || groqApiKey.trim().length === 0) {
    console.error('[generate/block variants] Missing GROQ_API_KEY');
    return [];
  }

  const groq = new Groq({ apiKey: groqApiKey });
  const variants: string[] = [];

  for (let i = 0; i < count; i++) {
    const completion = await groq.chat.completions.create({
      model: GROQ_MODEL,
      temperature: 0.8 + i * 0.1, // Increase temperature for more variety
      top_p: 0.9,
      max_tokens: 150,
      messages: [
        { role: 'system', content: buildBlockSystemPrompt(blockType, tone) },
        { role: 'user', content: buildBlockUserPrompt(context) },
      ],
    });

    const content = completion.choices?.[0]?.message?.content?.trim();
    if (content) {
      variants.push(content);
    }
  }

  return variants;
}

export async function POST(request: NextRequest) {
  try {
    const authResult = await requireApiAuth();
    if (!authResult.ok) return authResult.response;

    const body = (await request.json()) as GenerateBlockRequest;

    if (!body.block_type || !body.context) {
      return NextResponse.json(
        { error: 'Missing required fields: block_type, context' },
        { status: 400 },
      );
    }

    const mainContent = await generateBlockContent(body.block_type, body.context, body.tone);
    const variants = await generateBlockVariants(body.block_type, body.context, body.tone, 2);

    return NextResponse.json({
      block_type: body.block_type,
      content: mainContent,
      variants: variants,
      generated_at: new Date().toISOString(),
    });
  } catch (error) {
    console.error('[generate/block]', error);
    return NextResponse.json({ error: 'Failed to generate block content' }, { status: 500 });
  }
}
