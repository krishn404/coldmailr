import type { BroadcastStatus } from '@/lib/broadcast-status'

export type BroadcastRecord = {
  id: string
  subject: string
  status: BroadcastStatus
  createdAt: string
  updatedAt: string
  sentAt?: string | null
  messageId?: string | null
  content?: string
  body: string
  toEmail: string
  audience: string
  context: string
  fromEmail?: string
}
