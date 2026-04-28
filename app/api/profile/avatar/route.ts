import { NextResponse } from 'next/server'
import { requireApiAuth } from '@/lib/api-auth'
import { getSessionCookie } from '@/lib/gmail-auth'
import { persistAvatarUrl } from '@/lib/profile/repo'
import { supabaseAdmin } from '@/lib/supabase-admin'

export const dynamic = 'force-dynamic'
export const runtime = 'nodejs'

const MAX_FILE_SIZE = 2 * 1024 * 1024
const ALLOWED_TYPES = new Set(['image/jpeg', 'image/png', 'image/webp', 'image/gif'])

export async function POST(request: Request) {
  const authResult = await requireApiAuth()
  if (!authResult.ok) return authResult.response

  const session = await getSessionCookie()
  if (!session?.accessToken) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  try {
    const formData = await request.formData()
    const file = formData.get('file')

    if (!(file instanceof File)) {
      return NextResponse.json({ error: 'File is required' }, { status: 400 })
    }
    if (!ALLOWED_TYPES.has(file.type)) {
      return NextResponse.json({ error: 'Unsupported file type' }, { status: 400 })
    }
    if (file.size > MAX_FILE_SIZE) {
      return NextResponse.json({ error: 'File exceeds 2MB limit' }, { status: 400 })
    }

    const extension = file.name.split('.').pop()?.toLowerCase() || 'png'
    const objectPath = `${authResult.auth.userId}/${Date.now()}.${extension}`
    const buffer = Buffer.from(await file.arrayBuffer())

    const upload = await supabaseAdmin.storage
      .from('avatars')
      .upload(objectPath, buffer, {
        contentType: file.type,
        upsert: true,
      })

    if (upload.error) {
      console.error('[api/profile/avatar upload]', upload.error)
      return NextResponse.json({ error: 'Failed to upload avatar' }, { status: 500 })
    }

    const { data: publicData } = supabaseAdmin.storage.from('avatars').getPublicUrl(objectPath)
    const profile = await persistAvatarUrl({
      userId: authResult.auth.userId,
      email: authResult.auth.email,
      name: session.name ?? null,
      avatarUrl: publicData.publicUrl,
    })

    return NextResponse.json({ profile })
  } catch (error) {
    console.error('[api/profile/avatar POST]', error)
    return NextResponse.json({ error: 'Failed to upload avatar' }, { status: 500 })
  }
}

