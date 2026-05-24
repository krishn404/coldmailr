import { type NextRequest } from 'next/server'
import { createClient } from '@/utils/supabase/middleware'

export async function proxy(request: NextRequest) {
  return createClient(request)
}

export const config = {
  matcher: [
    // Do not run proxy on API routes — Next 16 dev can 404 route handlers when proxy matches /api.
    '/((?!api|_next/static|_next/image|favicon.ico|.*\\..*).*)',
  ],
}
