import { NextResponse } from 'next/server'
import { google } from 'googleapis'
import { getAuthorizedClient } from '@/lib/gmail-auth'

export async function GET(request: Request) {
  const url = new URL(request.url)
  const redirectUri = process.env.GOOGLE_REDIRECT_URI ?? `${url.origin}/api/google/callback`

  try {
    const auth = await getAuthorizedClient(redirectUri)
    if (!auth) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const gmail = google.gmail({ version: 'v1', auth })
    const list = await gmail.users.messages.list({
      userId: 'me',
      maxResults: 20,
      q: 'in:inbox',
    })

    const ids = list.data.messages?.map((m) => m.id).filter(Boolean) ?? []
    const messages = await Promise.all(
      ids.map(async (id) => {
        const result = await gmail.users.messages.get({
          userId: 'me',
          id: id!,
          format: 'metadata',
          metadataHeaders: ['From', 'Subject', 'Date'],
        })

        const headers = result.data.payload?.headers ?? []
        const getHeader = (name: string) =>
          headers.find((h) => h.name?.toLowerCase() === name.toLowerCase())?.value ?? ''

        return {
          id,
          from: getHeader('From'),
          subject: getHeader('Subject') || '(No subject)',
          date: getHeader('Date'),
          snippet: result.data.snippet ?? '',
        }
      }),
    )

    return NextResponse.json({ messages })
  } catch {
    return NextResponse.json({ error: 'Failed to fetch Gmail messages' }, { status: 500 })
  }
}
