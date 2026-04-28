import { Client } from 'pg'

let ensurePromise: Promise<void> | null = null

const ENSURE_SQL = `
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
CREATE TABLE IF NOT EXISTS public.broadcasts (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id TEXT NOT NULL,
  from_email TEXT,
  to_email TEXT NOT NULL DEFAULT '',
  subject TEXT,
  body TEXT DEFAULT '',
  context TEXT,
  status TEXT NOT NULL DEFAULT 'draft' CHECK (status IN ('draft', 'scheduled', 'sent')),
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  sent_at TIMESTAMPTZ,
  message_id TEXT
);
ALTER TABLE public.broadcasts ADD COLUMN IF NOT EXISTS sent_at TIMESTAMPTZ;
ALTER TABLE public.broadcasts ADD COLUMN IF NOT EXISTS message_id TEXT;
ALTER TABLE public.broadcasts ADD COLUMN IF NOT EXISTS user_id TEXT;
ALTER TABLE public.broadcasts ADD COLUMN IF NOT EXISTS subject TEXT;
ALTER TABLE public.broadcasts ADD COLUMN IF NOT EXISTS content TEXT;
ALTER TABLE public.broadcasts ADD COLUMN IF NOT EXISTS context TEXT;
ALTER TABLE public.broadcasts ADD COLUMN IF NOT EXISTS status TEXT DEFAULT 'draft';
ALTER TABLE public.broadcasts ADD COLUMN IF NOT EXISTS audience_count INTEGER DEFAULT 0;
ALTER TABLE public.broadcasts ADD COLUMN IF NOT EXISTS sent_count INTEGER DEFAULT 0;
ALTER TABLE public.broadcasts ADD COLUMN IF NOT EXISTS failed_count INTEGER DEFAULT 0;
ALTER TABLE public.broadcasts ADD COLUMN IF NOT EXISTS created_at TIMESTAMPTZ DEFAULT NOW();
ALTER TABLE public.broadcasts ADD COLUMN IF NOT EXISTS updated_at TIMESTAMPTZ DEFAULT NOW();
ALTER TABLE public.broadcasts ALTER COLUMN to_email SET DEFAULT '';
DO $$
BEGIN
  IF EXISTS (
    SELECT 1
    FROM pg_constraint
    WHERE conname = 'broadcasts_status_check'
      AND conrelid = 'public.broadcasts'::regclass
  ) THEN
    ALTER TABLE public.broadcasts DROP CONSTRAINT broadcasts_status_check;
  END IF;
END $$;
ALTER TABLE public.broadcasts
  ADD CONSTRAINT broadcasts_status_check
  CHECK (status IN ('draft', 'scheduled', 'sending', 'sent', 'failed'));
CREATE INDEX IF NOT EXISTS idx_broadcasts_status ON public.broadcasts(status);
CREATE INDEX IF NOT EXISTS idx_broadcasts_created_at ON public.broadcasts(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_broadcasts_user_id ON public.broadcasts(user_id);
CREATE INDEX IF NOT EXISTS idx_broadcasts_user_id_created_at ON public.broadcasts(user_id, created_at DESC);
DELETE FROM public.broadcasts WHERE user_id IS NULL OR user_id = '';
ALTER TABLE public.broadcasts ALTER COLUMN user_id SET NOT NULL;
ALTER TABLE public.broadcasts ENABLE ROW LEVEL SECURITY;
DO $$
BEGIN
  IF EXISTS (
    SELECT 1
    FROM pg_policies
    WHERE schemaname = 'public'
      AND tablename = 'broadcasts'
      AND policyname = 'broadcasts_select_all'
  ) THEN
    DROP POLICY broadcasts_select_all ON public.broadcasts;
  END IF;
END $$;
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1
    FROM pg_policies
    WHERE schemaname = 'public'
      AND tablename = 'broadcasts'
      AND policyname = 'broadcasts_user_select'
  ) THEN
    CREATE POLICY broadcasts_user_select ON public.broadcasts
      FOR SELECT
      USING (auth.uid()::text = user_id);
  END IF;
END $$;
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1
    FROM pg_policies
    WHERE schemaname = 'public'
      AND tablename = 'broadcasts'
      AND policyname = 'broadcasts_user_insert'
  ) THEN
    CREATE POLICY broadcasts_user_insert ON public.broadcasts
      FOR INSERT
      WITH CHECK (auth.uid()::text = user_id);
  END IF;
END $$;
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1
    FROM pg_policies
    WHERE schemaname = 'public'
      AND tablename = 'broadcasts'
      AND policyname = 'broadcasts_user_update'
  ) THEN
    CREATE POLICY broadcasts_user_update ON public.broadcasts
      FOR UPDATE
      USING (auth.uid()::text = user_id)
      WITH CHECK (auth.uid()::text = user_id);
  END IF;
END $$;
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1
    FROM pg_policies
    WHERE schemaname = 'public'
      AND tablename = 'broadcasts'
      AND policyname = 'broadcasts_user_delete'
  ) THEN
    CREATE POLICY broadcasts_user_delete ON public.broadcasts
      FOR DELETE
      USING (auth.uid()::text = user_id);
  END IF;
END $$;
CREATE TABLE IF NOT EXISTS public.broadcast_send_recovery_jobs (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  broadcast_id UUID NOT NULL,
  user_id TEXT NOT NULL,
  message_id TEXT,
  sent_at TIMESTAMPTZ NOT NULL,
  payload JSONB NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  status TEXT NOT NULL DEFAULT 'pending'
);
CREATE INDEX IF NOT EXISTS idx_broadcast_recovery_user_id ON public.broadcast_send_recovery_jobs(user_id);
CREATE TABLE IF NOT EXISTS public.templates (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id TEXT NOT NULL,
  name TEXT NOT NULL,
  subject TEXT NOT NULL,
  context TEXT NOT NULL,
  body TEXT NOT NULL,
  tags TEXT[] NOT NULL DEFAULT '{}',
  use_case TEXT,
  industry TEXT,
  tone TEXT,
  length_hint TEXT,
  is_pinned BOOLEAN NOT NULL DEFAULT false,
  source_broadcast_id UUID,
  last_used_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);
CREATE INDEX IF NOT EXISTS idx_templates_user_id_updated_at ON public.templates(user_id, updated_at DESC);
CREATE INDEX IF NOT EXISTS idx_templates_user_id_last_used_at ON public.templates(user_id, last_used_at DESC);
CREATE INDEX IF NOT EXISTS idx_templates_user_id_pinned ON public.templates(user_id, is_pinned);
CREATE TABLE IF NOT EXISTS public.template_versions (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  template_id UUID NOT NULL REFERENCES public.templates(id) ON DELETE CASCADE,
  user_id TEXT NOT NULL,
  subject TEXT NOT NULL,
  context TEXT NOT NULL,
  body TEXT NOT NULL,
  note TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);
CREATE INDEX IF NOT EXISTS idx_template_versions_template_id_created_at ON public.template_versions(template_id, created_at DESC);
CREATE TABLE IF NOT EXISTS public.template_ai_cache (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id TEXT NOT NULL,
  cache_key TEXT NOT NULL,
  context TEXT NOT NULL,
  tone TEXT NOT NULL,
  length_hint TEXT NOT NULL,
  subject TEXT NOT NULL,
  body TEXT NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  UNIQUE (user_id, cache_key)
);
CREATE INDEX IF NOT EXISTS idx_template_ai_cache_user_id_created_at ON public.template_ai_cache(user_id, created_at DESC);

-- ==========================================
-- BLOCK-BASED EMAIL SYSTEM TABLES
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
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);
CREATE INDEX IF NOT EXISTS idx_strategies_user_id ON public.strategies(user_id);
CREATE INDEX IF NOT EXISTS idx_strategies_intent ON public.strategies(intent);
CREATE INDEX IF NOT EXISTS idx_strategies_user_intent ON public.strategies(user_id, intent);

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
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);
CREATE INDEX IF NOT EXISTS idx_email_contexts_broadcast_id ON public.email_contexts(broadcast_id);
CREATE INDEX IF NOT EXISTS idx_email_contexts_user_id ON public.email_contexts(user_id);

CREATE TABLE IF NOT EXISTS public.email_blocks (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  broadcast_id UUID NOT NULL REFERENCES public.broadcasts(id) ON DELETE CASCADE,
  block_type VARCHAR(50) NOT NULL CHECK (block_type IN ('hook', 'personalization', 'value', 'cta', 'signature', 'custom')),
  position INTEGER NOT NULL,
  content TEXT NOT NULL,
  variants JSONB DEFAULT '{}',
  active_variant_index INTEGER DEFAULT 0,
  metadata JSONB DEFAULT '{}',
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);
CREATE INDEX IF NOT EXISTS idx_email_blocks_broadcast_id ON public.email_blocks(broadcast_id, position);
CREATE INDEX IF NOT EXISTS idx_email_blocks_block_type ON public.email_blocks(block_type);

CREATE TABLE IF NOT EXISTS public.block_variants_cache (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id TEXT NOT NULL,
  block_type VARCHAR(50) NOT NULL,
  context_hash VARCHAR(64) NOT NULL,
  strategy_id UUID REFERENCES public.strategies(id) ON DELETE CASCADE,
  variants JSONB NOT NULL,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  expires_at TIMESTAMPTZ DEFAULT (NOW() + INTERVAL '24 hours')
);
CREATE INDEX IF NOT EXISTS idx_block_variants_user_id ON public.block_variants_cache(user_id);
CREATE INDEX IF NOT EXISTS idx_block_variants_context_hash ON public.block_variants_cache(user_id, context_hash);

ALTER TABLE public.broadcasts ADD COLUMN IF NOT EXISTS body_structure JSONB DEFAULT NULL;
ALTER TABLE public.broadcasts ADD COLUMN IF NOT EXISTS strategy_id UUID REFERENCES public.strategies(id) ON DELETE SET NULL;
ALTER TABLE public.broadcasts ADD COLUMN IF NOT EXISTS context_id UUID REFERENCES public.email_contexts(id) ON DELETE SET NULL;
ALTER TABLE public.broadcasts ADD COLUMN IF NOT EXISTS intent VARCHAR(50);
ALTER TABLE public.broadcasts ADD COLUMN IF NOT EXISTS reply_detected BOOLEAN DEFAULT false;
ALTER TABLE public.broadcasts ADD COLUMN IF NOT EXISTS reply_at TIMESTAMPTZ;

CREATE INDEX IF NOT EXISTS idx_broadcasts_strategy_id ON public.broadcasts(strategy_id);
CREATE INDEX IF NOT EXISTS idx_broadcasts_context_id ON public.broadcasts(context_id);
CREATE INDEX IF NOT EXISTS idx_broadcasts_intent ON public.broadcasts(intent);

INSERT INTO public.strategies (user_id, intent, name, description, tone, is_system, hooks, personalization_hints, cta_types)
VALUES (
  'system',
  'cold',
  'Cold Outreach - Direct',
  'Direct approach emphasizing value proposition',
  'professional',
  true,
  ARRAY['Noticed your work in...', 'Saw your company is...', 'Found your profile...'],
  ARRAY['Mention specific achievement', 'Reference recent news', 'Note shared connection'],
  ARRAY['Quick call', 'Brief conversation', 'Check availability']
)
ON CONFLICT DO NOTHING;

INSERT INTO public.strategies (user_id, intent, name, description, tone, is_system, hooks, personalization_hints, cta_types)
VALUES (
  'system',
  'freelance',
  'Freelance Pitch - Collaborative',
  'Collaborative tone for freelance/service offers',
  'friendly',
  true,
  ARRAY['Your recent project caught my eye', 'I admire how you...', 'I''ve been following...'],
  ARRAY['Cite specific case study', 'Mention industry expertise', 'Reference shared values'],
  ARRAY['Chat about potential fit', 'Schedule a discovery call', 'Share portfolio']
)
ON CONFLICT DO NOTHING;

INSERT INTO public.strategies (user_id, intent, name, description, tone, is_system, hooks, personalization_hints, cta_types)
VALUES (
  'system',
  'follow_up',
  'Follow-up - Reengagement',
  'Soft reengagement without being pushy',
  'casual',
  true,
  ARRAY['Circling back on...', 'Wanted to follow up...', 'Just checking in...'],
  ARRAY['Reference previous message', 'Add new value', 'Acknowledge time passed'],
  ARRAY['One more time works', 'Only if interested', 'No pressure']
)
ON CONFLICT DO NOTHING;

ALTER TABLE public.strategies ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.email_contexts ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.email_blocks ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.block_variants_cache ENABLE ROW LEVEL SECURITY;

CREATE POLICY IF NOT EXISTS strategies_select ON public.strategies FOR SELECT USING (user_id = 'system' OR auth.uid()::text = user_id);
CREATE POLICY IF NOT EXISTS strategies_insert ON public.strategies FOR INSERT WITH CHECK (auth.uid()::text = user_id);
CREATE POLICY IF NOT EXISTS strategies_update ON public.strategies FOR UPDATE USING (auth.uid()::text = user_id) WITH CHECK (auth.uid()::text = user_id);
CREATE POLICY IF NOT EXISTS strategies_delete ON public.strategies FOR DELETE USING (auth.uid()::text = user_id AND is_system = false);

CREATE POLICY IF NOT EXISTS email_contexts_select ON public.email_contexts FOR SELECT USING (auth.uid()::text = user_id);
CREATE POLICY IF NOT EXISTS email_contexts_insert ON public.email_contexts FOR INSERT WITH CHECK (auth.uid()::text = user_id);
CREATE POLICY IF NOT EXISTS email_contexts_update ON public.email_contexts FOR UPDATE USING (auth.uid()::text = user_id) WITH CHECK (auth.uid()::text = user_id);
CREATE POLICY IF NOT EXISTS email_contexts_delete ON public.email_contexts FOR DELETE USING (auth.uid()::text = user_id);

CREATE POLICY IF NOT EXISTS email_blocks_select ON public.email_blocks FOR SELECT USING (EXISTS (SELECT 1 FROM public.broadcasts WHERE broadcasts.id = email_blocks.broadcast_id AND broadcasts.user_id = auth.uid()::text));
CREATE POLICY IF NOT EXISTS email_blocks_insert ON public.email_blocks FOR INSERT WITH CHECK (EXISTS (SELECT 1 FROM public.broadcasts WHERE broadcasts.id = email_blocks.broadcast_id AND broadcasts.user_id = auth.uid()::text));
CREATE POLICY IF NOT EXISTS email_blocks_update ON public.email_blocks FOR UPDATE USING (EXISTS (SELECT 1 FROM public.broadcasts WHERE broadcasts.id = email_blocks.broadcast_id AND broadcasts.user_id = auth.uid()::text)) WITH CHECK (EXISTS (SELECT 1 FROM public.broadcasts WHERE broadcasts.id = email_blocks.broadcast_id AND broadcasts.user_id = auth.uid()::text));
CREATE POLICY IF NOT EXISTS email_blocks_delete ON public.email_blocks FOR DELETE USING (EXISTS (SELECT 1 FROM public.broadcasts WHERE broadcasts.id = email_blocks.broadcast_id AND broadcasts.user_id = auth.uid()::text));

CREATE POLICY IF NOT EXISTS block_variants_select ON public.block_variants_cache FOR SELECT USING (auth.uid()::text = user_id);
CREATE POLICY IF NOT EXISTS block_variants_insert ON public.block_variants_cache FOR INSERT WITH CHECK (auth.uid()::text = user_id);
CREATE POLICY IF NOT EXISTS block_variants_delete ON public.block_variants_cache FOR DELETE USING (auth.uid()::text = user_id);
`

export async function ensureBroadcastsSchema() {
  if (ensurePromise) {
    return ensurePromise
  }

  ensurePromise = (async () => {
    const connectionString = process.env.POSTGRES_URL_NON_POOLING || process.env.POSTGRES_URL
    if (!connectionString) {
      throw new Error('Missing POSTGRES_URL_NON_POOLING/POSTGRES_URL for schema bootstrap')
    }

    const client = new Client({ connectionString, ssl: { rejectUnauthorized: false } })
    await client.connect()
    try {
      await client.query(ENSURE_SQL)
    } finally {
      await client.end()
    }
  })()

  try {
    await ensurePromise
  } finally {
    ensurePromise = null
  }
}
