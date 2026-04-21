'use client'

type GmailAuthModalProps = {
  open: boolean
  onConnect: () => void
}

export function GmailAuthModal({ open, onConnect }: GmailAuthModalProps) {
  if (!open) return null

  return (
    <div className="fixed inset-0 z-[60] bg-black/70 flex items-center justify-center p-4">
      <div className="w-full max-w-md bg-[#1a1a1a] border border-[#2a2a2a] rounded-xl p-6">
        <h2 className="text-xl font-semibold text-white mb-3">Connect Gmail to continue</h2>
        <p className="text-sm text-[#999999] mb-6">
          You need to authenticate with Gmail before using inbox and composer features.
        </p>
        <button
          onClick={onConnect}
          className="w-full px-4 py-2.5 bg-white text-black text-sm font-medium rounded hover:bg-[#f0f0f0] transition-colors"
        >
          Continue with Google
        </button>
      </div>
    </div>
  )
}
