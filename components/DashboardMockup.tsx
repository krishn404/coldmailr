'use client'

import { motion } from 'framer-motion'
import { useMemo, useState } from 'react'
import { BroadcastsTable } from '@/components/broadcasts-table'
import type { BroadcastRecord } from '@/components/broadcasts-types'
import type { BroadcastStatus } from '@/lib/broadcast-status'

export function DashboardMockup() {
  const [selectedIds, setSelectedIds] = useState<string[]>([])
  const [pendingStatusId, setPendingStatusId] = useState<string | null>(null)

  const broadcasts = useMemo<BroadcastRecord[]>(
    () => [
      {
        id: 'b1',
        subject: 'Quick question about your outreach stack',
        status: 'draft',
        createdAt: '2026-04-23T10:26:35.000Z',
        updatedAt: '2026-04-23T12:06:35.000Z',
        sentAt: null,
        messageId: null,
        body: "Hey — I’m reaching out because I noticed you’re hiring for growth. If helpful, I can share a quick cold-email outline that’s been working for similar founders.\n\nWorth sending over?",
        content:
          "Hey — I’m reaching out because I noticed you’re hiring for growth. If helpful, I can share a quick cold-email outline that’s been working for similar founders.\n\nWorth sending over?",
        toEmail: 'prospect@company.com',
        context: 'Hiring for growth, short CTA, keep it natural.',
        fromEmail: 'you@yourdomain.com',
      },
      {
        id: 'b2',
        subject: 'Following up — one idea for {{company}}',
        status: 'scheduled',
        createdAt: '2026-04-23T06:26:35.000Z',
        updatedAt: '2026-04-23T09:26:35.000Z',
        sentAt: null,
        messageId: null,
        body: 'Quick follow-up with one specific idea…',
        toEmail: 'lead@company.com',
        context: 'Follow-up variant; reference previous note.',
        fromEmail: 'you@yourdomain.com',
      },
      {
        id: 'b3',
        subject: 'Can I send a 2‑line breakdown?',
        status: 'sent',
        createdAt: '2026-04-22T08:26:35.000Z',
        updatedAt: '2026-04-22T09:26:35.000Z',
        sentAt: '2026-04-22T09:26:35.000Z',
        messageId: 'gmail_msg_123',
        body: 'Sent example…',
        toEmail: 'founder@startup.com',
        context: 'Founder, keep it concise.',
        fromEmail: 'you@yourdomain.com',
      },
    ],
    [],
  )

  const toggleAll = (checked: boolean) => {
    setSelectedIds(checked ? broadcasts.map((b) => b.id) : [])
  }
  const toggleOne = (id: string, checked: boolean) => {
    setSelectedIds((prev) => (checked ? (prev.includes(id) ? prev : [...prev, id]) : prev.filter((x) => x !== id)))
  }

  const noop = async () => {}

  return (
    <section className="px-6 py-8 md:px-10 md:py-12">
      <motion.div
        initial={{ opacity: 0, y: 56 }}
        whileInView={{ opacity: 1, y: 0 }}
        viewport={{ once: true, amount: 0.2 }}
        transition={{ duration: 0.65 }}
        className="mx-auto max-w-6xl overflow-hidden rounded-2xl border border-[#222] bg-[#111111]"
      >
        <div className="flex items-center gap-3 border-b border-[#222] px-4 py-3">
          <span className="h-2.5 w-2.5 rounded-full bg-[#555]" />
          <span className="h-2.5 w-2.5 rounded-full bg-[#444]" />
          <span className="h-2.5 w-2.5 rounded-full bg-[#3b82f6]" />
          <div className="ml-3 h-8 flex-1 rounded-md border border-[#222] bg-[#0d0d0d]" />
        </div>

        <div className="p-6">
          <div className="mb-4 grid gap-4 md:grid-cols-[240px_1fr]">
            <div className="rounded-xl border border-[#222] bg-[#0f0f0f] p-4">
              <div className="font-display text-sm font-bold text-white">Cold Mailr</div>
              <div className="mt-4 space-y-2">
                <div className="rounded-md bg-[#2a2a2a] px-3 py-2 text-sm text-white">Sent Emails</div>
                <div className="rounded-md px-3 py-2 text-sm text-[#9ca3af]">Inbox</div>
              </div>
              <div className="mt-6 rounded-md border border-white/25 px-3 py-2 text-xs text-white">Connect Gmail</div>
            </div>
            <div className="rounded-xl border border-[#222] bg-[#0f0f0f]">
              <div className="border-b border-[#222] px-6 py-5">
                <div className="flex items-center justify-between gap-4">
                  <div>
                    <div className="font-display text-2xl font-bold text-white">Sent Emails</div>
                    <div className="font-body mt-1 text-sm text-[#6b7280]">Draft, send, and keep a clean sent history.</div>
                  </div>
                  <div className="rounded-md bg-white px-4 py-2 text-sm font-semibold text-black">+ Create email</div>
                </div>
                <div className="mt-4 flex flex-col gap-3 md:flex-row md:items-center">
                  <div className="h-10 flex-1 rounded-md border border-[#222] bg-[#0a0a0a]" />
                  <div className="h-10 w-40 rounded-md border border-[#222] bg-[#0a0a0a]" />
                </div>
              </div>
              <BroadcastsTable
                broadcasts={broadcasts}
                selectedIds={selectedIds}
                onToggleSelectAll={toggleAll}
                onToggleSelectOne={toggleOne}
                onView={() => {}}
                onEdit={() => {}}
                onDuplicate={() => {}}
                onDelete={() => {}}
                onUpdateStatus={(_, status: BroadcastStatus) => {
                  setPendingStatusId(status ? pendingStatusId : null)
                }}
                pendingStatusId={pendingStatusId}
              />
            </div>
          </div>
          <div className="mt-4 rounded-xl border border-[#222] bg-[#141414] p-5">
            <div className="font-body text-sm text-[#9ca3af]">Compose + Send</div>
            <div className="mt-3 grid gap-3 md:grid-cols-2">
              <div className="rounded-lg border border-[#222] bg-[#0a0a0a] px-4 py-3 text-sm text-[#9ca3af]">
                AI draft, edit, and send via Gmail.
              </div>
              <div className="rounded-lg border border-[#222] bg-[#0a0a0a] px-4 py-3 text-sm text-[#9ca3af]">
                Saved as Sent Emails with status + message id.
              </div>
            </div>
          </div>
        </div>
      </motion.div>
    </section>
  )
}
