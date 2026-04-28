'use client';

import { useState, useCallback, useEffect } from 'react';
import {
  ComposerState,
  Intent,
  Strategy,
  EmailBlock,
  EmailContext,
  StrategyCard,
} from '@/lib/types/block-system';
import { createBlockWithVariants, createDefaultBlockStructure } from '@/lib/block-operations';

const DEFAULT_INTENT: Intent = 'cold';

interface UseBlockComposerOptions {
  initialBroadcastId?: string;
  initialContext?: Partial<EmailContext>;
}

export function useBlockComposer({ initialBroadcastId, initialContext }: UseBlockComposerOptions = {}) {
  const [state, setState] = useState<ComposerState>({
    broadcastId: initialBroadcastId || `draft-${Date.now()}`,
    intent: DEFAULT_INTENT,
    selectedStrategy: null,
    strategies: [],
    context: initialContext || {},
    blocks: [],
    personalizationStrength: 0,
    isGenerating: false,
    activeBlockIndex: 0,
  });

  // Load strategies for current intent
  useEffect(() => {
    const loadStrategies = async () => {
      try {
        const response = await fetch('/api/strategies', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            intent: state.intent,
            context: state.context,
          }),
        });

        if (response.ok) {
          const data = await response.json();
          setState((prev) => ({
            ...prev,
            strategies: data.strategies || [],
            selectedStrategy: data.strategies?.[0]?.strategy || null,
          }));
        }
      } catch (error) {
        console.error('[load strategies]', error);
      }
    };

    loadStrategies();
  }, [state.intent]);

  // Update intent
  const setIntent = useCallback((intent: Intent) => {
    setState((prev) => ({
      ...prev,
      intent,
      selectedStrategy: null, // Reset strategy when intent changes
    }));
  }, []);

  // Update context
  const updateContext = useCallback((context: Partial<EmailContext>) => {
    setState((prev) => ({
      ...prev,
      context: { ...prev.context, ...context },
    }));

    // Recalculate personalization strength
    calculatePersonalizationStrength(context);
  }, []);

  // Calculate personalization strength
  const calculatePersonalizationStrength = useCallback((context: Partial<EmailContext>) => {
    let score = 0;
    let maxScore = 5;

    if (context.recipient_name) score += 1;
    if (context.company_name) score += 1;
    if (context.recipient_role) score += 1;
    if (context.company_industry) score += 1;
    if (context.context_insights?.length && context.context_insights.length > 20) score += 1;

    setState((prev) => ({
      ...prev,
      personalizationStrength: score / maxScore,
    }));
  }, []);

  // Select strategy and generate blocks
  const selectStrategy = useCallback(async (strategyId: string) => {
    const strategy = state.strategies.find((s) => s.strategy.id === strategyId)?.strategy;
    if (!strategy) return;

    setState((prev) => ({
      ...prev,
      selectedStrategy: strategy,
      isGenerating: true,
    }));

    try {
      // Generate blocks from strategy
      const blockTypes: Array<'hook' | 'personalization' | 'value' | 'cta' | 'signature'> = [
        'hook',
        'personalization',
        'value',
        'cta',
        'signature',
      ];

      const generatedBlocks: EmailBlock[] = [];

      for (let i = 0; i < blockTypes.length; i++) {
        const blockType = blockTypes[i];
        const response = await fetch('/api/generate/block', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            block_type: blockType,
            strategy_id: strategyId,
            context: state.context,
            tone: strategy.tone,
          }),
        });

        if (response.ok) {
          const data = await response.json();
          const block = createBlockWithVariants(blockType, data.content, data.variants);
          block.position = i;
          block.broadcast_id = state.broadcastId;
          generatedBlocks.push(block);
        }
      }

      setState((prev) => ({
        ...prev,
        blocks: generatedBlocks,
        isGenerating: false,
      }));
    } catch (error) {
      console.error('[select strategy error]', error);
      setState((prev) => ({
        ...prev,
        isGenerating: false,
      }));
    }
  }, [state.strategies, state.context, state.broadcastId]);

  // Update a block
  const updateBlock = useCallback(
    (blockId: string, content: string, variantIndex?: number) => {
      setState((prev) => ({
        ...prev,
        blocks: prev.blocks.map((block) => {
          if (block.id === blockId) {
            return {
              ...block,
              content,
              active_variant_index: variantIndex ?? block.active_variant_index,
              updated_at: new Date().toISOString(),
            };
          }
          return block;
        }),
      }));
    },
    [],
  );

  // Regenerate a single block
  const regenerateBlock = useCallback(
    async (blockId: string) => {
      const block = state.blocks.find((b) => b.id === blockId);
      if (!block) return;

      setState((prev) => ({
        ...prev,
        isGenerating: true,
      }));

      try {
        const response = await fetch('/api/generate/block', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            block_type: block.block_type,
            strategy_id: state.selectedStrategy?.id,
            context: state.context,
            tone: state.selectedStrategy?.tone,
          }),
        });

        if (response.ok) {
          const data = await response.json();
          updateBlock(blockId, data.content);

          // Update variants if available
          setState((prev) => ({
            ...prev,
            blocks: prev.blocks.map((b) =>
              b.id === blockId
                ? {
                    ...b,
                    variants: data.variants.map((content: string, idx: number) => ({
                      index: idx,
                      content,
                    })),
                  }
                : b,
            ),
            isGenerating: false,
          }));
        }
      } catch (error) {
        console.error('[regenerate block error]', error);
        setState((prev) => ({
          ...prev,
          isGenerating: false,
        }));
      }
    },
    [state.blocks, state.selectedStrategy, state.context, updateBlock],
  );

  // Swap block variant
  const swapBlockVariant = useCallback((blockId: string, variantIndex: number) => {
    setState((prev) => ({
      ...prev,
      blocks: prev.blocks.map((block) => {
        if (block.id === blockId && variantIndex < (block.variants?.length || 0)) {
          return {
            ...block,
            content: block.variants![variantIndex].content,
            active_variant_index: variantIndex,
            updated_at: new Date().toISOString(),
          };
        }
        return block;
      }),
    }));
  }, []);

  // Delete a block
  const deleteBlock = useCallback((blockId: string) => {
    setState((prev) => ({
      ...prev,
      blocks: prev.blocks.filter((b) => b.id !== blockId).map((b, idx) => ({
        ...b,
        position: idx,
      })),
    }));
  }, []);

  // Get full email preview
  const getEmailPreview = useCallback(() => {
    return {
      subject: '', // TODO: add subject line state
      body: state.blocks.map((b) => b.content).join('\n\n'),
    };
  }, [state.blocks]);

  return {
    // State
    state,

    // Actions
    setIntent,
    updateContext,
    selectStrategy,
    updateBlock,
    regenerateBlock,
    swapBlockVariant,
    deleteBlock,

    // Computed
    getEmailPreview,
    hasCompleteEmail: state.blocks.length >= 3 && state.context.recipient_name && state.context.company_name,
  };
}
