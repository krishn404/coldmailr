export const BROADCAST_STATUSES = ['draft', 'scheduled', 'sent'] as const

export type BroadcastStatus = (typeof BROADCAST_STATUSES)[number]

export function isBroadcastStatus(value: unknown): value is BroadcastStatus {
  return typeof value === 'string' && BROADCAST_STATUSES.includes(value as BroadcastStatus)
}

export function canTransitionBroadcastStatus(
  from: BroadcastStatus,
  to: BroadcastStatus,
): { allowed: boolean; reason?: string } {
  if (from === to) return { allowed: true }
  if (from === 'sent' && to !== 'sent') {
    return { allowed: false, reason: 'Cannot transition a sent broadcast back to draft or scheduled' }
  }
  return { allowed: true }
}

export function fromDbStatus(value: string | null): BroadcastStatus {
  if (value === 'archived') return 'scheduled'
  if (value === 'sent') return 'sent'
  return 'draft'
}

export function toDbStatus(value: BroadcastStatus): 'draft' | 'scheduled' | 'sent' {
  return value
}

export function toTableStatus(
  value: BroadcastStatus,
  table: 'broadcasts' | 'drafts',
): 'draft' | 'scheduled' | 'archived' | 'sent' {
  if (table === 'drafts' && value === 'scheduled') return 'archived'
  return value
}
