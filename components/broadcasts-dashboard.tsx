'use client'

import { useEffect, useMemo, useState } from 'react'
import { Search, ChevronDown } from 'lucide-react'
import { BroadcastsTable } from '@/components/broadcasts-table'
import { BroadcastRecord, BroadcastStatus } from '@/components/broadcasts-types'
import { isBroadcastStatus } from '@/lib/broadcast-status'

interface BroadcastsDashboardProps {
  onCreateClick: (broadcast?: BroadcastRecord) => void
}

export function BroadcastsDashboard({ onCreateClick }: BroadcastsDashboardProps) {
  const [broadcasts, setBroadcasts] = useState<BroadcastRecord[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [searchTerm, setSearchTerm] = useState('')
  const [statusFilter, setStatusFilter] = useState('all')
  const [audienceFilter, setAudienceFilter] = useState('all')
  const [selectedBroadcast, setSelectedBroadcast] = useState<BroadcastRecord | null>(null)
  const [pendingStatusId, setPendingStatusId] = useState<string | null>(null)
  const [mutationError, setMutationError] = useState<string | null>(null)

  const normalizeBroadcasts = (input: unknown): BroadcastRecord[] => {
    if (!Array.isArray(input)) return []
    return input.map((b: any) => ({
      id: b?.id ?? '',
      subject: b?.subject ?? '',
      status: isBroadcastStatus(b?.status) ? b.status : 'draft',
      audience_count: b?.audience_count ?? 0,
      sent_count: b?.sent_count ?? 0,
      failed_count: b?.failed_count ?? 0,
      created_at: b?.created_at ?? '',
      createdAt: b?.created_at ?? '',
      updatedAt: b?.updated_at ?? b?.created_at ?? '',
      sentAt: b?.sent_at ?? null,
      messageId: b?.message_id ?? null,
      content: b?.content ?? b?.body ?? '',
      body: b?.content ?? b?.body ?? '',
      toEmail: b?.to_email ?? '',
      audience: b?.audience ?? '',
      context: b?.context ?? '',
      fromEmail: b?.from_email ?? '',
    }))
  }

  const loadBroadcasts = async () => {
    setIsLoading(true)
    try {
      const response = await fetch('/api/broadcasts', { cache: 'no-store' })
      if (!response.ok) {
        setBroadcasts([])
        return
      }
      const json = (await response.json()) as { data?: unknown }
      setBroadcasts(normalizeBroadcasts(json?.data))
    } catch {
      setBroadcasts([])
    } finally {
      setIsLoading(false)
    }
  }

  useEffect(() => {
    void loadBroadcasts()
  }, [])

  const filteredBroadcasts = useMemo(() => {
    return broadcasts.filter((item) => {
      const matchesSearch = searchTerm
        ? (item.subject || '').toLowerCase().includes(searchTerm.toLowerCase())
        : true
      const matchesStatus = statusFilter === 'all' ? true : item.status === statusFilter
      const matchesAudience = audienceFilter === 'all' ? true : item.audience === audienceFilter
      return matchesSearch && matchesStatus && matchesAudience
    })
  }, [broadcasts, searchTerm, statusFilter, audienceFilter])

  const audienceOptions = useMemo(() => {
    const values = Array.from(new Set(filteredBroadcasts.map((item) => item.audience))).filter(Boolean)
    return ['all', ...values]
  }, [filteredBroadcasts])

  const handleCreateEmail = async () => {
    try {
      const response = await fetch('/api/broadcasts', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ subject: 'Untitled', status: 'draft' }),
      })

      if (response.ok) {
        const json = (await response.json()) as { data?: unknown }
        const created = normalizeBroadcasts(json?.data ? [json.data] : [])[0]
        if (created) {
          setBroadcasts((prev) => [created, ...prev])
          onCreateClick(created)
          return
        }
        await loadBroadcasts()
        return
      }

      // If backend persistence is unavailable (e.g., missing table),
      // still allow composing immediately with a new unsaved broadcast.
      onCreateClick()
    } catch {
      onCreateClick()
    }
  }

  const handleUpdateStatus = async (broadcast: BroadcastRecord, status: BroadcastStatus) => {
    setMutationError(null)
    setPendingStatusId(broadcast.id)
    const optimistic = { ...broadcast, status, updatedAt: new Date().toISOString() }
    setBroadcasts((prev) => prev.map((item) => (item.id === broadcast.id ? optimistic : item)))

    try {
      const response = await fetch(`/api/broadcasts/${broadcast.id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ status }),
      })

      const body = (await response.json()) as { data?: any; error?: { message?: string } | string | null }
      const updated = body?.data
      if (!response.ok || !updated?.id) {
        throw new Error((body as { error?: { message?: string } })?.error?.message || 'Status update failed')
      }

      setBroadcasts((prev) =>
        prev.map((item) =>
            item.id === broadcast.id
              ? {
                  ...item,
                  status: updated.status ?? item.status,
                  updatedAt: updated.updated_at ?? item.updatedAt,
                  sentAt: updated.sent_at ?? item.sentAt,
                }
              : item,
      )
      )
      setSelectedBroadcast((prev) =>
        prev?.id === broadcast.id
          ? {
              ...prev,
              status: updated.status ?? prev.status,
              updatedAt: updated.updated_at ?? prev.updatedAt,
              sentAt: updated.sent_at ?? prev.sentAt,
            }
          : prev,
      )
      setSelectedBroadcast(null)
    } catch (error) {
      await loadBroadcasts()
      setMutationError(error instanceof Error ? error.message : 'Status update failed')
    } finally {
      setPendingStatusId(null)
    }
  }

  const handleDuplicate = async (broadcast: BroadcastRecord) => {
    const response = await fetch('/api/broadcasts', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        subject: `${broadcast.subject} (Copy)`,
        body: broadcast.body,
        toEmail: broadcast.toEmail,
        context: broadcast.context,
        status: 'draft',
      }),
    })
    if (!response.ok) return
    const json = (await response.json()) as { data?: unknown }
    const duplicated = normalizeBroadcasts(json?.data ? [json.data] : [])[0]
    if (duplicated) {
      setBroadcasts((prev) => [duplicated, ...prev])
    } else {
      await loadBroadcasts()
    }
  }

  const handleDelete = async (broadcast: BroadcastRecord) => {
    const response = await fetch(`/api/broadcasts/${broadcast.id}`, { method: 'DELETE' })
    if (!response.ok) return
    setBroadcasts((prev) => prev.filter((item) => item.id !== broadcast.id))
    if (selectedBroadcast?.id === broadcast.id) {
      setSelectedBroadcast(null)
    }
  }

  useEffect(() => {
    if (!selectedBroadcast) return
    const fresh = filteredBroadcasts.find((item) => item.id === selectedBroadcast.id)
    if (fresh) setSelectedBroadcast(fresh)
  }, [filteredBroadcasts, selectedBroadcast])

  return (
    <div className="flex-1 flex flex-col h-full bg-[#0a0a0a]">
      {/* Header */}
      <div className="px-8 py-8 border-b border-[#2a2a2a]">
        <div className="flex items-center justify-between mb-6">
          <h1 className="text-3xl font-semibold text-white">Sent Emails</h1>
          <button
            onClick={handleCreateEmail}
            className="px-4 py-2 bg-white text-black text-sm font-medium rounded hover:bg-[#f0f0f0] transition-colors"
          >
            + Create email
          </button>
        </div>

        {/* Filters */}
        <div className="flex items-center gap-4">
          {/* Search */}
          <div className="relative flex-1 max-w-sm">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-[#666666]" />
            <input
              type="text"
              placeholder="Search..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-10 pr-4 py-2 bg-[#1a1a1a] border border-[#2a2a2a] rounded text-sm text-white placeholder-[#666666] focus:outline-none focus:border-[#4a4a4a]"
            />
          </div>

          <div className="relative">
            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
              className="appearance-none px-4 py-2 pr-8 bg-[#1a1a1a] border border-[#2a2a2a] rounded text-sm text-white hover:bg-[#2a2a2a] transition-colors"
            >
              <option value="all">All Statuses</option>
              <option value="draft">Draft</option>
              <option value="scheduled">Scheduled</option>
              <option value="sent">Sent</option>
            </select>
            <ChevronDown className="w-4 h-4 text-[#666666] absolute right-2 top-1/2 -translate-y-1/2 pointer-events-none" />
          </div>

          <div className="relative">
            <select
              value={audienceFilter}
              onChange={(e) => setAudienceFilter(e.target.value)}
              className="appearance-none px-4 py-2 pr-8 bg-[#1a1a1a] border border-[#2a2a2a] rounded text-sm text-white hover:bg-[#2a2a2a] transition-colors"
            >
              {audienceOptions.map((value) => (
                <option key={value} value={value}>
                  {value === 'all' ? 'All Audiences' : value}
                </option>
              ))}
            </select>
            <ChevronDown className="w-4 h-4 text-[#666666] absolute right-2 top-1/2 -translate-y-1/2 pointer-events-none" />
          </div>
        </div>
      </div>

      {isLoading ? (
        <div className="flex-1 flex items-center justify-center text-[#666666]">Loading sent emails...</div>
      ) : (
        <BroadcastsTable
          broadcasts={filteredBroadcasts}
          onView={setSelectedBroadcast}
          onEdit={onCreateClick}
          onDuplicate={handleDuplicate}
          onDelete={handleDelete}
          onUpdateStatus={handleUpdateStatus}
          pendingStatusId={pendingStatusId}
        />
      )}

      {selectedBroadcast && (
        <div className="fixed inset-0 z-50 bg-black/50 flex items-center justify-center p-6">
          <div className="w-full max-w-2xl bg-[#121212] border border-[#2a2a2a] rounded-lg p-6 space-y-4">
            <div className="flex items-center justify-between">
              <h2 className="text-lg font-semibold text-white">{selectedBroadcast.subject}</h2>
              <button
                onClick={() => setSelectedBroadcast(null)}
                className="px-3 py-1 text-sm text-[#999999] hover:text-white"
              >
                Close
              </button>
            </div>
            <div className="grid grid-cols-2 gap-4 text-sm">
              <div>
                <div className="text-[#666666]">Audience</div>
                <div className="text-white">{selectedBroadcast.audience || '—'}</div>
              </div>
              <div>
                <div className="text-[#666666]">Recipient</div>
                <div className="text-white">{selectedBroadcast.toEmail || '—'}</div>
              </div>
              <div>
                <div className="text-[#666666]">Status</div>
                <div className="text-white">{selectedBroadcast.status}</div>
              </div>
              <div>
                <div className="text-[#666666]">Created</div>
                <div className="text-white">{new Date(selectedBroadcast.createdAt).toLocaleString()}</div>
              </div>
              <div>
                <div className="text-[#666666]">Updated</div>
                <div className="text-white">{new Date(selectedBroadcast.updatedAt).toLocaleString()}</div>
              </div>
              {selectedBroadcast.status === 'sent' && (
                <div>
                  <div className="text-[#666666]">Sent At</div>
                  <div className="text-white">
                    {selectedBroadcast.sentAt ? new Date(selectedBroadcast.sentAt).toLocaleString() : '-'}
                  </div>
                </div>
              )}
            </div>
            {mutationError && <div className="text-sm text-red-300">{mutationError}</div>}
            <div>
              <div className="text-[#666666] text-sm mb-2">Context</div>
              <p className="text-sm text-[#999999] whitespace-pre-wrap">{selectedBroadcast.context || '—'}</p>
            </div>
            <div>
              <div className="text-[#666666] text-sm mb-2">Email Body</div>
              <p className="text-sm text-white whitespace-pre-wrap">
                {selectedBroadcast.content || selectedBroadcast.body || '—'}
              </p>
            </div>
            <div className="flex items-center gap-2 justify-end">
              <button
                onClick={() => void handleUpdateStatus(selectedBroadcast, 'draft')}
                disabled={pendingStatusId === selectedBroadcast.id}
                className="px-3 py-2 text-xs border border-[#2a2a2a] text-[#999999] rounded hover:text-white disabled:opacity-50"
              >
                Mark Draft
              </button>
              <button
                onClick={() => void handleUpdateStatus(selectedBroadcast, 'scheduled')}
                disabled={pendingStatusId === selectedBroadcast.id}
                className="px-3 py-2 text-xs border border-[#2a2a2a] text-[#999999] rounded hover:text-white disabled:opacity-50"
              >
                Mark Scheduled
              </button>
              <button
                onClick={() => void handleUpdateStatus(selectedBroadcast, 'sent')}
                disabled={pendingStatusId === selectedBroadcast.id || selectedBroadcast.status === 'sent'}
                className="px-3 py-2 text-xs bg-white text-black rounded hover:bg-[#f0f0f0] disabled:opacity-50"
              >
                Mark Sent
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
