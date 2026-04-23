'use client'

import { motion } from 'framer-motion'
import Link from 'next/link'

const heading = 'Cold Email Outreach, Without the Guesswork.'.split(' ')

export function Hero() {
  return (
    <section className="relative overflow-hidden px-6 pb-24 pt-28 md:pb-32 md:pt-40">
      <div className="pointer-events-none absolute -left-24 top-6 h-80 w-80 rounded-full border border-white/10 bg-gradient-to-br from-white/10 to-transparent opacity-20 blur-2xl" />
      <div className="pointer-events-none absolute -right-24 -top-4 h-96 w-96 rounded-full border border-white/10 bg-gradient-to-bl from-white/10 to-transparent opacity-20 blur-2xl" />

      <div className="mx-auto flex max-w-4xl flex-col items-center text-center">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.4, delay: 0.3 }}
          className="mb-7 inline-flex items-center rounded-full border border-[#3b82f6] bg-[#3b82f6]/10 px-4 py-1.5 text-xs text-[#93c5fd]"
        >
          ✦ AI Outreach, Powered by Your Leads
        </motion.div>

        <h1 className="font-display text-5xl font-extrabold leading-[1.05] text-white md:text-7xl">
          {heading.map((word, i) => (
            <motion.span
              key={`${word}-${i}`}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.35, delay: 0.5 + i * 0.035 }}
              className="mr-3 inline-block"
            >
              {word}
            </motion.span>
          ))}
        </h1>

        <motion.p
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.35, delay: 0.7 }}
          className="font-body mt-6 max-w-xl text-lg text-[#9ca3af]"
        >
          Cold Mailr helps you write, refine, and send high-converting cold emails with Gmail + AI - fast,
          simple, and personal.
        </motion.p>

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.35, delay: 0.9 }}
          className="mt-10 flex flex-col gap-4 sm:flex-row"
        >
          <Link href="/app">
            <motion.button
              whileHover={{ scale: 1.03 }}
              whileTap={{ scale: 0.98 }}
              className="rounded-md bg-white px-6 py-3 text-sm font-semibold text-black"
            >
              Start Free
            </motion.button>
          </Link>
          <a href="#how-it-works">
            <motion.button
              whileHover={{ scale: 1.03 }}
              whileTap={{ scale: 0.98 }}
              className="rounded-md border border-white/30 px-6 py-3 text-sm font-semibold text-white"
            >
              See how it works →
            </motion.button>
          </a>
        </motion.div>
      </div>
    </section>
  )
}
