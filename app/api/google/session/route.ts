import { NextResponse } from 'next/server'
import { getSessionCookie } from '@/lib/gmail-auth'

export async function GET() {
  const session = await getSessionCookie()
  if (!session?.accessToken) {
    return NextResponse.json({ connected: false })
  }

  return NextResponse.json({
    connected: true,
    email: session.email ?? null,
    name: session.name ?? null,
    userId: session.userId ?? null,
  })
}
