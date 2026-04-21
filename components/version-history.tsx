'use client';

import { useDraftStore } from '@/lib/store';
import { Clock, ChevronDown } from 'lucide-react';
import { useState } from 'react';
import { Button } from '@/components/ui/button';

export function VersionHistory() {
  const [showHistory, setShowHistory] = useState(false);
  const store = useDraftStore();

  if (!store.history || store.history.length <= 1) return null;

  return (
    <div className="relative">
      <Button
        variant="outline"
        size="sm"
        onClick={() => setShowHistory(!showHistory)}
        className="gap-2 border-gray-800 text-gray-400 hover:text-white h-8"
      >
        <Clock className="w-4 h-4" />
        <span className="text-xs">Versions ({store.history?.length || 0})</span>
        <ChevronDown className="w-3 h-3" />
      </Button>

      {showHistory && (
        <div className="absolute right-0 top-10 bg-gray-900 border border-gray-800 rounded-lg shadow-lg z-50 min-w-[280px] max-h-[400px] overflow-y-auto">
          <div className="p-2">
            {store.history?.map((version, idx) => (
              <button
                key={idx}
                onClick={() => {
                  store.jumpToVersion?.(idx);
                  setShowHistory(false);
                }}
                className={`w-full text-left px-3 py-2 text-xs rounded transition-colors ${
                  idx === store.historyIndex
                    ? 'bg-blue-600 text-white'
                    : 'text-gray-300 hover:bg-gray-800'
                }`}
              >
                <div className="font-medium">
                  {new Date(version.timestamp).toLocaleTimeString()}
                </div>
                <div className="text-gray-400 truncate">
                  {version.body.substring(0, 50)}...
                </div>
              </button>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
