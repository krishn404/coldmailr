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
ALTER TABLE public.templates ADD COLUMN IF NOT EXISTS user_id TEXT;
ALTER TABLE public.templates ADD COLUMN IF NOT EXISTS name TEXT;
ALTER TABLE public.templates ADD COLUMN IF NOT EXISTS subject TEXT;
ALTER TABLE public.templates ADD COLUMN IF NOT EXISTS context TEXT;
ALTER TABLE public.templates ADD COLUMN IF NOT EXISTS body TEXT;
ALTER TABLE public.templates ADD COLUMN IF NOT EXISTS tags TEXT[] DEFAULT '{}';
ALTER TABLE public.templates ADD COLUMN IF NOT EXISTS use_case TEXT;
ALTER TABLE public.templates ADD COLUMN IF NOT EXISTS industry TEXT;
ALTER TABLE public.templates ADD COLUMN IF NOT EXISTS tone TEXT;
ALTER TABLE public.templates ADD COLUMN IF NOT EXISTS length_hint TEXT;
ALTER TABLE public.templates ADD COLUMN IF NOT EXISTS is_pinned BOOLEAN DEFAULT false;
ALTER TABLE public.templates ADD COLUMN IF NOT EXISTS source_broadcast_id UUID;
ALTER TABLE public.templates ADD COLUMN IF NOT EXISTS last_used_at TIMESTAMPTZ;
ALTER TABLE public.templates ADD COLUMN IF NOT EXISTS created_at TIMESTAMPTZ DEFAULT NOW();
ALTER TABLE public.templates ADD COLUMN IF NOT EXISTS updated_at TIMESTAMPTZ DEFAULT NOW();
DO $$
BEGIN
  IF EXISTS (
    SELECT 1 FROM information_schema.table_constraints
    WHERE table_schema = 'public' AND table_name = 'templates' AND constraint_name = 'templates_user_id_fkey'
  ) THEN
    ALTER TABLE public.templates DROP CONSTRAINT templates_user_id_fkey;
  END IF;
  IF EXISTS (
    SELECT 1
    FROM information_schema.columns
    WHERE table_schema = 'public' AND table_name = 'templates' AND column_name = 'user_id' AND data_type <> 'text'
  ) THEN
    ALTER TABLE public.templates ALTER COLUMN user_id TYPE TEXT USING user_id::text;
  END IF;
END $$;
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
ALTER TABLE public.template_versions ADD COLUMN IF NOT EXISTS user_id TEXT;
ALTER TABLE public.template_versions ADD COLUMN IF NOT EXISTS note TEXT;
ALTER TABLE public.template_versions ADD COLUMN IF NOT EXISTS created_at TIMESTAMPTZ DEFAULT NOW();
DO $$
BEGIN
  IF EXISTS (
    SELECT 1 FROM information_schema.table_constraints
    WHERE table_schema = 'public' AND table_name = 'template_versions' AND constraint_name = 'template_versions_user_id_fkey'
  ) THEN
    ALTER TABLE public.template_versions DROP CONSTRAINT template_versions_user_id_fkey;
  END IF;
  IF EXISTS (
    SELECT 1
    FROM information_schema.columns
    WHERE table_schema = 'public' AND table_name = 'template_versions' AND column_name = 'user_id' AND data_type <> 'text'
  ) THEN
    ALTER TABLE public.template_versions ALTER COLUMN user_id TYPE TEXT USING user_id::text;
  END IF;
END $$;
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
ALTER TABLE public.template_ai_cache ADD COLUMN IF NOT EXISTS user_id TEXT;
ALTER TABLE public.template_ai_cache ADD COLUMN IF NOT EXISTS cache_key TEXT;
ALTER TABLE public.template_ai_cache ADD COLUMN IF NOT EXISTS context TEXT;
ALTER TABLE public.template_ai_cache ADD COLUMN IF NOT EXISTS tone TEXT;
ALTER TABLE public.template_ai_cache ADD COLUMN IF NOT EXISTS length_hint TEXT;
ALTER TABLE public.template_ai_cache ADD COLUMN IF NOT EXISTS subject TEXT;
ALTER TABLE public.template_ai_cache ADD COLUMN IF NOT EXISTS body TEXT;
ALTER TABLE public.template_ai_cache ADD COLUMN IF NOT EXISTS created_at TIMESTAMPTZ DEFAULT NOW();
ALTER TABLE public.template_ai_cache ADD COLUMN IF NOT EXISTS updated_at TIMESTAMPTZ DEFAULT NOW();
DO $$
BEGIN
  IF EXISTS (
    SELECT 1 FROM information_schema.table_constraints
    WHERE table_schema = 'public' AND table_name = 'template_ai_cache' AND constraint_name = 'template_ai_cache_user_id_fkey'
  ) THEN
    ALTER TABLE public.template_ai_cache DROP CONSTRAINT template_ai_cache_user_id_fkey;
  END IF;
  IF EXISTS (
    SELECT 1
    FROM information_schema.columns
    WHERE table_schema = 'public' AND table_name = 'template_ai_cache' AND column_name = 'user_id' AND data_type <> 'text'
  ) THEN
    ALTER TABLE public.template_ai_cache ALTER COLUMN user_id TYPE TEXT USING user_id::text;
  END IF;
END $$;
CREATE INDEX IF NOT EXISTS idx_template_ai_cache_user_id_created_at ON public.template_ai_cache(user_id, created_at DESC);

ALTER TABLE public.templates ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.template_versions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.template_ai_cache ENABLE ROW LEVEL SECURITY;

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies WHERE schemaname = 'public' AND tablename = 'templates' AND policyname = 'templates_user_select'
  ) THEN
    CREATE POLICY templates_user_select ON public.templates FOR SELECT USING (auth.uid()::text = user_id::text);
  END IF;
END $$;

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies WHERE schemaname = 'public' AND tablename = 'templates' AND policyname = 'templates_user_insert'
  ) THEN
    CREATE POLICY templates_user_insert ON public.templates FOR INSERT WITH CHECK (auth.uid()::text = user_id::text);
  END IF;
END $$;

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies WHERE schemaname = 'public' AND tablename = 'templates' AND policyname = 'templates_user_update'
  ) THEN
    CREATE POLICY templates_user_update ON public.templates FOR UPDATE USING (auth.uid()::text = user_id::text) WITH CHECK (auth.uid()::text = user_id::text);
  END IF;
END $$;

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies WHERE schemaname = 'public' AND tablename = 'templates' AND policyname = 'templates_user_delete'
  ) THEN
    CREATE POLICY templates_user_delete ON public.templates FOR DELETE USING (auth.uid()::text = user_id::text);
  END IF;
END $$;
