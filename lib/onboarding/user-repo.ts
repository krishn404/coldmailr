import { supabaseAdmin } from '@/lib/supabase-admin'
import {
  buildBaseContext,
  IntentPreferencesSchema,
  SocialLinksSchema,
  validateSocialLinksOrThrow,
  type BaseContext,
  type IntentPreferences,
  type ProfileComplete,
  type SocialLinks,
} from '@/lib/onboarding/profile'

export type UserProfileRow = {
  id: string
  email: string | null
  name: string | null
  bio: string | null
  social_links: SocialLinks
  intent_preferences: IntentPreferences
  base_context: BaseContext
  onboarding_complete: boolean
  created_at?: string
  updated_at?: string
}

const DEFAULT_SOCIAL: SocialLinks = { linkedin: '', twitter: '', portfolio: '' }
const DEFAULT_INTENTS: IntentPreferences = { selected: [], custom: '' }

function normalizeRow(row: any): UserProfileRow {
  const social_links = SocialLinksSchema.parse(row.social_links ?? DEFAULT_SOCIAL)
  const intent_preferences = IntentPreferencesSchema.parse(row.intent_preferences ?? DEFAULT_INTENTS)
  const base_context = buildBaseContext({
    name: typeof row.name === 'string' ? row.name : '',
    bio: typeof row.bio === 'string' ? row.bio : '',
    social_links,
    intent_preferences,
  })
  return {
    id: String(row.id),
    email: row.email ?? null,
    name: row.name ?? null,
    bio: row.bio ?? null,
    social_links,
    intent_preferences,
    base_context,
    onboarding_complete: Boolean(row.onboarding_complete),
    created_at: row.created_at ?? undefined,
    updated_at: row.updated_at ?? undefined,
  }
}

function logSupabaseError(operation: string, error: any, context: any = {}) {
  console.error(`[user-repo] ${operation} Supabase error`, {
    ...context,
    message: error?.message,
    code: error?.code,
    details: error?.details,
  })
}

// Ensures the user row exists, creates it if missing, with safe defaults
export async function ensureUserRow(params: { userId: string; email: string | null }) {
  try {
    const { userId, email } = params
    const nowIso = new Date().toISOString()

    // Try to select existing row safely
    const byId = await supabaseAdmin
      .from('users')
      .select('*')
      .eq('id', userId)
      .maybeSingle()

    if (byId.error) {
      logSupabaseError('ensureUserRow:select', byId.error, { userId, email })
      throw new Error('Failed to ensure user row')
    }

    if (byId.data) {
      return byId.data.id as string
    }

    // Insert new row with default JSON fields
    const insert = await supabaseAdmin
      .from('users')
      .insert({
        id: userId,
        email: email ?? null,
        name: null,
        bio: null,
        social_links: {},
        intent_preferences: {},
        base_context: {},
        onboarding_complete: false,
        updated_at: nowIso,
      })
      .select('id')
      .single()

    if (insert.error || !insert.data) {
      logSupabaseError('ensureUserRow:insert', insert.error, { userId, email })
      throw new Error('Failed to ensure user row')
    }

    return insert.data.id as string
  } catch (error) {
    logSupabaseError('ensureUserRow:catch', error, params)
    throw new Error('Failed to ensure user row')
  }
}

// Fetches user profile safely
export async function getUserProfile(params: { userId: string; email: string | null }): Promise<UserProfileRow> {
  await ensureUserRow(params)

  const result = await supabaseAdmin
    .from('users')
    .select('*')
    .eq('id', params.userId)
    .maybeSingle()

  if (result.error) {
    logSupabaseError('getUserProfile:select', result.error, params)
    throw new Error('Failed to load profile')
  }

  const row = result.data ?? {
    id: params.userId,
    email: params.email,
    name: null,
    bio: null,
    social_links: {},
    intent_preferences: {},
    base_context: {},
    onboarding_complete: false,
  }

  return normalizeRow(row)
}

// Update partial profile safely
export async function updateUserProfilePartial(params: {
  userId: string
  email: string | null
  patch: {
    name?: string
    bio?: string
    social_links?: Partial<SocialLinks>
    intent_preferences?: Partial<IntentPreferences>
  }
}): Promise<UserProfileRow> {
  const current = await getUserProfile({ userId: params.userId, email: params.email })

  const mergedSocial = SocialLinksSchema.parse({ ...current.social_links, ...(params.patch.social_links ?? {}) })
  validateSocialLinksOrThrow(mergedSocial)

  const mergedIntent = IntentPreferencesSchema.parse({ ...current.intent_preferences, ...(params.patch.intent_preferences ?? {}) })

  const mergedName = params.patch.name ?? current.name ?? ''
  const mergedBio = params.patch.bio ?? current.bio ?? ''

  const base_context = buildBaseContext({
    name: mergedName,
    bio: mergedBio,
    social_links: mergedSocial,
    intent_preferences: mergedIntent,
  })

  const nowIso = new Date().toISOString()
  const update = await supabaseAdmin
    .from('users')
    .update({
      email: params.email ?? current.email ?? null,
      ...(params.patch.name !== undefined ? { name: params.patch.name } : {}),
      ...(params.patch.bio !== undefined ? { bio: params.patch.bio } : {}),
      ...(params.patch.social_links !== undefined ? { social_links: mergedSocial } : {}),
      ...(params.patch.intent_preferences !== undefined ? { intent_preferences: mergedIntent } : {}),
      base_context,
      updated_at: nowIso,
    })
    .eq('id', params.userId)
    .select('*')
    .maybeSingle()

  if (update.error || !update.data) {
    logSupabaseError('updateUserProfilePartial:update', update.error, params)
    throw new Error('Failed to update profile')
  }

  return normalizeRow(update.data)
}

// Complete onboarding and mark as complete
export async function completeOnboarding(params: {
  userId: string
  email: string | null
  profile: ProfileComplete
}): Promise<UserProfileRow> {
  await ensureUserRow({ userId: params.userId, email: params.email })

  const social_links = validateSocialLinksOrThrow(params.profile.social_links)
  const base_context = buildBaseContext({
    name: params.profile.name,
    bio: params.profile.bio,
    social_links,
    intent_preferences: params.profile.intent_preferences,
  })

  const nowIso = new Date().toISOString()
  const update = await supabaseAdmin
    .from('users')
    .update({
      email: params.email ?? null,
      name: params.profile.name,
      bio: params.profile.bio,
      social_links,
      intent_preferences: params.profile.intent_preferences,
      base_context,
      onboarding_complete: true,
      updated_at: nowIso,
    })
    .eq('id', params.userId)
    .select('*')
    .maybeSingle()

  if (update.error || !update.data) {
    logSupabaseError('completeOnboarding:update', update.error, params)
    throw new Error('Failed to complete onboarding')
  }

  return normalizeRow(update.data)
}

// Check if onboarding is complete
export async function getOnboardingCompleteFlag(params: { userId: string; email: string | null }): Promise<boolean> {
  await ensureUserRow(params)
  const result = await supabaseAdmin
    .from('users')
    .select('onboarding_complete')
    .eq('id', params.userId)
    .maybeSingle()

  if (result.error) {
    logSupabaseError('getOnboardingCompleteFlag:select', result.error, params)
    throw new Error('Failed to check onboarding status')
  }

  return Boolean(result.data?.onboarding_complete ?? false)
}