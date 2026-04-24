'use client'

import { useEffect, useState } from 'react'
import { BroadcastsSidebar } from '@/components/broadcasts-sidebar'
import { BroadcastsDashboard } from '@/components/broadcasts-dashboard'
import { ColdEmailComposer } from '@/components/cold-email-composer'
import { GmailInbox } from '@/components/gmail-inbox'
import { GmailAuthModal } from '@/components/gmail-auth-modal'
import { BroadcastRecord } from '@/components/broadcasts-types'

type GmailSession = {
  connected: boolean
  email?: string | null
  name?: string | null
  userId?: string | null
}

export default function AppPage() {
  const [mounted, setMounted] = useState(false)
  const [activeSection, setActiveSection] = useState<'emails' | 'broadcasts'>('broadcasts')
  const [isComposeOpen, setIsComposeOpen] = useState(false)
  const [selectedBroadcast, setSelectedBroadcast] = useState<BroadcastRecord | null>(null)
  const [gmailSession, setGmailSession] = useState<GmailSession>({ connected: false })
  const [sessionLoading, setSessionLoading] = useState(true)
  const [broadcastsVersion, setBroadcastsVersion] = useState(0)
  const [activeUserId, setActiveUserId] = useState<string | null>(null)

  useEffect(() => {
    setMounted(true)
  }, [])

  useEffect(() => {
    const loadSession = async () => {
      const response = await fetch('/api/google/session', { cache: 'no-store' })
      if (response.ok) {
        const session = (await response.json()) as GmailSession
        setGmailSession(session)
        setActiveUserId(session.userId ?? null)
      }
      setSessionLoading(false)
    }
    void loadSession()
  }, [])

  const connectGmail = async () => {
    const response = await fetch('/api/google/auth-url', { cache: 'no-store' })
    if (!response.ok) return
    const data = (await response.json()) as { authUrl: string }
    window.location.href = data.authUrl
  }

  const logoutGmail = async () => {
    await fetch('/api/google/logout', { method: 'POST' })
    setGmailSession({ connected: false })
    setActiveUserId(null)
    setSelectedBroadcast(null)
    setBroadcastsVersion((prev) => prev + 1)
  }

  useEffect(() => {
    if (!gmailSession.connected) return
    const currentUserId = gmailSession.userId ?? null
    if (activeUserId !== currentUserId) {
      setActiveUserId(currentUserId)
      setSelectedBroadcast(null)
      setBroadcastsVersion((prev) => prev + 1)
    }
  }, [gmailSession.connected, gmailSession.userId, activeUserId])

  if (!mounted) {
    return <div className="h-screen bg-[#0a0a0a]" />
  }

  return (
    <div className="flex h-screen bg-[#0a0a0a]">
      <BroadcastsSidebar
        activeSection={activeSection}
        onSectionChange={setActiveSection}
        accountEmail={gmailSession.email}
        accountName={gmailSession.name}
        connected={gmailSession.connected}
        onConnectGmail={connectGmail}
        onLogoutGmail={logoutGmail}
      />
      <main className="flex-1 flex flex-col overflow-hidden">
        {activeSection === 'emails' && <GmailInbox connected={gmailSession.connected} />}
        {activeSection === 'broadcasts' && (
          <BroadcastsDashboard
            onCreateClick={(broadcast) => {
              setSelectedBroadcast(broadcast ?? null)
              setIsComposeOpen(true)
            }}
            key={`${activeUserId ?? 'anon'}-${broadcastsVersion}`}
          />
        )}
      </main>
      <ColdEmailComposer
        isOpen={isComposeOpen}
        onClose={() => {
          setIsComposeOpen(false)
          setSelectedBroadcast(null)
        }}
        fromEmail={gmailSession.email}
        canSend={gmailSession.connected}
        initialBroadcast={selectedBroadcast}
        onSaved={() => setBroadcastsVersion((prev) => prev + 1)}
      />
      <GmailAuthModal open={!sessionLoading && !gmailSession.connected} onConnect={connectGmail} />
    </div>
  )
}

