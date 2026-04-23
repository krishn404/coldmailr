'use client'

import { MoreHorizontal } from 'lucide-react'
import { useState } from 'react'
import { BroadcastRecord, BroadcastStatus } from '@/components/broadcasts-types'

interface BroadcastsTableProps {
  broadcasts: BroadcastRecord[]
  selectedIds: string[]
  onToggleSelectAll: (checked: boolean) => void
  onToggleSelectOne: (id: string, checked: boolean) => void
  onView: (broadcast: BroadcastRecord) => void
  onEdit: (broadcast: BroadcastRecord) => void
  onDuplicate: (broadcast: BroadcastRecord) => void
  onDelete: (broadcast: BroadcastRecord) => void
  onUpdateStatus: (broadcast: BroadcastRecord, status: BroadcastStatus) => void
  pendingStatusId: string | null
}

const statusColors: Record<string, { bg: string; text: string }> = {
  draft: { bg: '#2a2a2a', text: '#999999' },
  scheduled: { bg: '#2a3240', text: '#b0c4ff' },
  sent: { bg: '#213428', text: '#8ee0aa' },
}

function formatUtc(iso: string) {
  const d = new Date(iso)
  if (Number.isNaN(d.getTime())) return iso
  // Deterministic output for SSR/CSR (avoids locale + timezone hydration mismatches)
  return `${d.toISOString().replace('T', ' ').slice(0, 19)}Z`
}

export function BroadcastsTable({
  broadcasts,
  selectedIds,
  onToggleSelectAll,
  onToggleSelectOne,
  onView,
  onEdit,
  onDuplicate,
  onDelete,
  onUpdateStatus,
  pendingStatusId,
}: BroadcastsTableProps) {
  const [openMenuId, setOpenMenuId] = useState<string | null>(null)
  if (!Array.isArray(broadcasts)) return null
  const allSelected = broadcasts.length > 0 && selectedIds.length === broadcasts.length

  return (
    <div className="flex-1 flex flex-col">
      {/* Table Header */}
      <div className="grid grid-cols-[36px_2fr_1fr_1.4fr_80px] gap-4 px-6 py-4 border-b border-[#2a2a2a] bg-[#0f0f0f]">
        <div className="flex items-center">
          <input
            type="checkbox"
            checked={allSelected}
            onChange={(e) => onToggleSelectAll(e.target.checked)}
            aria-label="Select all sent emails"
          />
        </div>
        <div className="text-sm font-medium text-[#666666]">Name</div>
        <div className="text-sm font-medium text-[#666666]">Status</div>
        <div className="text-sm font-medium text-[#666666]">Created</div>
        <div className="text-sm font-medium text-[#666666] text-right">Actions</div>
      </div>

      {/* Table Body */}
      <div className="flex-1 overflow-y-auto">
        {broadcasts.length === 0 ? (
          <div className="px-6 py-8 text-center text-[#666666]">
            No sent emails found
          </div>
        ) : (
          broadcasts.map((broadcast) => {
            const status = typeof broadcast.status === 'string' ? broadcast.status : 'unknown'
            const label = status.charAt(0).toUpperCase() + status.slice(1)

            return (
              <div
                key={broadcast.id}
                className="grid grid-cols-[36px_2fr_1fr_1.4fr_80px] gap-4 px-6 py-4 border-b border-[#1a1a1a] hover:bg-[#0f0f0f] transition-colors cursor-pointer"
                onClick={() => onView(broadcast)}
              >
                <div className="flex items-center" onClick={(e) => e.stopPropagation()}>
                  <input
                    type="checkbox"
                    checked={selectedIds.includes(broadcast.id)}
                    onChange={(e) => onToggleSelectOne(broadcast.id, e.target.checked)}
                    aria-label={`Select ${broadcast.subject || 'sent email'}`}
                  />
                </div>
                <div className="text-sm text-white truncate">{broadcast.subject}</div>
                <div>
                  <span
                    className="inline-block px-3 py-1 rounded text-xs font-medium"
                    style={{
                      backgroundColor: statusColors[status]?.bg,
                      color: statusColors[status]?.text,
                    }}
                  >
                    {label}
                  </span>
                </div>
                <div className="text-sm text-[#999999]">
                  {formatUtc(broadcast.createdAt)}
                  {broadcast.status === 'sent' && broadcast.sentAt && (
                    <div className="text-xs text-[#7c7c7c]">Sent: {formatUtc(broadcast.sentAt)}</div>
                  )}
                </div>
                <div className="flex items-center justify-end gap-2 relative">
                  <button
                    onClick={(e) => {
                      e.stopPropagation()
                      setOpenMenuId((current) => (current === broadcast.id ? null : broadcast.id))
                    }}
                    className="p-1 hover:bg-[#1a1a1a] rounded transition-colors"
                    aria-label="View actions"
                  >
                    <MoreHorizontal className="w-4 h-4 text-[#666666]" />
                  </button>
                  {openMenuId === broadcast.id && (
                    <div
                      className="absolute mt-28 w-32 bg-[#121212] border border-[#2a2a2a] rounded shadow-lg z-20"
                      onClick={(e) => e.stopPropagation()}
                    >
                      <button
                        onClick={() => {
                          setOpenMenuId(null)
                          onView(broadcast)
                        }}
                        className="w-full text-left px-3 py-2 text-xs text-[#cfcfcf] hover:bg-[#1a1a1a]"
                      >
                        View
                      </button>
                      <button
                        onClick={() => {
                          setOpenMenuId(null)
                          onEdit(broadcast)
                        }}
                        className="w-full text-left px-3 py-2 text-xs text-[#cfcfcf] hover:bg-[#1a1a1a]"
                      >
                        Edit
                      </button>
                      <button
                        disabled={pendingStatusId === broadcast.id}
                        onClick={() => {
                          setOpenMenuId(null)
                          onUpdateStatus(broadcast, 'draft')
                        }}
                        className="w-full text-left px-3 py-2 text-xs text-[#cfcfcf] hover:bg-[#1a1a1a] disabled:opacity-50"
                      >
                        Mark Draft
                      </button>
                      <button
                        disabled={pendingStatusId === broadcast.id}
                        onClick={() => {
                          setOpenMenuId(null)
                          onUpdateStatus(broadcast, 'scheduled')
                        }}
                        className="w-full text-left px-3 py-2 text-xs text-[#cfcfcf] hover:bg-[#1a1a1a] disabled:opacity-50"
                      >
                        Mark Scheduled
                      </button>
                      <button
                        disabled={pendingStatusId === broadcast.id || broadcast.status === 'sent'}
                        onClick={() => {
                          setOpenMenuId(null)
                          onUpdateStatus(broadcast, 'sent')
                        }}
                        className="w-full text-left px-3 py-2 text-xs text-[#cfcfcf] hover:bg-[#1a1a1a] disabled:opacity-50"
                      >
                        Mark Sent
                      </button>
                      <button
                        onClick={() => {
                          setOpenMenuId(null)
                          onDuplicate(broadcast)
                        }}
                        className="w-full text-left px-3 py-2 text-xs text-[#cfcfcf] hover:bg-[#1a1a1a]"
                      >
                        Duplicate
                      </button>
                      <button
                        onClick={() => {
                          setOpenMenuId(null)
                          onDelete(broadcast)
                        }}
                        className="w-full text-left px-3 py-2 text-xs text-red-300 hover:bg-[#1a1a1a]"
                      >
                        Delete
                      </button>
                    </div>
                  )}
                </div>
              </div>
            )
          })
        )}
      </div>

      {/* Pagination/Info */}
      {broadcasts.length > 0 && (
        <div className="px-6 py-4 border-t border-[#2a2a2a] bg-[#0f0f0f] text-xs text-[#999999]">
          Page 1 – 1 of {broadcasts.length} sent emails
        </div>
      )}
    </div>
  )
}
