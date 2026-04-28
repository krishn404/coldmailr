# Production Deployment Checklist

## Summary

You now have a **complete, production-ready block-based email composer**. Below is the exact sequence of steps to push this to production.

---

## Phase 1: Database Setup (5 minutes)

- [ ] **Step 1.1** - Open Supabase SQL Editor
  - Go to your Supabase project dashboard
  - Click "SQL Editor" in left sidebar
  - Click "New Query"

- [ ] **Step 1.2** - Copy and paste SQL migration
  - Open `scripts/03_block_system_complete.sql` in your code editor
  - Copy entire file contents
  - Paste into Supabase SQL Editor
  - Click "Run"
  - Verify: ✅ Success (0 errors)

- [ ] **Step 1.3** - Verify tables created
  - Run verification query in SQL Editor:
    ```sql
    SELECT tablename FROM pg_tables 
    WHERE schemaname = 'public' 
    AND tablename IN ('strategies', 'email_contexts', 'email_blocks', 'block_variants_cache');
    ```
  - Result: 4 rows returned

- [ ] **Step 1.4** - Verify default strategies
  - Run:
    ```sql
    SELECT count(*) FROM public.strategies WHERE is_system = true;
    ```
  - Result: 3 rows (Cold, Freelance, Follow-up)

- [ ] **Step 1.5** - Verify broadcasts table updated
  - Check columns:
    ```sql
    \d public.broadcasts
    ```
  - Look for: body_structure, strategy_id, context_id, intent, reply_detected, reply_at

- [ ] **Step 1.6** - Test RLS is enabled
  - Run:
    ```sql
    SELECT tablename, rowsecurity FROM pg_tables 
    WHERE schemaname = 'public' 
    AND tablename IN ('strategies', 'email_contexts', 'email_blocks', 'block_variants_cache');
    ```
  - All should show `t` (true)

---

## Phase 2: Code Integration (10 minutes)

- [ ] **Step 2.1** - Update app page
  - Open `app/app/page.tsx`
  - Find: `import { ColdEmailComposer } from '@/components/cold-email-composer'`
  - Replace with: `import { BlockBasedComposer } from '@/components/block-based-composer'`
  - Find: `<ColdEmailComposer />`
  - Replace with: `<BlockBasedComposer />`

- [ ] **Step 2.2** - Verify all new files are present
  - Components:
    - ✅ components/block-based-composer.tsx
    - ✅ components/block-editor.tsx
    - ✅ components/context-panel.tsx
    - ✅ components/strategy-selector.tsx
    - ✅ components/ai-subject-field.tsx
    - ✅ components/intent-selector.tsx
  
  - APIs:
    - ✅ app/api/generate/block/route.ts
    - ✅ app/api/strategies/route.ts
    - ✅ app/api/email/context/route.ts
    - ✅ app/api/email/context/analyze/route.ts
    - ✅ app/api/broadcasts/[id]/blocks/route.ts
    - ✅ app/api/strategies/manage/route.ts
  
  - Utilities:
    - ✅ lib/types/block-system.ts
    - ✅ lib/block-operations.ts
    - ✅ lib/hooks/use-block-composer.ts
    - ✅ lib/hooks/use-context-analysis.ts
  
  - Database:
    - ✅ scripts/02_block_based_schema.sql
    - ✅ scripts/03_block_system_complete.sql

- [ ] **Step 2.3** - Build project locally
  ```bash
  npm run build
  # or
  pnpm build
  # or
  yarn build
  ```
  - Verify: 0 errors, 0 warnings (or acceptable warnings only)

- [ ] **Step 2.4** - Test dev server
  ```bash
  npm run dev
  # Navigate to http://localhost:3000/app
  ```
  - Page loads without errors
  - No console errors

---

## Phase 3: Feature Testing (15 minutes)

- [ ] **Step 3.1** - Test Intent Selector
  - Load composer
  - Verify intent is pre-selected (default: "cold")
  - Can switch between Cold, Freelance, Follow-up
  - UI doesn't have errors

- [ ] **Step 3.2** - Test Strategy Selection
  - Select intent
  - Verify 3 strategy cards appear
  - Click a strategy
  - Verify loading state shows
  - Verify 5 blocks generate

- [ ] **Step 3.3** - Test Block Editor
  - Expand first block (Hook)
  - Verify block content displays
  - Verify variant controls appear
  - Can switch between 2-3 variants
  - Can click "Regenerate"

- [ ] **Step 3.4** - Test Context Panel
  - Fill in "Recipient Name" field
  - Fill in "Company Name" field
  - Observe email blocks update in real-time
  - Verify personalization strength indicator updates
  - No errors in console

- [ ] **Step 3.5** - Test Subject Line
  - Verify subject auto-generates
  - Can edit subject inline
  - Character count displays (50-65 optimal)
  - Regenerate button works

- [ ] **Step 3.6** - Test Save/Send
  - Fill in basic fields
  - Click "Save as Strategy" (or equivalent)
  - Verify dialog appears
  - Give it a name
  - Click confirm
  - Verify broadcast created in database

- [ ] **Step 3.7** - API Test
  - Open browser DevTools → Network
  - Perform actions above
  - Verify requests to:
    - `POST /api/strategies` → 200 OK
    - `POST /api/generate/block` → 200 OK
    - `POST /api/email/context/analyze` → 200 OK
    - `PUT /api/broadcasts/[id]/blocks` → 200 OK
  - No 5xx errors

---

## Phase 4: Data Validation (10 minutes)

- [ ] **Step 4.1** - Check broadcasts table
  ```sql
  SELECT id, subject, body_structure, strategy_id, intent 
  FROM public.broadcasts 
  WHERE status = 'draft' 
  ORDER BY created_at DESC 
  LIMIT 5;
  ```
  - Verify body_structure contains valid JSON
  - Verify strategy_id is populated
  - Verify intent is set

- [ ] **Step 4.2** - Check email_blocks table
  ```sql
  SELECT broadcast_id, block_type, position, content 
  FROM public.email_blocks 
  ORDER BY created_at DESC 
  LIMIT 10;
  ```
  - Verify blocks saved correctly
  - Verify all 5 block types present (hook, personalization, value, cta, signature)
  - Verify position ordering correct

- [ ] **Step 4.3** - Check email_contexts table
  ```sql
  SELECT broadcast_id, recipient_name, company_name, personalization_strength 
  FROM public.email_contexts 
  ORDER BY created_at DESC 
  LIMIT 5;
  ```
  - Verify context saved
  - Verify personalization_strength calculated

- [ ] **Step 4.4** - Check strategies table
  ```sql
  SELECT id, user_id, intent, is_system, usage_count 
  FROM public.strategies 
  WHERE is_system = false 
  ORDER BY created_at DESC;
  ```
  - Verify user strategies saved when "Save as Strategy" used
  - Verify usage_count incremented

---

## Phase 5: Performance Check (5 minutes)

- [ ] **Step 5.1** - Check query performance
  ```sql
  -- Strategies query should be fast (< 50ms)
  EXPLAIN ANALYZE
  SELECT * FROM public.strategies 
  WHERE user_id = 'test-user' 
  AND intent = 'cold';
  ```

- [ ] **Step 5.2** - Check indexes exist
  ```sql
  SELECT indexname FROM pg_indexes 
  WHERE tablename IN ('strategies', 'email_blocks', 'email_contexts', 'block_variants_cache')
  ORDER BY indexname;
  ```
  - Should have indexes on: user_id, intent, broadcast_id, block_type, context_hash

- [ ] **Step 5.3** - Monitor network requests
  - Open DevTools → Network tab
  - Perform full workflow (select intent → strategy → fill context → save)
  - No request should take > 3 seconds
  - No failed requests (5xx errors)

---

## Phase 6: Git Commit & Push (5 minutes)

- [ ] **Step 6.1** - Stage all changes
  ```bash
  git add .
  ```

- [ ] **Step 6.2** - Commit with message
  ```bash
  git commit -m "feat: add block-based email composer with AI-driven strategy system

  - Complete redesign of email composer to strategy-driven, block-based architecture
  - Remove blank states: load with default intent + 3 strategy options
  - Introduce 5-block editor: Hook, Personalization, Value, CTA, Signature
  - Add structured context panel for live personalization updates
  - Implement per-block generation and variant caching for instant switching
  - Add 4 new DB tables: strategies, email_contexts, email_blocks, block_variants_cache
  - Add 6 new API endpoints for block generation, context analysis, strategy management
  - Include 100% TypeScript types and comprehensive documentation
  - Maintain backward compatibility with existing broadcasts
  - Production-ready with RLS security, indexes, and error handling"
  ```

- [ ] **Step 6.3** - Push to branch
  ```bash
  git push origin email-composer-redesign
  # or your active branch
  ```

- [ ] **Step 6.4** - Create pull request
  - Go to GitHub repo
  - Click "Compare & pull request"
  - Add title and description
  - Request review from team
  - Merge when approved

---

## Phase 7: Production Deployment

- [ ] **Step 7.1** - Deploy to Vercel
  - Option A: Automatic (if connected to GitHub)
    - Merge PR to main/master
    - Vercel automatically builds and deploys
  - Option B: Manual
    ```bash
    vercel deploy --prod
    ```

- [ ] **Step 7.2** - Verify production deployment
  - Visit production URL
  - Test full workflow
  - Check Network tab for errors
  - Verify database is connected

- [ ] **Step 7.3** - Monitor after deployment
  - Check Vercel logs for errors
  - Check Supabase logs for slow queries
  - Monitor API response times
  - Set up alerts if not already done

---

## Phase 8: Post-Deployment (Day 1)

- [ ] **Step 8.1** - Smoke test on production
  - Create test broadcast with new system
  - Verify all features work
  - Test edge cases (very long names, special characters, etc.)

- [ ] **Step 8.2** - Gather feedback
  - Share with team
  - Collect UX feedback
  - Note any issues for next iteration

- [ ] **Step 8.3** - Documentation
  - Add link to BLOCK_SYSTEM.md in project README
  - Document any customizations made
  - Update team wiki/docs

---

## Troubleshooting During Deployment

### Build fails with "module not found"
**Solution:** Run `npm install` (or `pnpm install`)

### API returns 401 Unauthorized
**Solution:** Verify Supabase auth token is valid. Check if user is authenticated.

### Database queries slow
**Solution:** Verify indexes created. Run: `SELECT count(*) FROM pg_indexes WHERE tablename IN (...)`

### Variant generation fails
**Solution:** Check AI model is configured. Verify API keys in .env

### Context panel doesn't update blocks
**Solution:** Check that useContextAnalysis hook is properly integrated. Verify useEffect dependencies.

### Old emails don't work
**Solution:** They should still work! body field is maintained. If not, check serialization in block-operations.ts

---

## Success Criteria

You're ready for production when:

✅ Database migration ran without errors
✅ All 4 tables created with correct schema
✅ Default strategies inserted
✅ RLS policies enabled and tested
✅ All 6 APIs tested and responding 200 OK
✅ Frontend loads without console errors
✅ Intent selector, strategy selection, and block editor work
✅ Context panel updates blocks in real-time
✅ Subject line auto-generates
✅ Save as strategy creates database record
✅ All new data visible in database
✅ Indexes created for performance
✅ Build succeeds with 0 errors
✅ Production deployment successful

---

## Files to Keep

After deployment, reference these files:
- `README_BLOCK_SYSTEM.md` - Architecture & feature overview
- `QUICK_SETUP.md` - Quick reference for setup
- `SUPABASE_SETUP.md` - Detailed Supabase instructions
- `BLOCK_SYSTEM.md` - Component documentation
- `INTEGRATION_GUIDE.md` - Developer integration
- `USAGE_EXAMPLES.md` - Code examples
- `PRODUCTION_CHECKLIST.md` - This file

---

## Questions?

Refer to the documentation or reach out to the team.
Good luck! 🚀
