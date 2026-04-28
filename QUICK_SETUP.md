# Block-Based Email System - 5-Minute Setup

## TL;DR

1. **Run SQL** (2 min)
2. **Set env vars** (1 min)
3. **Update code** (1 min)
4. **Deploy** (1 min)

---

## Step 1: Database Setup (2 minutes)

### A. Copy SQL File

Open `/scripts/03_block_system_complete.sql` and copy the entire contents.

### B. Run in Supabase

1. Go to [Supabase Dashboard](https://supabase.com)
2. Select your project
3. Click **SQL Editor** (left sidebar)
4. Click **New Query**
5. **Paste** the SQL from step A
6. Click **Run** (top right)
7. Wait for ✅ "Success" message

### C. Verify

In Supabase SQL Editor, run:
```sql
SELECT COUNT(*) FROM strategies WHERE is_system = true;
```

Should return: **4**

---

## Step 2: Environment Variables (1 minute)

### A. Get Credentials

**From Supabase:**
1. Project Settings → API
2. Copy `Project URL` → `SUPABASE_URL`
3. Copy `anon key` → `SUPABASE_ANON_KEY`

**From Groq:**
1. Go to [console.groq.com](https://console.groq.com)
2. Create API key
3. Copy → `GROQ_API_KEY`

### B. Add to Project

**Option 1: Local Development**
Create `.env.local`:
```env
SUPABASE_URL=https://your-project.supabase.co
SUPABASE_ANON_KEY=your-anon-key-here
GROQ_API_KEY=your-groq-api-key-here
```

**Option 2: Vercel Production**
1. Go to [Vercel Dashboard](https://vercel.com)
2. Select your project
3. Settings → Environment Variables
4. Add the 3 variables above
5. Save

---

## Step 3: Update Code (1 minute)

Replace the old composer with the new one.

### In your composer page (e.g., `app/app/page.tsx`):

**Before:**
```typescript
import { ColdEmailComposer } from '@/components/cold-email-composer';

export default function AppPage() {
  return <ColdEmailComposer />;
}
```

**After:**
```typescript
import { BlockBasedComposer } from '@/components/block-based-composer';

export default function AppPage() {
  return <BlockBasedComposer />;
}
```

That's it!

---

## Step 4: Deploy (1 minute)

```bash
git add .
git commit -m "feat: block-based email composer system"
git push origin main
```

Vercel auto-deploys. Check [vercel.com/deployments](https://vercel.com/deployments).

---

## Verify It Works

1. Open your app
2. Click to composer
3. Select an intent (Cold, Freelance, Follow-up)
4. See 3 strategy cards appear
5. Click strategy
6. Wait for 5 blocks to generate
7. Fill in recipient info (right panel)
8. See blocks update in real-time
9. Click "Send" or "Save as Strategy"

✅ **Done!**

---

## Troubleshooting

### "Missing SUPABASE_URL"
- Check `.env.local` exists
- Verify env vars are set in Vercel Settings
- Restart dev server: `Ctrl+C` then `npm run dev`

### "Invalid GROQ_API_KEY"
- Create new key at [console.groq.com](https://console.groq.com)
- Make sure it's the **API Key**, not the model name
- Update env var and redeploy

### "Relation 'strategies' does not exist"
- SQL didn't run successfully
- Check for errors in Supabase SQL Editor output
- Run `scripts/03_block_system_complete.sql` again

### Blocks not generating
- Check browser console for errors
- Verify Groq API key is working
- Check Vercel logs: `vercel logs`

### "Permission denied" on blocks save
- Verify user is authenticated
- Check RLS policies in Supabase dashboard
- Ensure columns added to broadcasts table

---

## What Gets Created

### Database (Supabase)
- 4 new tables (strategies, email_contexts, email_blocks, block_variants_cache)
- 4 default strategies pre-loaded
- RLS policies for security

### API Endpoints (7 new)
- `/api/generate/block` - Generate email blocks
- `/api/strategies` - Fetch strategies
- `/api/strategies/manage` - CRUD strategies
- `/api/email/context` - CRUD context
- `/api/email/context/analyze` - Analyze context
- `/api/broadcasts/[id]/blocks` - CRUD blocks

### Components (6 new)
- BlockBasedComposer - Main UI
- BlockEditor - Block editing
- IntentSelector - Intent selection
- StrategySelector - Strategy cards
- ContextPanel - Context input
- AiSubjectField - Subject line

---

## File Locations

```
scripts/03_block_system_complete.sql  ← Run this in Supabase
lib/hooks/use-block-composer.ts       ← Main hook
components/block-based-composer.tsx   ← Main component
app/api/generate/block/route.ts       ← Generation API
```

---

## Next Steps

1. **Customization** - Update default strategies in `scripts/03_block_system_complete.sql`
2. **Styling** - Customize component styles in component files
3. **Analytics** - Query `strategies` table to track usage
4. **A/B Testing** - Compare strategy success scores

See [BLOCK_SYSTEM_INDEX.md](./BLOCK_SYSTEM_INDEX.md) for full docs.

---

**That's it! You're ready to go.** 🚀
