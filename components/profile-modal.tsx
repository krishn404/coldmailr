'use client'

import { useEffect, useMemo, useState } from 'react'
import { Loader2, Mail, Trash2 } from 'lucide-react'
import { useProfile } from '@/components/profile-provider'
import { Button } from '@/components/ui/button'
import { Dialog, DialogContent, DialogDescription, DialogTitle } from '@/components/ui/dialog'
import { Field, FieldContent, FieldError, FieldGroup, FieldLabel } from '@/components/ui/field'
import { Input } from '@/components/ui/input'
import { Checkbox } from '@/components/ui/checkbox'
import { PROFILE_INTENT_OPTIONS, ProfileUpsertSchema } from '@/lib/profile/schema'

const schema = ProfileUpsertSchema

export function ProfileModal({
  open,
  onOpenChange,
}: {
  open: boolean
  onOpenChange: (open: boolean) => void
}) {
  const { profile, session, mutateProfile, deleteProfile } = useProfile()
  const [activeSection, setActiveSection] = useState<'account' | 'preferences'>('account')
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
    setActiveSection('account')
    setFullName(profile?.full_name || session.name || '')
    setRole(profile?.role || '')
    setCompany(profile?.company || '')
    setIntents(profile?.intents || [])
    setCustomIntent(profile?.custom_intent || '')
    setError(null)
    setSuccess(null)
  }, [open, profile, session.name])

  const validation = useMemo(() => {
    return schema.safeParse({
      full_name: fullName,
      role,
      company,
      intents,
      custom_intent: customIntent,
    })
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

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-h-[85vh] w-[min(95vw,1050px)] max-w-[1050px] sm:max-w-[1050px] overflow-hidden rounded-2xl border-[#262626] bg-[#0f0f0f] p-0 text-white shadow-[0_20px_55px_rgba(0,0,0,0.5)]">
        <DialogTitle className="sr-only">Profile Settings</DialogTitle>
        <DialogDescription className="sr-only">
          Manage your account information and writing preferences.
        </DialogDescription>
        <div className="grid h-full grid-cols-1 md:grid-cols-[280px_minmax(0,1fr)]">
          <div className="flex flex-col border-b border-[#262626] bg-[#121212] p-6 md:border-b-0 md:border-r">
            <h2 className="text-xl font-semibold">Profile Settings</h2>
            <p className="mt-1 text-sm text-[#9d96b8]">Manage your identity and writing preferences</p>

            <div className="mt-6 space-y-2">
              {[
                { key: 'account' as const, label: 'Account' },
                { key: 'preferences' as const, label: 'Preferences' },
              ].map((item) => (
                <button
                  key={item.key}
                  onClick={() => setActiveSection(item.key)}
                  className={`w-full rounded-xl px-3 py-2.5 text-left text-sm font-medium transition-colors ${
                    activeSection === item.key
                      ? 'bg-[#1f1f1f] text-white ring-1 ring-[#333333]'
                      : 'text-[#9a9a9a] hover:bg-[#1a1a1a] hover:text-white'
                  }`}
                >
                  {item.label}
                </button>
              ))}
            </div>

            <div className="mt-auto rounded-xl border border-[#2a2a2a] bg-[#171717] p-4">
              <p className="text-sm font-medium text-white">Profile tips</p>
              <p className="mt-1 text-xs leading-relaxed text-[#8a8a8a]">
                Keep your role and company updated to improve personalization quality in generated emails.
              </p>
            </div>
          </div>

          <div className="flex min-h-0 flex-col">
            <div className="min-h-0 flex-1 overflow-y-auto p-6 md:p-8">
              {activeSection === 'account' ? (
                <>
                  <h3 className="text-lg font-semibold">Account Information</h3>
                  <p className="mt-1 text-sm text-[#8a8a8a]">Update your account details used across the app.</p>

                  <div className="mt-6">
                    <FieldGroup>
                      <Field>
                        <FieldLabel>Email</FieldLabel>
                        <FieldContent>
                          <div className="relative">
                            <Mail className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-[#8a8a8a]" />
                            <Input
                              value={profile?.email || session.email || ''}
                              readOnly
                              className="h-11 border-[#2a2a2a] bg-[#171717] pl-9 text-[#9a9a9a]"
                            />
                          </div>
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
                            className="h-11 border-[#2a2a2a] bg-[#171717] text-white placeholder-[#666]"
                          />
                          <FieldError>{fieldErrors.full_name?.[0]}</FieldError>
                        </FieldContent>
                      </Field>
                      <div className="grid grid-cols-1 gap-5 pt-2 md:grid-cols-2">
                        <Field data-invalid={!!fieldErrors.role?.length}>
                          <FieldLabel htmlFor="profile-role">Role (Optional)</FieldLabel>
                          <FieldContent>
                            <Input
                              id="profile-role"
                              value={role}
                              onChange={(e) => setRole(e.target.value)}
                              placeholder="Founder, Developer..."
                              aria-invalid={!!fieldErrors.role?.length}
                              className="h-11 border-[#2a2a2a] bg-[#171717] text-white placeholder-[#666]"
                            />
                            <FieldError>{fieldErrors.role?.[0]}</FieldError>
                          </FieldContent>
                        </Field>
                        <Field data-invalid={!!fieldErrors.company?.length}>
                          <FieldLabel htmlFor="profile-company">Company (Optional)</FieldLabel>
                          <FieldContent>
                            <Input
                              id="profile-company"
                              value={company}
                              onChange={(e) => setCompany(e.target.value)}
                              placeholder="Company name"
                              aria-invalid={!!fieldErrors.company?.length}
                              className="h-11 border-[#2a2a2a] bg-[#171717] text-white placeholder-[#666]"
                            />
                            <FieldError>{fieldErrors.company?.[0]}</FieldError>
                          </FieldContent>
                        </Field>
                      </div>
                    </FieldGroup>
                  </div>
                </>
              ) : null}

              {activeSection === 'preferences' ? (
                <div>
                  <h3 className="text-lg font-semibold">Preferences</h3>
                  <p className="mt-1 text-sm text-[#8a8a8a]">Select your writing intents to personalize generated drafts.</p>
                  <div className="mt-6">
                    <FieldGroup>
                      <Field data-invalid={!!fieldErrors.intents?.length}>
                        <FieldLabel>Writing Intents</FieldLabel>
                        <FieldContent>
                          <div className="grid grid-cols-1 gap-3 pt-1 sm:grid-cols-2">
                            {PROFILE_INTENT_OPTIONS.map((intent) => (
                              <label
                                key={intent}
                                className="flex cursor-pointer items-center gap-3 rounded-xl border border-[#2a2a2a] bg-[#171717] px-4 py-3 text-sm transition-colors hover:border-[#3a3a3a]"
                              >
                                <Checkbox checked={intents.includes(intent)} onCheckedChange={() => toggleIntent(intent)} />
                                <span className="font-medium capitalize text-white">{intent === 'other' ? 'Other' : intent}</span>
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
                            className="h-11 border-[#2a2a2a] bg-[#171717] text-white placeholder-[#666]"
                          />
                          <FieldError>{fieldErrors.custom_intent?.[0]}</FieldError>
                        </FieldContent>
                      </Field>
                    </FieldGroup>
                  </div>
                </div>
              ) : null}
            </div>

            <div className="border-t border-[#262626] bg-[#0a0a0a] p-6 md:p-8">
              {(error || success) && (
                <div className={`mb-4 text-sm font-medium ${error ? 'text-red-400' : 'text-emerald-400'}`}>
                  {error || success}
                </div>
              )}

              <div className="flex items-center justify-between gap-4">
                <Button
                  variant="destructive"
                  onClick={onDelete}
                  disabled={deleting || saving}
                  className="gap-2"
                >
                  {deleting ? <Loader2 className="size-4 animate-spin" /> : <Trash2 className="size-4" />}
                  Delete Profile
                </Button>
                <div className="flex items-center gap-2.5">
                  <Button
                    variant="outline"
                    onClick={() => onOpenChange(false)}
                    disabled={saving || deleting}
                    className="border-[#2a2a2a] bg-transparent text-[#9a9a9a] hover:bg-[#1a1a1a] hover:text-white"
                  >
                    Cancel
                  </Button>
                  <Button onClick={onSave} disabled={saving || deleting} className="gap-2 bg-[#5f2ccf] hover:bg-[#5223bc]">
                    {saving ? <Loader2 className="size-4 animate-spin" /> : null}
                    Save Changes
                  </Button>
                </div>
              </div>
            </div>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  )
}

