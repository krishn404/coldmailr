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
    <div className="space-y-4">
      {/* Personalization Strength Indicator */}
      <div className="bg-gradient-to-r from-slate-50 to-slate-100 border border-slate-200 rounded-lg p-4">
        <div className="flex items-center justify-between mb-2">
          <h3 className="text-sm font-semibold text-slate-900">Personalization Strength</h3>
          <span className="text-lg font-bold text-indigo-600">{Math.round(personalizationStrength * 100)}%</span>
        </div>
        <div className="w-full h-2 bg-slate-300 rounded-full overflow-hidden">
          <div
            className={`h-full transition-all ${
              personalizationStrength > 0.7
                ? 'bg-green-500'
                : personalizationStrength > 0.4
                  ? 'bg-amber-500'
                  : 'bg-red-500'
            }`}
            style={{ width: `${personalizationStrength * 100}%` }}
          ></div>
        </div>
        <p className="text-xs text-slate-600 mt-2">
          {personalizationStrength > 0.7
            ? 'Highly personalized - great setup!'
            : personalizationStrength > 0.4
              ? 'Add more specific details for better results'
              : 'Fill in recipient and company details'}
        </p>
      </div>

      {/* Context Fields */}
      <div className="space-y-3">
        {/* Recipient Name */}
        <div>
          <label className="block text-sm font-medium text-slate-900 mb-1">Recipient Name</label>
          <input
            type="text"
            value={context.recipient_name || ''}
            onChange={(e) => handleFieldChange('recipient_name', e.target.value)}
            placeholder="e.g., John Smith"
            className="w-full px-3 py-2 border border-slate-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
          />
        </div>

        {/* Recipient Email */}
        <div>
          <label className="block text-sm font-medium text-slate-900 mb-1">Recipient Email</label>
          <input
            type="email"
            value={context.recipient_email || ''}
            onChange={(e) => handleFieldChange('recipient_email', e.target.value)}
            placeholder="e.g., john@company.com"
            className="w-full px-3 py-2 border border-slate-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
          />
        </div>

        {/* Company Name */}
        <div>
          <label className="block text-sm font-medium text-slate-900 mb-1">Company Name</label>
          <input
            type="text"
            value={context.company_name || ''}
            onChange={(e) => handleFieldChange('company_name', e.target.value)}
            placeholder="e.g., Acme Corp"
            className="w-full px-3 py-2 border border-slate-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
          />
        </div>

        {/* Recipient Role */}
        <div>
          <label className="block text-sm font-medium text-slate-900 mb-1">Role (Optional)</label>
          <input
            type="text"
            value={context.recipient_role || ''}
            onChange={(e) => handleFieldChange('recipient_role', e.target.value)}
            placeholder="e.g., Marketing Manager"
            className="w-full px-3 py-2 border border-slate-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
          />
        </div>

        {/* Industry */}
        <div>
          <label className="block text-sm font-medium text-slate-900 mb-1">Industry (Optional)</label>
          <input
            type="text"
            value={context.company_industry || ''}
            onChange={(e) => handleFieldChange('company_industry', e.target.value)}
            placeholder="e.g., SaaS, Healthcare"
            className="w-full px-3 py-2 border border-slate-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
          />
        </div>

        {/* Context Insights */}
        <div>
          <label className="block text-sm font-medium text-slate-900 mb-1">Key Context</label>
          <textarea
            value={context.context_insights || ''}
            onChange={(e) => handleFieldChange('context_insights', e.target.value)}
            placeholder="What should the email emphasize? Any relevant facts, achievements, or pain points?"
            className="w-full px-3 py-2 border border-slate-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent resize-none"
            rows={3}
          />
        </div>
      </div>

      {/* AI Suggestions */}
      {onGenerateSuggestions && (
        <button
          onClick={onGenerateSuggestions}
          disabled={isGenerating}
          className="w-full py-2 px-3 bg-indigo-50 hover:bg-indigo-100 text-indigo-600 rounded-lg text-sm font-medium transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
        >
          <Sparkles size={16} />
          Get AI Suggestions
        </button>
      )}

      {/* Warnings */}
      {(!context.recipient_name || !context.company_name) && (
        <div className="bg-amber-50 border border-amber-200 rounded-lg p-3 flex gap-2">
          <AlertCircle size={16} className="text-amber-600 flex-shrink-0 mt-0.5" />
          <div>
            <p className="text-sm text-amber-900 font-medium">Add more details</p>
            <p className="text-xs text-amber-700 mt-1">Fill in recipient name and company for better personalization</p>
          </div>
        </div>
      )}
    </div>
  );
}
