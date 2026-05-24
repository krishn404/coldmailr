import { createClient } from '@supabase/supabase-js'

function getSupabaseUrl() {
  return process.env.SUPABASE_URL || process.env.NEXT_PUBLIC_SUPABASE_URL || null
}

function getSupabaseAnonKey() {
  return process.env.SUPABASE_ANON_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || null
}

function getSupabaseServiceRoleKey() {
  return process.env.SUPABASE_SERVICE_ROLE_KEY || null
}

export function getSupabaseServerClient() {
  const url = getSupabaseUrl()
  const key = getSupabaseAnonKey()

  if (!url || !key) return null
  return createClient(url, key)
}

export function getSupabaseServiceClient() {
  const url = getSupabaseUrl()
  const key = getSupabaseServiceRoleKey()

  if (!url || !key) return null
  return createClient(url, key)
}
