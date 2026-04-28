'use client'

import { useEffect, useMemo, useState } from 'react'
import { Loader2, Trash2 } from 'lucide-react'
import { useProfile } from '@/components/profile-provider'
import { Avatar, AvatarFallback } from '@/components/ui/avatar'
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
import { getAvatarGradient, getInitials } from '@/lib/profile/avatar-style'

const schema = ProfileUpsertSchema

export function ProfileModal({
  open,
  onOpenChange,
}: {
  open: boolean
  onOpenChange: (open: boolean) => void
}) {
  const { profile, session, mutateProfile, deleteProfile } = useProfile()
  const [fullName, setFullName] = useState('')
  const [role, setRole] = useState('')
  const [company, setCompany] = useState('')
  const [intents, setIntents] = useState<string[]>([])
  const [customIntent, setCustomIntent] = useState('')
  const [saving, setSaving] = useState(false)
  const [deleting, setDeleting] = useState(false)
  const [success, setSuccess] = useState<string | null>(null)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    if (!open) return
    setFullName(profile?.full_name || session.name || '')
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
      role,
      company,
      intents,
      custom_intent: customIntent,
    })
    return result
  }, [fullName, role, company, intents, customIntent])

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

  const avatarSeed = profile?.email || session.email || fullName
  const gradient = getAvatarGradient(avatarSeed)

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="w-[min(92vw,980px)] max-w-[980px] overflow-hidden rounded-2xl border-[#262626] bg-[#0f0f0f] p-0 text-white">
        <div className="grid max-h-[80vh] grid-cols-1 md:grid-cols-[320px_minmax(0,1fr)]">
          <div className="border-b border-[#262626] bg-[#121212] p-6 md:border-b-0 md:border-r">
            <DialogHeader className="text-left">
              <DialogTitle>Profile</DialogTitle>
              <DialogDescription className="text-[#9a9a9a]">
                Manage your account identity and writing preferences.
              </DialogDescription>
            </DialogHeader>

            <div className="mt-6 flex flex-col items-start gap-4">
              <Avatar className="size-20 border border-[#2a2a2a]">
                <AvatarFallback className={`bg-gradient-to-br ${gradient} text-lg font-semibold text-white`}>
                  {getInitials(fullName || session.name)}
                </AvatarFallback>
              </Avatar>
              <div className="space-y-1">
                <div className="text-base font-medium text-white">{fullName || session.name || 'Your profile'}</div>
                <div className="text-sm text-[#8a8a8a]">{profile?.email || session.email || ''}</div>
              </div>
              <div className="text-xs text-[#8a8a8a]">Profile image is generated automatically from your initials.</div>
            </div>
          </div>

          <div className="flex min-h-0 flex-col">
            <div className="min-h-0 flex-1 overflow-y-auto p-6">
              <Tabs defaultValue="account" className="gap-4">
                <TabsList className="bg-[#171717]">
                  <TabsTrigger value="account">Account</TabsTrigger>
                  <TabsTrigger value="preferences">Preferences</TabsTrigger>
                </TabsList>

                <TabsContent value="account" className="pt-2">
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
                    <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
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
                    </div>
                  </FieldGroup>
                </TabsContent>

                <TabsContent value="preferences" className="pt-2">
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
            </div>

            <div className="border-t border-[#262626] p-6">
              {(error || success) && (
                <div className={error ? 'mb-4 text-sm text-red-400' : 'mb-4 text-sm text-emerald-400'}>
                  {error || success}
                </div>
              )}

              <DialogFooter className="justify-between sm:justify-between">
                <Button variant="destructive" onClick={onDelete} disabled={deleting || saving}>
                  {deleting ? <Loader2 className="size-4 animate-spin" /> : <Trash2 className="size-4" />}
                  Delete profile
                </Button>
                <Button onClick={onSave} disabled={saving || deleting}>
                  {saving ? <Loader2 className="size-4 animate-spin" /> : null}
                  Save
                </Button>
              </DialogFooter>
            </div>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  )
}

