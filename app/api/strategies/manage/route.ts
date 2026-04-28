import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';
import { requireApiAuth } from '@/lib/api-auth';
import { Intent, Strategy } from '@/lib/types/block-system';

export const runtime = 'nodejs';

interface CreateStrategyRequest {
  intent: Intent;
  name: string;
  description?: string;
  tone?: string;
  hooks?: string[];
  personalization_hints?: string[];
  cta_types?: string[];
  metadata?: Record<string, any>;
}

interface UpdateStrategyRequest {
  id: string;
  name?: string;
  description?: string;
  tone?: string;
  hooks?: string[];
  personalization_hints?: string[];
  cta_types?: string[];
  metadata?: Record<string, any>;
  usage_count?: number;
  success_score?: number;
}

/**
 * POST /api/strategies/manage
 * Create a new user strategy
 */
export async function POST(request: NextRequest) {
  try {
    const authResult = await requireApiAuth();
    if (!authResult.ok) return authResult.response;

    const supabaseUrl = process.env.SUPABASE_URL;
    const supabaseKey = process.env.SUPABASE_ANON_KEY;

    if (!supabaseUrl || !supabaseKey) {
      return NextResponse.json({ error: 'Server configuration error' }, { status: 500 });
    }

    const supabase = createClient(supabaseUrl, supabaseKey);
    const body = (await request.json()) as CreateStrategyRequest;

    if (!body.intent || !body.name) {
      return NextResponse.json(
        { error: 'Missing required fields: intent, name' },
        { status: 400 },
      );
    }

    const { data, error } = await supabase
      .from('strategies')
      .insert([
        {
          user_id: authResult.auth,
          intent: body.intent,
          name: body.name,
          description: body.description || null,
          tone: body.tone || null,
          hooks: body.hooks || [],
          personalization_hints: body.personalization_hints || [],
          cta_types: body.cta_types || [],
          is_system: false,
          metadata: body.metadata || {},
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString(),
        },
      ])
      .select()
      .single();

    if (error) {
      console.error('[strategy/create error]', error);
      return NextResponse.json({ error: 'Failed to create strategy' }, { status: 500 });
    }

    return NextResponse.json(
      {
        strategy: data,
        created_at: new Date().toISOString(),
      },
      { status: 201 },
    );
  } catch (error) {
    console.error('[strategies/manage POST]', error);
    return NextResponse.json({ error: 'Server error' }, { status: 500 });
  }
}

/**
 * PUT /api/strategies/manage
 * Update an existing strategy
 */
export async function PUT(request: NextRequest) {
  try {
    const authResult = await requireApiAuth();
    if (!authResult.ok) return authResult.response;

    const supabaseUrl = process.env.SUPABASE_URL;
    const supabaseKey = process.env.SUPABASE_ANON_KEY;

    if (!supabaseUrl || !supabaseKey) {
      return NextResponse.json({ error: 'Server configuration error' }, { status: 500 });
    }

    const supabase = createClient(supabaseUrl, supabaseKey);
    const body = (await request.json()) as UpdateStrategyRequest;

    if (!body.id) {
      return NextResponse.json({ error: 'Missing strategy id' }, { status: 400 });
    }

    // Verify ownership
    const { data: strategy, error: fetchError } = await supabase
      .from('strategies')
      .select('user_id, is_system')
      .eq('id', body.id)
      .single();

    if (fetchError || !strategy) {
      return NextResponse.json({ error: 'Strategy not found' }, { status: 404 });
    }

    if (strategy.user_id !== authResult.auth || strategy.is_system) {
      return NextResponse.json(
        { error: 'Cannot modify system strategies or strategies from other users' },
        { status: 403 },
      );
    }

    // Build update payload (only include provided fields)
    const updatePayload: Record<string, any> = {
      updated_at: new Date().toISOString(),
    };

    if (body.name !== undefined) updatePayload.name = body.name;
    if (body.description !== undefined) updatePayload.description = body.description;
    if (body.tone !== undefined) updatePayload.tone = body.tone;
    if (body.hooks !== undefined) updatePayload.hooks = body.hooks;
    if (body.personalization_hints !== undefined)
      updatePayload.personalization_hints = body.personalization_hints;
    if (body.cta_types !== undefined) updatePayload.cta_types = body.cta_types;
    if (body.metadata !== undefined) updatePayload.metadata = body.metadata;
    if (body.usage_count !== undefined) updatePayload.usage_count = body.usage_count;
    if (body.success_score !== undefined) updatePayload.success_score = body.success_score;

    const { data, error } = await supabase
      .from('strategies')
      .update(updatePayload)
      .eq('id', body.id)
      .select()
      .single();

    if (error) {
      console.error('[strategy/update error]', error);
      return NextResponse.json({ error: 'Failed to update strategy' }, { status: 500 });
    }

    return NextResponse.json({
      strategy: data,
      updated_at: new Date().toISOString(),
    });
  } catch (error) {
    console.error('[strategies/manage PUT]', error);
    return NextResponse.json({ error: 'Server error' }, { status: 500 });
  }
}

/**
 * DELETE /api/strategies/manage?id=xxx
 * Delete a user strategy
 */
export async function DELETE(request: NextRequest) {
  try {
    const authResult = await requireApiAuth();
    if (!authResult.ok) return authResult.response;

    const searchParams = request.nextUrl.searchParams;
    const strategyId = searchParams.get('id');

    if (!strategyId) {
      return NextResponse.json({ error: 'Missing strategy id parameter' }, { status: 400 });
    }

    // Verify ownership
    const { data: strategy, error: fetchError } = await supabase
      .from('strategies')
      .select('user_id, is_system')
      .eq('id', strategyId)
      .single();

    if (fetchError || !strategy) {
      return NextResponse.json({ error: 'Strategy not found' }, { status: 404 });
    }

    if (strategy.user_id !== authResult.auth || strategy.is_system) {
      return NextResponse.json(
        { error: 'Cannot delete system strategies or strategies from other users' },
        { status: 403 },
      );
    }

    const { error } = await supabase.from('strategies').delete().eq('id', strategyId);

    if (error) {
      console.error('[strategy/delete error]', error);
      return NextResponse.json({ error: 'Failed to delete strategy' }, { status: 500 });
    }

    return NextResponse.json({
      deleted: true,
      strategy_id: strategyId,
    });
  } catch (error) {
    console.error('[strategies/manage DELETE]', error);
    return NextResponse.json({ error: 'Server error' }, { status: 500 });
  }
}
