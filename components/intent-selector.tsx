'use client';

import { Intent } from '@/lib/types/block-system';
import { Zap, Target, MessageCircle } from 'lucide-react';

interface IntentSelectorProps {
  value: Intent;
  onChange: (intent: Intent) => void;
  disabled?: boolean;
}

const INTENTS: Array<{ id: Intent; label: string; description: string; icon: React.ReactNode }> = [
  {
    id: 'cold',
    label: 'Cold Outreach',
    description: 'First-time contact focused on value',
    icon: <Zap size={20} />,
  },
  {
    id: 'freelance',
    label: 'Freelance Pitch',
    description: 'Service/portfolio offering',
    icon: <Target size={20} />,
  },
  {
    id: 'follow_up',
    label: 'Follow-up',
    description: 'Reengagement after first contact',
    icon: <MessageCircle size={20} />,
  },
];

export function IntentSelector({ value, onChange, disabled = false }: IntentSelectorProps) {
  return (
    <div className="space-y-2.5">
      <div>
        <h3 className="text-xs font-semibold text-slate-700 uppercase tracking-wide mb-1.5">Email Intent</h3>
        <p className="text-xs text-slate-500">What's the purpose of this email?</p>
      </div>

      <div className="grid grid-cols-3 gap-2.5">
        {INTENTS.map((intent) => (
          <button
            key={intent.id}
            onClick={() => onChange(intent.id)}
            disabled={disabled}
            className={`p-3 rounded-lg border-2 transition-all text-left hover:shadow-sm ${
              value === intent.id
                ? 'border-indigo-500 bg-indigo-50 shadow-sm'
                : 'border-slate-200 bg-white hover:border-slate-300'
            } ${disabled ? 'opacity-50 cursor-not-allowed' : 'cursor-pointer active:scale-95'}`}
          >
            <div className={`flex items-center justify-center h-7 w-7 rounded-md mb-2 transition-all ${
              value === intent.id ? 'bg-indigo-600 text-white scale-110' : 'bg-slate-100 text-slate-600'
            }`}>
              {intent.icon}
            </div>
            <h4 className="text-xs font-semibold text-slate-900">{intent.label}</h4>
            <p className="text-xs text-slate-500 mt-0.5">{intent.description}</p>
          </button>
        ))}
      </div>
    </div>
  );
}
