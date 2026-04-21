import { createClient } from '@supabase/supabase-js'

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY

if (!supabaseUrl || !supabaseKey) {
  throw new Error('Missing Supabase environment variables')
}

export const supabase = createClient(supabaseUrl, supabaseKey)

// Type definitions for our tables
export type Tenant = {
  id: string
  name: string
  slug: string
  logo_url: string | null
  accent_color: string
  custom_domain: string | null
  owner_id: string | null
  created_at: string
  updated_at: string
}

export type User = {
  id: string
  email: string
  tenant_id: string | null
  created_at: string
  updated_at: string
}

export type Draft = {
  id: string
  tenant_id: string
  user_id: string
  from_email: string
  to_email: string
  cc: string[] | null
  bcc: string[] | null
  subject: string | null
  body: string
  context: string | null
  status: 'draft' | 'sent' | 'archived'
  created_at: string
  updated_at: string
}

export type DraftVersion = {
  id: string
  draft_id: string
  version_number: number
  body: string
  subject: string | null
  context: string | null
  generated_at: boolean
  generation_prompt: string | null
  created_at: string
}

export type Template = {
  id: string
  tenant_id: string
  user_id: string
  name: string
  body_template: string
  subject_template: string | null
  context_template: string | null
  tone: string | null
  personalization_depth: 'low' | 'medium' | 'high'
  created_at: string
  updated_at: string
}

export type GenerationHistory = {
  id: string
  draft_id: string
  user_id: string
  action: 'generate' | 'regenerate' | 'shorten' | 'formalize' | 'add_cta'
  input_context: string | null
  output_body: string | null
  tokens_used: number | null
  duration_ms: number | null
  created_at: string
}

export type TeamMember = {
  id: string
  tenant_id: string
  user_id: string | null
  email: string
  role: 'admin' | 'member'
  invited_at: string
  accepted_at: string | null
}
