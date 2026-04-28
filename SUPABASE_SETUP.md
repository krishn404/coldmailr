# Supabase Setup Instructions

## Overview

This guide walks you through setting up the block-based email composer system in your Supabase database. The entire process takes ~5 minutes.

---

## Step 1: Access Supabase SQL Editor

1. Log into your Supabase project
2. Navigate to **SQL Editor** (left sidebar)
3. Click **New Query**

---

## Step 2: Copy the Migration Script

All SQL is in one file: **`scripts/03_block_system_complete.sql`**

This file contains:
- 4 new tables (strategies, email_contexts, email_blocks, block_variants_cache)
- Extensions to broadcasts table
- Row-level security policies
- System default strategies
- Indexes for performance

**Copy the ENTIRE contents of this file.**

---

## Step 3: Paste into Supabase SQL Editor

1. Paste the entire SQL into the editor
2. Click **Run** (or Cmd+Enter)
3. Wait for completion message

Expected output: ✅ Success (0 errors)

---

## Step 4: Verify Tables Created

Run this verification query in a new SQL tab:

```sql
SELECT 
  tablename 
FROM pg_tables 
WHERE schemaname = 'public' 
AND tablename IN ('strategies', 'email_contexts', 'email_blocks', 'block_variants_cache');
```

Should return 4 rows.

---

## Step 5: Verify Default Strategies

```sql
SELECT id, name, intent, is_system 
FROM public.strategies 
WHERE is_system = true;
```

Should return 3 rows:
- Cold Outreach - Direct
- Freelance Pitch - Collaborative
- Follow-up - Reengagement

---

## Step 6: Check broadcasts Table Updates

```sql
\d public.broadcasts
```

Verify these columns exist:
- body_structure (jsonb)
- strategy_id (uuid)
- context_id (uuid)
- intent (varchar)
- reply_detected (boolean)
- reply_at (timestamptz)

---

## Step 7: Test RLS Policies

RLS is enabled on all tables. Verify:

```sql
SELECT tablename, rowsecurity 
FROM pg_tables 
WHERE schemaname = 'public' 
AND tablename IN ('strategies', 'email_contexts', 'email_blocks', 'block_variants_cache');
```

All should show `rowsecurity = t` (true).

---

## Troubleshooting

### Error: "function uuid_generate_v4() does not exist"
The UUID extension didn't load. Run:
```sql
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
```

### Error: "relation broadcasts does not exist"
The broadcasts table wasn't created in the initial schema setup. Run:
```sql
CREATE TABLE IF NOT EXISTS public.broadcasts (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id TEXT NOT NULL,
  from_email TEXT NOT NULL,
  to_email TEXT NOT NULL,
  subject TEXT NOT NULL,
  body TEXT,
  content TEXT,
  context TEXT,
  status TEXT DEFAULT 'draft',
  message_id TEXT,
  audience_count INTEGER DEFAULT 0,
  sent_count INTEGER DEFAULT 0,
  failed_count INTEGER DEFAULT 0,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  sent_at TIMESTAMPTZ,
  body_structure JSONB DEFAULT NULL,
  strategy_id UUID REFERENCES public.strategies(id) ON DELETE SET NULL,
  context_id UUID REFERENCES public.email_contexts(id) ON DELETE SET NULL,
  intent VARCHAR(50),
  reply_detected BOOLEAN DEFAULT false,
  reply_at TIMESTAMPTZ
);
```

### Error: "policy already exists"
This is normal if you've run the migration twice. You can safely:
- Drop the policy: `DROP POLICY IF EXISTS policy_name ON table_name;`
- Re-run the migration

### Tables created but policies failed
Run the RLS setup separately:

```sql
ALTER TABLE public.strategies ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.email_contexts ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.email_blocks ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.block_variants_cache ENABLE ROW LEVEL SECURITY;

CREATE POLICY strategies_select ON public.strategies FOR SELECT 
USING (user_id = 'system' OR auth.uid()::text = user_id);

CREATE POLICY strategies_insert ON public.strategies FOR INSERT 
WITH CHECK (auth.uid()::text = user_id);

CREATE POLICY strategies_update ON public.strategies FOR UPDATE 
USING (auth.uid()::text = user_id) 
WITH CHECK (auth.uid()::text = user_id);

CREATE POLICY strategies_delete ON public.strategies FOR DELETE 
USING (auth.uid()::text = user_id AND is_system = false);

-- ... (continue with other tables as defined in 03_block_system_complete.sql)
```

---

## Step 8: Backend Integration

Once tables are created, the APIs are ready to use:

### Environment Variables
No new env vars needed if using Supabase client already configured.

### Test the Endpoints

**Get strategies:**
```bash
curl -X GET "http://localhost:3000/api/strategies?intent=cold" \
  -H "Authorization: Bearer YOUR_TOKEN" \
  -H "Content-Type: application/json"
```

**Generate block:**
```bash
curl -X POST "http://localhost:3000/api/generate/block" \
  -H "Authorization: Bearer YOUR_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "block_type": "hook",
    "context": "VP of Engineering at a SaaS startup",
    "intent": "cold"
  }'
```

**Save context:**
```bash
curl -X POST "http://localhost:3000/api/email/context" \
  -H "Authorization: Bearer YOUR_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "broadcast_id": "uuid-here",
    "recipient_name": "John Doe",
    "company_name": "Acme Corp",
    "context_insights": "Recently raised Series A"
  }'
```

---

## Step 9: Frontend Integration

Update your app page to use the new composer:

```tsx
// app/app/page.tsx

import { BlockBasedComposer } from '@/components/block-based-composer'

export default function AppPage() {
  return (
    <div>
      <BlockBasedComposer />
    </div>
  )
}
```

---

## Step 10: Test in Browser

1. Start dev server: `npm run dev` (or pnpm dev)
2. Navigate to `/app`
3. Verify:
   - Composer loads with intent preselected ✅
   - Strategies display ✅
   - Clicking strategy generates blocks ✅
   - Context panel fields work ✅
   - Subject line auto-generates ✅
   - Blocks can be expanded/collapsed ✅
   - Save as strategy works ✅

---

## Common Questions

### Q: Do I need to modify existing broadcasts?
**A:** No. The body_structure field is optional (JSONB, nullable). Old emails continue to work. New emails save structured blocks alongside plaintext body.

### Q: How long do variant caches persist?
**A:** 24 hours by default. Expired automatically. You can adjust by editing the block_variants_cache table creation in the SQL.

### Q: Can I customize the system strategies?
**A:** Yes. Edit the INSERT statements in the SQL file to add your own hooks, tones, and CTAs. Or create new strategies via the `POST /api/strategies/manage` endpoint.

### Q: Do I need Supabase Auth?
**A:** Yes. The RLS policies use `auth.uid()`. All APIs require valid authentication tokens.

### Q: Can I migrate existing broadcasts to the new format?
**A:** Yes. A migration function is available in the SQL. Refer to INTEGRATION_GUIDE.md.

---

## Production Checklist

Before deploying to production:

- [ ] Migration ran without errors
- [ ] All 4 tables created
- [ ] Default strategies inserted
- [ ] RLS policies enabled
- [ ] All APIs tested
- [ ] Frontend integration tested
- [ ] Database backups enabled
- [ ] Monitor performance (queries should use indexes)

---

## Need Help?

Refer to:
- **Architecture**: README_BLOCK_SYSTEM.md
- **Code Examples**: USAGE_EXAMPLES.md
- **Integration**: INTEGRATION_GUIDE.md
- **Component Props**: BLOCK_SYSTEM.md
