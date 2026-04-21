'use client'

interface ContactPreviewProps {
  email: string
  tokenCount: number
}

export function ContactPreview({ email, tokenCount }: ContactPreviewProps) {
  const displayName = email.split('@')[0]
  const domain = email.includes('@') ? email.split('@')[1] : ''

  return (
    <div className="bg-[#1a1a1a] border border-[#2a2a2a] rounded-lg p-4 flex items-center justify-between">
      <div className="flex items-center gap-3">
        <div className="w-8 h-8 rounded-full bg-[#2a2a2a] flex items-center justify-center">
          <span className="text-xs font-semibold text-[#999999]">
            {displayName.charAt(0).toUpperCase()}
          </span>
        </div>
        <div>
          <p className="text-sm font-medium text-white">{displayName}</p>
          <p className="text-xs text-[#666666]">{domain}</p>
        </div>
      </div>
      <div className="text-right">
        <p className="text-xs text-[#666666]">Tokens</p>
        <p className="text-sm font-semibold text-[#999999]">{tokenCount}</p>
      </div>
    </div>
  )
}
