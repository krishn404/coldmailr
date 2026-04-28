'use client'

import { useCallback, useEffect, useMemo, useRef, useState } from 'react'
import type { IntentKey, IntentPreferences, SocialLinks } from '@/lib/onboarding/profile'
import { isValidHttpUrl } from '@/lib/onboarding/profile'

export type OnboardingStep = 1 | 2 | 3

type ProfileResponse = {
  id?: string
  email?: string | null
  name: string
  bio: string
  social_links: SocialLinks
  intent_preferences: IntentPreferences
  base_context?: unknown
  onboarding_complete: boolean
  redirectTo?: string
}

type SaveState = { status: 'idle' | 'saving' | 'error' | 'saved' | 'celebrating'; error?: string }

const DEFAULT_SOCIAL: SocialLinks = { linkedin: '', twitter: '', portfolio: '' }
const DEFAULT_INTENTS: IntentPreferences = { selected: [], custom: '' }

function computeStep(name: string, bio: string, intents: IntentPreferences): OnboardingStep {
  const identityOk = name.trim().length >= 2 && bio.trim().length > 0 && bio.trim().length <= 200
  if (!identityOk) return 1
  const intentOk = intents.selected.length >= 1 && (!intents.selected.includes('other') || intents.custom.trim().length > 0)
  if (!intentOk) return 2
  return 3
}

export function useOnboarding() {
  const [loading, setLoading] = useState(true)
  const [finishing, setFinishing] = useState(false)
  const [step, setStep] = useState<OnboardingStep>(1)
  const [saveState, setSaveState] = useState<SaveState>({ status: 'idle' })

  const [name, setName] = useState('')
  const [bio, setBio] = useState('')
  const [intentSelected, setIntentSelected] = useState<IntentKey[]>([])
  const [intentOtherText, setIntentOtherText] = useState('')
  const [social, setSocial] = useState<SocialLinks>(DEFAULT_SOCIAL)

  const debounceRef = useRef<number | null>(null)
  const pendingPatchRef = useRef<Record<string, unknown>>({})

  const identityErrors = useMemo(() => {
    const errs: { name?: string; bio?: string } = {}
    if (name.trim().length < 2) errs.name = 'Name is required (min 2 characters)'
    const b = bio.trim()
    if (!b) errs.bio = 'Bio is required'
    if (b.length > 200) errs.bio = 'Bio must be 200 characters or less'
    return errs
  }, [name, bio])

  const intentErrors = useMemo(() => {
    const errs: { selected?: string; custom?: string } = {}
    if (intentSelected.length < 1) errs.selected = 'Select at least 1 intent'
    if (intentSelected.includes('other') && !intentOtherText.trim()) errs.custom = 'Please specify your intent'
    return errs
  }, [intentSelected, intentOtherText])

  const socialErrors = useMemo(() => {
    const errs: Partial<Record<keyof SocialLinks, string>> = {}
    if (social.linkedin && !isValidHttpUrl(social.linkedin)) errs.linkedin = 'Invalid URL'
    if (social.twitter && !isValidHttpUrl(social.twitter)) errs.twitter = 'Invalid URL'
    if (social.portfolio && !isValidHttpUrl(social.portfolio)) errs.portfolio = 'Invalid URL'
    return errs
  }, [social])

  const isIdentityValid = Object.keys(identityErrors).length === 0
  const isIntentValid = Object.keys(intentErrors).length === 0
  const isSocialValid = Object.keys(socialErrors).length === 0

  const profilePayload = useMemo(
    () => ({
      name: name.trim(),
      bio: bio.trim(),
      social_links: social,
      intent_preferences: { selected: intentSelected, custom: intentOtherText },
    }),
    [name, bio, social, intentSelected, intentOtherText],
  )

  const flushSave = useCallback(async (opts?: { complete?: boolean }) => {
    if (debounceRef.current) {
      window.clearTimeout(debounceRef.current)
      debounceRef.current = null
    }

    const patch = { ...pendingPatchRef.current }
    pendingPatchRef.current = {}

    // If there is nothing to save and we are not completing, no-op.
    if (!Object.keys(patch).length && !opts?.complete) return true

    setSaveState({ status: 'saving' })
    try {
      const res = await fetch('/api/user/profile', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          ...patch,
          ...(opts?.complete ? { ...profilePayload, complete: true } : {}),
        }),
      })
      const data = (await res.json().catch(() => null)) as ProfileResponse | { error?: string } | null
      if (!res.ok) {
        setSaveState({ status: 'error', error: data?.error || 'Save failed' })
        return false
      }
      setSaveState({ status: opts?.complete ? 'celebrating' : 'saved' })
      if (opts?.complete) {
        setFinishing(true)
        window.setTimeout(() => {
          window.location.href = (data as ProfileResponse | null)?.redirectTo || '/app'
        }, 1200)
      }
      return true
    } catch (e: any) {
      setSaveState({ status: 'error', error: e?.message || 'Save failed' })
      return false
    }
  }, [profilePayload])

  const scheduleSave = useCallback(
    (patch: Record<string, unknown>) => {
      pendingPatchRef.current = { ...pendingPatchRef.current, ...patch }
      setSaveState((prev) => (prev.status === 'saving' ? prev : { status: 'idle' }))

      if (debounceRef.current) window.clearTimeout(debounceRef.current)
      debounceRef.current = window.setTimeout(() => {
        void flushSave()
      }, 650)
    },
    [flushSave],
  )

  useEffect(() => {
    let cancelled = false
    const load = async () => {
      setLoading(true)
      try {
        const res = await fetch('/api/user/profile', { cache: 'no-store' })
        if (!res.ok) throw new Error('Failed to load profile')
        const data = (await res.json()) as ProfileResponse
        if (cancelled) return

        setName(data.name ?? '')
        setBio(data.bio ?? '')
        setSocial(data.social_links ?? DEFAULT_SOCIAL)
        setIntentSelected(data.intent_preferences?.selected ?? [])
        setIntentOtherText(data.intent_preferences?.custom ?? '')

        const nextStep = computeStep(data.name ?? '', data.bio ?? '', data.intent_preferences ?? DEFAULT_INTENTS)
        setStep(nextStep)
        setSaveState({ status: 'idle' })
      } catch (e: any) {
        if (!cancelled) setSaveState({ status: 'error', error: e?.message || 'Failed to load profile' })
      } finally {
        if (!cancelled) setLoading(false)
      }
    }
    void load()
    return () => {
      cancelled = true
    }
  }, [])

  const updateName = useCallback(
    (value: string) => {
      setName(value)
      scheduleSave({ name: value })
    },
    [scheduleSave],
  )

  const updateBio = useCallback(
    (value: string) => {
      setBio(value)
      scheduleSave({ bio: value })
    },
    [scheduleSave],
  )

  const toggleIntent = useCallback(
    (key: IntentKey) => {
      setIntentSelected((prev) => {
        const exists = prev.includes(key)
        const next = exists ? prev.filter((x) => x !== key) : [...prev, key]
        scheduleSave({ intent_preferences: { selected: next } })
        return next
      })
    },
    [scheduleSave],
  )

  const updateOtherIntent = useCallback(
    (value: string) => {
      setIntentOtherText(value)
      scheduleSave({ intent_preferences: { custom: value } })
    },
    [scheduleSave],
  )

  const updateSocial = useCallback(
    (key: keyof SocialLinks, value: string) => {
      setSocial((prev) => {
        const next = { ...prev, [key]: value }
        scheduleSave({ social_links: { [key]: value } })
        return next
      })
    },
    [scheduleSave],
  )

  const next = useCallback(async () => {
    if (step === 1) {
      if (!isIdentityValid) return false
      await flushSave()
      setStep(2)
      return true
    }
    if (step === 2) {
      if (!isIntentValid) return false
      await flushSave()
      setStep(3)
      return true
    }
    return false
  }, [step, isIdentityValid, isIntentValid, flushSave])

  const skip = useCallback(async () => {
    if (step === 3) {
      if (!isIdentityValid || !isIntentValid) return false
      const ok = await flushSave({ complete: true })
      return ok
    }
    return false
  }, [step, flushSave, isIdentityValid, isIntentValid])

  const back = useCallback(() => {
    setStep((s) => (s === 3 ? 2 : s === 2 ? 1 : 1))
  }, [])

  const complete = useCallback(async () => {
    if (!isIdentityValid || !isIntentValid || !isSocialValid) return false
    return flushSave({ complete: true })
  }, [isIdentityValid, isIntentValid, isSocialValid, flushSave])

  return {
    loading,
    finishing,
    step,
    saveState,
    values: {
      name,
      bio,
      intentSelected,
      intentOtherText,
      social,
    },
    errors: {
      identity: identityErrors,
      intent: intentErrors,
      social: socialErrors,
    },
    validity: {
      identity: isIdentityValid,
      intent: isIntentValid,
      social: isSocialValid,
    },
    actions: {
      updateName,
      updateBio,
      toggleIntent,
      updateOtherIntent,
      updateSocial,
      next,
      skip,
      back,
      complete,
      flushSave,
    },
  }
}

