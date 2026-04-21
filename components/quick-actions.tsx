'use client';

import { Button } from '@/components/ui/button';
import { useDraftStore } from '@/lib/store';
import {
  Zap,
  RotateCcw,
  Type,
  Sparkles,
  ChevronDown,
} from 'lucide-react';
import { useState } from 'react';

interface QuickActionsProps {
  onGenerate: (action: string) => void;
  isGenerating: boolean;
}

export function QuickActions({ onGenerate, isGenerating }: QuickActionsProps) {
  const [showMenu, setShowMenu] = useState(false);
  const { undo, redo } = useDraftStore();
  const canUndo = useDraftStore((state) => state.canUndo());
  const canRedo = useDraftStore((state) => state.canRedo());

  const toneOptions = [
    { id: 'professional', label: 'Professional' },
    { id: 'casual', label: 'Casual' },
    { id: 'friendly', label: 'Friendly' },
    { id: 'formal', label: 'Formal' },
  ];

  const lengthOptions = [
    { id: 'short', label: 'Short (50-75 words)' },
    { id: 'medium', label: 'Medium (100-150 words)' },
    { id: 'long', label: 'Long (200+ words)' },
  ];

  return (
    <div className="flex items-center gap-2 px-4 py-3 border-t border-gray-800 bg-gray-950">
      {/* Undo/Redo */}
      <div className="flex gap-1">
        <Button
          variant="ghost"
          size="sm"
          onClick={undo}
          disabled={!canUndo}
          className="text-gray-500 hover:text-white h-8 w-8 p-0"
          title="Undo"
        >
          <RotateCcw className="w-4 h-4" />
        </Button>
        <Button
          variant="ghost"
          size="sm"
          onClick={redo}
          disabled={!canRedo}
          className="text-gray-500 hover:text-white h-8 w-8 p-0"
          title="Redo"
        >
          <RotateCcw className="w-4 h-4 rotate-180" />
        </Button>
      </div>

      <div className="w-px h-5 bg-gray-800" />

      {/* Regenerate */}
      <Button
        size="sm"
        onClick={() => onGenerate('regenerate')}
        disabled={isGenerating}
        className="gap-2 bg-gray-800 hover:bg-gray-700 text-white h-8 text-xs"
      >
        <Zap className="w-3.5 h-3.5" />
        Regenerate
      </Button>

      {/* Tone */}
      <div className="relative group">
        <Button
          variant="ghost"
          size="sm"
          className="gap-1 text-gray-400 hover:text-white h-8 px-2"
        >
          <Sparkles className="w-3.5 h-3.5" />
          <span className="text-xs">Tone</span>
          <ChevronDown className="w-3 h-3" />
        </Button>
        <div className="absolute left-0 top-8 hidden group-hover:block bg-gray-900 border border-gray-800 rounded-lg shadow-lg z-50 min-w-max">
          {toneOptions.map((tone) => (
            <button
              key={tone.id}
              onClick={() => onGenerate(`tone:${tone.id}`)}
              disabled={isGenerating}
              className="block w-full text-left px-3 py-2 text-xs text-gray-300 hover:bg-gray-800 hover:text-white first:rounded-t-lg last:rounded-b-lg disabled:opacity-50"
            >
              {tone.label}
            </button>
          ))}
        </div>
      </div>

      {/* Length */}
      <div className="relative group">
        <Button
          variant="ghost"
          size="sm"
          className="gap-1 text-gray-400 hover:text-white h-8 px-2"
        >
          <Type className="w-3.5 h-3.5" />
          <span className="text-xs">Length</span>
          <ChevronDown className="w-3 h-3" />
        </Button>
        <div className="absolute left-0 top-8 hidden group-hover:block bg-gray-900 border border-gray-800 rounded-lg shadow-lg z-50 min-w-max">
          {lengthOptions.map((len) => (
            <button
              key={len.id}
              onClick={() => onGenerate(`length:${len.id}`)}
              disabled={isGenerating}
              className="block w-full text-left px-3 py-2 text-xs text-gray-300 hover:bg-gray-800 hover:text-white first:rounded-t-lg last:rounded-b-lg disabled:opacity-50"
            >
              {len.label}
            </button>
          ))}
        </div>
      </div>

      {/* More Actions */}
      <div className="relative group ml-auto">
        <Button
          variant="ghost"
          size="sm"
          className="gap-1 text-gray-400 hover:text-white h-8 px-2"
        >
          <span className="text-xs">More</span>
          <ChevronDown className="w-3 h-3" />
        </Button>
        <div className="absolute right-0 top-8 hidden group-hover:block bg-gray-900 border border-gray-800 rounded-lg shadow-lg z-50 min-w-max">
          <button
            onClick={() => onGenerate('shorten')}
            disabled={isGenerating}
            className="block w-full text-left px-3 py-2 text-xs text-gray-300 hover:bg-gray-800 hover:text-white disabled:opacity-50"
          >
            Shorten
          </button>
          <button
            onClick={() => onGenerate('formalize')}
            disabled={isGenerating}
            className="block w-full text-left px-3 py-2 text-xs text-gray-300 hover:bg-gray-800 hover:text-white disabled:opacity-50"
          >
            Formalize
          </button>
          <button
            onClick={() => onGenerate('add-cta')}
            disabled={isGenerating}
            className="block w-full text-left px-3 py-2 text-xs text-gray-300 hover:bg-gray-800 hover:text-white disabled:opacity-50 rounded-b-lg"
          >
            Add CTA
          </button>
        </div>
      </div>
    </div>
  );
}
