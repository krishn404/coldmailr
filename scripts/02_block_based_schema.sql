-- ==========================================
-- BLOCK-BASED EMAIL SYSTEM MIGRATION
-- ==========================================

-- ==========================================
-- STRATEGIES TABLE
-- Stores strategy definitions that drive generation
-- ==========================================
CREATE TABLE IF NOT EXISTS strategies (
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

CREATE INDEX IF NOT EXISTS idx_strategies_user_id ON strategies(user_id);
CREATE INDEX IF NOT EXISTS idx_strategies_intent ON strategies(intent);
CREATE INDEX IF NOT EXISTS idx_strategies_user_intent ON strategies(user_id, intent);

-- ==========================================
-- EMAIL CONTEXT TABLE
-- Structured context for personalization
-- ==========================================
CREATE TABLE IF NOT EXISTS email_contexts (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id TEXT NOT NULL,
  broadcast_id UUID REFERENCES broadcasts(id) ON DELETE CASCADE,
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

CREATE INDEX IF NOT EXISTS idx_email_contexts_broadcast_id ON email_contexts(broadcast_id);
CREATE INDEX IF NOT EXISTS idx_email_contexts_user_id ON email_contexts(user_id);

-- ==========================================
-- EMAIL BLOCKS TABLE
-- Individual blocks that compose an email
-- ==========================================
CREATE TABLE IF NOT EXISTS email_blocks (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  broadcast_id UUID NOT NULL REFERENCES broadcasts(id) ON DELETE CASCADE,
  block_type VARCHAR(50) NOT NULL CHECK (block_type IN ('hook', 'personalization', 'value', 'cta', 'signature', 'custom')),
  position INTEGER NOT NULL,
  content TEXT NOT NULL,
  variants JSONB DEFAULT '{}',
  active_variant_index INTEGER DEFAULT 0,
  metadata JSONB DEFAULT '{}',
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_email_blocks_broadcast_id ON email_blocks(broadcast_id, position);
CREATE INDEX IF NOT EXISTS idx_email_blocks_block_type ON email_blocks(block_type);

-- ==========================================
-- BLOCK GENERATION CACHE TABLE
-- Cache variants for instant switching
-- ==========================================
CREATE TABLE IF NOT EXISTS block_variants_cache (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id TEXT NOT NULL,
  block_type VARCHAR(50) NOT NULL,
  context_hash VARCHAR(64) NOT NULL,
  strategy_id UUID REFERENCES strategies(id) ON DELETE CASCADE,
  variants JSONB NOT NULL,
  created_at TIMESTAMPTZ DEFAULT now(),
  expires_at TIMESTAMPTZ DEFAULT (now() + interval '24 hours')
);

CREATE INDEX IF NOT EXISTS idx_block_variants_user_id ON block_variants_cache(user_id);
CREATE INDEX IF NOT EXISTS idx_block_variants_context_hash ON block_variants_cache(user_id, context_hash);

-- ==========================================
-- EXTEND BROADCASTS TABLE
-- Add structure metadata
-- ==========================================
ALTER TABLE broadcasts ADD COLUMN IF NOT EXISTS body_structure JSONB DEFAULT NULL;
ALTER TABLE broadcasts ADD COLUMN IF NOT EXISTS strategy_id UUID REFERENCES strategies(id) ON DELETE SET NULL;
ALTER TABLE broadcasts ADD COLUMN IF NOT EXISTS context_id UUID REFERENCES email_contexts(id) ON DELETE SET NULL;
ALTER TABLE broadcasts ADD COLUMN IF NOT EXISTS intent VARCHAR(50);
ALTER TABLE broadcasts ADD COLUMN IF NOT EXISTS reply_detected BOOLEAN DEFAULT false;
ALTER TABLE broadcasts ADD COLUMN IF NOT EXISTS reply_at TIMESTAMPTZ;

CREATE INDEX IF NOT EXISTS idx_broadcasts_strategy_id ON broadcasts(strategy_id);
CREATE INDEX IF NOT EXISTS idx_broadcasts_context_id ON broadcasts(context_id);
CREATE INDEX IF NOT EXISTS idx_broadcasts_intent ON broadcasts(intent);

-- ==========================================
-- DEFAULT SYSTEM STRATEGIES
-- Cold outreach strategy
-- ==========================================
INSERT INTO strategies (user_id, intent, name, description, tone, is_system, hooks, personalization_hints, cta_types)
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

INSERT INTO strategies (user_id, intent, name, description, tone, is_system, hooks, personalization_hints, cta_types)
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

INSERT INTO strategies (user_id, intent, name, description, tone, is_system, hooks, personalization_hints, cta_types)
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

-- ==========================================
-- UPDATED_AT TRIGGER
-- ==========================================
DROP TRIGGER IF EXISTS trigger_strategies_updated_at ON strategies;
DROP TRIGGER IF EXISTS trigger_email_contexts_updated_at ON email_contexts;
DROP TRIGGER IF EXISTS trigger_email_blocks_updated_at ON email_blocks;

CREATE TRIGGER trigger_strategies_updated_at
  BEFORE UPDATE ON strategies
  FOR EACH ROW
  EXECUTE FUNCTION set_updated_at();

CREATE TRIGGER trigger_email_contexts_updated_at
  BEFORE UPDATE ON email_contexts
  FOR EACH ROW
  EXECUTE FUNCTION set_updated_at();

CREATE TRIGGER trigger_email_blocks_updated_at
  BEFORE UPDATE ON email_blocks
  FOR EACH ROW
  EXECUTE FUNCTION set_updated_at();

-- ==========================================
-- RLS POLICIES
-- ==========================================
ALTER TABLE strategies ENABLE ROW LEVEL SECURITY;
ALTER TABLE email_contexts ENABLE ROW LEVEL SECURITY;
ALTER TABLE email_blocks ENABLE ROW LEVEL SECURITY;
ALTER TABLE block_variants_cache ENABLE ROW LEVEL SECURITY;

-- Strategies: system + user-owned
CREATE POLICY strategies_select ON strategies
  FOR SELECT
  USING (user_id = 'system' OR auth.uid()::text = user_id);

CREATE POLICY strategies_insert ON strategies
  FOR INSERT
  WITH CHECK (auth.uid()::text = user_id);

CREATE POLICY strategies_update ON strategies
  FOR UPDATE
  USING (auth.uid()::text = user_id)
  WITH CHECK (auth.uid()::text = user_id);

CREATE POLICY strategies_delete ON strategies
  FOR DELETE
  USING (auth.uid()::text = user_id AND is_system = false);

-- Email contexts: user-owned
CREATE POLICY email_contexts_select ON email_contexts
  FOR SELECT
  USING (auth.uid()::text = user_id);

CREATE POLICY email_contexts_insert ON email_contexts
  FOR INSERT
  WITH CHECK (auth.uid()::text = user_id);

CREATE POLICY email_contexts_update ON email_contexts
  FOR UPDATE
  USING (auth.uid()::text = user_id)
  WITH CHECK (auth.uid()::text = user_id);

CREATE POLICY email_contexts_delete ON email_contexts
  FOR DELETE
  USING (auth.uid()::text = user_id);

-- Email blocks: via broadcast ownership
CREATE POLICY email_blocks_select ON email_blocks
  FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM broadcasts
      WHERE broadcasts.id = email_blocks.broadcast_id
        AND broadcasts.user_id = auth.uid()::text
    )
  );

CREATE POLICY email_blocks_insert ON email_blocks
  FOR INSERT
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM broadcasts
      WHERE broadcasts.id = email_blocks.broadcast_id
        AND broadcasts.user_id = auth.uid()::text
    )
  );

CREATE POLICY email_blocks_update ON email_blocks
  FOR UPDATE
  USING (
    EXISTS (
      SELECT 1 FROM broadcasts
      WHERE broadcasts.id = email_blocks.broadcast_id
        AND broadcasts.user_id = auth.uid()::text
    )
  )
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM broadcasts
      WHERE broadcasts.id = email_blocks.broadcast_id
        AND broadcasts.user_id = auth.uid()::text
    )
  );

CREATE POLICY email_blocks_delete ON email_blocks
  FOR DELETE
  USING (
    EXISTS (
      SELECT 1 FROM broadcasts
      WHERE broadcasts.id = email_blocks.broadcast_id
        AND broadcasts.user_id = auth.uid()::text
    )
  );

-- Block variants cache: user-owned
CREATE POLICY block_variants_cache_select ON block_variants_cache
  FOR SELECT
  USING (auth.uid()::text = user_id);

CREATE POLICY block_variants_cache_insert ON block_variants_cache
  FOR INSERT
  WITH CHECK (auth.uid()::text = user_id);

CREATE POLICY block_variants_cache_delete ON block_variants_cache
  FOR DELETE
  USING (auth.uid()::text = user_id);

-- ==========================================
-- DONE
-- ==========================================
