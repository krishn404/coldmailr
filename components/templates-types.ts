export type TemplateRecord = {
  id: string
  name: string
  subject: string
  context: string
  body: string
  tags: string[]
  use_case?: string | null
  industry?: string | null
  tone?: string | null
  length_hint?: string | null
  is_pinned: boolean
  last_used_at?: string | null
  created_at: string
  updated_at: string
}

export type TemplateVersionRecord = {
  id: string
  template_id: string
  subject: string
  context: string
  body: string
  note?: string | null
  created_at: string
}
