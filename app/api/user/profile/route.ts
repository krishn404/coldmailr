import { NextResponse } from 'next/server'
import { z } from 'zod'
import { requireApiAuth } from '@/lib/api-auth'
import { ProfileCompleteSchema, ProfilePatchSchema } from '@/lib/onboarding/profile'
import { completeOnboarding, getUserProfile, updateUserProfilePartial, type UserProfileRow } from '@/lib/onboarding/user-repo'

function profileJson(profile: UserProfileRow, extra: Record<string, unknown> = {}) {
  return {
    id: profile.id,
    email: profile.email,
    name: profile.name ?? '',
    bio: profile.bio ?? '',
    social_links: profile.social_links,
    intent_preferences: profile.intent_preferences,
    base_context: profile.base_context,
    onboarding_complete: profile.onboarding_complete,
    ...extra,
  }
}

async function readJson(request: Request): Promise<unknown> {
  try {
    return await request.json()
  } catch (error) {
    console.error('[profile POST] Failed to parse request JSON', error)
    throw new Error('Invalid JSON body')
  }
}

export async function GET() {
  const authResult = await requireApiAuth()
  if (!authResult.ok) return authResult.response

  const { userId, email } = authResult.auth
  const profile = await getUserProfile({ userId, email })

  return NextResponse.json(profileJson(profile))
}

export async function POST(request: Request) {
  const authResult = await requireApiAuth()
  if (!authResult.ok) return authResult.response

  const { userId, email } = authResult.auth

  try {
    const raw = await readJson(request)
    const parsed = ProfilePatchSchema.safeParse(raw)

    if (!parsed.success) {
      console.error('[profile POST] Invalid profile patch payload', parsed.error.flatten())
      return NextResponse.json({ error: 'Invalid payload', issues: parsed.error.issues }, { status: 400 })
    }

    const { complete, ...patch } = parsed.data

    if (complete) {
      const fullParsed = ProfileCompleteSchema.safeParse({
        name: patch.name,
        bio: patch.bio,
        social_links: patch.social_links,
        intent_preferences: patch.intent_preferences,
      })

      if (!fullParsed.success) {
        console.error('[profile POST] Invalid complete onboarding payload', fullParsed.error.flatten())
        return NextResponse.json({ error: 'Invalid payload', issues: fullParsed.error.issues }, { status: 400 })
      }

      const updated = await completeOnboarding({ userId, email, profile: fullParsed.data })

      if (!updated.onboarding_complete) {
        console.error('[profile POST] Onboarding completion was not persisted', { userId, profileId: updated.id })
        return NextResponse.json(
          { error: 'Unable to save onboarding profile', profile: profileJson(updated) },
          { status: 503 },
        )
      }

      return NextResponse.json(profileJson(updated, { redirectTo: '/app' }))
    }

    const updated = await updateUserProfilePartial({
      userId,
      email,
      patch: {
        ...(patch.name !== undefined ? { name: patch.name } : {}),
        ...(patch.bio !== undefined ? { bio: patch.bio } : {}),
        ...(patch.social_links !== undefined ? { social_links: patch.social_links } : {}),
        ...(patch.intent_preferences !== undefined ? { intent_preferences: patch.intent_preferences } : {}),
      },
    })

    return NextResponse.json(profileJson(updated))
  } catch (error) {
    console.error('[profile POST]', error)

    if (error instanceof z.ZodError) {
      return NextResponse.json({ error: 'Invalid payload', issues: error.issues }, { status: 400 })
    }

    const message = error instanceof Error ? error.message : 'Failed to update profile'
    const status = message === 'Invalid JSON body' || message.startsWith('Invalid URL') ? 400 : 500
    return NextResponse.json({ error: message }, { status })
  }
}
