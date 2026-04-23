'use client'

import { motion } from 'framer-motion'
import Link from 'next/link'

export function FinalCTA() {
  return (
    <section className="px-6 py-24 md:px-10">
      <div className="mx-auto grid max-w-6xl gap-8 rounded-2xl border border-[#222] bg-[#111111] p-8 md:grid-cols-2 md:p-12">
        <div>
          <p className="mb-4 inline-flex rounded-full border border-[#3b82f6] bg-[#3b82f6]/10 px-4 py-1 text-xs text-[#93c5fd]">
            ✦ Start with Cold Mailr
          </p>
          <motion.h2
            initial={{ opacity: 0, y: 60 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true, amount: 0.25 }}
            transition={{ duration: 0.8 }}
            className="font-display text-5xl font-extrabold leading-[1.05] text-white md:text-6xl"
          >
            Ready to Simplify
            <br />
            Your Outreach?
          </motion.h2>
        </div>
        <div className="flex flex-col justify-between gap-6 md:items-end">
          <p className="font-body max-w-md text-base text-[#9ca3af] md:text-right">
            Start for free today and experience how effortless AI-powered cold email can be.
          </p>
          <Link href="/app">
            <motion.button
              whileHover={{ scale: 1.03 }}
              whileTap={{ scale: 0.98 }}
              className="rounded-md border border-white/30 px-6 py-3 text-sm font-semibold text-white"
            >
              Start for Free →
            </motion.button>
          </Link>
        </div>
      </div>
    </section>
  )
}
