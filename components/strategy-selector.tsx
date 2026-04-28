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
    <div className="space-y-3">
      <div>
        <h3 className="text-sm font-semibold text-slate-900">Recommended Strategies</h3>
        <p className="text-xs text-slate-500 mt-1">Based on your intent and context</p>
      </div>

      <div className="space-y-2">
        {strategies.map((card) => (
          <StrategyCard key={card.strategy.id} card={card} selected={selectedId === card.strategy.id} onSelect={onSelect} disabled={isLoading} />
        ))}
      </div>

      {strategies.length === 0 && (
        <div className="py-6 text-center">
          <p className="text-sm text-slate-500">No strategies available for this intent</p>
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
      className={`w-full p-4 rounded-lg border-2 transition-all text-left ${
        selected ? 'border-indigo-600 bg-indigo-50' : 'border-slate-200 bg-white hover:border-slate-300'
      } ${disabled ? 'opacity-50 cursor-not-allowed' : 'cursor-pointer'}`}
    >
      <div className="flex items-start justify-between mb-2">
        <div className="flex-1">
          <h4 className="font-semibold text-slate-900 text-sm">{strategy.name}</h4>
          <p className="text-xs text-slate-600 mt-1">{strategy.description}</p>
        </div>
        {selected && <Check size={20} className="text-indigo-600 flex-shrink-0 ml-2" />}
      </div>

      <div className="flex items-center gap-3 mt-3">
        {/* Match Score */}
        <div className="flex items-center gap-2">
          <div className="text-xs font-medium text-slate-600">{Math.round(matchScore * 100)}% match</div>
          <div className="w-16 h-1.5 bg-slate-200 rounded-full overflow-hidden">
            <div
              className="h-full bg-green-500 transition-all"
              style={{ width: `${matchScore * 100}%` }}
            ></div>
          </div>
        </div>

        {/* Variant Count */}
        <div className="flex items-center gap-1 text-slate-600">
          <Zap size={14} className="text-amber-500" />
          <span className="text-xs font-medium">{variants} variants</span>
        </div>
      </div>
    </button>
  );
}
