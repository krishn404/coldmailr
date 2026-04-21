import { createClient } from '@/lib/supabase';
import { NextRequest, NextResponse } from 'next/server';

export async function GET(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const supabase = createClient();
    const { data: { user } } = await supabase.auth.getUser();

    if (!user) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      );
    }

    // First verify the draft belongs to the user
    const { data: draft } = await supabase
      .from('drafts')
      .select('id')
      .eq('id', params.id)
      .eq('user_id', user.id)
      .single();

    if (!draft) {
      return NextResponse.json(
        { error: 'Draft not found' },
        { status: 404 }
      );
    }

    const { data: versions, error } = await supabase
      .from('draft_versions')
      .select('*')
      .eq('draft_id', params.id)
      .order('created_at', { ascending: false });

    if (error) throw error;

    return NextResponse.json(versions);
  } catch (error) {
    console.error('[API] Error fetching versions:', error);
    return NextResponse.json(
      { error: 'Failed to fetch versions' },
      { status: 500 }
    );
  }
}

export async function POST(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const supabase = createClient();
    const { data: { user } } = await supabase.auth.getUser();

    if (!user) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      );
    }

    const body = await req.json();
    const { subject, emailBody, context } = body;

    const { data: version, error } = await supabase
      .from('draft_versions')
      .insert({
        draft_id: params.id,
        subject,
        body: emailBody,
        context,
      })
      .select()
      .single();

    if (error) throw error;

    return NextResponse.json(version, { status: 201 });
  } catch (error) {
    console.error('[API] Error creating version:', error);
    return NextResponse.json(
      { error: 'Failed to create version' },
      { status: 500 }
    );
  }
}
