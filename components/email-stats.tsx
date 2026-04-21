'use client';

import { getEmailStats, estimateReadingTime } from '@/lib/ai-utils';
import { BarChart3, Clock, Type } from 'lucide-react';

interface EmailStatsProps {
  body: string;
}

export function EmailStats({ body }: EmailStatsProps) {
  const stats = getEmailStats(body);
  const readingTime = estimateReadingTime(body);

  return (
    <div className="flex items-center gap-4 px-4 py-2 text-xs text-gray-500 border-t border-gray-800 bg-gray-950">
      <div className="flex items-center gap-1">
        <Type className="w-3.5 h-3.5" />
        <span>{stats.words} words</span>
      </div>
      <div className="w-px h-4 bg-gray-800" />
      <div className="flex items-center gap-1">
        <BarChart3 className="w-3.5 h-3.5" />
        <span>{stats.sentences} sentences</span>
      </div>
      <div className="w-px h-4 bg-gray-800" />
      <div className="flex items-center gap-1">
        <Clock className="w-3.5 h-3.5" />
        <span>{readingTime}</span>
      </div>
    </div>
  );
}
