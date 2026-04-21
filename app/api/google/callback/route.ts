import { NextResponse } from 'next/server'
import { google } from 'googleapis'
import {
  clearStateCookie,
  createGoogleOAuthClient,
  getStateCookie,
  setSessionCookie,
} from '@/lib/gmail-auth'

export async function GET(request: Request) {
  const url = new URL(request.url)
  const code = url.searchParams.get('code')
  const state = url.searchParams.get('state')
  const expectedState = await getStateCookie()
  const redirectUri = process.env.GOOGLE_REDIRECT_URI ?? `${url.origin}/api/google/callback`

  if (!code || !state || state !== expectedState) {
    return NextResponse.redirect(new URL('/?gmail=error', url.origin))
  }

  try {
    const client = createGoogleOAuthClient(redirectUri)
    const { tokens } = await client.getToken(code)
    client.setCredentials(tokens)

    const oauth2 = google.oauth2({ version: 'v2', auth: client })
    const profile = await oauth2.userinfo.get()

    await setSessionCookie({
      accessToken: tokens.access_token ?? '',
      refreshToken: tokens.refresh_token ?? undefined,
      expiryDate: tokens.expiry_date ?? undefined,
      email: profile.data.email ?? undefined,
      name: profile.data.name ?? undefined,
    })
    await clearStateCookie()

    return NextResponse.redirect(new URL('/?gmail=connected', url.origin))
  } catch {
    return NextResponse.redirect(new URL('/?gmail=error', url.origin))
  }
}
