# Block-Based Composer - Usage Examples

## 1. Basic Integration in App Page

```typescript
// app/app/page.tsx
'use client';

import { useState } from 'react';
import { BlockBasedComposer } from '@/components/block-based-composer';

export default function AppPage() {
  const [composerOpen, setComposerOpen] = useState(false);
  const fromEmail = 'your@email.com';

  return (
    <div className="space-y-4">
      <button
        onClick={() => setComposerOpen(true)}
        className="px-4 py-2 bg-indigo-600 text-white rounded"
      >
        New Email
      </button>

      <BlockBasedComposer
        isOpen={composerOpen}
        onClose={() => setComposerOpen(false)}
        fromEmail={fromEmail}
        canSend={true}
        onSaved={() => console.log('Saved')}
        onSent={(broadcastId) => console.log('Sent:', broadcastId)}
      />
    </div>
  );
}
```

## 2. Using useBlockComposer Hook Directly

```typescript
'use client';

import { useBlockComposer } from '@/lib/hooks/use-block-composer';

export function CustomComposer() {
  const composer = useBlockComposer({
    initialBroadcastId: 'broadcast-123',
    initialContext: {
      recipient_name: 'John',
      company_name: 'Acme Corp',
    },
  });

  // Access state
  console.log('Current intent:', composer.state.intent);
  console.log('Selected strategy:', composer.state.selectedStrategy?.name);
  console.log('Blocks:', composer.state.blocks);
  console.log('Personalization:', composer.state.personalizationStrength);

  // Use actions
  return (
    <button
      onClick={() => composer.setIntent('cold')}
      className="px-4 py-2 bg-blue-500 text-white rounded"
    >
      Switch to Cold Intent
    </button>
  );
}
```

## 3. Manual Block Generation

```typescript
// Generate a single block
async function generateHook() {
  const response = await fetch('/api/generate/block', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      block_type: 'hook',
      strategy_id: 'strategy-uuid',
      context: {
        recipient_name: 'Sarah',
        company_name: 'Tech Startup Inc',
        context_insights: 'Recently raised Series A funding',
      },
      tone: 'professional',
    }),
  });

  const data = await response.json();
  console.log('Main content:', data.content);
  console.log('Variants:', data.variants); // Array of 2 alternatives
}
```

## 4. Fetching Strategies for Intent

```typescript
async function getStrategies() {
  const response = await fetch('/api/strategies', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      intent: 'cold',
      context: {
        recipient_name: 'John',
        company_name: 'Acme Corp',
        company_industry: 'SaaS',
      },
    }),
  });

  const data = await response.json();
  // data.strategies = [
  //   {
  //     strategy: { id, name, description, ... },
  //     matchScore: 0.85,  // How well it matches context
  //     variants: 3        // Available variants
  //   },
  //   ...
  // ]

  return data.strategies;
}
```

## 5. Analyzing Context

```typescript
async function analyzeContext() {
  const response = await fetch('/api/email/context/analyze', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      recipient_name: 'John Smith',
      company_name: 'Acme Corp',
      company_industry: 'SaaS',
      recipient_role: 'VP Sales',
      context_notes: 'Recently appeared on TechCrunch',
    }),
  });

  const result = await response.json();
  console.log('Strength:', result.personalization_strength); // 0.85
  console.log('Suggestions:', result.ai_suggestions);
  // [
  //   "Mention their TechCrunch feature in the hook",
  //   "Reference their VP Sales role when discussing value",
  //   "Ask about their sales process improvements"
  // ]
}
```

## 6. Saving Draft with Block Structure

```typescript
async function saveDraft() {
  const response = await fetch('/api/broadcasts', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      to_email: 'john@acme.com',
      from_email: 'your@email.com',
      subject: 'Quick opportunity for Acme',
      body: 'Full email text here...',
      context: 'Personalization notes',
      status: 'draft',
      body_structure: {
        blocks: [
          {
            type: 'hook',
            content: 'Saw your recent TechCrunch feature...',
            variants: [],
          },
          {
            type: 'personalization',
            content: 'Your VP Sales role at Acme caught my eye...',
            variants: [],
          },
          {
            type: 'value',
            content: 'We help sales teams close 40% faster...',
            variants: [],
          },
          {
            type: 'cta',
            content: 'Quick call next week?',
            variants: [],
          },
          {
            type: 'signature',
            content: 'John Doe\nSales @ MyCompany\njohn@mycompany.com',
            variants: [],
          },
        ],
        strategy_id: 'strategy-123',
        context_id: 'context-456',
        generated_at: '2024-01-01T00:00:00Z',
      },
      strategy_id: 'strategy-123',
      context_id: 'context-456',
      intent: 'cold',
    }),
  });

  const broadcast = await response.json();
  console.log('Saved with ID:', broadcast.data.id);
}
```

## 7. Converting Block Structure to Plaintext

```typescript
import { blockStructureToPlaintext } from '@/lib/block-operations';

const structure = {
  blocks: [
    { type: 'hook', content: 'First sentence...' },
    { type: 'value', content: 'Value prop...' },
    { type: 'cta', content: 'CTA here...' },
    { type: 'signature', content: 'Signature...' },
  ],
};

const emailText = blockStructureToPlaintext(structure);
// Output:
// First sentence...
//
// Value prop...
//
// CTA here...
//
// ---
// Signature...
```

## 8. Reconstructing Block Structure from Plaintext

```typescript
import { plaintextToBlockStructure } from '@/lib/block-operations';

const emailText = `Hi John,

I saw your recent post on scaling sales teams. We've helped companies like Acme do this in half the time.

Would love a quick call next week.

Best,
Jane`;

const structure = plaintextToBlockStructure(emailText);
// Automatically separates into hook, value, cta, signature blocks
```

## 9. Validating Block Structure

```typescript
import { validateBlockStructure } from '@/lib/block-operations';

const structure = { blocks: [/* ... */] };

const validation = validateBlockStructure(structure);
// { valid: true, missingTypes: [] }

if (!validation.valid) {
  console.log('Missing blocks:', validation.missingTypes);
  // Missing blocks: ['cta']
}
```

## 10. Creating Default Block Structure

```typescript
import { createDefaultBlockStructure } from '@/lib/block-operations';

const emptyStructure = createDefaultBlockStructure();
// Returns structure with all 5 block types, empty content
```

## 11. Block Operations in Composer

```typescript
const composer = useBlockComposer();

// Update a block's content
composer.updateBlock('block-123', 'New content here');

// Update block content AND swap to a variant
composer.updateBlock('block-123', 'Variant content', 1);

// Regenerate block with new content
await composer.regenerateBlock('block-123');

// Swap to a specific variant
composer.swapBlockVariant('block-123', 2);

// Delete block (reorders others)
composer.deleteBlock('block-123');
```

## 12. Real-time Context Updates

```typescript
const composer = useBlockComposer();

// Update any context field
composer.updateContext({
  recipient_name: 'John',
  company_name: 'Acme',
  recipient_role: 'CTO',
});

// This automatically:
// 1. Recalculates personalization strength
// 2. Updates strategy recommendations (on next load)
// 3. Can trigger block regeneration if enabled
```

## 13. Advanced: Custom Email Generation Flow

```typescript
async function generateCustomEmail(intent, recipientData) {
  // 1. Get strategies for intent
  const strategiesRes = await fetch('/api/strategies', {
    method: 'POST',
    body: JSON.stringify({
      intent,
      context: recipientData,
    }),
  });
  const { strategies } = await strategiesRes.json();
  const topStrategy = strategies[0].strategy;

  // 2. Generate each block
  const blocks = [];
  for (const blockType of ['hook', 'personalization', 'value', 'cta', 'signature']) {
    const blockRes = await fetch('/api/generate/block', {
      method: 'POST',
      body: JSON.stringify({
        block_type: blockType,
        strategy_id: topStrategy.id,
        context: recipientData,
        tone: topStrategy.tone,
      }),
    });
    const blockData = await blockRes.json();
    blocks.push({
      type: blockType,
      content: blockData.content,
      variants: blockData.variants,
    });
  }

  // 3. Return complete email structure
  return {
    blocks,
    strategy_id: topStrategy.id,
    generated_at: new Date().toISOString(),
  };
}

// Usage
const email = await generateCustomEmail('cold', {
  recipient_name: 'John',
  company_name: 'Acme',
  context_insights: 'Recently funded',
});
```

## 14. Component-Level Usage

```typescript
// Use in a custom component
import { BlockEditor } from '@/components/block-editor';
import { ContextPanel } from '@/components/context-panel';

export function MyComposer() {
  const [blocks, setBlocks] = useState([]);
  const [context, setContext] = useState({});

  return (
    <div className="grid grid-cols-2 gap-6">
      <div>
        <BlockEditor
          blocks={blocks}
          onBlockUpdate={(id, content) => {
            // Update block
          }}
          onBlockRegenerate={(id) => {
            // Regenerate block
          }}
          onBlockSwapVariant={(id, idx) => {
            // Swap to variant
          }}
          onBlockDelete={(id) => {
            // Delete block
          }}
          isGenerating={false}
        />
      </div>

      <div>
        <ContextPanel
          context={context}
          onChange={setContext}
          personalizationStrength={0.75}
        />
      </div>
    </div>
  );
}
```

## Error Handling

```typescript
try {
  const composer = useBlockComposer();
  await composer.selectStrategy(strategyId);
} catch (error) {
  console.error('Strategy selection failed:', error);
  toast.error('Failed to generate email blocks');
}
```

## Notes

- All API endpoints require authentication (`requireApiAuth`)
- Groq API key must be set in environment
- Block generation uses Groq's Llama model
- Variants are generated with different temperatures for diversity
- Context analysis is synchronous (no rate limiting needed)
