'use client';

import { useState } from 'react';
import { EmailContext } from '@/lib/types/block-system';
import { Sparkles, AlertCircle } from 'lucide-react';

interface ContextPanelProps {
  context: Partial<EmailContext>;
  onChange: (context: Partial<EmailContext>) => void;
  personalizationStrength: number;
  onGenerateSuggestions?: () => void;
  isGenerating?: boolean;
}

export function ContextPanel({
  context,
  onChange,
  personalizationStrength,
  onGenerateSuggestions,
  isGenerating = false,
}: ContextPanelProps) {
  const [showSuggestions, setShowSuggestions] = useState(false);

  const handleFieldChange = (field: keyof EmailContext, value: unknown) => {
    onChange({
      ...context,
      [field]: value,
    });
  };

  return (
    <div className="space-y-3">
      {/* Personalization Strength Indicator */}
      <div className="bg-white border border-slate-200 rounded-lg p-3.5">
        <div className="flex items-center justify-between mb-2">
          <h3 className="text-xs font-semibold text-slate-700 uppercase tracking-wide">Personalization</h3>
          <span className="text-base font-bold text-indigo-600">{Math.round(personalizationStrength * 100)}%</span>
        </div>
        <div className="w-full h-2 bg-slate-200 rounded-full overflow-hidden">
          <div
            className={`h-full transition-all duration-300 ${
              personalizationStrength > 0.7
                ? 'bg-emerald-500'
                : personalizationStrength > 0.4
                  ? 'bg-amber-500'
                  : 'bg-slate-300'
            }`}
            style={{ width: `${personalizationStrength * 100}%` }}
          ></div>
        </div>
        <p className="text-xs text-slate-500 mt-1.5">
          {personalizationStrength > 0.7
            ? '✓ Highly personalized'
            : personalizationStrength > 0.4
              ? 'Add more details'
              : 'Fill in key fields'}
        </p>
      </div>

      {/* Context Fields */}
      <div className="space-y-2.5">
        {/* Recipient Name */}
        <div>
          <label className="block text-xs font-semibold text-slate-700 mb-1.5">Recipient Name</label>
          <input
            type="text"
            value={context.recipient_name || ''}
            onChange={(e) => handleFieldChange('recipient_name', e.target.value)}
            placeholder="e.g., John Smith"
            className="w-full px-3 py-2.5 bg-white border border-slate-300 rounded-md text-sm text-slate-900 placeholder-slate-400 transition-all hover:border-slate-400 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:ring-offset-0 focus:border-indigo-500"
          />
        </div>

        {/* Recipient Email */}
        <div>
          <label className="block text-xs font-semibold text-slate-700 mb-1.5">Recipient Email</label>
          <input
            type="email"
            value={context.recipient_email || ''}
            onChange={(e) => handleFieldChange('recipient_email', e.target.value)}
            placeholder="e.g., john@company.com"
            className="w-full px-3 py-2.5 bg-white border border-slate-300 rounded-md text-sm text-slate-900 placeholder-slate-400 transition-all hover:border-slate-400 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:ring-offset-0 focus:border-indigo-500"
          />
        </div>

        {/* Company Name */}
        <div>
          <label className="block text-xs font-semibold text-slate-700 mb-1.5">Company Name</label>
          <input
            type="text"
            value={context.company_name || ''}
            onChange={(e) => handleFieldChange('company_name', e.target.value)}
            placeholder="e.g., Acme Corp"
            className="w-full px-3 py-2.5 bg-white border border-slate-300 rounded-md text-sm text-slate-900 placeholder-slate-400 transition-all hover:border-slate-400 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:ring-offset-0 focus:border-indigo-500"
          />
        </div>

        {/* Recipient Role */}
        <div>
          <label className="block text-xs font-semibold text-slate-700 mb-1.5">Role <span className="font-normal text-slate-500">(Optional)</span></label>
          <input
            type="text"
            value={context.recipient_role || ''}
            onChange={(e) => handleFieldChange('recipient_role', e.target.value)}
            placeholder="e.g., Marketing Manager"
            className="w-full px-3 py-2.5 bg-white border border-slate-300 rounded-md text-sm text-slate-900 placeholder-slate-400 transition-all hover:border-slate-400 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:ring-offset-0 focus:border-indigo-500"
          />
        </div>

        {/* Industry */}
        <div>
          <label className="block text-xs font-semibold text-slate-700 mb-1.5">Industry <span className="font-normal text-slate-500">(Optional)</span></label>
          <input
            type="text"
            value={context.company_industry || ''}
            onChange={(e) => handleFieldChange('company_industry', e.target.value)}
            placeholder="e.g., SaaS, Healthcare"
            className="w-full px-3 py-2.5 bg-white border border-slate-300 rounded-md text-sm text-slate-900 placeholder-slate-400 transition-all hover:border-slate-400 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:ring-offset-0 focus:border-indigo-500"
          />
        </div>

        {/* Context Insights */}
        <div>
          <label className="block text-xs font-semibold text-slate-700 mb-1.5">Key Context</label>
          <textarea
            value={context.context_insights || ''}
            onChange={(e) => handleFieldChange('context_insights', e.target.value)}
            placeholder="What should the email emphasize? Any relevant facts or pain points?"
            className="w-full px-3 py-2.5 bg-white border border-slate-300 rounded-md text-sm text-slate-900 placeholder-slate-400 transition-all hover:border-slate-400 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:ring-offset-0 focus:border-indigo-500 resize-none"
            rows={2}
          />
        </div>
      </div>

      {/* AI Suggestions */}
      {onGenerateSuggestions && (
        <button
          onClick={onGenerateSuggestions}
          disabled={isGenerating}
          className="w-full py-2 px-3 bg-indigo-50 hover:bg-indigo-100 active:bg-indigo-200 text-indigo-600 rounded-md text-xs font-semibold transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
        >
          <Sparkles size={14} />
          AI Suggestions
        </button>
      )}

      {/* Warnings */}
      {(!context.recipient_name || !context.company_name) && (
        <div className="bg-amber-50 border border-amber-200 rounded-md p-2.5 flex gap-2">
          <AlertCircle size={14} className="text-amber-600 flex-shrink-0 mt-0.5" />
          <div>
            <p className="text-xs text-amber-900 font-semibold">Add more details</p>
            <p className="text-xs text-amber-700 mt-0.5">Fill in recipient name and company for better personalization</p>
          </div>
        </div>
      )}
    </div>
  );
}
