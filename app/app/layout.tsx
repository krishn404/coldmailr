import { redirect } from 'next/navigation'
import { getSessionCookie } from '@/lib/gmail-auth'
import { deriveUserIdFromGoogleSub } from '@/lib/gmail-auth'
import { getOnboardingCompleteFlag } from '@/lib/onboarding/user-repo'

export default async function AppLayout({ children }: { children: React.ReactNode }) {
  const session = await getSessionCookie()
  if (!session?.accessToken || !session.googleSub) {
    redirect('/')
  }

  const userId = deriveUserIdFromGoogleSub(session.googleSub)
  const onboardingComplete = await getOnboardingCompleteFlag({ userId, email: session.email ?? null })
  if (!onboardingComplete) {
    redirect('/onboarding')
  }

  return children
}

