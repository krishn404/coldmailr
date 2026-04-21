'use client'

import { useState } from 'react'
import { Zap } from 'lucide-react'

interface InlineAIActionsProps {
  selectedText: string
  onAction: (action: string, text: string) => void
  isProcessing?: boolean
}

type ActionType = 'rewrite' | 'grammar' | 'tone' | 'subject'

export function InlineAIActions({ selectedText, onAction, isProcessing = false }: InlineAIActionsProps) {
  const [showMenu, setShowMenu] = useState(false)

  const actions: { id: ActionType; label: string; description: string }[] = [
    { id: 'rewrite', label: 'Rewrite', description: 'Rephrase this section' },
    { id: 'grammar', label: 'Grammar', description: 'Fix grammar and clarity' },
    { id: 'tone', label: 'Tone', description: 'Adjust tone of voice' },
    { id: 'subject', label: 'Subject', description: 'Generate subject line' },
  ]

  const handleAction = (actionId: ActionType) => {
    onAction(actionId, selectedText)
    setShowMenu(false)
  }

  if (!selectedText) return null

  return (
    <div className="absolute bg-[#2a2a2a] border border-[#3a3a3a] rounded-lg shadow-lg z-50">
      <div className="p-2 space-y-1">
        {actions.map((action) => (
          <button
            key={action.id}
            onClick={() => handleAction(action.id)}
            disabled={isProcessing}
            className="w-full text-left px-3 py-2 text-sm text-[#ccc] hover:bg-[#3a3a3a] rounded transition-colors disabled:opacity-50"
          >
            <div className="flex items-center gap-2">
              <Zap className="w-3.5 h-3.5 text-[#999999]" />
              <div>
                <p className="font-medium">{action.label}</p>
                <p className="text-xs text-[#666666]">{action.description}</p>
              </div>
            </div>
          </button>
        ))}
      </div>
    </div>
  )
}
