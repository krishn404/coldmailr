import { NextResponse } from 'next/server'
import { getSessionCookie } from '@/lib/gmail-auth'

export type ApiAuthContext = {
  userId: string
  email: string | null
}

export async function requireApiAuth(): Promise<
  { ok: true; auth: ApiAuthContext } | { ok: false; response: NextResponse }
> {
  const session = await getSessionCookie()
  if (!session?.accessToken || !session?.userId) {
    return { ok: false, response: NextResponse.json({ error: 'Unauthorized' }, { status: 401 }) }
  }

  return {
    ok: true,
    auth: {
      userId: session.userId,
      email: session.email ?? null,
    },
  }
}
