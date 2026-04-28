import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';
import { requireApiAuth } from '@/lib/api-auth';
import { Intent, Strategy, StrategyCard, EmailContext } from '@/lib/types/block-system';

export const runtime = 'nodejs';

const supabaseUrl = process.env.SUPABASE_URL;
const supabaseKey = process.env.SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseKey) {
  throw new Error('Missing Supabase configuration');
}

const supabase = createClient(supabaseUrl, supabaseKey);

interface FetchStrategiesRequest {
  intent: Intent;
  context?: Partial<EmailContext>;
}

function calculateMatchScore(strategy: Strategy, context?: Partial<EmailContext>): number {
  if (!context) return 0.7; // Default score if no context
  
  let score = 0;
  let factors = 0;

  // Recipient name
  if (context.recipient_name) {
    score += 0.2;
    factors += 0.2;
  }

  // Company name
  if (context.company_name) {
    score += 0.2;
    factors += 0.2;
  }

  // Role
  if (context.recipient_role) {
    score += 0.15;
    factors += 0.15;
  }

  // Industry
  if (context.company_industry) {
    score += 0.15;
    factors += 0.15;
  }

  // Context insights
  if (context.context_insights?.length && context.context_insights.length > 10) {
    score += 0.3;
    factors += 0.3;
  }

  return factors > 0 ? score / factors : 0.5;
}

async function getStrategiesForIntent(intent: Intent, userId: string): Promise<Strategy[]> {
  try {
    const { data, error } = await supabase
      .from('strategies')
      .select('*')
      .eq('intent', intent)
      .or(`user_id.eq.${userId},user_id.eq.system`)
      .order('is_system', { ascending: false })
      .order('success_score', { ascending: false })
      .limit(10);

    if (error) {
      console.error('[strategies fetch error]', error);
      return [];
    }

    return data || [];
  } catch (error) {
    console.error('[strategies fetch exception]', error);
    return [];
  }
}

export async function POST(request: NextRequest) {
  try {
    const authResult = await requireApiAuth();
    if (!authResult.ok) return authResult.response;

    const body = (await request.json()) as FetchStrategiesRequest;

    if (!body.intent) {
      return NextResponse.json({ error: 'Missing intent' }, { status: 400 });
    }

    const strategies = await getStrategiesForIntent(body.intent, authResult.auth);

    const strategyCards: StrategyCard[] = strategies
      .slice(0, 3) // Top 3 strategies
      .map((strategy) => ({
        strategy,
        matchScore: calculateMatchScore(strategy, body.context),
        variants: strategy.hooks?.length || 3,
      }))
      .sort((a, b) => b.matchScore - a.matchScore);

    return NextResponse.json({
      intent: body.intent,
      strategies: strategyCards,
      total: strategies.length,
    });
  } catch (error) {
    console.error('[strategies]', error);
    return NextResponse.json({ error: 'Failed to fetch strategies' }, { status: 500 });
  }
}

export async function GET(request: NextRequest) {
  try {
    const authResult = await requireApiAuth();
    if (!authResult.ok) return authResult.response;

    const searchParams = request.nextUrl.searchParams;
    const intent = searchParams.get('intent') as Intent | null;

    if (!intent) {
      return NextResponse.json({ error: 'Missing intent parameter' }, { status: 400 });
    }

    const strategies = await getStrategiesForIntent(intent, authResult.auth);

    return NextResponse.json({
      intent,
      strategies,
      total: strategies.length,
    });
  } catch (error) {
    console.error('[strategies GET]', error);
    return NextResponse.json({ error: 'Failed to fetch strategies' }, { status: 500 });
  }
}
