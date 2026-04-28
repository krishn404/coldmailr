import { createClient } from '@supabase/supabase-js'

// Lazy-initialize supabaseAdmin to allow builds to succeed with missing env vars
let supabaseAdminClient: ReturnType<typeof createClient> | null = null

export function getSupabaseAdmin() {
  if (!supabaseAdminClient) {
    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
    const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY

    if (!supabaseUrl || !serviceRoleKey) {
      throw new Error('Missing NEXT_PUBLIC_SUPABASE_URL or SUPABASE_SERVICE_ROLE_KEY')
    }

    supabaseAdminClient = createClient(supabaseUrl, serviceRoleKey, {
      auth: {
        autoRefreshToken: false,
        persistSession: false,
      },
    })
  }

  return supabaseAdminClient
}

// Re-export for backward compatibility
export const supabaseAdmin = new Proxy({} as ReturnType<typeof createClient>, {
  get: (target, prop) => {
    return Reflect.get(getSupabaseAdmin(), prop)
  },
}) as ReturnType<typeof createClient>
