import { z } from 'zod'

export const SocialLinksSchema = z
  .object({
    linkedin: z.string().trim().optional().default(''),
    twitter: z.string().trim().optional().default(''),
    portfolio: z.string().trim().optional().default(''),
  })
  .strict()

export type SocialLinks = z.infer<typeof SocialLinksSchema>

export const IntentKeySchema = z.enum(['freelance', 'internship', 'investor', 'networking', 'other'])
export type IntentKey = z.infer<typeof IntentKeySchema>

export const IntentPreferencesSchema = z
  .object({
    selected: z.array(IntentKeySchema).default([]),
    custom: z.string().trim().default(''),
  })
  .strict()

export type IntentPreferences = z.infer<typeof IntentPreferencesSchema>

export const BaseContextSchema = z
  .object({
    name: z.string().default(''),
    bio: z.string().default(''),
    social_links: SocialLinksSchema.default({ linkedin: '', twitter: '', portfolio: '' }),
    intent_preferences: IntentPreferencesSchema.default({ selected: [], custom: '' }),
  })
  .strict()

export type BaseContext = z.infer<typeof BaseContextSchema>

export const ProfilePatchSchema = z
  .object({
    name: z.string().trim().optional(),
    bio: z.string().trim().max(200).optional(),
    social_links: SocialLinksSchema.partial().optional(),
    intent_preferences: IntentPreferencesSchema.partial().optional(),
    complete: z.boolean().optional(),
  })
  .strict()

export type ProfilePatch = z.infer<typeof ProfilePatchSchema>

export const ProfileCompleteSchema = z
  .object({
    name: z.string().trim().min(2),
    bio: z.string().trim().max(200).min(1),
    social_links: SocialLinksSchema,
    intent_preferences: IntentPreferencesSchema.superRefine((v, ctx) => {
      if (!v.selected || v.selected.length < 1) {
        ctx.addIssue({ code: z.ZodIssueCode.custom, message: 'Select at least one intent', path: ['selected'] })
      }
      if (v.selected?.includes('other') && !v.custom?.trim()) {
        ctx.addIssue({ code: z.ZodIssueCode.custom, message: 'Please specify other intent', path: ['custom'] })
      }
    }),
  })
  .strict()

export type ProfileComplete = z.infer<typeof ProfileCompleteSchema>

export function isValidHttpUrl(value: string): boolean {
  if (!value.trim()) return true
  try {
    const url = new URL(value)
    return url.protocol === 'http:' || url.protocol === 'https:'
  } catch {
    return false
  }
}

export function validateSocialLinksOrThrow(input: SocialLinks): SocialLinks {
  const parsed = SocialLinksSchema.parse(input)
  const urls = [
    { key: 'linkedin', value: parsed.linkedin ?? '' },
    { key: 'twitter', value: parsed.twitter ?? '' },
    { key: 'portfolio', value: parsed.portfolio ?? '' },
  ] as const
  for (const item of urls) {
    if (item.value && !isValidHttpUrl(item.value)) {
      throw new Error(`Invalid URL for ${item.key}`)
    }
  }
  return parsed
}

export function buildBaseContext(input: {
  name: string
  bio: string
  social_links: SocialLinks
  intent_preferences: IntentPreferences
}): BaseContext {
  return BaseContextSchema.parse({
    name: input.name,
    bio: input.bio,
    social_links: SocialLinksSchema.parse(input.social_links),
    intent_preferences: IntentPreferencesSchema.parse(input.intent_preferences),
  })
}

