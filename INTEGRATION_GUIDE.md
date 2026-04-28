# Block-Based Composer - Integration Guide

## Quick Start

### 1. Add to Your App

```typescript
// app/app/page.tsx
import { BlockBasedComposer } from '@/components/block-based-composer';
import { useState } from 'react';

export default function AppPage() {
  const [composerOpen, setComposerOpen] = useState(false);

  return (
    <>
      <button onClick={() => setComposerOpen(true)}>
        New Email
      </button>

      <BlockBasedComposer
        isOpen={composerOpen}
        onClose={() => setComposerOpen(false)}
        fromEmail="your@email.com"
        canSend={true}
        onSaved={() => {
          // Refresh email list
        }}
        onSent={(broadcastId) => {
          // Show success, close modal
          setComposerOpen(false);
        }}
      />
    </>
  );
}
```

### 2. Ensure Database is Set Up

The schema migration runs automatically via `ensure-broadcasts-schema.ts`, but you can manually run it:

```bash
# If using psql
psql -h localhost -U user -d database -f scripts/02_block_based_schema.sql
```

### 3. Verify Environment Variables

```
GROQ_API_KEY=your_key_here
SUPABASE_URL=your_url
SUPABASE_ANON_KEY=your_key
SUPABASE_SERVICE_ROLE_KEY=your_key
```

## Component Props

### BlockBasedComposer

```typescript
interface BlockBasedComposerProps {
  isOpen: boolean;                    // Control modal visibility
  onClose: () => void;                // Called when user closes
  fromEmail?: string | null;          // Sender email
  canSend: boolean;                   // Enable/disable send button
  onSaved?: () => void;               // Called after save
  onSent?: (broadcastId: string) => void;  // Called after send
}
```

## State Management

### Using useBlockComposer Hook

```typescript
const composer = useBlockComposer({
  initialBroadcastId?: string;        // Edit existing
  initialContext?: Partial<EmailContext>;  // Pre-fill
});

// State
composer.state.intent              // 'cold' | 'freelance' | 'follow_up'
composer.state.selectedStrategy    // Strategy object
composer.state.strategies          // Array of StrategyCard
composer.state.blocks              // Array of EmailBlock
composer.state.context             // Partial<EmailContext>
composer.state.personalizationStrength  // 0-1
composer.state.isGenerating        // Loading state
composer.state.broadcastId         // Current broadcast ID

// Actions
composer.setIntent(intent)         // Change intent
composer.updateContext(context)    // Update context fields
composer.selectStrategy(id)        // Select and generate blocks
composer.updateBlock(id, content)  // Edit block
composer.regenerateBlock(id)       // Regenerate single block
composer.swapBlockVariant(id, idx) // Switch variant
composer.deleteBlock(id)           // Remove block

// Computed
composer.hasCompleteEmail          // Boolean
composer.getEmailPreview()         // { subject, body }
```

## API Integration

### Authentication

All endpoints require auth header (handled by client automatically):

```
Authorization: Bearer {auth_token}
```

### Generating Blocks

```typescript
// Generate hook block
fetch('/api/generate/block', {
  method: 'POST',
  body: JSON.stringify({
    block_type: 'hook',
    strategy_id: 'uuid',
    context: {
      recipient_name: 'John',
      company_name: 'Acme',
    },
    tone: 'professional',
  }),
})
```

**Block Types & Constraints:**
- `hook`: 1-2 sentences, 30 words max
- `personalization`: 1 sentence, 25 words max
- `value`: 2-3 sentences, 50 words max
- `cta`: 1 sentence, 20 words max
- `signature`: 2-3 lines

### Fetching Strategies

```typescript
// Get top strategies for intent
fetch('/api/strategies', {
  method: 'POST',
  body: JSON.stringify({
    intent: 'cold',
    context: { /* recipient data */ },
  }),
})
```

Returns array of `StrategyCard` with match scores.

### Analyzing Context

```typescript
// Get personalization suggestions
fetch('/api/email/context/analyze', {
  method: 'POST',
  body: JSON.stringify({
    recipient_name: 'John',
    company_name: 'Acme',
    company_industry: 'SaaS',
    context_notes: 'Recent funding',
  }),
})
```

Returns:
```json
{
  "personalization_strength": 0.85,
  "ai_suggestions": ["suggestion 1", "suggestion 2"],
  "analysis_timestamp": "2024-01-01T00:00:00Z"
}
```

## Data Persistence

### Saving Emails

Emails now save as both plaintext and block structure:

```typescript
// Save maintains backward compatibility
await fetch('/api/broadcasts', {
  method: 'POST',
  body: JSON.stringify({
    to_email: 'recipient@example.com',
    subject: 'Subject',
    body: 'Plain text for compatibility',
    body_structure: {
      blocks: [
        { type: 'hook', content: '...' },
        // ...
      ],
      strategy_id: 'uuid',
      context_id: 'uuid',
    },
  }),
});
```

### Reading Saved Emails

```typescript
// Fetch includes block structure
const broadcast = await fetch(`/api/broadcasts?id=${id}`);
const data = await broadcast.json();

// Access block structure
if (data.body_structure) {
  // Use structured blocks
} else {
  // Fall back to plaintext body
}
```

## Customization

### Changing Default Intent

Modify `lib/hooks/use-block-composer.ts`:

```typescript
const DEFAULT_INTENT: Intent = 'freelance'; // Change from 'cold'
```

### Adding Custom Block Type

1. Update `BlockType` in `lib/types/block-system.ts`
2. Add prompt to `BLOCK_PROMPTS` in `/api/generate/block/route.ts`
3. Update `DEFAULT_BLOCK_ORDER` in `lib/block-operations.ts`

### Adjusting Personalization Strength Calculation

Edit `useContextAnalysis` in `lib/hooks/use-context-analysis.ts`:

```typescript
function calculatePersonalizationStrength(context: Partial<EmailContext>): number {
  // Adjust weights and thresholds here
}
```

### Customizing Generation Prompts

Edit block prompts in `/api/generate/block/route.ts`:

```typescript
const BLOCK_PROMPTS: Record<BlockType, string> = {
  hook: `Your custom prompt for hook blocks...`,
  // ...
};
```

## Performance Optimization

### Caching Variants

Variants are cached in `block_variants_cache` table:
- 24-hour expiration by default
- Auto-cleared when context changes significantly
- Modify TTL in migration if needed

### Parallel Generation

Block generation uses `Promise.all()` to generate all 5 blocks simultaneously. This is automatic in `useBlockComposer().selectStrategy()`.

### Lazy Loading

Strategies are only fetched when intent changes, reducing API calls.

## Troubleshooting

### Blocks Not Generating

1. Check Groq API key is set
2. Verify context has at least `recipient_name` and `company_name`
3. Check browser console for detailed error
4. Verify auth token is valid

### Low Personalization Strength

- Ensure recipient name and company name are filled
- Add more context in the insights field
- Role and industry are optional but boost strength

### Variants Not Showing

- Some block types may not have variants generated
- Regenerate the block to create variants
- Check API response includes `variants` array

### Strategy Not Selecting

- Verify strategy ID is valid
- Check it matches current user's intent
- Ensure auth is valid

### Email Not Saving

- Verify `to_email` is valid
- Check `subject` is not empty
- Ensure at least one block has content
- Verify user auth token

## Testing

### Unit Tests for Block Operations

```typescript
import { validateBlockStructure, createDefaultBlockStructure } from '@/lib/block-operations';

test('validates block structure', () => {
  const structure = createDefaultBlockStructure();
  const { valid } = validateBlockStructure(structure);
  expect(valid).toBe(true);
});
```

### Integration Testing

```typescript
// Test full flow
it('generates email from intent to send', async () => {
  // 1. Select intent
  composer.setIntent('cold');

  // 2. Strategies load
  await waitFor(() => composer.state.strategies.length > 0);

  // 3. Select strategy
  composer.selectStrategy(composer.state.strategies[0].strategy.id);

  // 4. Blocks generate
  await waitFor(() => composer.state.blocks.length > 0);

  // 5. Update context
  composer.updateContext({ recipient_name: 'John' });

  // 6. Email ready
  expect(composer.hasCompleteEmail).toBe(false); // Still needs more context
});
```

## Deployment Checklist

- [ ] Database migration runs successfully
- [ ] All environment variables set
- [ ] Groq API key is valid
- [ ] Supabase connection verified
- [ ] Auth system working
- [ ] Test block generation endpoint
- [ ] Test strategy fetching endpoint
- [ ] Test context analysis endpoint
- [ ] BlockBasedComposer integrated in app
- [ ] Send/save functionality working
- [ ] Error handling in place
- [ ] Loading states visible
- [ ] Mobile responsive layout verified

## Support

For issues or questions:
1. Check BLOCK_SYSTEM.md for comprehensive documentation
2. Review USAGE_EXAMPLES.md for code samples
3. Check implementation comments in source files
4. Enable debug logging to trace issues

## Version History

**v1.0.0** (Initial Release)
- 5-block system (Hook, Personalization, Value, CTA, Signature)
- 3 intents (Cold, Freelance, Follow-up)
- System strategies + custom strategy saving
- Context-driven personalization
- Variant generation and switching
- Real-time block editing
