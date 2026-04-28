'use client'

import { BookMarked, Mail, Radio } from 'lucide-react'
import { useState } from 'react'
import { ProfileTrigger } from '@/components/profile-trigger'
import { ProfileModal } from '@/components/profile-modal'

interface BroadcastsSidebarProps {
  activeSection: 'emails' | 'broadcasts' | 'templates'
  onSectionChange: (section: 'emails' | 'broadcasts' | 'templates') => void
  accountName?: string | null
  connected: boolean
  onConnectGmail: () => void
  onLogoutGmail: () => void
}

export function BroadcastsSidebar({
  activeSection,
  onSectionChange,
  accountName,
  connected,
  onConnectGmail,
  onLogoutGmail,
}: BroadcastsSidebarProps) {
  const [profileOpen, setProfileOpen] = useState(false)

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
        <button
          onClick={() => onSectionChange('templates')}
          className={`w-full flex items-center gap-3 px-3 py-2 rounded-md transition-colors ${
            activeSection === 'templates'
              ? 'bg-[#2a2a2a] text-white'
              : 'text-[#999999] hover:text-white hover:bg-[#1a1a1a]'
          }`}
        >
          <BookMarked className="w-5 h-5" />
          <span className="text-sm">Template Gallery</span>
        </button>
      </nav>

      {/* Footer */}
      <div className="px-4 py-4 border-t border-[#2a2a2a]">
        {connected ? (
          <div className="space-y-3">
            <ProfileTrigger onOpen={() => setProfileOpen(true)} />
            <button
              onClick={onLogoutGmail}
              className="w-full px-3 py-2 text-xs text-white bg-[#1a1a1a] border border-[#2a2a2a] rounded hover:bg-[#2a2a2a] transition-colors"
            >
              Disconnect Gmail
            </button>
            <ProfileModal open={profileOpen} onOpenChange={setProfileOpen} />
          </div>
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
