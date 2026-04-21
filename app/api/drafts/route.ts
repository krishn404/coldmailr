import { createClient } from '@/lib/supabase';
import { NextRequest, NextResponse } from 'next/server';

export async function GET(req: NextRequest) {
  try {
    const supabase = createClient();
    const { data: { user } } = await supabase.auth.getUser();

    if (!user) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      );
    }

    const { data: drafts, error } = await supabase
      .from('drafts')
      .select('*')
      .eq('user_id', user.id)
      .order('updated_at', { ascending: false })
      .limit(10);

    if (error) throw error;

    return NextResponse.json(drafts);
  } catch (error) {
    console.error('[API] Error fetching drafts:', error);
    return NextResponse.json(
      { error: 'Failed to fetch drafts' },
      { status: 500 }
    );
  }
}

export async function POST(req: NextRequest) {
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
    const { from, to, cc, bcc, subject, body: emailBody, context } = body;

    const { data: draft, error } = await supabase
      .from('drafts')
      .insert({
        user_id: user.id,
        from,
        to,
        cc,
        bcc,
        subject,
        body: emailBody,
        context,
      })
      .select()
      .single();

    if (error) throw error;

    return NextResponse.json(draft, { status: 201 });
  } catch (error) {
    console.error('[API] Error creating draft:', error);
    return NextResponse.json(
      { error: 'Failed to create draft' },
      { status: 500 }
    );
  }
}
