-- Onboarding schema extension for users + deterministic UUID mapping for legacy googleSub user ids.
-- This migration is additive and safe to run multiple times.

CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- Stable deterministic mapping from Google "sub" (string) -> UUID (v5).
-- Uses a standard namespace (URL) provided by uuid-ossp (not hardcoded).
CREATE OR REPLACE FUNCTION public.google_sub_to_uuid(sub TEXT)
RETURNS UUID
LANGUAGE sql
IMMUTABLE
AS $$
  SELECT uuid_generate_v5(uuid_ns_url(), 'google:' || COALESCE(sub, ''));
$$;

-- Extend public.users (existing) with onboarding fields.
ALTER TABLE public.users
  ADD COLUMN IF NOT EXISTS name TEXT;

ALTER TABLE public.users
  ADD COLUMN IF NOT EXISTS bio TEXT;

ALTER TABLE public.users
  ADD COLUMN IF NOT EXISTS social_links JSONB NOT NULL DEFAULT '{}'::jsonb;

ALTER TABLE public.users
  ADD COLUMN IF NOT EXISTS intent_preferences JSONB NOT NULL DEFAULT '{"selected":[],"custom":""}'::jsonb;

ALTER TABLE public.users
  ADD COLUMN IF NOT EXISTS base_context JSONB NOT NULL DEFAULT '{}'::jsonb;

ALTER TABLE public.users
  ADD COLUMN IF NOT EXISTS onboarding_complete BOOLEAN NOT NULL DEFAULT false;

-- Ensure updated_at stays correct (trigger already exists in init schema; ensure column exists).
ALTER TABLE public.users
  ADD COLUMN IF NOT EXISTS updated_at TIMESTAMPTZ DEFAULT now();

ALTER TABLE public.users
  ALTER COLUMN social_links SET DEFAULT '{}'::jsonb;

ALTER TABLE public.users
  ALTER COLUMN intent_preferences SET DEFAULT '{}'::jsonb;

ALTER TABLE public.users
  ALTER COLUMN base_context SET DEFAULT '{}'::jsonb;

UPDATE public.users
SET
  social_links = COALESCE(social_links, '{}'::jsonb),
  intent_preferences = COALESCE(intent_preferences, '{}'::jsonb),
  base_context = COALESCE(base_context, '{}'::jsonb),
  onboarding_complete = COALESCE(onboarding_complete, false),
  updated_at = COALESCE(updated_at, now());

-- Best-effort migration for legacy tables that used googleSub as TEXT user_id.
-- Convert only rows whose user_id is not already a UUID.
DO $$
BEGIN
  IF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_schema='public' AND table_name='broadcasts' AND column_name='user_id') THEN
    UPDATE public.broadcasts
      SET user_id = public.google_sub_to_uuid(user_id)::text
    WHERE user_id IS NOT NULL
      AND user_id !~* '^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$';
  END IF;

  IF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_schema='public' AND table_name='templates' AND column_name='user_id') THEN
    UPDATE public.templates
      SET user_id = public.google_sub_to_uuid(user_id)::text
    WHERE user_id IS NOT NULL
      AND user_id !~* '^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$';
  END IF;

  IF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_schema='public' AND table_name='template_versions' AND column_name='user_id') THEN
    UPDATE public.template_versions
      SET user_id = public.google_sub_to_uuid(user_id)::text
    WHERE user_id IS NOT NULL
      AND user_id !~* '^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$';
  END IF;

  IF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_schema='public' AND table_name='template_ai_cache' AND column_name='user_id') THEN
    UPDATE public.template_ai_cache
      SET user_id = public.google_sub_to_uuid(user_id)::text
    WHERE user_id IS NOT NULL
      AND user_id !~* '^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$';
  END IF;
END $$;

