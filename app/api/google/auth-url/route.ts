import { randomUUID } from 'crypto'
import { NextResponse } from 'next/server'
import { buildAuthUrl, setStateCookie } from '@/lib/gmail-auth'

export async function GET(request: Request) {
  const url = new URL(request.url)
  const redirectUri = process.env.GOOGLE_REDIRECT_URI ?? `${url.origin}/api/google/callback`
  const state = randomUUID()

  await setStateCookie(state)

  return NextResponse.json({
    authUrl: buildAuthUrl(redirectUri, state),
  })
}
