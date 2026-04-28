import { NextRequest, NextResponse } from 'next/server';
import Groq from 'groq-sdk';
import { requireApiAuth } from '@/lib/api-auth';
import { EmailContext } from '@/lib/types/block-system';

export const runtime = 'nodejs';

const GROQ_MODEL = 'llama-3.3-70b-versatile';
const groqApiKey = process.env.GROQ_API_KEY;

if (!groqApiKey || groqApiKey.trim().length === 0) {
  throw new Error('Missing GROQ_API_KEY');
}

const groq = new Groq({ apiKey: groqApiKey });

interface AnalyzeContextRequest {
  recipient_name?: string;
  company_name?: string;
  company_industry?: string;
  recipient_role?: string;
  context_notes?: string;
}

function calculatePersonalizationStrength(context: Partial<EmailContext>): number {
  let strength = 0;
  let maxPoints = 0;

  // Recipient name (25%)
  if (context.recipient_name?.trim()) strength += 0.25;
  maxPoints += 0.25;

  // Company (20%)
  if (context.company_name?.trim()) strength += 0.2;
  maxPoints += 0.2;

  // Role (15%)
  if (context.recipient_role?.trim()) strength += 0.15;
  maxPoints += 0.15;

  // Industry (15%)
  if (context.company_industry?.trim()) strength += 0.15;
  maxPoints += 0.15;

  // Context insights (25%)
  if (context.context_insights?.trim() && context.context_insights.length > 20) strength += 0.25;
  maxPoints += 0.25;

  return maxPoints > 0 ? strength / maxPoints : 0;
}

async function generateContextSuggestions(context: Partial<EmailContext>): Promise<string[]> {
  const prompt = `Based on the following recipient and company information, generate 2-3 specific, personalized context points that could be used in a cold email to make it more relevant and compelling.

Recipient: ${context.recipient_name || 'Unknown'}
Company: ${context.company_name || 'Unknown'}
Role: ${context.recipient_role || 'Not specified'}
Industry: ${context.company_industry || 'Not specified'}
Current Context: ${context.context_insights || 'None provided'}

Generate ONLY 2-3 bullet points (short, actionable context insights), one per line. No numbering, no extra formatting. Each should be a single sentence (max 20 words).`;

  try {
    const completion = await groq.chat.completions.create({
      model: GROQ_MODEL,
      temperature: 0.7,
      max_tokens: 150,
      messages: [
        {
          role: 'system',
          content:
            'You are an expert at identifying personalization opportunities for cold emails. Generate specific, actionable context points that make emails more relevant.',
        },
        { role: 'user', content: prompt },
      ],
    });

    const response = completion.choices?.[0]?.message?.content?.trim() || '';
    return response
      .split('\n')
      .filter((line) => line.trim().length > 0)
      .slice(0, 3)
      .map((line) => line.replace(/^[-•*]\s*/, '').trim());
  } catch (error) {
    console.error('[context analysis error]', error);
    return [];
  }
}

export async function POST(request: NextRequest) {
  try {
    const authResult = await requireApiAuth();
    if (!authResult.ok) return authResult.response;

    const body = (await request.json()) as AnalyzeContextRequest;

    const context: Partial<EmailContext> = {
      recipient_name: body.recipient_name,
      company_name: body.company_name,
      company_industry: body.company_industry,
      recipient_role: body.recipient_role,
      context_insights: body.context_notes,
    };

    const personalizationStrength = calculatePersonalizationStrength(context);
    const suggestions = await generateContextSuggestions(context);

    return NextResponse.json({
      context,
      personalization_strength: personalizationStrength,
      ai_suggestions: suggestions,
      analysis_timestamp: new Date().toISOString(),
    });
  } catch (error) {
    console.error('[context/analyze]', error);
    return NextResponse.json({ error: 'Failed to analyze context' }, { status: 500 });
  }
}
