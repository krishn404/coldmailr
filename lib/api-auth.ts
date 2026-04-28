import { NextResponse } from 'next/server'
import { getSessionCookie } from '@/lib/gmail-auth'
import { deriveUserIdFromGoogleSub } from '@/lib/gmail-auth'

export type ApiAuthContext = {
  userId: string
  email: string | null
}

export async function requireApiAuth(): Promise<
  { ok: true; auth: ApiAuthContext } | { ok: false; response: NextResponse }
> {
  const session = await getSessionCookie()
  const derivedUserId = session?.googleSub ? deriveUserIdFromGoogleSub(session.googleSub) : session?.userId
  if (!session?.accessToken || !derivedUserId) {
    return { ok: false, response: NextResponse.json({ error: 'Unauthorized' }, { status: 401 }) }
  }

  return {
    ok: true,
    auth: {
      userId: derivedUserId,
      email: session.email ?? null,
    },
  }
}
