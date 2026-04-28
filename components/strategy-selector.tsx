'use client';

import { Strategy, StrategyCard } from '@/lib/types/block-system';
import { Check, Zap } from 'lucide-react';

interface StrategySelectorProps {
  strategies: StrategyCard[];
  selectedId: string | null;
  onSelect: (strategyId: string) => void;
  isLoading?: boolean;
}

export function StrategySelector({ strategies, selectedId, onSelect, isLoading = false }: StrategySelectorProps) {
  return (
    <div className="space-y-2.5">
      <div>
        <h3 className="text-xs font-semibold text-slate-700 uppercase tracking-wide">Recommended Strategies</h3>
        <p className="text-xs text-slate-500 mt-0.5">Based on your intent and context</p>
      </div>

      <div className="space-y-2">
        {strategies.map((card) => (
          <StrategyCard key={card.strategy.id} card={card} selected={selectedId === card.strategy.id} onSelect={onSelect} disabled={isLoading} />
        ))}
      </div>

      {strategies.length === 0 && (
        <div className="py-4 text-center">
          <p className="text-xs text-slate-500 font-medium">No strategies available for this intent</p>
        </div>
      )}
    </div>
  );
}

interface StrategyCardProps {
  card: StrategyCard;
  selected: boolean;
  onSelect: (strategyId: string) => void;
  disabled: boolean;
}

function StrategyCard({ card, selected, onSelect, disabled }: StrategyCardProps) {
  const { strategy, matchScore, variants } = card;

  return (
    <button
      onClick={() => onSelect(strategy.id)}
      disabled={disabled}
      className={`w-full p-3.5 rounded-lg border-2 transition-all text-left hover:shadow-sm active:scale-98 ${
        selected ? 'border-indigo-500 bg-indigo-50 shadow-sm' : 'border-slate-200 bg-white hover:border-slate-300'
      } ${disabled ? 'opacity-50 cursor-not-allowed' : 'cursor-pointer'}`}
    >
      <div className="flex items-start justify-between mb-2">
        <div className="flex-1 min-w-0">
          <h4 className="font-semibold text-slate-900 text-sm">{strategy.name}</h4>
          <p className="text-xs text-slate-600 mt-0.5">{strategy.description}</p>
        </div>
        {selected && <Check size={18} className="text-indigo-600 flex-shrink-0 ml-2 mt-0.5" />}
      </div>

      <div className="flex items-center gap-3 mt-2.5 flex-wrap">
        {/* Match Score */}
        <div className="flex items-center gap-1.5">
          <div className="text-xs font-medium text-slate-600">{Math.round(matchScore * 100)}%</div>
          <div className="w-12 h-1.5 bg-slate-200 rounded-full overflow-hidden">
            <div
              className={`h-full transition-all ${matchScore > 0.7 ? 'bg-emerald-500' : matchScore > 0.4 ? 'bg-amber-500' : 'bg-slate-300'}`}
              style={{ width: `${matchScore * 100}%` }}
            ></div>
          </div>
        </div>

        {/* Variant Count */}
        <div className="flex items-center gap-1 text-slate-600">
          <Zap size={13} className="text-amber-500" />
          <span className="text-xs font-medium">{variants}</span>
        </div>
      </div>
    </button>
  );
}
