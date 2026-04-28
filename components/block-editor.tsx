'use client';

import { useState, useCallback } from 'react';
import { EmailBlock, BlockType } from '@/lib/types/block-system';
import { ChevronDown, RotateCcw, Copy, Trash2, Plus } from 'lucide-react';

interface BlockEditorProps {
  blocks: EmailBlock[];
  onBlockUpdate: (blockId: string, content: string, variantIndex?: number) => void;
  onBlockRegenerate: (blockId: string) => void;
  onBlockSwapVariant: (blockId: string, variantIndex: number) => void;
  onBlockDelete: (blockId: string) => void;
  isGenerating: boolean;
}

const BLOCK_LABELS: Record<BlockType, string> = {
  hook: 'Hook',
  personalization: 'Personalization',
  value: 'Value Proposition',
  cta: 'Call to Action',
  signature: 'Signature',
  custom: 'Custom Block',
};

const BLOCK_DESCRIPTIONS: Record<BlockType, string> = {
  hook: 'Opening that captures attention',
  personalization: 'Personalized context about recipient',
  value: 'Your unique value proposition',
  cta: 'Clear call to action',
  signature: 'Closing and signature',
  custom: 'Custom content block',
};

export function BlockEditor({ blocks, onBlockUpdate, onBlockRegenerate, onBlockSwapVariant, onBlockDelete, isGenerating }: BlockEditorProps) {
  const [expandedBlockId, setExpandedBlockId] = useState<string | null>(blocks[0]?.id || null);
  const [editingBlockId, setEditingBlockId] = useState<string | null>(null);

  const handleBlockClick = useCallback((blockId: string) => {
    setExpandedBlockId(expandedBlockId === blockId ? null : blockId);
  }, [expandedBlockId]);

  return (
    <div className="space-y-3">
      {/* Email Preview Mode */}
      <div className="bg-slate-50 border border-slate-200 rounded-lg p-6 mb-6">
        <div className="prose prose-sm max-w-none">
          {blocks.map((block) => (
            <div key={block.id} className="mb-4">
              {block.block_type === 'signature' ? (
                <div className="text-sm text-slate-600 italic border-t border-slate-300 pt-4">
                  {block.content}
                </div>
              ) : (
                <div className="text-slate-900">{block.content}</div>
              )}
            </div>
          ))}
        </div>
      </div>

      {/* Editable Blocks */}
      <div className="space-y-2">
        {blocks.map((block) => (
          <BlockItem
            key={block.id}
            block={block}
            isExpanded={expandedBlockId === block.id}
            isEditing={editingBlockId === block.id}
            isGenerating={isGenerating}
            onToggleExpand={() => handleBlockClick(block.id)}
            onToggleEdit={() => setEditingBlockId(editingBlockId === block.id ? null : block.id)}
            onUpdate={(content, variantIndex) => {
              onBlockUpdate(block.id, content, variantIndex);
              setEditingBlockId(null);
            }}
            onRegenerate={() => onBlockRegenerate(block.id)}
            onSwapVariant={(variantIndex) => onBlockSwapVariant(block.id, variantIndex)}
            onDelete={() => onBlockDelete(block.id)}
          />
        ))}
      </div>

      {/* Add Block Option (only if < 6 blocks) */}
      {blocks.length < 6 && (
        <button className="w-full py-3 border-2 border-dashed border-slate-300 rounded-lg text-slate-600 hover:border-slate-400 hover:text-slate-700 transition-colors flex items-center justify-center gap-2">
          <Plus size={18} />
          <span className="text-sm font-medium">Add Custom Block</span>
        </button>
      )}
    </div>
  );
}

interface BlockItemProps {
  block: EmailBlock;
  isExpanded: boolean;
  isEditing: boolean;
  isGenerating: boolean;
  onToggleExpand: () => void;
  onToggleEdit: () => void;
  onUpdate: (content: string, variantIndex?: number) => void;
  onRegenerate: () => void;
  onSwapVariant: (variantIndex: number) => void;
  onDelete: () => void;
}

function BlockItem({
  block,
  isExpanded,
  isEditing,
  isGenerating,
  onToggleExpand,
  onToggleEdit,
  onUpdate,
  onRegenerate,
  onSwapVariant,
  onDelete,
}: BlockItemProps) {
  const [editContent, setEditContent] = useState(block.content);
  const [showVariants, setShowVariants] = useState(false);

  const handleSave = () => {
    onUpdate(editContent);
  };

  return (
    <div className="bg-white border border-slate-200 rounded-lg overflow-hidden hover:border-slate-300 transition-colors">
      {/* Header */}
      <button
        onClick={onToggleExpand}
        className="w-full px-4 py-3 flex items-center justify-between hover:bg-slate-50 transition-colors"
      >
        <div className="flex items-center gap-3 flex-1 text-left">
          <div className="w-2 h-2 rounded-full bg-indigo-500"></div>
          <div>
            <h3 className="font-semibold text-slate-900">{BLOCK_LABELS[block.block_type]}</h3>
            <p className="text-xs text-slate-500">{BLOCK_DESCRIPTIONS[block.block_type]}</p>
          </div>
        </div>
        <ChevronDown size={18} className={`text-slate-400 transition-transform ${isExpanded ? 'rotate-180' : ''}`} />
      </button>

      {/* Content Preview (when collapsed) */}
      {!isExpanded && (
        <div className="px-4 py-2 bg-slate-50 border-t border-slate-200 text-sm text-slate-600 line-clamp-2">
          {block.content}
        </div>
      )}

      {/* Expanded Content */}
      {isExpanded && (
        <div className="border-t border-slate-200 p-4 space-y-3">
          {/* Current Content or Edit Mode */}
          {isEditing ? (
            <div className="space-y-2">
              <textarea
                value={editContent}
                onChange={(e) => setEditContent(e.target.value)}
                placeholder="Edit block content..."
                className="w-full px-3 py-2 border border-slate-300 rounded text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 resize-none"
                rows={4}
              />
              <div className="flex gap-2">
                <button
                  onClick={handleSave}
                  className="px-3 py-1 bg-indigo-600 text-white text-sm rounded hover:bg-indigo-700 transition-colors"
                >
                  Save
                </button>
                <button
                  onClick={onToggleEdit}
                  className="px-3 py-1 bg-slate-200 text-slate-700 text-sm rounded hover:bg-slate-300 transition-colors"
                >
                  Cancel
                </button>
              </div>
            </div>
          ) : (
            <div className="bg-slate-50 p-3 rounded text-sm text-slate-900 whitespace-pre-wrap">
              {block.content}
            </div>
          )}

          {/* Variants Section */}
          {block.variants && block.variants.length > 0 && !isEditing && (
            <div className="space-y-2">
              <button
                onClick={() => setShowVariants(!showVariants)}
                className="text-xs font-semibold text-indigo-600 hover:text-indigo-700 flex items-center gap-1"
              >
                <span>{block.variants.length} variant{block.variants.length !== 1 ? 's' : ''} available</span>
                <ChevronDown size={14} className={`transition-transform ${showVariants ? 'rotate-180' : ''}`} />
              </button>

              {showVariants && (
                <div className="space-y-2 pl-3 border-l-2 border-slate-300">
                  {block.variants.map((variant, idx) => (
                    <button
                      key={idx}
                      onClick={() => {
                        onSwapVariant(idx);
                        setShowVariants(false);
                      }}
                      className={`w-full text-left p-2 rounded text-xs transition-colors ${
                        idx === block.active_variant_index
                          ? 'bg-indigo-100 text-indigo-900 border border-indigo-300'
                          : 'bg-slate-100 text-slate-700 hover:bg-slate-200'
                      }`}
                    >
                      {variant.content || variant}
                    </button>
                  ))}
                </div>
              )}
            </div>
          )}

          {/* Action Buttons */}
          <div className="flex gap-2 pt-2">
            <button
              onClick={onToggleEdit}
              disabled={isEditing || isGenerating}
              className="flex-1 px-3 py-2 text-xs font-medium text-slate-700 bg-slate-100 rounded hover:bg-slate-200 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
            >
              Edit
            </button>
            <button
              onClick={onRegenerate}
              disabled={isGenerating}
              className="flex-1 px-3 py-2 text-xs font-medium text-slate-700 bg-slate-100 rounded hover:bg-slate-200 transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-1"
            >
              <RotateCcw size={12} />
              Regenerate
            </button>
            {block.variants && block.variants.length > 0 && (
              <button
                disabled={isGenerating}
                className="flex-1 px-3 py-2 text-xs font-medium text-slate-700 bg-slate-100 rounded hover:bg-slate-200 transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-1"
              >
                <Copy size={12} />
                Swap
              </button>
            )}
            {blocks.length > 1 && (
              <button
                onClick={onDelete}
                disabled={isGenerating}
                className="px-3 py-2 text-xs font-medium text-red-600 bg-red-50 rounded hover:bg-red-100 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
              >
                <Trash2 size={12} />
              </button>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
