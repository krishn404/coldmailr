import { Client } from 'pg'

let ensurePromise: Promise<void> | null = null

const ENSURE_SQL = `
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
CREATE TABLE IF NOT EXISTS public.broadcasts (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
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
ALTER TABLE public.broadcasts ENABLE ROW LEVEL SECURITY;
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1
    FROM pg_policies
    WHERE schemaname = 'public'
      AND tablename = 'broadcasts'
      AND policyname = 'broadcasts_select_all'
  ) THEN
    CREATE POLICY broadcasts_select_all ON public.broadcasts
      FOR SELECT
      USING (true);
  END IF;
END $$;
CREATE TABLE IF NOT EXISTS public.broadcast_send_recovery_jobs (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  broadcast_id UUID NOT NULL,
  message_id TEXT,
  sent_at TIMESTAMPTZ NOT NULL,
  payload JSONB NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  status TEXT NOT NULL DEFAULT 'pending'
);
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
