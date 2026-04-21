import { supabase } from '@/lib/supabase';
import { NextRequest, NextResponse } from 'next/server';

export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ tenantId: string }> }
) {
  try {
    const { tenantId } = await params

    // Fetch tenant configuration from database
    const { data: tenant, error } = await supabase
      .from('tenants')
      .select('*')
      .eq('id', tenantId)
      .single();

    if (error || !tenant) {
      return NextResponse.json(
        { error: 'Tenant not found' },
        { status: 404 }
      );
    }

    // Return white-label configuration
    return NextResponse.json({
      tenantId: tenant.id,
      name: tenant.name,
      logo: tenant.logo_url,
      accentColor: tenant.accent_color || '#3B82F6',
      domain: tenant.custom_domain,
      features: {
        aiGeneration: tenant.feature_ai_generation !== false,
        versioning: tenant.feature_versioning !== false,
        templates: tenant.feature_templates !== false,
        teamCollaboration: tenant.feature_team_collaboration === true,
        emailSending: tenant.feature_email_sending === true,
        analytics: tenant.feature_analytics === true,
      },
    });
  } catch (error) {
    console.error('[API] White-label config error:', error);
    return NextResponse.json(
      { error: 'Failed to fetch configuration' },
      { status: 500 }
    );
  }
}

export async function PUT(
  req: NextRequest,
  { params }: { params: Promise<{ tenantId: string }> }
) {
  try {
    const { tenantId } = await params
    const { data: { user } } = await supabase.auth.getUser();

    if (!user) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      );
    }

    const body = await req.json();

    // Verify user owns this tenant (in production, check user's tenant_id)
    const { data: tenant, error: fetchError } = await supabase
      .from('tenants')
      .select('*')
      .eq('id', tenantId)
      .single();

    if (fetchError || !tenant) {
      return NextResponse.json(
        { error: 'Tenant not found' },
        { status: 404 }
      );
    }

    // Update tenant configuration
    const { data: updated, error: updateError } = await supabase
      .from('tenants')
      .update({
        name: body.name,
        logo_url: body.logo,
        accent_color: body.accentColor,
        custom_domain: body.domain,
        feature_ai_generation: body.features?.aiGeneration,
        feature_versioning: body.features?.versioning,
        feature_templates: body.features?.templates,
        feature_team_collaboration: body.features?.teamCollaboration,
        feature_email_sending: body.features?.emailSending,
        feature_analytics: body.features?.analytics,
      })
      .eq('id', tenantId)
      .select()
      .single();

    if (updateError) throw updateError;

    return NextResponse.json(updated);
  } catch (error) {
    console.error('[API] White-label update error:', error);
    return NextResponse.json(
      { error: 'Failed to update configuration' },
      { status: 500 }
    );
  }
}
