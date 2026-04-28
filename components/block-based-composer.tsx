'use client';

import { useState, useEffect } from 'react';
import { Send, Save, X, AlertCircle, Zap } from 'lucide-react';
import { IntentSelector } from '@/components/intent-selector';
import { StrategySelector } from '@/components/strategy-selector';
import { ContextPanel } from '@/components/context-panel';
import { BlockEditor } from '@/components/block-editor';
import { AISubjectField } from '@/components/ai-subject-field';
import { useBlockComposer } from '@/lib/hooks/use-block-composer';
import { Intent } from '@/lib/types/block-system';
import { toast } from 'sonner';

interface BlockBasedComposerProps {
  isOpen: boolean;
  onClose: () => void;
  fromEmail?: string | null;
  canSend: boolean;
  onSaved?: () => void;
  onSent?: (broadcastId: string) => void;
}

export function BlockBasedComposer({
  isOpen,
  onClose,
  fromEmail,
  canSend,
  onSaved,
  onSent,
}: BlockBasedComposerProps) {
  const composer = useBlockComposer();
  const [subject, setSubject] = useState('');
  const [isSaving, setIsSaving] = useState(false);
  const [isSending, setIsSending] = useState(false);

  // Load default strategies on mount
  useEffect(() => {
    if (isOpen) {
      composer.selectStrategy(composer.state.selectedStrategy?.id || '');
    }
  }, [isOpen]);

  const handleSave = async () => {
    if (!subject || composer.state.blocks.length === 0) {
      toast.error('Please add a subject and at least one email block');
      return;
    }

    setIsSaving(true);
    try {
      const emailBody = composer.state.blocks.map((b) => b.content).join('\n\n');

      const response = await fetch('/api/broadcasts', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          to_email: composer.state.context.recipient_email,
          subject,
          body: emailBody,
          context: composer.state.context.context_insights,
          status: 'draft',
          body_structure: {
            blocks: composer.state.blocks.map((b) => ({
              type: b.block_type,
              content: b.content,
            })),
            strategy_id: composer.state.selectedStrategy?.id,
            context_id: composer.state.context.id,
          },
        }),
      });

      if (response.ok) {
        toast.success('Email draft saved');
        onSaved?.();
      } else {
        toast.error('Failed to save draft');
      }
    } catch (error) {
      console.error('[save error]', error);
      toast.error('Error saving draft');
    } finally {
      setIsSaving(false);
    }
  };

  const handleSend = async () => {
    if (!composer.state.context.recipient_email) {
      toast.error('Please enter recipient email');
      return;
    }

    if (!subject) {
      toast.error('Please add a subject line');
      return;
    }

    setIsSending(true);
    try {
      const emailBody = composer.state.blocks.map((b) => b.content).join('\n\n');

      const response = await fetch('/api/broadcasts', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          to_email: composer.state.context.recipient_email,
          from_email: fromEmail,
          subject,
          body: emailBody,
          context: composer.state.context.context_insights,
          status: 'sent',
          sent_at: new Date().toISOString(),
          body_structure: {
            blocks: composer.state.blocks.map((b) => ({
              type: b.block_type,
              content: b.content,
            })),
            strategy_id: composer.state.selectedStrategy?.id,
          },
        }),
      });

      if (response.ok) {
        const data = await response.json();
        toast.success('Email sent!');
        onSent?.(data.id);
        onClose();
      } else {
        toast.error('Failed to send email');
      }
    } catch (error) {
      console.error('[send error]', error);
      toast.error('Error sending email');
    } finally {
      setIsSending(false);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
      <div className="bg-white rounded-lg shadow-xl max-w-6xl w-full max-h-[90vh] overflow-hidden flex flex-col">
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-slate-200 bg-white">
          <div>
            <h2 className="text-lg font-bold text-slate-900">Email Composer</h2>
            <p className="text-xs text-slate-500 mt-0.5 tracking-wide uppercase font-medium">Strategy-driven block-based creation</p>
          </div>
          <button onClick={onClose} className="p-2 hover:bg-slate-100 active:bg-slate-200 rounded-lg transition-colors">
            <X size={20} className="text-slate-600" />
          </button>
        </div>

        {/* Main Content */}
        <div className="flex-1 overflow-hidden flex">
          {/* Left Panel */}
          <div className="flex-1 overflow-y-auto p-5 border-r border-slate-200 bg-white space-y-4">
            {/* Intent Selector */}
            <div>
              <IntentSelector
                value={composer.state.intent as Intent}
                onChange={(intent) => composer.setIntent(intent)}
                disabled={composer.state.isGenerating}
              />
            </div>

            {/* Strategy Selector */}
            {composer.state.strategies.length > 0 && (
              <div className="border-t border-slate-200 pt-4">
                <StrategySelector
                  strategies={composer.state.strategies}
                  selectedId={composer.state.selectedStrategy?.id || null}
                  onSelect={(strategyId) => composer.selectStrategy(strategyId)}
                  isLoading={composer.state.isGenerating}
                />
              </div>
            )}

            {/* Subject Field */}
            {composer.state.blocks.length > 0 && (
              <div className="border-t border-slate-200 pt-4">
                <AISubjectField
                  value={subject}
                  onChange={setSubject}
                  isGenerating={false}
                  placeholder="Write or generate subject line..."
                />
              </div>
            )}

            {/* Block Editor */}
            {composer.state.blocks.length > 0 && (
              <div className="border-t border-slate-200 pt-4">
                <h3 className="text-xs font-semibold text-slate-700 uppercase tracking-wide mb-3">Email Content</h3>
                <BlockEditor
                  blocks={composer.state.blocks}
                  onBlockUpdate={composer.updateBlock}
                  onBlockRegenerate={composer.regenerateBlock}
                  onBlockSwapVariant={composer.swapBlockVariant}
                  onBlockDelete={composer.deleteBlock}
                  isGenerating={composer.state.isGenerating}
                />
              </div>
            )}

            {/* Empty State */}
            {composer.state.blocks.length === 0 && composer.state.selectedStrategy && (
              <div className="flex items-center gap-3 p-3 bg-amber-50 border border-amber-200 rounded-lg">
                <AlertCircle size={16} className="text-amber-600 flex-shrink-0" />
                <p className="text-xs text-amber-900 font-medium">
                  Select a strategy to generate email blocks
                </p>
              </div>
            )}
          </div>

          {/* Right Panel */}
          <div className="w-72 bg-slate-50 border-l border-slate-200 overflow-y-auto p-5 space-y-4">
            {/* Context Panel */}
            <ContextPanel
              context={composer.state.context}
              onChange={composer.updateContext}
              personalizationStrength={composer.state.personalizationStrength}
            />

            {/* Stats */}
            <div className="border-t border-slate-200 pt-4">
              <div className="space-y-1.5 text-xs">
                <div className="flex items-center justify-between">
                  <span className="text-slate-600">Email Length</span>
                  <span className="font-medium text-slate-900">
                    {composer.state.blocks.reduce((sum, b) => sum + b.content.length, 0)} chars
                  </span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-slate-600">Blocks</span>
                  <span className="font-medium text-slate-900">{composer.state.blocks.length}/5</span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-slate-600">Strategy</span>
                  <span className="font-medium text-slate-900 truncate">
                    {composer.state.selectedStrategy?.name || 'None'}
                  </span>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className="bg-white border-t border-slate-200 px-6 py-4 flex items-center justify-between">
          <div className="flex gap-2">
            {!composer.hasCompleteEmail && (
              <div className="flex items-center gap-2 text-xs font-semibold text-amber-600">
                <AlertCircle size={14} />
                <span>Complete context and strategy to send</span>
              </div>
            )}
          </div>

          <div className="flex gap-2.5">
            <button
              onClick={onClose}
              className="px-3.5 py-2 text-slate-700 bg-white border border-slate-300 rounded-md hover:bg-slate-50 active:bg-slate-100 transition-colors font-medium text-sm"
            >
              Close
            </button>

            <button
              onClick={handleSave}
              disabled={isSaving || composer.state.blocks.length === 0}
              className="px-3.5 py-2 text-slate-700 bg-slate-100 hover:bg-slate-200 active:bg-slate-300 rounded-md transition-colors font-medium text-sm disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
            >
              <Save size={14} />
              Save Draft
            </button>

            <button
              onClick={handleSend}
              disabled={isSending || !composer.hasCompleteEmail || !canSend}
              className="px-3.5 py-2 bg-indigo-600 hover:bg-indigo-700 active:bg-indigo-800 text-white rounded-md transition-colors font-medium text-sm disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
            >
              <Send size={14} />
              Send Now
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
