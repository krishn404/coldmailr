-- ==========================================
-- COMPLETE BLOCK-BASED EMAIL SYSTEM SETUP
-- Run this file once in your Supabase database
-- ==========================================

-- Enable UUID extension if not already enabled
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- ==========================================
-- STRATEGIES TABLE
-- Stores strategy definitions that drive generation
-- ==========================================
CREATE TABLE IF NOT EXISTS public.strategies (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id TEXT NOT NULL,
  intent VARCHAR(50) NOT NULL CHECK (intent IN ('cold', 'freelance', 'follow_up', 'custom')),
  name TEXT NOT NULL,
  description TEXT,
  tone VARCHAR(50) CHECK (tone IN ('casual', 'professional', 'persuasive', 'urgent', 'friendly')),
  hooks TEXT[] DEFAULT '{}',
  personalization_hints TEXT[] DEFAULT '{}',
  cta_types TEXT[] DEFAULT '{}',
  is_system BOOLEAN DEFAULT false,
  usage_count INTEGER DEFAULT 0,
  success_score FLOAT DEFAULT 0.0,
  last_used_at TIMESTAMPTZ,
  metadata JSONB DEFAULT '{}',
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_strategies_user_id ON public.strategies(user_id);
CREATE INDEX IF NOT EXISTS idx_strategies_intent ON public.strategies(intent);
CREATE INDEX IF NOT EXISTS idx_strategies_user_intent ON public.strategies(user_id, intent);

-- ==========================================
-- EMAIL CONTEXTS TABLE
-- Structured context for personalization
-- ==========================================
CREATE TABLE IF NOT EXISTS public.email_contexts (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id TEXT NOT NULL,
  broadcast_id UUID REFERENCES public.broadcasts(id) ON DELETE CASCADE,
  recipient_name VARCHAR(255),
  recipient_email VARCHAR(255),
  company_name VARCHAR(255),
  company_industry VARCHAR(255),
  recipient_role VARCHAR(255),
  recipient_pain_points TEXT[] DEFAULT '{}',
  company_size VARCHAR(50),
  context_insights TEXT,
  personalization_strength FLOAT DEFAULT 0.0,
  ai_suggestions JSONB DEFAULT '{}',
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_email_contexts_broadcast_id ON public.email_contexts(broadcast_id);
CREATE INDEX IF NOT EXISTS idx_email_contexts_user_id ON public.email_contexts(user_id);

-- ==========================================
-- EMAIL BLOCKS TABLE
-- Individual editable blocks per email
-- ==========================================
CREATE TABLE IF NOT EXISTS public.email_blocks (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  broadcast_id UUID NOT NULL REFERENCES public.broadcasts(id) ON DELETE CASCADE,
  block_type VARCHAR(50) NOT NULL CHECK (block_type IN ('hook', 'personalization', 'value', 'cta', 'signature', 'custom')),
  position INTEGER NOT NULL,
  content TEXT NOT NULL,
  variants JSONB DEFAULT '{}',
  active_variant_index INTEGER DEFAULT 0,
  metadata JSONB DEFAULT '{}',
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_email_blocks_broadcast_id ON public.email_blocks(broadcast_id, position);
CREATE INDEX IF NOT EXISTS idx_email_blocks_block_type ON public.email_blocks(block_type);

-- ==========================================
-- BLOCK VARIANTS CACHE
-- Pre-generated variants for instant switching
-- ==========================================
CREATE TABLE IF NOT EXISTS public.block_variants_cache (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id TEXT NOT NULL,
  block_type VARCHAR(50) NOT NULL,
  context_hash VARCHAR(64) NOT NULL,
  strategy_id UUID REFERENCES public.strategies(id) ON DELETE CASCADE,
  variants JSONB NOT NULL,
  created_at TIMESTAMPTZ DEFAULT now(),
  expires_at TIMESTAMPTZ DEFAULT (now() + INTERVAL '24 hours')
);

CREATE INDEX IF NOT EXISTS idx_block_variants_user_id ON public.block_variants_cache(user_id);
CREATE INDEX IF NOT EXISTS idx_block_variants_context_hash ON public.block_variants_cache(user_id, context_hash);

-- ==========================================
-- EXTEND BROADCASTS TABLE
-- Add columns for block-based system
-- ==========================================
ALTER TABLE public.broadcasts ADD COLUMN IF NOT EXISTS body_structure JSONB DEFAULT NULL;
ALTER TABLE public.broadcasts ADD COLUMN IF NOT EXISTS strategy_id UUID REFERENCES public.strategies(id) ON DELETE SET NULL;
ALTER TABLE public.broadcasts ADD COLUMN IF NOT EXISTS context_id UUID REFERENCES public.email_contexts(id) ON DELETE SET NULL;
ALTER TABLE public.broadcasts ADD COLUMN IF NOT EXISTS intent VARCHAR(50);
ALTER TABLE public.broadcasts ADD COLUMN IF NOT EXISTS reply_detected BOOLEAN DEFAULT false;
ALTER TABLE public.broadcasts ADD COLUMN IF NOT EXISTS reply_at TIMESTAMPTZ;

CREATE INDEX IF NOT EXISTS idx_broadcasts_strategy_id ON public.broadcasts(strategy_id);
CREATE INDEX IF NOT EXISTS idx_broadcasts_context_id ON public.broadcasts(context_id);
CREATE INDEX IF NOT EXISTS idx_broadcasts_intent ON public.broadcasts(intent);

-- ==========================================
-- INSERT DEFAULT SYSTEM STRATEGIES
-- ==========================================
INSERT INTO public.strategies (user_id, intent, name, description, tone, is_system, hooks, personalization_hints, cta_types, usage_count, success_score)
VALUES (
  'system',
  'cold',
  'Cold Outreach - Direct Value',
  'Direct approach emphasizing specific value proposition',
  'professional',
  true,
  ARRAY[
    'Noticed your work in...',
    'Saw your company is...',
    'Found your profile and was impressed by...',
    'Your recent post about... caught my attention'
  ],
  ARRAY[
    'Mention specific achievement or award',
    'Reference recent news or funding round',
    'Note shared connection or mutual contact',
    'Reference specific job change or promotion'
  ],
  ARRAY['Quick call', 'Brief 15-minute conversation', 'Check your availability'],
  0,
  0.85
)
ON CONFLICT DO NOTHING;

INSERT INTO public.strategies (user_id, intent, name, description, tone, is_system, hooks, personalization_hints, cta_types, usage_count, success_score)
VALUES (
  'system',
  'cold',
  'Cold Outreach - Problem-Focused',
  'Lead with a problem the recipient likely faces',
  'professional',
  true,
  ARRAY[
    'Most [role] struggle with...',
    'I noticed [company] might be facing...',
    'Your industry typically deals with...',
    'Companies like yours often challenge with...'
  ],
  ARRAY[
    'Cite industry-specific pain point',
    'Reference competitor strategy',
    'Mention common team challenge',
    'Reference market trend'
  ],
  ARRAY['Schedule a brief discussion', 'Quick 20-minute call', 'Share your thoughts'],
  0,
  0.78
)
ON CONFLICT DO NOTHING;

INSERT INTO public.strategies (user_id, intent, name, description, tone, is_system, hooks, personalization_hints, cta_types, usage_count, success_score)
VALUES (
  'system',
  'freelance',
  'Freelance Pitch - Collaborative',
  'Collaborative tone emphasizing mutual benefit',
  'friendly',
  true,
  ARRAY[
    'Your recent project caught my eye',
    'I admire how you...',
    'I''ve been following your work...',
    'I''ve seen some great things you''ve done...'
  ],
  ARRAY[
    'Cite specific case study or project',
    'Mention relevant industry expertise',
    'Reference shared values or mission',
    'Note impressive results or portfolio piece'
  ],
  ARRAY[
    'Chat about potential fit',
    'Schedule a discovery call',
    'Share my portfolio and get your thoughts',
    'Grab coffee or quick call'
  ],
  0,
  0.81
)
ON CONFLICT DO NOTHING;

INSERT INTO public.strategies (user_id, intent, name, description, tone, is_system, hooks, personalization_hints, cta_types, usage_count, success_score)
VALUES (
  'system',
  'follow_up',
  'Follow-up - Soft Reengagement',
  'Gentle reengagement without being pushy',
  'casual',
  true,
  ARRAY[
    'Circling back on...',
    'Wanted to follow up on...',
    'Just checking in...',
    'Adding one more thought...'
  ],
  ARRAY[
    'Reference specific previous message',
    'Add new valuable insight or resource',
    'Acknowledge time that has passed',
    'Highlight new development'
  ],
  ARRAY[
    'Only if you''re interested',
    'No pressure, just wanted to follow up',
    'Let me know if still relevant',
    'Happy to discuss further'
  ],
  0,
  0.72
)
ON CONFLICT DO NOTHING;

-- ==========================================
-- ROW LEVEL SECURITY (RLS) POLICIES
-- Ensure users only see their own data
-- ==========================================
ALTER TABLE public.strategies ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.email_contexts ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.email_blocks ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.block_variants_cache ENABLE ROW LEVEL SECURITY;

-- Strategies: users see their own + system strategies
CREATE POLICY IF NOT EXISTS strategies_select ON public.strategies
  FOR SELECT USING (user_id = 'system' OR auth.uid()::text = user_id);

CREATE POLICY IF NOT EXISTS strategies_insert ON public.strategies
  FOR INSERT WITH CHECK (auth.uid()::text = user_id);

CREATE POLICY IF NOT EXISTS strategies_update ON public.strategies
  FOR UPDATE USING (auth.uid()::text = user_id) WITH CHECK (auth.uid()::text = user_id);

CREATE POLICY IF NOT EXISTS strategies_delete ON public.strategies
  FOR DELETE USING (auth.uid()::text = user_id AND is_system = false);

-- Email contexts: users see only their broadcasts' contexts
CREATE POLICY IF NOT EXISTS email_contexts_select ON public.email_contexts
  FOR SELECT USING (auth.uid()::text = user_id);

CREATE POLICY IF NOT EXISTS email_contexts_insert ON public.email_contexts
  FOR INSERT WITH CHECK (auth.uid()::text = user_id);

CREATE POLICY IF NOT EXISTS email_contexts_update ON public.email_contexts
  FOR UPDATE USING (auth.uid()::text = user_id) WITH CHECK (auth.uid()::text = user_id);

CREATE POLICY IF NOT EXISTS email_contexts_delete ON public.email_contexts
  FOR DELETE USING (auth.uid()::text = user_id);

-- Email blocks: users see blocks from their broadcasts only
CREATE POLICY IF NOT EXISTS email_blocks_select ON public.email_blocks
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM public.broadcasts
      WHERE broadcasts.id = email_blocks.broadcast_id
      AND broadcasts.user_id = auth.uid()::text
    )
  );

CREATE POLICY IF NOT EXISTS email_blocks_insert ON public.email_blocks
  FOR INSERT WITH CHECK (
    EXISTS (
      SELECT 1 FROM public.broadcasts
      WHERE broadcasts.id = email_blocks.broadcast_id
      AND broadcasts.user_id = auth.uid()::text
    )
  );

CREATE POLICY IF NOT EXISTS email_blocks_update ON public.email_blocks
  FOR UPDATE USING (
    EXISTS (
      SELECT 1 FROM public.broadcasts
      WHERE broadcasts.id = email_blocks.broadcast_id
      AND broadcasts.user_id = auth.uid()::text
    )
  ) WITH CHECK (
    EXISTS (
      SELECT 1 FROM public.broadcasts
      WHERE broadcasts.id = email_blocks.broadcast_id
      AND broadcasts.user_id = auth.uid()::text
    )
  );

CREATE POLICY IF NOT EXISTS email_blocks_delete ON public.email_blocks
  FOR DELETE USING (
    EXISTS (
      SELECT 1 FROM public.broadcasts
      WHERE broadcasts.id = email_blocks.broadcast_id
      AND broadcasts.user_id = auth.uid()::text
    )
  );

-- Block variants cache: users only see their own cache
CREATE POLICY IF NOT EXISTS block_variants_select ON public.block_variants_cache
  FOR SELECT USING (auth.uid()::text = user_id);

CREATE POLICY IF NOT EXISTS block_variants_insert ON public.block_variants_cache
  FOR INSERT WITH CHECK (auth.uid()::text = user_id);

CREATE POLICY IF NOT EXISTS block_variants_delete ON public.block_variants_cache
  FOR DELETE USING (auth.uid()::text = user_id);

-- ==========================================
-- SUMMARY
-- ==========================================
-- Tables created:
-- - strategies: 4 default system strategies pre-loaded
-- - email_contexts: structured personalization data
-- - email_blocks: individual email blocks
-- - block_variants_cache: pre-generated variants (24h TTL)
-- - broadcasts: extended with body_structure, strategy_id, context_id, intent
--
-- All tables have RLS enabled with proper user isolation
-- Indexes optimized for common queries
-- ==========================================
