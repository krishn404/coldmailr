import { NextResponse } from 'next/server'
import { getOnboardingCompleteFlag } from '@/lib/onboarding/user-repo'

export async function requireOnboardingComplete(params: { userId: string; email: string | null }) {
  const complete = await getOnboardingCompleteFlag(params)
  if (!complete) {
    return { ok: false as const, response: NextResponse.json({ error: 'Onboarding incomplete' }, { status: 403 }) }
  }
  return { ok: true as const }
}

