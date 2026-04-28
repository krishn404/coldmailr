'use client'

import { motion } from 'framer-motion'
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar'
import { useProfile } from '@/components/profile-provider'

function initials(value: string | null | undefined) {
  const text = value?.trim()
  if (!text) return 'U'
  return text
    .split(/\s+/)
    .slice(0, 2)
    .map((part) => part[0]?.toUpperCase() ?? '')
    .join('')
}

export function ProfileTrigger({ onOpen }: { onOpen: () => void }) {
  const { session, profile, isLoading } = useProfile()
  const displayName = profile?.full_name || session.name || 'Your profile'
  const displayEmail = profile?.email || session.email || 'Not connected'

  return (
    <motion.button
      initial={{ opacity: 0, y: 6 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.18 }}
      onClick={onOpen}
      className="flex w-full items-center gap-3 rounded-xl border border-[#2a2a2a] bg-[#121212] px-3 py-2 text-left transition-colors hover:bg-[#1a1a1a]"
    >
      <Avatar className="size-9 border border-[#2a2a2a]">
        <AvatarImage src={profile?.avatar_url ?? undefined} alt={displayName} />
        <AvatarFallback className="bg-[#202020] text-xs text-white">{initials(displayName)}</AvatarFallback>
      </Avatar>
      <div className="min-w-0 flex-1">
        <div className="truncate text-sm font-medium text-white">{isLoading ? 'Loading profile…' : displayName}</div>
        <div className="truncate text-xs text-[#888888]">{displayEmail}</div>
      </div>
    </motion.button>
  )
}

