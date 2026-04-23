'use client'

import { motion } from 'framer-motion'
import { Check } from 'lucide-react'
import Link from 'next/link'

const freeFeatures = [
  'Gmail integration',
  'AI email draft + subject regeneration',
  'Save drafts and sent emails',
  'Basic deliverability checks',
]

export function Pricing() {
  return (
    <section id="pricing" className="px-6 py-24 md:px-10">
      <div className="mx-auto grid max-w-6xl gap-10 md:grid-cols-[1.05fr_1fr]">
        <div>
          <p className="mb-3 inline-flex rounded-full border border-[#3b82f6] bg-[#3b82f6]/10 px-4 py-1 text-xs text-[#93c5fd]">
            ✦ Pricing
          </p>
          <h2 className="font-display text-5xl font-extrabold leading-[1.05] text-white md:text-6xl">
            Simple Pricing,
            <br />
            No Surprises.
          </h2>
          <p className="font-body mt-5 max-w-md text-[#9ca3af]">
            Start free and get everything you need to draft and send cold emails with AI + Gmail.
          </p>
        </div>

        <motion.div
          initial={{ opacity: 0, y: 36, scale: 0.95 }}
          whileInView={{ opacity: 1, y: 0, scale: 1 }}
          viewport={{ once: true, amount: 0.2 }}
          transition={{ duration: 0.55 }}
          className="grid gap-5"
        >
          <motion.article
            whileHover={{ scale: 1.01, boxShadow: '0 8px 32px rgba(59,130,246,0.08)' }}
            className="rounded-xl border border-[#222] bg-[#141414] p-6"
          >
            <p className="font-body text-xs uppercase tracking-[0.2em] text-[#9ca3af]">FREE</p>
            <p className="mt-3 font-display text-4xl font-extrabold text-white">$0</p>
            <p className="font-body mt-4 text-sm text-[#c9c9c9]">Perfect for getting started.</p>
            <ul className="mt-5 space-y-2">
              {freeFeatures.map((feature) => (
                <li key={feature} className="font-body flex items-start gap-2 text-sm text-[#cfcfcf]">
                  <Check className="mt-0.5 h-4 w-4 text-[#93c5fd]" />
                  {feature}
                </li>
              ))}
            </ul>
            <Link href="/app" className="block">
              <motion.button
                whileHover={{ scale: 1.03 }}
                whileTap={{ scale: 0.98 }}
                className="mt-6 w-full rounded-md bg-white py-2.5 text-sm font-semibold text-black"
              >
                Start Free
              </motion.button>
            </Link>
          </motion.article>
        </motion.div>
      </div>
    </section>
  )
}
