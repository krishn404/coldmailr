import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';
import { requireApiAuth } from '@/lib/api-auth';
import { EmailContext } from '@/lib/types/block-system';

export const runtime = 'nodejs';

interface SaveContextRequest {
  broadcast_id?: string;
  recipient_name?: string;
  recipient_email?: string;
  company_name?: string;
  company_industry?: string;
  recipient_role?: string;
  recipient_pain_points?: string[];
  company_size?: string;
  context_insights?: string;
  personalization_strength?: number;
  ai_suggestions?: Record<string, any>;
}

/**
 * GET /api/email/context?broadcast_id=xxx
 * Fetch context for a broadcast
 */
export async function GET(request: NextRequest) {
  try {
    const authResult = await requireApiAuth();
    if (!authResult.ok) return authResult.response;

    const supabaseUrl = process.env.SUPABASE_URL;
    const supabaseKey = process.env.SUPABASE_ANON_KEY;

    if (!supabaseUrl || !supabaseKey) {
      return NextResponse.json({ error: 'Server configuration error' }, { status: 500 });
    }

    const supabase = createClient(supabaseUrl, supabaseKey);
    const searchParams = request.nextUrl.searchParams;
    const broadcastId = searchParams.get('broadcast_id');

    if (!broadcastId) {
      return NextResponse.json({ error: 'Missing broadcast_id parameter' }, { status: 400 });
    }

    // Verify broadcast ownership
    const { data: broadcast, error: broadcastError } = await supabase
      .from('broadcasts')
      .select('user_id')
      .eq('id', broadcastId)
      .single();

    if (broadcastError || !broadcast || broadcast.user_id !== authResult.auth) {
      return NextResponse.json(
        { error: 'Broadcast not found or unauthorized' },
        { status: 404 },
      );
    }

    // Fetch context
    const { data: context, error: contextError } = await supabase
      .from('email_contexts')
      .select('*')
      .eq('broadcast_id', broadcastId)
      .single();

    if (contextError && contextError.code !== 'PGRST116') {
      // PGRST116 = no rows found, which is acceptable
      console.error('[context/get error]', contextError);
      return NextResponse.json({ error: 'Failed to fetch context' }, { status: 500 });
    }

    return NextResponse.json({
      broadcast_id: broadcastId,
      context: context || null,
    });
  } catch (error) {
    console.error('[email/context GET]', error);
    return NextResponse.json({ error: 'Server error' }, { status: 500 });
  }
}

/**
 * POST /api/email/context
 * Save or update context for a broadcast
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
    const body = (await request.json()) as SaveContextRequest;

    if (!body.broadcast_id) {
      return NextResponse.json({ error: 'Missing broadcast_id' }, { status: 400 });
    }

    // Verify broadcast ownership
    const { data: broadcast, error: broadcastError } = await supabase
      .from('broadcasts')
      .select('user_id')
      .eq('id', body.broadcast_id)
      .single();

    if (broadcastError || !broadcast || broadcast.user_id !== authResult.auth) {
      return NextResponse.json(
        { error: 'Broadcast not found or unauthorized' },
        { status: 404 },
      );
    }

    // Check if context already exists
    const { data: existingContext } = await supabase
      .from('email_contexts')
      .select('id')
      .eq('broadcast_id', body.broadcast_id)
      .single();

    const contextPayload = {
      user_id: authResult.auth,
      broadcast_id: body.broadcast_id,
      recipient_name: body.recipient_name || null,
      recipient_email: body.recipient_email || null,
      company_name: body.company_name || null,
      company_industry: body.company_industry || null,
      recipient_role: body.recipient_role || null,
      recipient_pain_points: body.recipient_pain_points || [],
      company_size: body.company_size || null,
      context_insights: body.context_insights || null,
      personalization_strength: body.personalization_strength ?? 0,
      ai_suggestions: body.ai_suggestions || {},
      updated_at: new Date().toISOString(),
    };

    let result;

    if (existingContext) {
      // Update
      const { data, error } = await supabase
        .from('email_contexts')
        .update(contextPayload)
        .eq('broadcast_id', body.broadcast_id)
        .select();

      result = { data, error };
    } else {
      // Insert
      const { data, error } = await supabase
        .from('email_contexts')
        .insert([{ ...contextPayload, created_at: new Date().toISOString() }])
        .select();

      result = { data, error };
    }

    if (result.error) {
      console.error('[context/save error]', result.error);
      return NextResponse.json({ error: 'Failed to save context' }, { status: 500 });
    }

    return NextResponse.json({
      broadcast_id: body.broadcast_id,
      context: result.data?.[0] || null,
      saved_at: new Date().toISOString(),
    });
  } catch (error) {
    console.error('[email/context POST]', error);
    return NextResponse.json({ error: 'Server error' }, { status: 500 });
  }
}
