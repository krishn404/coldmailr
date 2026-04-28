'use client'

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Checkbox } from '@/components/ui/checkbox'
import { Field, FieldContent, FieldError, FieldGroup, FieldLabel } from '@/components/ui/field'
import { Input } from '@/components/ui/input'
import type { IntentKey } from '@/lib/onboarding/profile'

const OPTIONS: Array<{ key: IntentKey; label: string }> = [
  { key: 'freelance', label: 'Freelance work' },
  { key: 'internship', label: 'Internship' },
  { key: 'investor', label: 'Investor pitch' },
  { key: 'networking', label: 'Networking / intro' },
  { key: 'other', label: 'Other' },
]

export function StepIntents(props: {
  selected: IntentKey[]
  otherText: string
  errors: { selected?: string; custom?: string }
  onToggle: (key: IntentKey) => void
  onOtherTextChange: (value: string) => void
}) {
  const hasOther = props.selected.includes('other')
  return (
    <Card>
      <CardHeader>
        <CardTitle>Step 2 — Intent</CardTitle>
        <CardDescription>Select what you’re using Coldmailr for.</CardDescription>
      </CardHeader>
      <CardContent>
        <FieldGroup>
          <Field data-invalid={!!props.errors.selected}>
            <FieldLabel>Intent preferences</FieldLabel>
            <FieldContent>
              <div className="flex flex-col gap-3">
                {OPTIONS.map((opt) => {
                  const checked = props.selected.includes(opt.key)
                  return (
                    <label key={opt.key} className="flex items-center gap-3 text-sm">
                      <Checkbox checked={checked} onCheckedChange={() => props.onToggle(opt.key)} />
                      <span>{opt.label}</span>
                    </label>
                  )
                })}
              </div>
              <FieldError>{props.errors.selected}</FieldError>
            </FieldContent>
          </Field>

          {hasOther && (
            <Field data-invalid={!!props.errors.custom}>
              <FieldLabel htmlFor="onb-other">Other (required)</FieldLabel>
              <FieldContent>
                <Input
                  id="onb-other"
                  value={props.otherText}
                  onChange={(e) => props.onOtherTextChange(e.target.value)}
                  placeholder="Describe your intent"
                  aria-invalid={!!props.errors.custom}
                />
                <FieldError>{props.errors.custom}</FieldError>
              </FieldContent>
            </Field>
          )}
        </FieldGroup>
      </CardContent>
    </Card>
  )
}

