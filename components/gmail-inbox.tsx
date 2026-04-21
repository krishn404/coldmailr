'use client'

import { useCallback, useEffect, useState } from 'react'
import { Mail, RefreshCw } from 'lucide-react'

type GmailMessage = {
  id: string
  from: string
  subject: string
  date: string
  snippet: string
}

type GmailInboxProps = {
  connected: boolean
}

export function GmailInbox({ connected }: GmailInboxProps) {
  const [messages, setMessages] = useState<GmailMessage[]>([])
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const loadMessages = useCallback(async () => {
    if (!connected) return

    setLoading(true)
    setError(null)
    try {
      const response = await fetch('/api/gmail/messages', { cache: 'no-store' })
      if (!response.ok) {
        throw new Error('Failed to fetch inbox')
      }
      const data = (await response.json()) as { messages: GmailMessage[] }
      setMessages(data.messages ?? [])
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to fetch inbox')
    } finally {
      setLoading(false)
    }
  }, [connected])

  useEffect(() => {
    void loadMessages()
  }, [loadMessages])

  if (!connected) {
    return (
      <div className="p-6 text-[#999999] text-sm">
        Connect Gmail to view your inbox.
      </div>
    )
  }

  return (
    <div className="flex-1 flex flex-col bg-[#0a0a0a]">
      <div className="px-8 py-6 border-b border-[#2a2a2a] flex items-center justify-between">
        <h1 className="text-2xl font-semibold text-white">Inbox</h1>
        <button
          onClick={() => void loadMessages()}
          className="px-3 py-2 text-sm bg-[#1a1a1a] border border-[#2a2a2a] rounded text-white hover:bg-[#2a2a2a] transition-colors flex items-center gap-2"
        >
          <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />
          Refresh
        </button>
      </div>

      {error ? (
        <div className="p-6 text-sm text-red-400">{error}</div>
      ) : loading && messages.length === 0 ? (
        <div className="p-6 text-sm text-[#999999]">Loading inbox...</div>
      ) : messages.length === 0 ? (
        <div className="p-6 text-sm text-[#999999]">No inbox emails found.</div>
      ) : (
        <div className="overflow-y-auto">
          {messages.map((message) => (
            <div
              key={message.id}
              className="px-6 py-4 border-b border-[#1a1a1a] hover:bg-[#0f0f0f] transition-colors"
            >
              <div className="flex items-center gap-2 text-sm text-white">
                <Mail className="w-4 h-4 text-[#666666]" />
                <span className="truncate">{message.subject}</span>
              </div>
              <div className="text-xs text-[#999999] mt-1 truncate">{message.from}</div>
              <div className="text-xs text-[#666666] mt-1 truncate">{message.snippet}</div>
              <div className="text-xs text-[#666666] mt-1">{message.date}</div>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}
