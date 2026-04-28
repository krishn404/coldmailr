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
      <DialogContent className="w-[min(95vw,1100px)] max-w-[1100px] overflow-hidden rounded-2xl border-[#262626] bg-[#0f0f0f] p-0 text-white max-h-[85vh]">
        <div className="grid h-full grid-cols-1 md:grid-cols-[380px_minmax(0,1fr)]">
          <div className="border-b border-[#262626] bg-gradient-to-b from-[#121212] to-[#0f0f0f] p-8 md:border-b-0 md:border-r">
            <DialogHeader className="text-left">
              <DialogTitle className="text-xl">Profile Settings</DialogTitle>
              <DialogDescription className="text-[#9a9a9a] text-sm">
                Manage your identity and writing preferences
              </DialogDescription>
            </DialogHeader>

            <div className="mt-8 flex flex-col items-start gap-5">
              <Avatar className="size-24 border-2 border-[#2a2a2a] ring-4 ring-[#1a1a1a]">
                <AvatarFallback className={`bg-gradient-to-br ${gradient} text-2xl font-bold text-white`}>
                  {getInitials(fullName || session.name)}
                </AvatarFallback>
              </Avatar>
              <div className="space-y-2 w-full">
                <div className="text-lg font-semibold text-white">{fullName || session.name || 'Your profile'}</div>
                <div className="text-sm text-[#8a8a8a]">{profile?.email || session.email || ''}</div>
              </div>
              <div className="text-xs text-[#7a7a7a] leading-relaxed">Profile image is automatically generated from your initials and never changes.</div>
            </div>
          </div>

          <div className="flex min-h-0 flex-col">
            <div className="min-h-0 flex-1 overflow-y-auto p-8">
              <Tabs defaultValue="account" className="gap-6">
                <TabsList className="bg-[#171717] h-11">
                  <TabsTrigger value="account" className="font-medium">Account</TabsTrigger>
                  <TabsTrigger value="preferences" className="font-medium">Preferences</TabsTrigger>
                </TabsList>

                <TabsContent value="account" className="pt-4 space-y-1">
                  <FieldGroup>
                    <Field>
                      <FieldLabel>Email</FieldLabel>
                      <FieldContent>
                        <Input value={profile?.email || session.email || ''} readOnly className="bg-[#171717] text-[#9a9a9a]" />
                      </FieldContent>
                    </Field>
                    <Field>
                      <FieldLabel>Auth provider</FieldLabel>
                      <FieldContent>
                        <Input value="Google OAuth" readOnly className="bg-[#171717] text-[#9a9a9a]" />
                      </FieldContent>
                    </Field>
                    <Field data-invalid={!!fieldErrors.full_name?.length}>
                      <FieldLabel htmlFor="profile-name">Full Name</FieldLabel>
                      <FieldContent>
                        <Input 
                          id="profile-name" 
                          value={fullName} 
                          onChange={(e) => setFullName(e.target.value)} 
                          placeholder="Enter your full name"
                          aria-invalid={!!fieldErrors.full_name?.length} 
                          className="bg-[#171717] border-[#2a2a2a] text-white placeholder-[#666]"
                        />
                        <FieldError>{fieldErrors.full_name?.[0]}</FieldError>
                      </FieldContent>
                    </Field>
                    <div className="grid grid-cols-1 gap-5 md:grid-cols-2 pt-2">
                      <Field data-invalid={!!fieldErrors.role?.length}>
                        <FieldLabel htmlFor="profile-role">Role</FieldLabel>
                        <FieldContent>
                          <Input 
                            id="profile-role" 
                            value={role} 
                            onChange={(e) => setRole(e.target.value)} 
                            placeholder="Founder, Developer…" 
                            aria-invalid={!!fieldErrors.role?.length}
                            className="bg-[#171717] border-[#2a2a2a] text-white placeholder-[#666]"
                          />
                          <FieldError>{fieldErrors.role?.[0]}</FieldError>
                        </FieldContent>
                      </Field>
                      <Field data-invalid={!!fieldErrors.company?.length}>
                        <FieldLabel htmlFor="profile-company">Company</FieldLabel>
                        <FieldContent>
                          <Input 
                            id="profile-company" 
                            value={company} 
                            onChange={(e) => setCompany(e.target.value)} 
                            placeholder="Company name" 
                            aria-invalid={!!fieldErrors.company?.length}
                            className="bg-[#171717] border-[#2a2a2a] text-white placeholder-[#666]"
                          />
                          <FieldError>{fieldErrors.company?.[0]}</FieldError>
                        </FieldContent>
                      </Field>
                    </div>
                  </FieldGroup>
                </TabsContent>

                <TabsContent value="preferences" className="pt-4 space-y-1">
                  <FieldGroup>
                    <Field data-invalid={!!fieldErrors.intents?.length}>
                      <FieldLabel>Writing Intents</FieldLabel>
                      <FieldContent>
                        <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 pt-1">
                          {PROFILE_INTENT_OPTIONS.map((intent) => (
                            <label key={intent} className="flex items-center gap-3 rounded-lg border border-[#2a2a2a] hover:border-[#3a3a3a] bg-[#171717] px-4 py-3 text-sm cursor-pointer transition-colors">
                              <Checkbox checked={intents.includes(intent)} onCheckedChange={() => toggleIntent(intent)} />
                              <span className="capitalize text-white font-medium">{intent === 'other' ? 'Other' : intent}</span>
                            </label>
                          ))}
                        </div>
                        <FieldError>{fieldErrors.intents?.[0]}</FieldError>
                      </FieldContent>
                    </Field>

                    <Field data-invalid={!!fieldErrors.custom_intent?.length}>
                      <FieldLabel htmlFor="profile-custom-intent">Custom Intent</FieldLabel>
                      <FieldContent>
                        <Input
                          id="profile-custom-intent"
                          value={customIntent}
                          onChange={(e) => setCustomIntent(e.target.value)}
                          placeholder='Required when "Other" is selected'
                          aria-invalid={!!fieldErrors.custom_intent?.length}
                          className="bg-[#171717] border-[#2a2a2a] text-white placeholder-[#666]"
                        />
                        <FieldError>{fieldErrors.custom_intent?.[0]}</FieldError>
                      </FieldContent>
                    </Field>
                  </FieldGroup>
                </TabsContent>
              </Tabs>
            </div>

            <div className="border-t border-[#262626] bg-[#0a0a0a] p-8">
              {(error || success) && (
                <div className={`mb-4 text-sm font-medium ${error ? 'text-red-400' : 'text-emerald-400'}`}>
                  {error || success}
                </div>
              )}

              <DialogFooter className="justify-between sm:justify-between gap-4">
                <Button 
                  variant="destructive" 
                  onClick={onDelete} 
                  disabled={deleting || saving}
                  className="gap-2"
                >
                  {deleting ? <Loader2 className="size-4 animate-spin" /> : <Trash2 className="size-4" />}
                  Delete Profile
                </Button>
                <Button 
                  onClick={onSave} 
                  disabled={saving || deleting}
                  className="gap-2 bg-indigo-600 hover:bg-indigo-700"
                >
                  {saving ? <Loader2 className="size-4 animate-spin" /> : null}
                  Save Changes
                </Button>
              </DialogFooter>
            </div>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  )
}

