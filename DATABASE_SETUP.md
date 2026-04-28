# Block-Based Email System - Database Setup Guide

## Overview

The block-based email composer system requires 4 new tables and extensions to your existing Supabase database:
- `strategies` - Strategy definitions that drive generation
- `email_contexts` - Structured personalization data
- `email_blocks` - Individual editable email blocks
- `block_variants_cache` - Pre-generated variants cache
- Extended `broadcasts` table with new columns

## Quick Start

### Option 1: Automated SQL File (Recommended)

1. Go to **Supabase Dashboard** → Your Project → **SQL Editor**
2. Click **New Query**
3. Copy and paste the entire contents of `/scripts/03_block_system_complete.sql`
4. Click **Run**
5. Verify all tables and indexes are created successfully

### Option 2: Manual Setup

Run the following SQL in your Supabase SQL Editor:

```sql
-- Copy the entire contents from scripts/03_block_system_complete.sql
-- and paste here, then execute
```

## Database Schema

### Strategies Table
Stores strategy definitions that drive email generation.

```sql
CREATE TABLE strategies (
  id UUID PRIMARY KEY,
  user_id TEXT NOT NULL,
  intent VARCHAR(50) -- 'cold', 'freelance', 'follow_up', 'custom'
  name TEXT NOT NULL,
  description TEXT,
  tone VARCHAR(50),
  hooks TEXT[] -- Suggested opening lines
  personalization_hints TEXT[],
  cta_types TEXT[],
  is_system BOOLEAN, -- System strategies vs. user-created
  usage_count INTEGER,
  success_score FLOAT,
  metadata JSONB,
  created_at TIMESTAMPTZ,
  updated_at TIMESTAMPTZ
)
```

**Default System Strategies:**
- Cold Outreach - Direct Value
- Cold Outreach - Problem-Focused
- Freelance Pitch - Collaborative
- Follow-up - Soft Reengagement

### Email Contexts Table
Stores structured personalization data for emails.

```sql
CREATE TABLE email_contexts (
  id UUID PRIMARY KEY,
  user_id TEXT NOT NULL,
  broadcast_id UUID REFERENCES broadcasts(id),
  recipient_name VARCHAR(255),
  recipient_email VARCHAR(255),
  company_name VARCHAR(255),
  company_industry VARCHAR(255),
  recipient_role VARCHAR(255),
  recipient_pain_points TEXT[],
  company_size VARCHAR(50),
  context_insights TEXT,
  personalization_strength FLOAT, -- 0-1 score
  ai_suggestions JSONB, -- AI-generated insights
  created_at TIMESTAMPTZ,
  updated_at TIMESTAMPTZ
)
```

### Email Blocks Table
Individual editable blocks that compose the email.

```sql
CREATE TABLE email_blocks (
  id UUID PRIMARY KEY,
  broadcast_id UUID NOT NULL REFERENCES broadcasts(id),
  block_type VARCHAR(50), -- 'hook', 'personalization', 'value', 'cta', 'signature'
  position INTEGER, -- Order in email
  content TEXT, -- Current block content
  variants JSONB, -- { "0": "...", "1": "...", "2": "..." }
  active_variant_index INTEGER, -- Currently selected variant
  metadata JSONB,
  created_at TIMESTAMPTZ,
  updated_at TIMESTAMPTZ
)
```

### Block Variants Cache Table
Pre-generated variants for instant switching (24-hour TTL).

```sql
CREATE TABLE block_variants_cache (
  id UUID PRIMARY KEY,
  user_id TEXT NOT NULL,
  block_type VARCHAR(50),
  context_hash VARCHAR(64), -- Hash of context for cache key
  strategy_id UUID REFERENCES strategies(id),
  variants JSONB, -- Pre-generated variants
  created_at TIMESTAMPTZ,
  expires_at TIMESTAMPTZ -- Auto-cleanup after 24h
)
```

### Extended Broadcasts Table
New columns added to existing `broadcasts` table:

```sql
ALTER TABLE broadcasts ADD COLUMN body_structure JSONB;
ALTER TABLE broadcasts ADD COLUMN strategy_id UUID;
ALTER TABLE broadcasts ADD COLUMN context_id UUID;
ALTER TABLE broadcasts ADD COLUMN intent VARCHAR(50);
ALTER TABLE broadcasts ADD COLUMN reply_detected BOOLEAN;
ALTER TABLE broadcasts ADD COLUMN reply_at TIMESTAMPTZ;
```

## Row Level Security (RLS)

All tables have RLS enabled with these policies:

### Strategies
- SELECT: Users see their own + system strategies
- INSERT/UPDATE/DELETE: Users can only modify their own strategies
- System strategies cannot be deleted

### Email Contexts & Email Blocks
- Only accessible through broadcasts that belong to the user
- Automatic filtering via `auth.uid()`

### Block Variants Cache
- Users only see their own cached variants

## Indexes

Optimized indexes are created for:
- `strategies(user_id, intent)`
- `email_contexts(broadcast_id, user_id)`
- `email_blocks(broadcast_id, position, block_type)`
- `block_variants_cache(user_id, context_hash)`
- `broadcasts(strategy_id, context_id, intent)`

## Environment Variables

Ensure these env vars are set in your `.env.local` or Vercel project:

```env
SUPABASE_URL=https://your-project.supabase.co
SUPABASE_ANON_KEY=your-anon-key
GROQ_API_KEY=your-groq-api-key
```

## API Endpoints

Once the database is set up, the following endpoints are available:

### Generation
- `POST /api/generate/block` - Generate single block with variants
- `POST /api/email/context/analyze` - Analyze context and get suggestions

### Strategies
- `GET /api/strategies?intent=cold` - Fetch strategies for intent
- `POST /api/strategies/manage` - Create new user strategy
- `PUT /api/strategies/manage` - Update strategy
- `DELETE /api/strategies/manage?id=xxx` - Delete strategy

### Blocks & Context
- `GET /api/broadcasts/[id]/blocks` - Fetch blocks for broadcast
- `POST /api/broadcasts/[id]/blocks` - Save blocks for broadcast
- `GET /api/email/context?broadcast_id=xxx` - Fetch context
- `POST /api/email/context` - Save context

## Verification

After running the SQL file, verify setup:

```sql
-- Check tables exist
SELECT table_name FROM information_schema.tables 
WHERE table_schema = 'public' 
AND table_name IN ('strategies', 'email_contexts', 'email_blocks', 'block_variants_cache');

-- Check default strategies loaded
SELECT count(*) FROM strategies WHERE is_system = true;
-- Should return: 4

-- Check RLS enabled
SELECT tablename, rowsecurity 
FROM pg_tables 
WHERE schemaname = 'public' 
AND tablename IN ('strategies', 'email_contexts', 'email_blocks', 'block_variants_cache');
-- All should show true
```

## Troubleshooting

### Error: "Missing Supabase configuration"
- Check `.env.local` has `SUPABASE_URL` and `SUPABASE_ANON_KEY`
- Verify your Supabase project is active in Vercel

### Error: "Permission denied"
- Ensure RLS policies are created (check Supabase dashboard)
- Verify `auth.uid()` is properly set in your auth context

### Tables not created
- Check for SQL syntax errors in the output
- Verify you're running as a user with schema creation permissions
- Try running `03_block_system_complete.sql` in smaller chunks

### RLS policies missing
- The SQL file creates policies with `CREATE POLICY IF NOT EXISTS`
- If policies exist but are incorrect, you may need to drop and recreate them:
  ```sql
  DROP POLICY IF EXISTS policies_name ON table_name;
  -- Then re-run the setup file
  ```

## Data Migration (Optional)

If migrating from the old plain-text email format:

```sql
-- Convert existing broadcasts to block structure
WITH block_data AS (
  SELECT 
    id,
    body as hook_content,
    NULL as personalization_content,
    NULL as value_content,
    NULL as cta_content,
    NULL as signature_content
  FROM broadcasts
  WHERE body IS NOT NULL
)
INSERT INTO email_blocks (broadcast_id, block_type, position, content, created_at, updated_at)
SELECT id, 'hook', 0, hook_content, now(), now() FROM block_data
UNION ALL
SELECT id, 'personalization', 1, personalization_content, now(), now() FROM block_data WHERE personalization_content IS NOT NULL
-- ... continue for other block types
```

## Next Steps

1. Run the SQL setup file
2. Verify database is ready (see Verification section)
3. Test API endpoints with sample requests
4. Deploy the application
5. Monitor usage and success metrics in the `strategies` table

## Support

For issues with the database setup:
- Check Supabase dashboard logs
- Review API error responses (they include database error details)
- Verify RLS policies in Supabase dashboard under "Authentication" → "Policies"
