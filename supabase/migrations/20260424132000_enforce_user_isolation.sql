-- Enforce strict per-user isolation for broadcasts and recovery jobs.

ALTER TABLE public.broadcasts ADD COLUMN IF NOT EXISTS user_id TEXT;
UPDATE public.broadcasts
SET user_id = NULL
WHERE user_id IS NOT NULL AND btrim(user_id) = '';
DELETE FROM public.broadcasts WHERE user_id IS NULL;
ALTER TABLE public.broadcasts ALTER COLUMN user_id SET NOT NULL;

CREATE INDEX IF NOT EXISTS idx_broadcasts_user_id ON public.broadcasts(user_id);
CREATE INDEX IF NOT EXISTS idx_broadcasts_user_id_created_at ON public.broadcasts(user_id, created_at DESC);

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

ALTER TABLE public.broadcast_send_recovery_jobs ADD COLUMN IF NOT EXISTS user_id TEXT;
DELETE FROM public.broadcast_send_recovery_jobs WHERE user_id IS NULL;
ALTER TABLE public.broadcast_send_recovery_jobs ALTER COLUMN user_id SET NOT NULL;
CREATE INDEX IF NOT EXISTS idx_broadcast_recovery_user_id ON public.broadcast_send_recovery_jobs(user_id);
