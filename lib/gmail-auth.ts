import { cookies } from 'next/headers'
import { google } from 'googleapis'

type GmailSession = {
  accessToken: string
  refreshToken?: string
  expiryDate?: number
  email?: string
  name?: string
}

const GMAIL_SESSION_COOKIE = 'gmail_oauth_session'
const GMAIL_STATE_COOKIE = 'gmail_oauth_state'

const GMAIL_SCOPES = [
  'openid',
  'email',
  'profile',
  'https://www.googleapis.com/auth/gmail.readonly',
  'https://www.googleapis.com/auth/gmail.send',
]

function getOAuthConfig(redirectUri: string) {
  const clientId = process.env.GOOGLE_CLIENT_ID
  const clientSecret = process.env.GOOGLE_CLIENT_SECRET

  if (!clientId || !clientSecret) {
    throw new Error('Missing GOOGLE_CLIENT_ID or GOOGLE_CLIENT_SECRET')
  }

  return { clientId, clientSecret, redirectUri }
}

export function createGoogleOAuthClient(redirectUri: string) {
  const { clientId, clientSecret } = getOAuthConfig(redirectUri)
  return new google.auth.OAuth2(clientId, clientSecret, redirectUri)
}

export async function setStateCookie(state: string) {
  const cookieStore = await cookies()
  cookieStore.set(GMAIL_STATE_COOKIE, state, {
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'lax',
    path: '/',
    maxAge: 60 * 10,
  })
}

export async function getStateCookie() {
  const cookieStore = await cookies()
  return cookieStore.get(GMAIL_STATE_COOKIE)?.value
}

export async function clearStateCookie() {
  const cookieStore = await cookies()
  cookieStore.delete(GMAIL_STATE_COOKIE)
}

export async function setSessionCookie(session: GmailSession) {
  const cookieStore = await cookies()
  cookieStore.set(GMAIL_SESSION_COOKIE, JSON.stringify(session), {
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'lax',
    path: '/',
    maxAge: 60 * 60 * 24 * 30,
  })
}

export async function clearSessionCookie() {
  const cookieStore = await cookies()
  cookieStore.delete(GMAIL_SESSION_COOKIE)
}

export async function getSessionCookie(): Promise<GmailSession | null> {
  const cookieStore = await cookies()
  const raw = cookieStore.get(GMAIL_SESSION_COOKIE)?.value
  if (!raw) return null

  try {
    return JSON.parse(raw) as GmailSession
  } catch {
    return null
  }
}

export function buildAuthUrl(redirectUri: string, state: string) {
  const client = createGoogleOAuthClient(redirectUri)

  return client.generateAuthUrl({
    access_type: 'offline',
    scope: GMAIL_SCOPES,
    include_granted_scopes: true,
    prompt: 'consent',
    state,
  })
}

export async function getAuthorizedClient(redirectUri: string) {
  const session = await getSessionCookie()
  if (!session?.accessToken) {
    return null
  }

  const client = createGoogleOAuthClient(redirectUri)
  client.setCredentials({
    access_token: session.accessToken,
    refresh_token: session.refreshToken,
    expiry_date: session.expiryDate,
  })

  // Refresh if needed and persist newer token state.
  if (session.expiryDate && Date.now() >= session.expiryDate - 30_000 && session.refreshToken) {
    const refreshed = await client.refreshAccessToken()
    const credentials = refreshed.credentials
    if (credentials.access_token) {
      await setSessionCookie({
        ...session,
        accessToken: credentials.access_token,
        refreshToken: credentials.refresh_token ?? session.refreshToken,
        expiryDate: credentials.expiry_date ?? session.expiryDate,
      })
      client.setCredentials({
        access_token: credentials.access_token,
        refresh_token: credentials.refresh_token ?? session.refreshToken,
        expiry_date: credentials.expiry_date ?? session.expiryDate,
      })
    }
  }

  return client
}
