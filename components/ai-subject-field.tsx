'use client';

import { useState } from 'react';
import { RotateCcw, Sparkles } from 'lucide-react';

interface AISubjectFieldProps {
  value: string;
  onChange: (value: string) => void;
  onRegenerate?: () => void;
  isGenerating?: boolean;
  placeholder?: string;
}

export function AISubjectField({
  value,
  onChange,
  onRegenerate,
  isGenerating = false,
  placeholder = 'Email subject line...',
}: AISubjectFieldProps) {
  const [showVariants, setShowVariants] = useState(false);
  const [variants] = useState<string[]>([]);

  return (
    <div className="space-y-2">
      <div className="flex items-center justify-between mb-1.5">
        <label className="text-xs font-semibold text-slate-700 uppercase tracking-wide">Subject Line</label>
        {onRegenerate && (
          <button
            onClick={onRegenerate}
            disabled={isGenerating}
            className="text-xs text-indigo-600 hover:text-indigo-700 font-medium flex items-center gap-1 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
          >
            <RotateCcw size={13} />
            Regenerate
          </button>
        )}
      </div>

      <div className="relative">
        <input
          type="text"
          value={value}
          onChange={(e) => onChange(e.target.value)}
          placeholder={placeholder}
          className="w-full px-3.5 py-2.5 bg-white border-2 border-slate-300 rounded-md focus:outline-none focus:border-indigo-500 focus:ring-2 focus:ring-indigo-500/20 text-sm text-slate-900 placeholder-slate-400 transition-all hover:border-slate-400"
        />
        <div className="absolute right-3 top-1/2 -translate-y-1/2 flex items-center gap-2">
          {isGenerating && (
            <div className="w-4 h-4 border-2 border-slate-300 border-t-indigo-600 rounded-full animate-spin"></div>
          )}
          {onRegenerate && !isGenerating && value && (
            <Sparkles size={14} className="text-indigo-500" />
          )}
        </div>
      </div>

      {/* Character count */}
      <div className="flex items-center justify-between text-xs text-slate-500">
        <span className="font-medium">{value.length} chars</span>
        <span className={value.length > 60 ? 'text-amber-600 font-semibold' : ''}>
          {value.length > 60 ? '⚠ ' : ''}
          Best: 40-60
        </span>
      </div>

      {/* Variants */}
      {variants.length > 0 && (
        <div className="space-y-1.5">
          <button
            onClick={() => setShowVariants(!showVariants)}
            className="text-xs font-semibold text-indigo-600 hover:text-indigo-700 transition-colors"
          >
            {variants.length} alternative{variants.length !== 1 ? 's' : ''} available
          </button>

          {showVariants && (
            <div className="space-y-1 p-2 bg-slate-50 rounded border border-slate-200">
              {variants.map((variant, idx) => (
                <button
                  key={idx}
                  onClick={() => {
                    onChange(variant);
                    setShowVariants(false);
                  }}
                  className="w-full text-left px-2 py-1.5 rounded text-xs bg-white hover:bg-indigo-50 text-slate-700 hover:text-indigo-700 transition-colors"
                >
                  {variant}
                </button>
              ))}
            </div>
          )}
        </div>
      )}
    </div>
  );
}
