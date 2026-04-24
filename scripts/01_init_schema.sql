
-- ==========================================
-- EXTENSIONS
-- ==========================================
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- ==========================================
-- TENANTS
-- ==========================================
CREATE TABLE IF NOT EXISTS tenants (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  name VARCHAR(255) NOT NULL,
  slug VARCHAR(255) UNIQUE NOT NULL,
  logo_url TEXT,
  accent_color VARCHAR(7) DEFAULT '#4F46E5',
  custom_domain VARCHAR(255),
  owner_id UUID,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_tenants_slug ON tenants(slug);

-- ==========================================
-- USERS
-- ==========================================
CREATE TABLE IF NOT EXISTS users (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  email VARCHAR(255) UNIQUE NOT NULL,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now(),
  tenant_id UUID REFERENCES tenants(id) ON DELETE CASCADE
);

CREATE INDEX IF NOT EXISTS idx_users_email ON users(email);
CREATE INDEX IF NOT EXISTS idx_users_tenant_id ON users(tenant_id);

-- ==========================================
-- TEAM MEMBERS
-- ==========================================
CREATE TABLE IF NOT EXISTS team_members (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  tenant_id UUID NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  email VARCHAR(255) NOT NULL,
  role VARCHAR(50) DEFAULT 'member' CHECK (role IN ('admin','member')),
  invited_at TIMESTAMPTZ DEFAULT now(),
  accepted_at TIMESTAMPTZ,
  UNIQUE(tenant_id, email)
);

-- ==========================================
-- DRAFTS
-- ==========================================
CREATE TABLE IF NOT EXISTS drafts (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  tenant_id UUID NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  from_email VARCHAR(255) NOT NULL,
  to_email VARCHAR(255) NOT NULL,
  cc TEXT[],
  bcc TEXT[],
  subject TEXT,
  body TEXT NOT NULL DEFAULT '',
  context TEXT,
  status VARCHAR(50) DEFAULT 'draft' CHECK (status IN ('draft','sent','archived')),
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_drafts_status ON drafts(status);

-- ==========================================
-- BROADCASTS (FIXED CORE TABLE)
-- ==========================================
CREATE TABLE IF NOT EXISTS broadcasts (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id TEXT NOT NULL,
  from_email VARCHAR(255),
  to_email VARCHAR(255) NOT NULL DEFAULT '',
  subject TEXT,
  body TEXT DEFAULT '',
  context TEXT,
  status VARCHAR(50) DEFAULT 'draft',
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now(),
  sent_at TIMESTAMPTZ,
  message_id TEXT
);

ALTER TABLE broadcasts ADD COLUMN IF NOT EXISTS message_id TEXT;
ALTER TABLE broadcasts ADD COLUMN IF NOT EXISTS user_id TEXT;
ALTER TABLE broadcasts ADD COLUMN IF NOT EXISTS subject TEXT;
ALTER TABLE broadcasts ADD COLUMN IF NOT EXISTS content TEXT;
ALTER TABLE broadcasts ADD COLUMN IF NOT EXISTS context TEXT;
ALTER TABLE broadcasts ADD COLUMN IF NOT EXISTS status TEXT DEFAULT 'draft';
ALTER TABLE broadcasts ADD COLUMN IF NOT EXISTS audience_count INTEGER DEFAULT 0;
ALTER TABLE broadcasts ADD COLUMN IF NOT EXISTS sent_count INTEGER DEFAULT 0;
ALTER TABLE broadcasts ADD COLUMN IF NOT EXISTS failed_count INTEGER DEFAULT 0;
ALTER TABLE broadcasts ADD COLUMN IF NOT EXISTS created_at TIMESTAMPTZ DEFAULT now();
ALTER TABLE broadcasts ADD COLUMN IF NOT EXISTS updated_at TIMESTAMPTZ DEFAULT now();
ALTER TABLE broadcasts ADD COLUMN IF NOT EXISTS sent_at TIMESTAMPTZ;

-- enforce valid states
DO $$ 
BEGIN
  IF EXISTS (
    SELECT 1 FROM pg_constraint 
    WHERE conname = 'broadcasts_status_check'
  ) THEN
    ALTER TABLE broadcasts DROP CONSTRAINT broadcasts_status_check;
  END IF;
END $$;

ALTER TABLE broadcasts
ADD CONSTRAINT broadcasts_status_check
CHECK (status IN ('draft','scheduled','sending','sent','failed'));

-- indexes
CREATE INDEX IF NOT EXISTS idx_broadcasts_status ON broadcasts(status);
CREATE INDEX IF NOT EXISTS idx_broadcasts_created_at ON broadcasts(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_broadcasts_user_id ON broadcasts(user_id);
CREATE INDEX IF NOT EXISTS idx_broadcasts_user_id_created_at ON broadcasts(user_id, created_at DESC);

-- ==========================================
-- AUTO updated_at (ALL TABLES)
-- ==========================================
CREATE OR REPLACE FUNCTION set_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- apply trigger safely
DO $$
DECLARE t text;
BEGIN
  FOR t IN SELECT unnest(ARRAY['tenants','users','drafts','broadcasts','templates'])
  LOOP
    EXECUTE format('DROP TRIGGER IF EXISTS trigger_%s_updated_at ON %s', t, t);
    EXECUTE format('CREATE TRIGGER trigger_%s_updated_at BEFORE UPDATE ON %s FOR EACH ROW EXECUTE FUNCTION set_updated_at()', t, t);
  END LOOP;
END $$;

-- ==========================================
-- RESEND PROTECTION (CRITICAL FIX)
-- ==========================================
CREATE OR REPLACE FUNCTION prevent_resend()
RETURNS TRIGGER AS $$
BEGIN
  IF OLD.status = 'sent' THEN
    RAISE EXCEPTION 'Broadcast already sent';
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS trigger_prevent_resend ON broadcasts;

CREATE TRIGGER trigger_prevent_resend
BEFORE UPDATE ON broadcasts
FOR EACH ROW
WHEN (OLD.status = 'sent')
EXECUTE FUNCTION prevent_resend();

-- ==========================================
-- BACKFILL (FIX YOUR CURRENT BUG)
-- ==========================================
UPDATE broadcasts
SET sent_at = created_at
WHERE status = 'sent' AND sent_at IS NULL;

DELETE FROM broadcasts WHERE user_id IS NULL OR user_id = '';
ALTER TABLE broadcasts ALTER COLUMN user_id SET NOT NULL;

-- ==========================================
-- RLS (UNCHANGED BUT ENABLED)
-- ==========================================
ALTER TABLE tenants ENABLE ROW LEVEL SECURITY;
ALTER TABLE users ENABLE ROW LEVEL SECURITY;
ALTER TABLE team_members ENABLE ROW LEVEL SECURITY;
ALTER TABLE drafts ENABLE ROW LEVEL SECURITY;
ALTER TABLE broadcasts ENABLE ROW LEVEL SECURITY;

DO $$
BEGIN
  IF EXISTS (
    SELECT 1
    FROM pg_policies
    WHERE schemaname = 'public'
      AND tablename = 'broadcasts'
      AND policyname = 'broadcasts_select_all'
  ) THEN
    DROP POLICY broadcasts_select_all ON broadcasts;
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
    CREATE POLICY broadcasts_user_select ON broadcasts
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
    CREATE POLICY broadcasts_user_insert ON broadcasts
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
    CREATE POLICY broadcasts_user_update ON broadcasts
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
    CREATE POLICY broadcasts_user_delete ON broadcasts
      FOR DELETE
      USING (auth.uid()::text = user_id);
  END IF;
END $$;

-- ==========================================
-- DONE
-- ==========================================