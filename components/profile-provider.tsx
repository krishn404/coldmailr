'use client'

import { createContext, useContext, useMemo } from 'react'
import useSWR from 'swr'
import { mutate as globalMutate } from 'swr'
import type { ProfileRecord, ProfileUpsertInput } from '@/lib/profile/schema'

type GmailSession = {
  connected: boolean
  email?: string | null
  name?: string | null
  userId?: string | null
}

type ProfileContextValue = {
  session: GmailSession
  profile: ProfileRecord | null
  isLoading: boolean
  error: string | null
  mutateProfile: (input: ProfileUpsertInput) => Promise<ProfileRecord>
  deleteProfile: () => Promise<void>
}

const ProfileContext = createContext<ProfileContextValue | null>(null)

const fetcher = async (url: string) => {
  const response = await fetch(url, { cache: 'no-store' })
  const data = await response.json().catch(() => null)
  if (!response.ok) {
    throw new Error(data?.error || 'Request failed')
  }
  return data
}

export function ProfileProvider({
  children,
  session,
}: {
  children: React.ReactNode
  session: GmailSession
}) {
  const shouldFetch = session.connected ? '/api/profile' : null
  const { data, error, isLoading, mutate } = useSWR<{ profile: ProfileRecord }>(shouldFetch, fetcher, {
    revalidateOnFocus: false,
  })

  const value = useMemo<ProfileContextValue>(() => {
    return {
      session,
      profile: data?.profile ?? null,
      isLoading,
      error: error instanceof Error ? error.message : null,
      mutateProfile: async (input) => {
        const optimistic = data?.profile
          ? {
              ...data.profile,
              full_name: input.full_name,
              avatar_url: null,
              role: input.role?.trim() || null,
              company: input.company?.trim() || null,
              intents: input.intents,
              custom_intent: input.custom_intent?.trim() || null,
              onboarding_complete:
                input.full_name.trim().length > 0 &&
                input.intents.length > 0 &&
                (!input.intents.includes('other') || Boolean(input.custom_intent?.trim())),
            }
          : undefined

        const result = await mutate(
          async (current) => {
            const response = await fetch('/api/profile', {
              method: 'POST',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify(input),
            })
            const payload = await response.json()
            if (!response.ok) {
              throw new Error(payload?.error || 'Failed to save profile')
            }
            return payload
          },
          {
            optimisticData: optimistic ? { profile: optimistic } : undefined,
            rollbackOnError: true,
            revalidate: false,
          },
        )
        return result!.profile
      },
      deleteProfile: async () => {
        await fetch('/api/profile', { method: 'DELETE' }).then(async (response) => {
          const payload = await response.json().catch(() => null)
          if (!response.ok) throw new Error(payload?.error || 'Failed to delete profile')
        })
        await mutate({ profile: null as unknown as ProfileRecord }, { revalidate: false })
      },
    }
  }, [session, data, error, isLoading, mutate])

  return <ProfileContext.Provider value={value}>{children}</ProfileContext.Provider>
}

export function useProfile() {
  const context = useContext(ProfileContext)
  if (!context) {
    throw new Error('useProfile must be used within ProfileProvider')
  }
  return context
}

export function mutateProfileCache() {
  return globalMutate('/api/profile')
}

