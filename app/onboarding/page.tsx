'use client'

import { useMemo } from 'react'
import { Button } from '@/components/ui/button'
import { StepIdentity } from '@/app/onboarding/components/step-identity'
import { StepIntents } from '@/app/onboarding/components/step-intents'
import { StepSocial } from '@/app/onboarding/components/step-social'
import { useOnboarding } from '@/app/onboarding/hooks/useOnboarding'

function SaveIndicator({ status }: { status: string }) {
  if (status === 'saving') return <span className="text-xs text-muted-foreground">Saving…</span>
  if (status === 'saved') return <span className="text-xs text-muted-foreground">Saved</span>
  if (status === 'celebrating') return <span className="text-xs text-emerald-400">Profile saved</span>
  if (status === 'error') return <span className="text-xs text-destructive">Save failed</span>
  return <span className="text-xs text-muted-foreground"> </span>
}

export default function OnboardingPage() {
  const onboarding = useOnboarding()

  const title = useMemo(() => `Onboarding (${onboarding.step}/3)`, [onboarding.step])

  return (
    <div className="flex flex-col gap-6">
      <div className="flex items-end justify-between">
        <div>
          <div className="text-sm text-muted-foreground">Blocking setup</div>
          <div className="text-xl font-semibold">{title}</div>
        </div>
        <SaveIndicator status={onboarding.saveState.status} />
      </div>

      {onboarding.step === 1 && (
        <StepIdentity
          name={onboarding.values.name}
          bio={onboarding.values.bio}
          errors={onboarding.errors.identity}
          onNameChange={onboarding.actions.updateName}
          onBioChange={onboarding.actions.updateBio}
        />
      )}

      {onboarding.step === 2 && (
        <StepIntents
          selected={onboarding.values.intentSelected}
          otherText={onboarding.values.intentOtherText}
          errors={onboarding.errors.intent}
          onToggle={onboarding.actions.toggleIntent}
          onOtherTextChange={onboarding.actions.updateOtherIntent}
        />
      )}

      {onboarding.step === 3 && (
        <StepSocial
          social={onboarding.values.social}
          errors={onboarding.errors.social}
          onChange={onboarding.actions.updateSocial}
        />
      )}

      {onboarding.saveState.status === 'celebrating' && (
        <div className="rounded-xl border border-emerald-500/30 bg-emerald-500/10 px-4 py-6 text-center">
          <div className="mx-auto mb-3 h-10 w-10 animate-pulse rounded-full bg-emerald-400/20" />
          <div className="text-base font-medium text-emerald-300">Profile saved</div>
          <div className="mt-1 text-sm text-muted-foreground">Redirecting to your workspace…</div>
        </div>
      )}

      <div className="flex items-center justify-between">
        <Button variant="outline" onClick={onboarding.actions.back} disabled={onboarding.step === 1 || onboarding.loading || onboarding.finishing}>
          Back
        </Button>

        <div className="flex items-center gap-3">
          {onboarding.step === 3 && (
            <Button variant="ghost" onClick={onboarding.actions.skip} disabled={onboarding.loading || onboarding.finishing}>
              Skip
            </Button>
          )}
          {onboarding.step < 3 ? (
            <Button onClick={onboarding.actions.next} disabled={onboarding.loading || onboarding.finishing}>
              Continue
            </Button>
          ) : (
            <Button onClick={onboarding.actions.complete} disabled={onboarding.loading || onboarding.finishing}>
              Finish
            </Button>
          )}
        </div>
      </div>

      {onboarding.saveState.status === 'error' && onboarding.saveState.error && (
        <div className="text-sm text-destructive">{onboarding.saveState.error}</div>
      )}
    </div>
  )
}

