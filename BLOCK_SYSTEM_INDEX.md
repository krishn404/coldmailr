# Block-Based Email System - Complete Documentation Index

## Quick Links

🚀 **Getting Started**
- [DATABASE_SETUP.md](./DATABASE_SETUP.md) - Database setup instructions
- [PRODUCTION_CHECKLIST.md](./PRODUCTION_CHECKLIST.md) - Pre-launch checklist

📖 **Documentation**
- [BLOCK_SYSTEM.md](./BLOCK_SYSTEM.md) - System architecture overview
- [IMPLEMENTATION_SUMMARY.md](./IMPLEMENTATION_SUMMARY.md) - What was built
- [USAGE_EXAMPLES.md](./USAGE_EXAMPLES.md) - Code examples
- [INTEGRATION_GUIDE.md](./INTEGRATION_GUIDE.md) - Integration steps

## File Structure

```
coldmailr/
├── scripts/
│   ├── 01_init_schema.sql              (existing: original schema)
│   ├── 02_block_based_schema.sql       (new: initial migration)
│   └── 03_block_system_complete.sql    (new: complete setup - USE THIS)
│
├── lib/
│   ├── types/
│   │   └── block-system.ts             (new: TypeScript types)
│   ├── hooks/
│   │   ├── use-block-composer.ts       (new: state management)
│   │   └── use-context-analysis.ts     (new: analysis hook)
│   ├── block-operations.ts             (new: utilities)
│   └── ensure-broadcasts-schema.ts     (updated: schema definitions)
│
├── components/
│   ├── block-based-composer.tsx        (new: main composer UI)
│   ├── block-editor.tsx                (new: block editor)
│   ├── intent-selector.tsx             (new: intent selection)
│   ├── strategy-selector.tsx           (new: strategy cards)
│   ├── context-panel.tsx               (new: context input)
│   ├── ai-subject-field.tsx            (new: subject field)
│   └── [other existing components]
│
├── app/api/
│   ├── generate/
│   │   └── block/route.ts              (new: block generation)
│   ├── strategies/
│   │   ├── route.ts                    (new: strategy fetching)
│   │   └── manage/route.ts             (new: strategy CRUD)
│   ├── email/
│   │   └── context/
│   │       ├── route.ts                (new: context CRUD)
│   │       └── analyze/route.ts        (new: context analysis)
│   ├── broadcasts/
│   │   ├── route.ts                    (updated: support new fields)
│   │   └── [id]/blocks/route.ts        (new: block CRUD)
│   └── [other existing routes]
│
├── DATABASE_SETUP.md                   (new: setup guide)
├── BLOCK_SYSTEM.md                     (new: architecture)
├── BLOCK_SYSTEM_INDEX.md               (new: this file)
├── IMPLEMENTATION_SUMMARY.md           (new: what was built)
├── INTEGRATION_GUIDE.md                (new: integration steps)
├── PRODUCTION_CHECKLIST.md             (new: pre-launch checklist)
└── USAGE_EXAMPLES.md                   (new: code examples)
```

## Setup Instructions

### 1. Database Setup (Required)
```bash
# Option A: Use SQL file (recommended)
1. Go to Supabase Dashboard → SQL Editor
2. Create new query
3. Copy contents of scripts/03_block_system_complete.sql
4. Run query

# Option B: Use ensure-broadcasts-schema.ts
1. Deploy code
2. First API call auto-runs schema creation
3. Verify in Supabase dashboard
```

### 2. Environment Variables (Required)
```env
SUPABASE_URL=https://your-project.supabase.co
SUPABASE_ANON_KEY=your-anon-key
GROQ_API_KEY=your-groq-api-key
```

### 3. Update Application Code
```typescript
// In your composer page/component:
import { BlockBasedComposer } from '@/components/block-based-composer';

export default function ComposerPage() {
  return <BlockBasedComposer />;
}
```

### 4. Deploy
```bash
git push origin main
# Vercel auto-deploys
```

## API Endpoints Summary

### Generation
| Method | Endpoint | Purpose |
|--------|----------|---------|
| POST | `/api/generate/block` | Generate block content with 2-3 variants |
| POST | `/api/email/context/analyze` | Analyze context, calculate strength, suggest improvements |

### Strategies (Intent-driven)
| Method | Endpoint | Purpose |
|--------|----------|---------|
| GET | `/api/strategies?intent=cold` | Fetch top strategies for intent |
| POST | `/api/strategies/manage` | Create new user strategy |
| PUT | `/api/strategies/manage` | Update existing strategy |
| DELETE | `/api/strategies/manage?id=xxx` | Delete user strategy |

### Context Management
| Method | Endpoint | Purpose |
|--------|----------|---------|
| GET | `/api/email/context?broadcast_id=xxx` | Fetch context for broadcast |
| POST | `/api/email/context` | Save/update context |

### Block Management
| Method | Endpoint | Purpose |
|--------|----------|---------|
| GET | `/api/broadcasts/[id]/blocks` | Fetch all blocks for broadcast |
| POST | `/api/broadcasts/[id]/blocks` | Save/update blocks for broadcast |

### Broadcasting (Updated)
| Method | Endpoint | Purpose |
|--------|----------|---------|
| GET | `/api/broadcasts` | List broadcasts (now includes new fields) |
| POST | `/api/broadcasts` | Create broadcast (now supports block_structure) |

## Data Models

### Strategy
```typescript
{
  id: UUID;
  user_id: string;
  intent: 'cold' | 'freelance' | 'follow_up' | 'custom';
  name: string;
  tone?: 'casual' | 'professional' | 'persuasive' | 'urgent' | 'friendly';
  hooks: string[];              // Opening line suggestions
  personalization_hints: string[];
  cta_types: string[];         // CTA suggestions
  is_system: boolean;          // System vs. user-created
  usage_count: number;         // Tracking
  success_score: number;       // 0-1 score
}
```

### EmailBlock
```typescript
{
  id: UUID;
  broadcast_id: UUID;
  block_type: 'hook' | 'personalization' | 'value' | 'cta' | 'signature' | 'custom';
  position: number;            // 0-4 for standard blocks
  content: string;             // Main block content
  variants: {                  // Alternative versions
    [index: string]: string;   // "0": "...", "1": "...", "2": "..."
  };
  active_variant_index: number;
}
```

### EmailContext
```typescript
{
  id: UUID;
  broadcast_id: UUID;
  recipient_name?: string;
  recipient_email?: string;
  company_name?: string;
  company_industry?: string;
  recipient_role?: string;
  context_insights?: string;
  personalization_strength: number;  // 0-1 calculated strength
  ai_suggestions?: Record<string, any>;
}
```

## Component Hierarchy

```
BlockBasedComposer (main container)
├── IntentSelector
│   └── [Intent buttons]
├── StrategySelectorCards
│   ├── StrategyCard 1
│   ├── StrategyCard 2
│   └── StrategyCard 3
├── AiSubjectField
│   └── [Subject + regenerate button]
├── BlockEditor
│   ├── BlockItem (Hook)
│   │   └── [Content + variants + controls]
│   ├── BlockItem (Personalization)
│   │   └── [Content + variants + controls]
│   ├── BlockItem (Value)
│   │   └── [Content + variants + controls]
│   ├── BlockItem (CTA)
│   │   └── [Content + variants + controls]
│   └── BlockItem (Signature)
│       └── [Content + variants + controls]
├── ContextPanel
│   ├── RecipientNameInput
│   ├── CompanyNameInput
│   ├── RoleInput
│   ├── ContextInsightsInput
│   └── PersonalizationStrengthIndicator
└── ActionBar
    ├── [Send button]
    ├── [Save as Strategy button]
    └── [Deliverability warnings]
```

## State Flow

```
User selects Intent
    ↓
useBlockComposer() fetches top 3 strategies
    ↓
Strategies displayed
    ↓
User selects strategy
    ↓
/api/generate/block called in parallel for 5 blocks
    ↓
Blocks render with content + 2 variants each
    ↓
User fills context panel
    ↓
useContextAnalysis() calculates personalization strength
    ↓
Context saved to database
    ↓
Blocks auto-update based on new context
    ↓
User sends email
    ↓
Broadcast created with blocks, context, strategy_id stored
```

## Testing

### Unit Test Templates

```typescript
// Test block serialization
describe('blockOperations', () => {
  test('serializeBlocks should produce valid JSON', () => {
    // ...
  });
  
  test('deserializeBlocks should restore original structure', () => {
    // ...
  });
});

// Test context analysis
describe('contextAnalysis', () => {
  test('calculatePersonalizationStrength', () => {
    // ...
  });
});

// Test strategy matching
describe('strategyMatching', () => {
  test('calculateMatchScore', () => {
    // ...
  });
});
```

### Integration Test Templates

```typescript
// Test full flow
describe('BlockBasedComposer', () => {
  test('should load, select strategy, fill context, and save', async () => {
    // 1. Render composer
    // 2. Select intent
    // 3. Choose strategy
    // 4. Fill context
    // 5. Edit blocks
    // 6. Send
    // 7. Verify broadcast created with blocks
  });
});
```

## Monitoring & Observability

### Key Metrics
- Strategy selection frequency per intent
- Block regeneration patterns
- Context completion rate (%)
- Personalization strength distribution
- API response times (ms)
- Error rates by endpoint
- Send success rate per strategy

### Sample SQL Queries
```sql
-- Top strategies by usage
SELECT strategy_id, COUNT(*) as usage_count, AVG(success_score) as avg_success
FROM broadcasts
WHERE strategy_id IS NOT NULL
GROUP BY strategy_id
ORDER BY usage_count DESC;

-- Personalization strength distribution
SELECT 
  ROUND(personalization_strength, 1) as strength,
  COUNT(*) as count
FROM email_contexts
GROUP BY ROUND(personalization_strength, 1)
ORDER BY strength;

-- Strategy success rates
SELECT 
  s.name,
  s.intent,
  COUNT(b.id) as sent_count,
  AVG(s.success_score) as avg_success
FROM strategies s
LEFT JOIN broadcasts b ON s.id = b.strategy_id
GROUP BY s.id, s.name, s.intent
ORDER BY avg_success DESC;
```

## Troubleshooting

### Common Issues

**Database connection error**
- Check env vars are set correctly
- Verify Supabase project is active
- Test with `SELECT 1;` in SQL editor

**RLS permission denied**
- Ensure user is authenticated
- Check RLS policies in Supabase dashboard
- Verify `auth.uid()` returns correct user ID

**Blocks not saving**
- Check API response for errors
- Verify broadcast ID is correct
- Ensure user owns the broadcast

**Generation API timeout**
- Check Groq API key is valid
- Monitor API response times
- Consider caching more aggressively

See [DATABASE_SETUP.md](./DATABASE_SETUP.md#troubleshooting) for more.

## Useful Commands

```bash
# Run migrations
npm run db:migrate

# Test API
curl -X POST http://localhost:3000/api/strategies \
  -H "Authorization: Bearer YOUR_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{"intent": "cold"}'

# Deploy
git push origin main

# Check logs
vercel logs
```

## Quick Start Checklist

- [ ] Run `scripts/03_block_system_complete.sql`
- [ ] Set `SUPABASE_URL`, `SUPABASE_ANON_KEY`, `GROQ_API_KEY`
- [ ] Import `BlockBasedComposer` component
- [ ] Test flow: Intent → Strategy → Blocks → Context → Send
- [ ] Verify blocks saved in database
- [ ] Deploy to production

## Support & Resources

- **Schema Issues**: See [DATABASE_SETUP.md](./DATABASE_SETUP.md)
- **Integration Issues**: See [INTEGRATION_GUIDE.md](./INTEGRATION_GUIDE.md)
- **Code Examples**: See [USAGE_EXAMPLES.md](./USAGE_EXAMPLES.md)
- **Architecture**: See [BLOCK_SYSTEM.md](./BLOCK_SYSTEM.md)

---

**Built:** Block-Based Email Composer System  
**Status:** Production Ready  
**Last Updated:** 2024  
**Version:** 1.0.0
