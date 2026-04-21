'use client'

import { Mail, Radio } from 'lucide-react'

interface BroadcastsSidebarProps {
  activeSection: 'emails' | 'broadcasts'
  onSectionChange: (section: 'emails' | 'broadcasts') => void
  accountEmail?: string | null
  accountName?: string | null
  connected: boolean
  onConnectGmail: () => void
  onLogoutGmail: () => void
}

export function BroadcastsSidebar({
  activeSection,
  onSectionChange,
  accountEmail,
  accountName,
  connected,
  onConnectGmail,
  onLogoutGmail,
}: BroadcastsSidebarProps) {
  return (
    <div className="w-64 bg-[#0a0a0a] border-r border-[#2a2a2a] flex flex-col h-full">
      {/* Header */}
      <div className="px-4 py-6 border-b border-[#2a2a2a]">
        <h1 className="text-lg font-semibold text-white">{accountName || 'coldmailr'}</h1>
      </div>

      {/* Navigation */}
      <nav className="flex-1 px-3 py-4 space-y-1">
        <button
          onClick={() => onSectionChange('emails')}
          className={`w-full flex items-center gap-3 px-3 py-2 rounded-md transition-colors ${
            activeSection === 'emails'
              ? 'bg-[#2a2a2a] text-white'
              : 'text-[#999999] hover:text-white hover:bg-[#1a1a1a]'
          }`}
        >
          <Mail className="w-5 h-5" />
          <span className="text-sm">Inbox</span>
        </button>

        <button
          onClick={() => onSectionChange('broadcasts')}
          className={`w-full flex items-center gap-3 px-3 py-2 rounded-md transition-colors ${
            activeSection === 'broadcasts'
              ? 'bg-[#2a2a2a] text-white'
              : 'text-[#999999] hover:text-white hover:bg-[#1a1a1a]'
          }`}
        >
          <Radio className="w-5 h-5" />
          <span className="text-sm">Sent Emails</span>
        </button>
      </nav>

      {/* Footer */}
      <div className="px-4 py-4 border-t border-[#2a2a2a]">
        <div className="text-xs text-[#666666] mb-3">{accountEmail || 'Not connected'}</div>
        {connected ? (
          <button
            onClick={onLogoutGmail}
            className="w-full px-3 py-2 text-xs text-white bg-[#1a1a1a] border border-[#2a2a2a] rounded hover:bg-[#2a2a2a] transition-colors"
          >
            Disconnect Gmail
          </button>
        ) : (
          <button
            onClick={onConnectGmail}
            className="w-full px-3 py-2 text-xs text-black bg-white rounded hover:bg-[#f0f0f0] transition-colors"
          >
            Connect Gmail
          </button>
        )}
      </div>
    </div>
  )
}
