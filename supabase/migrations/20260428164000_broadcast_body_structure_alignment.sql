-- Align broadcasts schema with composer payload fields.
-- Fixes runtime errors like: column broadcasts.body_structure does not exist

ALTER TABLE public.broadcasts
  ADD COLUMN IF NOT EXISTS body_structure JSONB DEFAULT NULL;

ALTER TABLE public.broadcasts
  ADD COLUMN IF NOT EXISTS strategy_id UUID DEFAULT NULL;

ALTER TABLE public.broadcasts
  ADD COLUMN IF NOT EXISTS context_id UUID DEFAULT NULL;

ALTER TABLE public.broadcasts
  ADD COLUMN IF NOT EXISTS intent TEXT DEFAULT NULL;

CREATE INDEX IF NOT EXISTS idx_broadcasts_intent ON public.broadcasts(intent);
