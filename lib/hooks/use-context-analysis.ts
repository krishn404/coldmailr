'use client';

import { useState, useCallback } from 'react';
import { EmailContext } from '@/lib/types/block-system';

interface AnalysisResult {
  personalization_strength: number;
  ai_suggestions: string[];
  analysis_timestamp: string;
}

export function useContextAnalysis() {
  const [analysis, setAnalysis] = useState<AnalysisResult | null>(null);
  const [isAnalyzing, setIsAnalyzing] = useState(false);

  const analyzeContext = useCallback(async (context: Partial<EmailContext>) => {
    setIsAnalyzing(true);
    try {
      const response = await fetch('/api/email/context/analyze', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          recipient_name: context.recipient_name,
          company_name: context.company_name,
          company_industry: context.company_industry,
          recipient_role: context.recipient_role,
          context_notes: context.context_insights,
        }),
      });

      if (response.ok) {
        const data = await response.json();
        setAnalysis(data);
        return data;
      }
    } catch (error) {
      console.error('[context analysis error]', error);
    } finally {
      setIsAnalyzing(false);
    }
  }, []);

  return {
    analysis,
    isAnalyzing,
    analyzeContext,
  };
}
