'use client'

import { useEffect, useMemo, useState } from 'react'
import { Loader2, Trash2, Upload } from 'lucide-react'
import { z } from 'zod'
import { useProfile } from '@/components/profile-provider'
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar'
import { Button } from '@/components/ui/button'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import { Field, FieldContent, FieldError, FieldGroup, FieldLabel } from '@/components/ui/field'
import { Input } from '@/components/ui/input'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { Checkbox } from '@/components/ui/checkbox'
import { PROFILE_INTENT_OPTIONS, ProfileUpsertSchema } from '@/lib/profile/schema'

const schema = ProfileUpsertSchema

function initials(value: string | null | undefined) {
  const text = value?.trim()
  if (!text) return 'U'
  return text
    .split(/\s+/)
    .slice(0, 2)
    .map((part) => part[0]?.toUpperCase() ?? '')
    .join('')
}

export function ProfileModal({
  open,
  onOpenChange,
}: {
  open: boolean
  onOpenChange: (open: boolean) => void
}) {
  const { profile, session, mutateProfile, deleteProfile, uploadAvatar } = useProfile()
  const [fullName, setFullName] = useState('')
  const [avatarUrl, setAvatarUrl] = useState('')
  const [role, setRole] = useState('')
  const [company, setCompany] = useState('')
  const [intents, setIntents] = useState<string[]>([])
  const [customIntent, setCustomIntent] = useState('')
  const [saving, setSaving] = useState(false)
  const [deleting, setDeleting] = useState(false)
  const [uploading, setUploading] = useState(false)
  const [success, setSuccess] = useState<string | null>(null)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    if (!open) return
    setFullName(profile?.full_name || session.name || '')
    setAvatarUrl(profile?.avatar_url || '')
    setRole(profile?.role || '')
    setCompany(profile?.company || '')
    setIntents(profile?.intents || [])
    setCustomIntent(profile?.custom_intent || '')
    setError(null)
    setSuccess(null)
  }, [open, profile, session.name])

  const validation = useMemo(() => {
    const result = schema.safeParse({
      full_name: fullName,
      avatar_url: avatarUrl,
      role,
      company,
      intents,
      custom_intent: customIntent,
    })
    return result
  }, [fullName, avatarUrl, role, company, intents, customIntent])

  const fieldErrors = useMemo(() => {
    if (validation.success) return {}
    return validation.error.flatten().fieldErrors
  }, [validation])

  const toggleIntent = (value: string) => {
    setIntents((prev) => (prev.includes(value) ? prev.filter((item) => item !== value) : [...prev, value]))
  }

  const onSave = async () => {
    setSuccess(null)
    setError(null)
    if (!validation.success) {
      setError('Please fix the highlighted fields.')
      return
    }

    setSaving(true)
    try {
      await mutateProfile(validation.data)
      setSuccess('Profile saved')
    } catch (err: any) {
      setError(err?.message || 'Failed to save profile')
    } finally {
      setSaving(false)
    }
  }

  const onDelete = async () => {
    setDeleting(true)
    setError(null)
    setSuccess(null)
    try {
      await deleteProfile()
      onOpenChange(false)
    } catch (err: any) {
      setError(err?.message || 'Failed to delete profile')
    } finally {
      setDeleting(false)
    }
  }

  const onAvatarFile = async (file: File | null) => {
    if (!file) return
    setUploading(true)
    setError(null)
    setSuccess(null)
    try {
      const updated = await uploadAvatar(file)
      setAvatarUrl(updated.avatar_url || '')
      setSuccess('Avatar updated')
    } catch (err: any) {
      setError(err?.message || 'Failed to upload avatar')
    } finally {
      setUploading(false)
    }
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl bg-[#0f0f0f] text-white border-[#262626]">
        <DialogHeader>
          <DialogTitle>Profile</DialogTitle>
          <DialogDescription className="text-[#9a9a9a]">
            Manage your account identity and writing preferences.
          </DialogDescription>
        </DialogHeader>

        <Tabs defaultValue="account">
          <TabsList className="bg-[#171717]">
            <TabsTrigger value="account">Account</TabsTrigger>
            <TabsTrigger value="preferences">Preferences</TabsTrigger>
          </TabsList>

          <TabsContent value="account" className="pt-4">
            <div className="mb-6 flex items-center gap-4">
              <Avatar className="size-16 border border-[#2a2a2a]">
                <AvatarImage src={avatarUrl || undefined} alt={fullName || session.name || 'User'} />
                <AvatarFallback className="bg-[#202020] text-white">{initials(fullName || session.name)}</AvatarFallback>
              </Avatar>
              <div className="flex flex-col gap-2">
                <label className="inline-flex cursor-pointer items-center gap-2 text-sm text-white">
                  <Upload className="size-4" />
                  <span>{uploading ? 'Uploading…' : 'Upload avatar'}</span>
                  <input
                    type="file"
                    className="hidden"
                    accept="image/png,image/jpeg,image/webp,image/gif"
                    onChange={(event) => void onAvatarFile(event.target.files?.[0] ?? null)}
                  />
                </label>
                <div className="text-xs text-[#8a8a8a]">PNG, JPG, WEBP, GIF up to 2MB</div>
              </div>
            </div>

            <FieldGroup>
              <Field>
                <FieldLabel>Email</FieldLabel>
                <FieldContent>
                  <Input value={profile?.email || session.email || ''} readOnly />
                </FieldContent>
              </Field>
              <Field>
                <FieldLabel>Auth provider</FieldLabel>
                <FieldContent>
                  <Input value="Google OAuth" readOnly />
                </FieldContent>
              </Field>
              <Field data-invalid={!!fieldErrors.full_name?.length}>
                <FieldLabel htmlFor="profile-name">Name</FieldLabel>
                <FieldContent>
                  <Input id="profile-name" value={fullName} onChange={(e) => setFullName(e.target.value)} aria-invalid={!!fieldErrors.full_name?.length} />
                  <FieldError>{fieldErrors.full_name?.[0]}</FieldError>
                </FieldContent>
              </Field>
              <Field data-invalid={!!fieldErrors.avatar_url?.length}>
                <FieldLabel htmlFor="profile-avatar-url">Avatar URL</FieldLabel>
                <FieldContent>
                  <Input id="profile-avatar-url" value={avatarUrl} onChange={(e) => setAvatarUrl(e.target.value)} placeholder="https://..." aria-invalid={!!fieldErrors.avatar_url?.length} />
                  <FieldError>{fieldErrors.avatar_url?.[0]}</FieldError>
                </FieldContent>
              </Field>
              <Field data-invalid={!!fieldErrors.role?.length}>
                <FieldLabel htmlFor="profile-role">Role</FieldLabel>
                <FieldContent>
                  <Input id="profile-role" value={role} onChange={(e) => setRole(e.target.value)} placeholder="Founder, Developer, Designer…" aria-invalid={!!fieldErrors.role?.length} />
                  <FieldError>{fieldErrors.role?.[0]}</FieldError>
                </FieldContent>
              </Field>
              <Field data-invalid={!!fieldErrors.company?.length}>
                <FieldLabel htmlFor="profile-company">Company</FieldLabel>
                <FieldContent>
                  <Input id="profile-company" value={company} onChange={(e) => setCompany(e.target.value)} placeholder="Company name" aria-invalid={!!fieldErrors.company?.length} />
                  <FieldError>{fieldErrors.company?.[0]}</FieldError>
                </FieldContent>
              </Field>
            </FieldGroup>
          </TabsContent>

          <TabsContent value="preferences" className="pt-4">
            <FieldGroup>
              <Field data-invalid={!!fieldErrors.intents?.length}>
                <FieldLabel>Writing intents</FieldLabel>
                <FieldContent>
                  <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
                    {PROFILE_INTENT_OPTIONS.map((intent) => (
                      <label key={intent} className="flex items-center gap-3 rounded-lg border border-[#2a2a2a] px-3 py-3 text-sm">
                        <Checkbox checked={intents.includes(intent)} onCheckedChange={() => toggleIntent(intent)} />
                        <span className="capitalize">{intent === 'other' ? 'Other' : intent}</span>
                      </label>
                    ))}
                  </div>
                  <FieldError>{fieldErrors.intents?.[0]}</FieldError>
                </FieldContent>
              </Field>

              <Field data-invalid={!!fieldErrors.custom_intent?.length}>
                <FieldLabel htmlFor="profile-custom-intent">Custom intent</FieldLabel>
                <FieldContent>
                  <Input
                    id="profile-custom-intent"
                    value={customIntent}
                    onChange={(e) => setCustomIntent(e.target.value)}
                    placeholder='Required when "other" is selected'
                    aria-invalid={!!fieldErrors.custom_intent?.length}
                  />
                  <FieldError>{fieldErrors.custom_intent?.[0]}</FieldError>
                </FieldContent>
              </Field>
            </FieldGroup>
          </TabsContent>
        </Tabs>

        {(error || success) && (
          <div className={error ? 'text-sm text-red-400' : 'text-sm text-emerald-400'}>
            {error || success}
          </div>
        )}

        <DialogFooter className="justify-between sm:justify-between">
          <Button variant="destructive" onClick={onDelete} disabled={deleting || saving || uploading}>
            {deleting ? <Loader2 className="size-4 animate-spin" /> : <Trash2 className="size-4" />}
            Delete profile
          </Button>
          <Button onClick={onSave} disabled={saving || deleting || uploading}>
            {saving ? <Loader2 className="size-4 animate-spin" /> : null}
            Save
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}

