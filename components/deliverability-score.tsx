'use client'

import { AlertCircle, Info, Link as LinkIcon } from 'lucide-react'

interface DeliverabilityMetrics {
  linksCount: number
  emailLength: number
  spamTriggers: string[]
}

interface DeliverabilityScoreProps {
  metrics: DeliverabilityMetrics
}

export function DeliverabilityScore({ metrics }: DeliverabilityScoreProps) {
  const isLongEmail = metrics.emailLength > 1000
  const hasManyLinks = metrics.linksCount > 5
  const hasSpamTriggers = metrics.spamTriggers.length > 0

  return (
    <div className="bg-[#1a1a1a] border border-[#2a2a2a] rounded-lg p-4 space-y-3">
      <div className="flex items-center justify-between">
        <h4 className="text-xs font-semibold text-[#999999] uppercase tracking-wider">Deliverability</h4>
      </div>

      <div className="space-y-2">
        {/* Links */}
        <div className="flex items-center justify-between text-sm">
          <div className="flex items-center gap-2">
            <LinkIcon className="w-4 h-4 text-[#666666]" />
            <span className="text-[#999999]">Links</span>
            <div className="group relative inline-block">
              <Info className="w-3.5 h-3.5 text-[#666666] cursor-help" />
              <div className="absolute hidden group-hover:block bg-[#2a2a2a] text-[#ccc] text-xs rounded px-2 py-1 whitespace-nowrap z-10 bottom-full right-0 mb-1">
                {hasManyLinks ? 'Many links may reduce deliverability' : 'Optimal link count'}
              </div>
            </div>
          </div>
          <span className={hasManyLinks ? 'text-red-400' : 'text-[#999999]'}>
            {metrics.linksCount}
          </span>
        </div>

        {/* Email Length */}
        <div className="flex items-center justify-between text-sm">
          <div className="flex items-center gap-2">
            <span className="text-[#666666]">📄</span>
            <span className="text-[#999999]">Length</span>
            <div className="group relative inline-block">
              <Info className="w-3.5 h-3.5 text-[#666666] cursor-help" />
              <div className="absolute hidden group-hover:block bg-[#2a2a2a] text-[#ccc] text-xs rounded px-2 py-1 whitespace-nowrap z-10 bottom-full right-0 mb-1">
                {isLongEmail ? 'Email is lengthy' : 'Good length'}
              </div>
            </div>
          </div>
          <span className={isLongEmail ? 'text-yellow-400' : 'text-[#999999]'}>
            {metrics.emailLength} chars
          </span>
        </div>

        {/* Spam Triggers */}
        {hasSpamTriggers && (
          <div className="flex items-start justify-between text-sm pt-1 border-t border-[#2a2a2a]">
            <div className="flex items-center gap-2">
              <AlertCircle className="w-4 h-4 text-red-500 mt-0.5" />
              <span className="text-red-400">Spam Triggers</span>
            </div>
            <div className="text-xs text-red-400 text-right">
              {metrics.spamTriggers.length} found
            </div>
          </div>
        )}
      </div>
    </div>
  )
}
