import { NextResponse } from 'next/server'
import { z } from 'zod'
import { requireApiAuth } from '@/lib/api-auth'
import { getSessionCookie } from '@/lib/gmail-auth'
import { deleteProfile, getOrCreateProfile, upsertProfile } from '@/lib/profile/repo'
import { ProfileUpsertSchema } from '@/lib/profile/schema'

export const dynamic = 'force-dynamic'

function unauthorized(message = 'Unauthorized') {
  return NextResponse.json({ error: message }, { status: 401, headers: { 'Cache-Control': 'no-store' } })
}

export async function GET() {
  const authResult = await requireApiAuth()
  if (!authResult.ok) return authResult.response

  const session = await getSessionCookie()
  if (!session?.accessToken) return unauthorized()

  try {
    const profile = await getOrCreateProfile({
      userId: authResult.auth.userId,
      email: authResult.auth.email,
      name: session.name ?? null,
    })
    return NextResponse.json({ profile }, { headers: { 'Cache-Control': 'no-store' } })
  } catch (error) {
    console.error('[api/profile GET]', error)
    return NextResponse.json({ error: 'Failed to load profile' }, { status: 500, headers: { 'Cache-Control': 'no-store' } })
  }
}

export async function POST(request: Request) {
  const authResult = await requireApiAuth()
  if (!authResult.ok) return authResult.response

  const session = await getSessionCookie()
  if (!session?.accessToken) return unauthorized()

  try {
    const raw = await request.json()
    const input = ProfileUpsertSchema.parse(raw)
    const profile = await upsertProfile({
      userId: authResult.auth.userId,
      email: authResult.auth.email,
      name: session.name ?? null,
      input,
    })
    return NextResponse.json({ profile }, { headers: { 'Cache-Control': 'no-store' } })
  } catch (error) {
    console.error('[api/profile POST]', error)
    if (error instanceof z.ZodError) {
      return NextResponse.json({ error: 'Invalid payload', issues: error.issues }, { status: 400, headers: { 'Cache-Control': 'no-store' } })
    }
    return NextResponse.json({ error: 'Failed to save profile' }, { status: 500, headers: { 'Cache-Control': 'no-store' } })
  }
}

export async function DELETE() {
  const authResult = await requireApiAuth()
  if (!authResult.ok) return authResult.response

  const session = await getSessionCookie()
  if (!session?.accessToken) return unauthorized()

  try {
    await deleteProfile({
      userId: authResult.auth.userId,
      email: authResult.auth.email,
      name: session.name ?? null,
    })
    return NextResponse.json({ success: true }, { headers: { 'Cache-Control': 'no-store' } })
  } catch (error) {
    console.error('[api/profile DELETE]', error)
    return NextResponse.json({ error: 'Failed to delete profile' }, { status: 500, headers: { 'Cache-Control': 'no-store' } })
  }
}

