'use client'

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Field, FieldContent, FieldError, FieldGroup, FieldLabel } from '@/components/ui/field'
import { Input } from '@/components/ui/input'
import { Textarea } from '@/components/ui/textarea'

export function StepIdentity(props: {
  name: string
  bio: string
  errors: { name?: string; bio?: string }
  onNameChange: (value: string) => void
  onBioChange: (value: string) => void
}) {
  return (
    <Card>
      <CardHeader>
        <CardTitle>Step 1 — Identity</CardTitle>
        <CardDescription>Tell us who you are. This becomes part of your base context.</CardDescription>
      </CardHeader>
      <CardContent>
        <FieldGroup>
          <Field data-invalid={!!props.errors.name}>
            <FieldLabel htmlFor="onb-name">Name</FieldLabel>
            <FieldContent>
              <Input
                id="onb-name"
                value={props.name}
                onChange={(e) => props.onNameChange(e.target.value)}
                placeholder="Your name"
                aria-invalid={!!props.errors.name}
              />
              <FieldError>{props.errors.name}</FieldError>
            </FieldContent>
          </Field>

          <Field data-invalid={!!props.errors.bio}>
            <FieldLabel htmlFor="onb-bio">Bio</FieldLabel>
            <FieldContent>
              <Textarea
                id="onb-bio"
                value={props.bio}
                onChange={(e) => props.onBioChange(e.target.value)}
                placeholder="A short bio (max 200 chars)"
                rows={5}
                aria-invalid={!!props.errors.bio}
              />
              <div className="text-xs text-muted-foreground">{props.bio.trim().length}/200</div>
              <FieldError>{props.errors.bio}</FieldError>
            </FieldContent>
          </Field>
        </FieldGroup>
      </CardContent>
    </Card>
  )
}

