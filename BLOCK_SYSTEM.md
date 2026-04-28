# Block-Based Email Composer System

## Overview

The block-based email composer is a strategy-driven, structured approach to cold email generation that replaces manual drafting with guided generation. Instead of blank-page writing, users select an intent, choose a strategy, provide minimal context, and the system generates a structured, fully-formed email composed of distinct, editable blocks.

## Core Concepts

### 1. Intent

The purpose of the email. Currently supported:
- **Cold**: First-time outreach to new prospects
- **Freelance**: Offering services or portfolio work
- **Follow-up**: Reengagement after initial contact

Intents drive strategy selection and generation constraints.

### 2. Strategy

A pre-configured or user-saved approach to composing emails. Each strategy includes:
- **Tone**: Professional, casual, persuasive, urgent, or friendly
- **Hooks**: Opening lines that grab attention
- **Personalization hints**: Guidance on what to reference
- **CTA types**: Call-to-action styles

System strategies are provided for each intent. Users can save custom strategies by saving emails as strategies.

### 3. Email Blocks

Emails are composed of distinct, independently editable blocks:
- **Hook** (1-2 sentences): Attention-grabbing opening referencing something specific
- **Personalization** (1 sentence): Personal connection point
- **Value** (2-3 sentences): Why the recipient should care
- **CTA** (1 sentence): Clear, low-friction call-to-action
- **Signature** (2-3 lines): Contact information

Each block can be:
- **Edited** inline
- **Regenerated** independently without affecting others
- **Swapped** with 2-3 alternative variants
- **Deleted** (if not required)

### 4. Context Panel

Structured fields that drive personalization:
- **Recipient Name**: Who you're emailing
- **Company Name**: Where they work
- **Role**: Their position (optional)
- **Industry**: Company industry (optional)
- **Key Context**: Specific insights, achievements, or pain points

Context is analyzed in real-time to calculate **personalization strength** (0-100%), which indicates email quality and relevance.

## Database Schema

### New Tables

```sql
-- Strategies: Pre-configured and user-saved generation approaches
strategies (
  id, user_id, intent, name, description, tone,
  hooks[], personalization_hints[], cta_types[],
  is_system, usage_count, success_score, metadata
)

-- Email Context: Structured personalization data
email_contexts (
  id, user_id, broadcast_id, recipient_name, company_name,
  recipient_role, company_industry, context_insights,
  personalization_strength, ai_suggestions
)

-- Email Blocks: Individual blocks composing an email
email_blocks (
  id, broadcast_id, block_type, position, content,
  variants[] (index, content), active_variant_index, metadata
)

-- Block Variants Cache: Pre-generated variants for instant switching
block_variants_cache (
  id, user_id, block_type, context_hash, strategy_id,
  variants[], expires_at
)
```

### Extended Tables

**broadcasts** table now includes:
- `body_structure` (JSONB): Structured block data instead of plain text
- `strategy_id` (UUID): Reference to strategy used
- `context_id` (UUID): Reference to context used
- `intent` (VARCHAR): Email intent
- `reply_detected` (BOOLEAN): Future reply detection flag
- `reply_at` (TIMESTAMPTZ): When reply was received

## API Endpoints

### Generate Block
**POST** `/api/generate/block`

Generate content for a single block type with variants.

Request:
```json
{
  "block_type": "hook|personalization|value|cta|signature",
  "strategy_id": "uuid",
  "context": { recipient_name, company_name, ... },
  "tone": "professional"
}
```

Response:
```json
{
  "block_type": "hook",
  "content": "Generated content...",
  "variants": ["variant 1", "variant 2"],
  "generated_at": "2024-01-01T00:00:00Z"
}
```

### Fetch Strategies
**POST** `/api/strategies`

Get top strategies for an intent based on context.

Request:
```json
{
  "intent": "cold|freelance|follow_up",
  "context": { recipient_name, company_name, ... }
}
```

Response:
```json
{
  "intent": "cold",
  "strategies": [
    {
      "strategy": { id, name, description, ... },
      "matchScore": 0.85,
      "variants": 3
    }
  ]
}
```

### Analyze Context
**POST** `/api/email/context/analyze`

Analyze context and get personalization suggestions.

Request:
```json
{
  "recipient_name": "John",
  "company_name": "Acme",
  "company_industry": "SaaS",
  "context_notes": "..."
}
```

Response:
```json
{
  "personalization_strength": 0.75,
  "ai_suggestions": ["suggestion 1", "suggestion 2"],
  "analysis_timestamp": "2024-01-01T00:00:00Z"
}
```

## Component Architecture

### Block-Based Composer (`block-based-composer.tsx`)

Main composer UI with two-column layout:

**Left Column:**
- Intent selector (3 options)
- Strategy selector (top 3 strategies)
- Subject field (AI-assisted)
- Block editor (expandable blocks with controls)

**Right Column:**
- Context panel (recipient, company, role, industry, insights)
- Personalization strength indicator
- Email statistics

### Block Editor (`block-editor.tsx`)

Interactive block editor featuring:
- Email preview at top (reads selected blocks)
- Expandable blocks with inline controls
- Variant switching for each block
- Edit, regenerate, and delete actions
- Add block button (for custom blocks)

### Supporting Components

- `intent-selector.tsx`: Visual intent selection
- `strategy-selector.tsx`: Strategy cards with match scores
- `context-panel.tsx`: Structured context input
- `ai-subject-field.tsx`: AI-assisted subject generation

## Hooks

### `useBlockComposer()`

Main hook managing composer state and operations.

```typescript
const composer = useBlockComposer({
  initialBroadcastId?: string,
  initialContext?: Partial<EmailContext>
});

// State
composer.state.intent
composer.state.selectedStrategy
composer.state.blocks
composer.state.context
composer.state.personalizationStrength

// Actions
composer.setIntent(intent)
composer.updateContext(context)
composer.selectStrategy(strategyId)
composer.updateBlock(blockId, content, variantIndex?)
composer.regenerateBlock(blockId)
composer.swapBlockVariant(blockId, variantIndex)
composer.deleteBlock(blockId)

// Computed
composer.hasCompleteEmail
composer.getEmailPreview()
```

### `useContextAnalysis()`

Helper for real-time context analysis.

```typescript
const { analysis, isAnalyzing, analyzeContext } = useContextAnalysis();
```

## Utilities

### `block-operations.ts`

Helper functions for block manipulation:

- `createBlockStructure()`: Convert blocks to JSONB structure
- `blockStructureToPlaintext()`: Render blocks as email text
- `plaintextToBlockStructure()`: Parse plain text into blocks
- `createBlockWithVariants()`: Create block with variant list
- `validateBlockStructure()`: Ensure required blocks exist
- `reorderBlocks()`: Maintain proper positioning after deletion

## Data Model

### Block Structure (stored in broadcasts.body_structure)

```json
{
  "blocks": [
    {
      "type": "hook",
      "content": "Saw your recent article on...",
      "variants": ["alternative hook 1", "alternative hook 2"]
    },
    {
      "type": "personalization",
      "content": "We both work in SaaS...",
      "variants": []
    }
  ],
  "strategy_id": "uuid",
  "context_id": "uuid",
  "generated_at": "2024-01-01T00:00:00Z"
}
```

### Email Context

```json
{
  "recipient_name": "John Smith",
  "recipient_email": "john@acme.com",
  "company_name": "Acme Corp",
  "company_industry": "SaaS",
  "recipient_role": "VP Sales",
  "company_size": "50-200",
  "context_insights": "Recently raised Series B, expanding sales team",
  "recipient_pain_points": ["sales efficiency", "team scaling"],
  "personalization_strength": 0.85
}
```

## Workflow

1. **User Opens Composer**: Default intent (usually last used) is pre-selected
2. **System Loads Strategies**: Top 3 strategies for the intent are displayed
3. **User Selects Strategy**: System generates all 5 blocks in parallel
4. **Blocks Display**: User sees full email in block preview, plus expandable controls
5. **User Fills Context**: As they type, personalization strength updates
6. **User Refines Blocks**: Can edit, regenerate, or swap individual blocks
7. **User Adds Subject**: AI suggests or user types
8. **User Sends/Saves**: Email saves with block structure to DB

## Key Design Principles

- **No Blank Page**: System pre-generates content, user refines not creates
- **Block-Level Control**: Users regenerate blocks independently, not entire emails
- **Instant Variants**: Pre-caching enables fast variant switching
- **Live Personalization**: Context changes instantly update all blocks
- **Structured Data**: Emails stored as blocks enable future learning and improvements
- **One-Step Generation**: Strategy selection triggers full block generation

## Future Enhancements

- **Reply Detection**: Automatically flag emails with responses
- **Success Scoring**: Track which blocks/strategies get replies
- **Auto-Learning**: Adjust variant suggestions based on reply rates
- **A/B Testing**: Generate and track multiple variants per send
- **Smart Scheduling**: Optimal send times based on recipient location/industry
- **Team Strategies**: Share strategies across team members
