import { cookies } from 'next/headers'
import { google } from 'googleapis'

export type GmailSession = {
  accessToken: string
  refreshToken?: string
  expiryDate?: number
  email?: string
  name?: string
  googleSub?: string
  userId?: string
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

export function deriveUserIdFromGoogleSub(googleSub: string): string {
  // Deterministic UUID so Supabase "users" table can use UUID PK while keeping Google OAuth as identity provider.
  // Must match DB function: public.google_sub_to_uuid(sub TEXT) (uuid v5, namespace URL, name "google:<sub>").
  // We implement v5 here to avoid extra roundtrips in middleware/API.
  const namespaceUrl = '6ba7b811-9dad-11d1-80b4-00c04fd430c8' // uuid_ns_url()
  return uuidv5(`google:${googleSub}`, namespaceUrl)
}

function uuidv5(name: string, namespace: string): string {
  const crypto = require('crypto') as typeof import('crypto')
  const nsBytes = parseUuid(namespace)
  const nameBytes = Buffer.from(name, 'utf8')
  const hash = crypto.createHash('sha1').update(Buffer.concat([nsBytes, nameBytes])).digest()
  hash[6] = (hash[6] & 0x0f) | 0x50 // version 5
  hash[8] = (hash[8] & 0x3f) | 0x80 // variant RFC 4122
  const b = hash.subarray(0, 16)
  return formatUuid(b)
}

function parseUuid(uuid: string): Buffer {
  const hex = uuid.replace(/-/g, '').toLowerCase()
  if (!/^[0-9a-f]{32}$/.test(hex)) {
    throw new Error('Invalid UUID namespace')
  }
  return Buffer.from(hex, 'hex')
}

function formatUuid(bytes: Buffer): string {
  const hex = bytes.toString('hex')
  return `${hex.slice(0, 8)}-${hex.slice(8, 12)}-${hex.slice(12, 16)}-${hex.slice(16, 20)}-${hex.slice(20, 32)}`
}

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
    const parsed = JSON.parse(raw) as GmailSession
    if (parsed.googleSub && !parsed.userId) {
      parsed.userId = deriveUserIdFromGoogleSub(parsed.googleSub)
    }
    return parsed
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
