'use client'

import { motion } from 'framer-motion'
import Image from 'next/image'
import Link from 'next/link'

const navItems = [
  { label: 'Features', href: '/#features' },
  { label: 'How it Works', href: '/#how-it-works' },
  { label: 'Pricing', href: '/#pricing' },
  { label: 'FAQ', href: '/#faq' },
]

export function Navbar() {
  return (
    <motion.header
      initial={{ opacity: 0, y: -20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.2 }}
      className="sticky top-0 z-40 border-b border-[#222] bg-[#0a0a0a]/90 backdrop-blur-xl"
    >
      <nav className="mx-auto flex h-20 w-full max-w-7xl items-center justify-between px-6 md:px-10">
        <Link href="/" className="flex items-center gap-3">
          <Image src="/logo.png" alt="Cold Mailr logo" width={28} height={28} className="rounded-md" />
          <span className="font-display text-lg font-extrabold tracking-wide text-white">Cold Mailr</span>
        </Link>

        <div className="hidden items-center gap-8 md:flex">
          {navItems.map((item) => (
            <Link key={item.href} href={item.href} className="font-body text-sm text-[#b8b8b8] transition-colors hover:text-white">
              {item.label}
            </Link>
          ))}
        </div>

        <Link href="/app" className="hidden md:block">
          <motion.button
          whileHover={{ scale: 1.03 }}
          whileTap={{ scale: 0.98 }}
          className="rounded-md border border-white/40 px-4 py-2 text-sm font-medium text-white transition-colors hover:border-white"
        >
          Join Us
          </motion.button>
        </Link>
        <Link href="/app" className="md:hidden rounded-md border border-white/40 px-4 py-2 text-sm font-medium text-white">
          Join
        </Link>
      </nav>
    </motion.header>
  )
}
