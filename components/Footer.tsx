'use client'

import Image from 'next/image'
import Link from 'next/link'
import { Github } from 'lucide-react'

const COPYRIGHT_YEAR = 2026

export function Footer() {
  return (
    <footer className="border-t border-[#222] bg-[#0a0a0a] px-6 py-14 md:px-10">
      <div className="mx-auto max-w-6xl">
        <div className="flex flex-col items-start justify-between gap-6 md:flex-row md:items-center">
          <div>
            <div className="flex items-center gap-3">
              <Image src="/logo.png" alt="Cold Mailr logo" width={28} height={28} className="rounded-md" />
              <span className="font-display text-lg font-extrabold text-white">Cold Mailr</span>
            </div>
            <p className="font-body mt-3 max-w-md text-sm text-[#9ca3af]">
              AI-powered cold email outreach. Draft faster, personalize better, and send with Gmail.
            </p>
          </div>
          <div className="flex flex-col items-start gap-3 md:items-end">
            <div className="flex flex-wrap items-center gap-x-4 gap-y-2 text-xs text-[#9ca3af]">
              <Link href="/privacy-policy" className="transition-colors hover:text-white">
                Privacy Policy
              </Link>
              <Link href="/terms-of-service" className="transition-colors hover:text-white">
                Terms of Service
              </Link>
            </div>
            <p className="text-xs text-[#7d7d7d]">Copyright {COPYRIGHT_YEAR} cold mailr. All Rights Reserved.</p>
            <a
              href="https://github.com/krishn404/coldmailr"
              target="_blank"
              rel="noreferrer"
              className="text-[#9ca3af] transition-colors hover:text-white"
              aria-label="Cold Mailr GitHub repository"
            >
              <Github className="h-5 w-5" />
            </a>
          </div>
        </div>
      </div>
    </footer>
  )
}
