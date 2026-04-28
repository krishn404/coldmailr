import { supabaseAdmin } from '@/lib/supabase-admin'
import { getUserProfile, type UserProfileRow } from '@/lib/onboarding/user-repo'
import { ProfileUpsertSchema, sanitizeIntents, type ProfileRecord, type ProfileUpsertInput } from '@/lib/profile/schema'

type SessionSeed = {
  userId: string
  email: string | null
  name?: string | null
}

function logProfileError(operation: string, error: any, context: Record<string, unknown>) {
  console.error(`[profile-repo] ${operation}`, {
    ...context,
    message: error?.message,
    code: error?.code,
    details: error?.details,
  })
}

function onboardingIntents(user: UserProfileRow): { intents: string[]; custom_intent: string } {
  return {
    intents: sanitizeIntents(user.intent_preferences?.selected ?? []),
    custom_intent: user.intent_preferences?.custom?.trim() ?? '',
  }
}

function normalizeProfile(row: any, onboardingComplete: boolean): ProfileRecord {
  return {
    id: String(row.id),
    email: String(row.email ?? ''),
    full_name: typeof row.full_name === 'string' ? row.full_name : '',
    avatar_url: typeof row.avatar_url === 'string' && row.avatar_url.trim() ? row.avatar_url : null,
    role: typeof row.role === 'string' && row.role.trim() ? row.role : null,
    company: typeof row.company === 'string' && row.company.trim() ? row.company : null,
    intents: sanitizeIntents(row.intents),
    custom_intent: typeof row.custom_intent === 'string' && row.custom_intent.trim() ? row.custom_intent : null,
    auth_provider: 'google',
    onboarding_complete: onboardingComplete,
    created_at: row.created_at,
    updated_at: row.updated_at,
  }
}

async function seedProfileFromOnboarding(params: SessionSeed) {
  const user = await getUserProfile({ userId: params.userId, email: params.email })
  const intents = onboardingIntents(user)

  const upsert = await supabaseAdmin
    .from('profiles')
    .upsert(
      {
        id: params.userId,
        email: params.email ?? user.email ?? '',
        full_name: user.name?.trim() || params.name?.trim() || '',
        avatar_url: null,
        role: null,
        company: null,
        intents: intents.intents,
        custom_intent: intents.custom_intent || null,
      },
      { onConflict: 'id' },
    )
    .select('*')
    .single()

  if (upsert.error || !upsert.data) {
    logProfileError('seedProfileFromOnboarding:upsert', upsert.error, params)
    throw new Error('Failed to initialize profile')
  }

  return normalizeProfile(upsert.data, user.onboarding_complete)
}

export async function getOrCreateProfile(params: SessionSeed): Promise<ProfileRecord> {
  if (!params.email) {
    throw new Error('Authenticated email is required')
  }

  const existing = await supabaseAdmin.from('profiles').select('*').eq('id', params.userId).maybeSingle()
  if (existing.error) {
    logProfileError('getOrCreateProfile:select', existing.error, params)
    throw new Error('Failed to load profile')
  }

  const onboarding = await getUserProfile({ userId: params.userId, email: params.email })

  if (!existing.data) {
    return seedProfileFromOnboarding(params)
  }

  const patch: Record<string, unknown> = {}
  if (!existing.data.email && params.email) patch.email = params.email
  if ((!existing.data.full_name || !String(existing.data.full_name).trim()) && (onboarding.name || params.name)) {
    patch.full_name = onboarding.name?.trim() || params.name?.trim() || ''
  }
  if ((!existing.data.intents || existing.data.intents.length === 0) && onboarding.intent_preferences?.selected?.length) {
    patch.intents = sanitizeIntents(onboarding.intent_preferences.selected)
    patch.custom_intent = onboarding.intent_preferences.custom?.trim() || null
  }

  if (Object.keys(patch).length > 0) {
    const refreshed = await supabaseAdmin
      .from('profiles')
      .update(patch)
      .eq('id', params.userId)
      .select('*')
      .single()
    if (refreshed.error || !refreshed.data) {
      logProfileError('getOrCreateProfile:refresh', refreshed.error, params)
      throw new Error('Failed to refresh profile')
    }
    return normalizeProfile(refreshed.data, onboarding.onboarding_complete)
  }

  return normalizeProfile(existing.data, onboarding.onboarding_complete)
}

export async function upsertProfile(params: SessionSeed & { input: ProfileUpsertInput }): Promise<ProfileRecord> {
  const parsed = ProfileUpsertSchema.parse(params.input)
  const onboarding = await getUserProfile({ userId: params.userId, email: params.email })

  const upsert = await supabaseAdmin
    .from('profiles')
    .upsert(
      {
        id: params.userId,
        email: params.email ?? onboarding.email ?? '',
        full_name: parsed.full_name,
        avatar_url: parsed.avatar_url?.trim() || null,
        role: parsed.role?.trim() || null,
        company: parsed.company?.trim() || null,
        intents: parsed.intents,
        custom_intent: parsed.custom_intent?.trim() || null,
      },
      { onConflict: 'id' },
    )
    .select('*')
    .single()

  if (upsert.error || !upsert.data) {
    logProfileError('upsertProfile:profiles', upsert.error, { userId: params.userId, email: params.email })
    throw new Error('Failed to save profile')
  }

  const shouldCompleteOnboarding = Boolean(parsed.full_name.trim()) && parsed.intents.length > 0 && (!parsed.intents.includes('other') || parsed.custom_intent.trim())

  const userUpdate = await supabaseAdmin
    .from('users')
    .update({
      email: params.email ?? onboarding.email ?? '',
      name: parsed.full_name,
      intent_preferences: {
        selected: parsed.intents,
        custom: parsed.custom_intent,
      },
      onboarding_complete: shouldCompleteOnboarding ? true : onboarding.onboarding_complete,
      updated_at: new Date().toISOString(),
    })
    .eq('id', params.userId)
    .select('onboarding_complete')
    .single()

  if (userUpdate.error) {
    logProfileError('upsertProfile:users', userUpdate.error, { userId: params.userId })
    throw new Error('Failed to sync onboarding profile')
  }

  return normalizeProfile(upsert.data, Boolean(userUpdate.data?.onboarding_complete))
}

export async function deleteProfile(params: SessionSeed): Promise<void> {
  const deleted = await supabaseAdmin.from('profiles').delete().eq('id', params.userId)
  if (deleted.error) {
    logProfileError('deleteProfile', deleted.error, params)
    throw new Error('Failed to delete profile')
  }
}

export async function persistAvatarUrl(params: SessionSeed & { avatarUrl: string }): Promise<ProfileRecord> {
  const current = await getOrCreateProfile(params)
  return upsertProfile({
    ...params,
    input: {
      full_name: current.full_name || params.name || '',
      avatar_url: params.avatarUrl,
      role: current.role ?? '',
      company: current.company ?? '',
      intents: current.intents,
      custom_intent: current.custom_intent ?? '',
    },
  })
}

