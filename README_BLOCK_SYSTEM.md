# Block-Based Email Composer System

**⚡ QUICK START: Read [QUICK_SETUP.md](./QUICK_SETUP.md) first (5 minutes)**

---

## What is This?

A **production-ready, strategy-driven, block-based email composer** that replaces manual email drafting with guided generation.

### Key Differentiators
- ✅ **No blank states** - Composer loads with intent + strategies pre-selected
- ✅ **3-layer flow** - Intent → Strategy → Block Editing
- ✅ **Block-based** - Edit Hook, Personalization, Value, CTA, Signature independently
- ✅ **Real-time personalization** - Context changes instantly update all blocks
- ✅ **Instant variants** - Switch between 2-3 pre-generated variations instantly
- ✅ **AI-powered** - Groq integration for intelligent generation
- ✅ **Production ready** - Full database, API, components, types, documentation

---

## Documentation Map

### 🚀 Getting Started
1. **[QUICK_SETUP.md](./QUICK_SETUP.md)** - 5-minute setup
   - Run SQL, set env vars, update code, deploy
   - Best for: Want to launch immediately

2. **[BUILD_SUMMARY.md](./BUILD_SUMMARY.md)** - What was built
   - Overview of all components, APIs, database changes
   - Best for: Understanding the big picture

### 🔧 Setup & Deployment
3. **[DATABASE_SETUP.md](./DATABASE_SETUP.md)** - Detailed DB instructions
   - Step-by-step database setup
   - Troubleshooting guide
   - Best for: Database-specific questions

4. **[PRODUCTION_CHECKLIST.md](./PRODUCTION_CHECKLIST.md)** - Pre-launch checklist
   - Verification steps before going live
   - Testing checklist
   - Monitoring setup
   - Best for: Pre-launch verification

### 📚 Reference & Learning
5. **[BLOCK_SYSTEM_INDEX.md](./BLOCK_SYSTEM_INDEX.md)** - Complete reference
   - File structure and organization
   - All API endpoints with examples
   - Component hierarchy
   - Data models
   - Best for: Detailed reference

6. **[BLOCK_SYSTEM.md](./BLOCK_SYSTEM.md)** - Architecture overview
   - System design
   - Data flow
   - Generation logic
   - Best for: Understanding architecture

7. **[USAGE_EXAMPLES.md](./USAGE_EXAMPLES.md)** - Code examples
   - API request/response examples
   - Component usage
   - Hook examples
   - Database queries
   - Best for: Copy-paste code samples

8. **[INTEGRATION_GUIDE.md](./INTEGRATION_GUIDE.md)** - Integration steps
   - How to integrate into your app
   - Component setup
   - State management
   - Best for: Integration tasks

### 📋 Reference Files
9. **[IMPLEMENTATION_SUMMARY.md](./IMPLEMENTATION_SUMMARY.md)** - Technical details
   - Database layer details
   - API specifications
   - Component specifications
   - Best for: Deep technical dive

10. **[FILES_CREATED.md](./FILES_CREATED.md)** - Complete file manifest
    - All 31 files created
    - File organization
    - Statistics
    - Best for: Finding specific files

---

## The Problem It Solves

### Before
```
User opens composer
  ↓
Blank textarea stares them in the face
  ↓
User struggles to write compelling email
  ↓
Result: Generic, low-converting emails
```

### After
```
User opens composer
  ↓
3 strategy options appear (ranked by context match)
  ↓
User selects strategy
  ↓
System generates 5 blocks (Hook, Personalization, Value, CTA, Signature)
  ↓
User fills context panel (recipient, company, role)
  ↓
Blocks update in real-time
  ↓
User can regenerate any block or switch variants
  ↓
Result: Personalized, high-converting emails guided by strategy
```

---

## Architecture at a Glance

### Database
```
strategies              email_contexts          email_blocks
├── id                 ├── id                  ├── id
├── intent             ├── broadcast_id        ├── broadcast_id
├── name               ├── recipient_name      ├── block_type
├── hooks[]            ├── company_name        ├── position
├── tone               ├── personalization...  ├── content
└── success_score      └── insights            └── variants[]

broadcasts (extended)
├── body (plaintext)
├── body_structure (JSON blocks)
├── strategy_id
├── context_id
└── intent
```

### API (7 endpoints)
```
Generation
  POST /api/generate/block              Generate blocks with variants

Strategies
  GET /api/strategies?intent=cold       Fetch top strategies
  POST /api/strategies/manage           Create strategy
  PUT /api/strategies/manage            Update strategy
  DELETE /api/strategies/manage?id=xxx  Delete strategy

Context
  GET /api/email/context                Fetch context
  POST /api/email/context               Save context
  POST /api/email/context/analyze       Analyze & suggest

Blocks
  GET /api/broadcasts/[id]/blocks       Fetch blocks
  POST /api/broadcasts/[id]/blocks      Save blocks
```

### UI Components (6 main)
```
BlockBasedComposer
├── IntentSelector        (Cold / Freelance / Follow-up)
├── StrategySelector      (Show top 3 strategies)
├── AiSubjectField        (AI-assisted subject)
├── BlockEditor           (5 editable blocks)
│   ├── Hook block
│   ├── Personalization block
│   ├── Value block
│   ├── CTA block
│   └── Signature block
└── ContextPanel          (Recipient, company, insights)
```

---

## User Journey

1. **Load Composer**
   - Default intent selected (e.g., "cold")
   - 3 top strategies loaded and displayed

2. **Select Strategy**
   - Click strategy card
   - 5 blocks generate in parallel
   - Each block has 2-3 variants

3. **Fill Context**
   - Enter recipient name, company, role
   - Context panel suggests insights
   - Personalization strength updates live

4. **Edit Blocks**
   - Click any block to expand
   - See 2-3 variant options
   - Regenerate single block if needed
   - Edit directly or use AI variants

5. **Send or Save**
   - Click "Send" to send email
   - Click "Save as Strategy" to save this combination
   - Broadcast saved with blocks + metadata

---

## Technology Stack

- **Frontend:** React, Next.js, TypeScript
- **Backend:** Next.js API Routes, Node.js
- **Database:** Supabase (PostgreSQL) with RLS
- **AI:** Groq API (LLaMA 3.3 70B)
- **State:** React hooks (useBlockComposer)

---

## Files at a Glance

### Database (1 to run)
- `scripts/03_block_system_complete.sql` ← Copy-paste this into Supabase

### Backend API (7 endpoints)
- `app/api/generate/block/route.ts`
- `app/api/strategies/route.ts`
- `app/api/strategies/manage/route.ts`
- `app/api/email/context/route.ts`
- `app/api/email/context/analyze/route.ts`
- `app/api/broadcasts/[id]/blocks/route.ts`
- `app/api/broadcasts/route.ts` (updated)

### Frontend Components (6 main)
- `components/block-based-composer.tsx`
- `components/block-editor.tsx`
- `components/intent-selector.tsx`
- `components/strategy-selector.tsx`
- `components/context-panel.tsx`
- `components/ai-subject-field.tsx`

### Hooks & Utils
- `lib/hooks/use-block-composer.ts`
- `lib/hooks/use-context-analysis.ts`
- `lib/types/block-system.ts`
- `lib/block-operations.ts`

### Documentation
- All `.md` files in project root

---

## Step-by-Step Deployment

### Step 1: Database (2 min)
```bash
# Copy scripts/03_block_system_complete.sql
# Paste into Supabase SQL Editor → Run
```

### Step 2: Environment Variables (1 min)
```env
SUPABASE_URL=https://your-project.supabase.co
SUPABASE_ANON_KEY=your-anon-key
GROQ_API_KEY=your-groq-api-key
```

### Step 3: Code (1 min)
```typescript
// In your composer page:
import { BlockBasedComposer } from '@/components/block-based-composer';

export default function Page() {
  return <BlockBasedComposer />;
}
```

### Step 4: Deploy (1 min)
```bash
git push origin main
# Vercel auto-deploys
```

---

## Key Features

### 1. Intent-Driven
- Starts with intent selection
- 4 system intents: cold, freelance, follow-up, custom
- Users can create custom intents

### 2. Strategy Selection
- Top 3 strategies ranked by context match
- Match score reflects personalization completeness
- Instant strategy switching pre-generates variants

### 3. Block-Based Editing
- 5 standard blocks: Hook, Personalization, Value, CTA, Signature
- Each block independent
- Regenerate single blocks without affecting others
- 2-3 variants per block, switch instantly

### 4. Real-Time Personalization
- Context fields: recipient, company, role, insights
- Personalization strength calculated live (0-100%)
- All blocks update when context changes
- AI suggestions for context insights

### 5. Data Persistence
- Broadcast stored with blocks (JSON)
- Context stored separately
- Strategy ID tracked for analytics
- Reply tracking ready for future

### 6. Production Ready
- Row-Level Security (RLS) on all tables
- User isolation at database level
- Comprehensive error handling
- Type-safe throughout

---

## Quick Test

After deployment, test the flow:

1. Open app → Composer
2. Select "Cold" intent
3. See 3 strategies appear
4. Click first strategy
5. Wait for blocks to load
6. Enter recipient info:
   - Name: "Sarah"
   - Company: "TechCorp"
   - Role: "VP Sales"
7. See personalization strength increase
8. Click any block to see variants
9. Click "Send" or "Save as Strategy"
10. ✅ Done!

---

## Support & Troubleshooting

| Problem | Solution | Reference |
|---------|----------|-----------|
| "How do I start?" | Read QUICK_SETUP.md | [Link](./QUICK_SETUP.md) |
| "What was built?" | Read BUILD_SUMMARY.md | [Link](./BUILD_SUMMARY.md) |
| "Database error" | See DATABASE_SETUP.md | [Link](./DATABASE_SETUP.md) |
| "Pre-launch check" | Run PRODUCTION_CHECKLIST.md | [Link](./PRODUCTION_CHECKLIST.md) |
| "Need code examples?" | See USAGE_EXAMPLES.md | [Link](./USAGE_EXAMPLES.md) |
| "Where's the API docs?" | See BLOCK_SYSTEM_INDEX.md | [Link](./BLOCK_SYSTEM_INDEX.md) |
| "File location?" | See FILES_CREATED.md | [Link](./FILES_CREATED.md) |

---

## What's Next

### Immediate
- Run setup (5 min)
- Deploy to production (1 min)
- Test end-to-end

### This Week
- Monitor usage
- Collect user feedback
- Fine-tune strategies

### This Month
- Add reply detection
- Implement A/B testing
- Build analytics dashboard

### This Quarter
- ML-based recommendations
- Automated sequences
- Team collaboration

---

## Summary

You have a **complete, production-ready system** for:
- Strategy-driven email composition
- Block-based editing with variants
- Real-time personalization
- AI-powered generation
- Full data persistence
- Comprehensive documentation

**Everything is ready to deploy.** 🚀

---

## Start Here

**→ [QUICK_SETUP.md](./QUICK_SETUP.md)** - 5 minutes to launch

Then reference the map above for specific topics.

---

**Questions?** Check [BLOCK_SYSTEM_INDEX.md](./BLOCK_SYSTEM_INDEX.md) for complete reference.
