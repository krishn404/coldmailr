'use client'

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Field, FieldContent, FieldError, FieldGroup, FieldLabel } from '@/components/ui/field'
import { Input } from '@/components/ui/input'
import type { SocialLinks } from '@/lib/onboarding/profile'

export function StepSocial(props: {
  social: SocialLinks
  errors: Partial<Record<keyof SocialLinks, string>>
  onChange: (key: keyof SocialLinks, value: string) => void
}) {
  return (
    <Card>
      <CardHeader>
        <CardTitle>Step 3 — Social links</CardTitle>
        <CardDescription>Optional. If provided, links must be valid URLs.</CardDescription>
      </CardHeader>
      <CardContent>
        <FieldGroup>
          <Field data-invalid={!!props.errors.linkedin}>
            <FieldLabel htmlFor="onb-linkedin">LinkedIn</FieldLabel>
            <FieldContent>
              <Input
                id="onb-linkedin"
                value={props.social.linkedin ?? ''}
                onChange={(e) => props.onChange('linkedin', e.target.value)}
                placeholder="https://linkedin.com/in/..."
                aria-invalid={!!props.errors.linkedin}
              />
              <FieldError>{props.errors.linkedin}</FieldError>
            </FieldContent>
          </Field>

          <Field data-invalid={!!props.errors.twitter}>
            <FieldLabel htmlFor="onb-twitter">Twitter</FieldLabel>
            <FieldContent>
              <Input
                id="onb-twitter"
                value={props.social.twitter ?? ''}
                onChange={(e) => props.onChange('twitter', e.target.value)}
                placeholder="https://x.com/..."
                aria-invalid={!!props.errors.twitter}
              />
              <FieldError>{props.errors.twitter}</FieldError>
            </FieldContent>
          </Field>

          <Field data-invalid={!!props.errors.portfolio}>
            <FieldLabel htmlFor="onb-portfolio">Portfolio</FieldLabel>
            <FieldContent>
              <Input
                id="onb-portfolio"
                value={props.social.portfolio ?? ''}
                onChange={(e) => props.onChange('portfolio', e.target.value)}
                placeholder="https://..."
                aria-invalid={!!props.errors.portfolio}
              />
              <FieldError>{props.errors.portfolio}</FieldError>
            </FieldContent>
          </Field>
        </FieldGroup>
      </CardContent>
    </Card>
  )
}

