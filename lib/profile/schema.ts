import { z } from 'zod'

export const PROFILE_INTENT_OPTIONS = ['freelance', 'internship', 'investor', 'networking', 'other'] as const

export const ProfileIntentsSchema = z
  .array(z.string().trim().min(1).max(50))
  .transform((values) => Array.from(new Set(values.map((value) => value.trim()).filter(Boolean))))

export const ProfileUpsertSchema = z
  .object({
    full_name: z.string().trim().min(1, 'Name is required').max(80),
    avatar_url: z.string().trim().url('Avatar URL must be valid').max(500).or(z.literal('')).optional(),
    role: z.string().trim().max(80).optional().default(''),
    company: z.string().trim().max(120).optional().default(''),
    intents: ProfileIntentsSchema.default([]),
    custom_intent: z.string().trim().max(160).optional().default(''),
  })
  .superRefine((value, ctx) => {
    if (value.intents.includes('other') && !value.custom_intent?.trim()) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        path: ['custom_intent'],
        message: 'Custom intent is required when "other" is selected',
      })
    }
  })

export type ProfileUpsertInput = z.infer<typeof ProfileUpsertSchema>

export type ProfileRecord = {
  id: string
  email: string
  full_name: string
  avatar_url: string | null
  role: string | null
  company: string | null
  intents: string[]
  custom_intent: string | null
  auth_provider: 'google'
  onboarding_complete: boolean
  created_at: string
  updated_at: string
}

export function sanitizeIntents(intents: string[] | null | undefined): string[] {
  return ProfileIntentsSchema.parse(intents ?? [])
}

