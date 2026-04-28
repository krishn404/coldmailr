import { BlockType, EmailBlock, BlockVariant, BlockStructure, EmailBlockData } from './types/block-system';

/**
 * Create initial email block structure from blocks
 */
export function createBlockStructure(blocks: EmailBlock[], strategyId?: string, contextId?: string): BlockStructure {
  return {
    blocks: blocks.map((block) => ({
      type: block.block_type,
      content: block.content,
      variants: block.variants?.map((v) => (typeof v === 'string' ? v : v.content)) || [],
    })),
    strategy_id: strategyId,
    context_id: contextId,
    generated_at: new Date().toISOString(),
  };
}

/**
 * Reconstruct plain text email from block structure
 */
export function blockStructureToPlaintext(structure: BlockStructure | BlockStructure): string {
  if (!structure.blocks) return '';

  return structure.blocks
    .map((block) => {
      // Add spacing between blocks
      if (block.type === 'signature') {
        return `\n---\n${block.content}`;
      }
      return block.content;
    })
    .join('\n\n');
}

/**
 * Convert plain text email back to block structure
 * Uses heuristics to separate blocks
 */
export function plaintextToBlockStructure(plaintext: string, hooks?: string[]): BlockStructure {
  const lines = plaintext.split('\n').map((l) => l.trim()).filter((l) => l);
  const blocks: BlockBlockData[] = [];

  if (!lines.length) return { blocks };

  // Simple heuristic: first sentence is hook, last few lines are signature
  if (lines.length === 1) {
    blocks.push({
      type: 'hook',
      content: lines[0],
    });
  } else {
    // First line(s) as hook
    blocks.push({
      type: 'hook',
      content: lines[0],
    });

    // Middle content
    if (lines.length > 2) {
      const middleContent = lines.slice(1, -1).join(' ');
      blocks.push({
        type: 'value',
        content: middleContent,
      });
    }

    // Last line as signature (heuristic)
    const lastLine = lines[lines.length - 1];
    if (lastLine.includes('@') || lastLine.match(/^[A-Za-z\s,]*$/)) {
      blocks.push({
        type: 'signature',
        content: lastLine,
      });
    } else {
      blocks.push({
        type: 'cta',
        content: lastLine,
      });
    }
  }

  return { blocks };
}

/**
 * Merge block variants with main content
 */
export function createBlockWithVariants(
  blockType: BlockType,
  mainContent: string,
  variants: string[],
): EmailBlock {
  const id = `block-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;

  return {
    id,
    broadcast_id: '', // Will be set when saving
    block_type: blockType,
    position: 0, // Will be set in array
    content: mainContent,
    variants: variants.map((content, index) => ({
      index,
      content,
    })),
    active_variant_index: 0,
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString(),
  };
}

/**
 * Calculate preview of blocks as they'll appear in email
 */
export function getBlockPreview(blocks: EmailBlock[], maxLength: number = 200): string {
  return blocks
    .map((block) => block.content)
    .join(' ')
    .substring(0, maxLength)
    .concat(blocks.join(' ').length > maxLength ? '...' : '');
}

/**
 * Reorder blocks after deletion
 */
export function reorderBlocks(blocks: EmailBlock[], deletedId: string): EmailBlock[] {
  return blocks
    .filter((b) => b.id !== deletedId)
    .map((block, index) => ({
      ...block,
      position: index,
    }));
}

/**
 * Get block by type
 */
export function getBlockByType(blocks: EmailBlock[], type: BlockType): EmailBlock | undefined {
  return blocks.find((b) => b.block_type === type);
}

/**
 * Default block order for email composition
 */
export const DEFAULT_BLOCK_ORDER: BlockType[] = ['hook', 'personalization', 'value', 'cta', 'signature'];

/**
 * Create default email structure with all block types
 */
export function createDefaultBlockStructure(): BlockStructure {
  return {
    blocks: DEFAULT_BLOCK_ORDER.map((type) => ({
      type,
      content: '',
      variants: [],
    })),
  };
}

/**
 * Validate block structure has required blocks
 */
export function validateBlockStructure(structure: BlockStructure): {
  valid: boolean;
  missingTypes: BlockType[];
} {
  const requiredTypes: BlockType[] = ['hook', 'value', 'cta'];
  const presentTypes = new Set(structure.blocks.map((b) => b.type));
  const missingTypes = requiredTypes.filter((type) => !presentTypes.has(type));

  return {
    valid: missingTypes.length === 0,
    missingTypes,
  };
}

export type BlockBlockData = EmailBlockData;
