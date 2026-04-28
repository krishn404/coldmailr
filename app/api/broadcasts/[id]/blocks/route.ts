import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';
import { requireApiAuth } from '@/lib/api-auth';
import { EmailBlock, BlockType } from '@/lib/types/block-system';

export const runtime = 'nodejs';

interface SaveBlocksRequest {
  blocks: Omit<EmailBlock, 'id' | 'broadcast_id' | 'created_at' | 'updated_at'>[];
  body_structure?: Record<string, any>;
  strategy_id?: string;
  context_id?: string;
  intent?: string;
}

/**
 * GET /api/broadcasts/[id]/blocks
 * Fetch all blocks for a broadcast
 */
export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } },
) {
  try {
    const authResult = await requireApiAuth();
    if (!authResult.ok) return authResult.response;

    const supabaseUrl = process.env.SUPABASE_URL;
    const supabaseKey = process.env.SUPABASE_ANON_KEY;

    if (!supabaseUrl || !supabaseKey) {
      return NextResponse.json({ error: 'Server configuration error' }, { status: 500 });
    }

    const supabase = createClient(supabaseUrl, supabaseKey);
    const broadcastId = params.id;

    // Verify ownership
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

    // Fetch blocks
    const { data: blocks, error: blocksError } = await supabase
      .from('email_blocks')
      .select('*')
      .eq('broadcast_id', broadcastId)
      .order('position', { ascending: true });

    if (blocksError) {
      console.error('[blocks/get error]', blocksError);
      return NextResponse.json({ error: 'Failed to fetch blocks' }, { status: 500 });
    }

    return NextResponse.json({
      broadcast_id: broadcastId,
      blocks: blocks || [],
      count: blocks?.length || 0,
    });
  } catch (error) {
    console.error('[broadcasts/blocks GET]', error);
    return NextResponse.json({ error: 'Server error' }, { status: 500 });
  }
}

/**
 * POST /api/broadcasts/[id]/blocks
 * Save or update blocks for a broadcast
 */
export async function POST(
  request: NextRequest,
  { params }: { params: { id: string } },
) {
  try {
    const authResult = await requireApiAuth();
    if (!authResult.ok) return authResult.response;

    const supabaseUrl = process.env.SUPABASE_URL;
    const supabaseKey = process.env.SUPABASE_ANON_KEY;

    if (!supabaseUrl || !supabaseKey) {
      return NextResponse.json({ error: 'Server configuration error' }, { status: 500 });
    }

    const supabase = createClient(supabaseUrl, supabaseKey);
    const broadcastId = params.id;
    const body = (await request.json()) as SaveBlocksRequest;

    // Verify ownership
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

    // Delete existing blocks first (to avoid duplicates)
    const { error: deleteError } = await supabase
      .from('email_blocks')
      .delete()
      .eq('broadcast_id', broadcastId);

    if (deleteError) {
      console.error('[blocks/delete error]', deleteError);
      return NextResponse.json({ error: 'Failed to update blocks' }, { status: 500 });
    }

    // Insert new blocks
    if (body.blocks && body.blocks.length > 0) {
      const blocksToInsert = body.blocks.map((block, index) => ({
        broadcast_id: broadcastId,
        block_type: block.block_type,
        position: block.position ?? index,
        content: block.content,
        variants: block.variants || {},
        active_variant_index: block.active_variant_index ?? 0,
        metadata: block.metadata || {},
      }));

      const { error: insertError } = await supabase
        .from('email_blocks')
        .insert(blocksToInsert);

      if (insertError) {
        console.error('[blocks/insert error]', insertError);
        return NextResponse.json({ error: 'Failed to save blocks' }, { status: 500 });
      }
    }

    // Update broadcast metadata
    const updatePayload: Record<string, any> = {
      updated_at: new Date().toISOString(),
    };

    if (body.body_structure) {
      updatePayload.body_structure = body.body_structure;
    }
    if (body.strategy_id) {
      updatePayload.strategy_id = body.strategy_id;
    }
    if (body.context_id) {
      updatePayload.context_id = body.context_id;
    }
    if (body.intent) {
      updatePayload.intent = body.intent;
    }

    const { error: updateError } = await supabase
      .from('broadcasts')
      .update(updatePayload)
      .eq('id', broadcastId);

    if (updateError) {
      console.error('[broadcast/update error]', updateError);
      return NextResponse.json({ error: 'Failed to update broadcast' }, { status: 500 });
    }

    // Fetch and return updated blocks
    const { data: updatedBlocks } = await supabase
      .from('email_blocks')
      .select('*')
      .eq('broadcast_id', broadcastId)
      .order('position', { ascending: true });

    return NextResponse.json({
      broadcast_id: broadcastId,
      blocks: updatedBlocks || [],
      count: updatedBlocks?.length || 0,
      updated_at: new Date().toISOString(),
    });
  } catch (error) {
    console.error('[broadcasts/blocks POST]', error);
    return NextResponse.json({ error: 'Server error' }, { status: 500 });
  }
}
