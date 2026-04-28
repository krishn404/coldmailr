import { redirect } from 'next/navigation'
import { getSessionCookie } from '@/lib/gmail-auth'
import { deriveUserIdFromGoogleSub } from '@/lib/gmail-auth'
import { getOnboardingCompleteFlag } from '@/lib/onboarding/user-repo'

export default async function OnboardingLayout({ children }: { children: React.ReactNode }) {
  const session = await getSessionCookie()
  if (!session?.accessToken || !session.googleSub) {
    redirect('/')
  }

  const userId = deriveUserIdFromGoogleSub(session.googleSub)
  const onboardingComplete = await getOnboardingCompleteFlag({ userId, email: session.email ?? null })
  if (onboardingComplete) {
    redirect('/app')
  }

  return (
    <div className="min-h-screen bg-[#0a0a0a] text-white flex items-start justify-center px-4 py-10">
      <div className="w-full max-w-xl">{children}</div>
    </div>
  )
}

