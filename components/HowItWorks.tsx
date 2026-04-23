'use client'

import { motion } from 'framer-motion'
import { Brain, Send, ShieldCheck } from 'lucide-react'

const items = [
  {
    title: 'Connect Gmail',
    description: 'Link your Gmail account once and send cold emails from the same identity you already use.',
    icon: Brain,
  },
  {
    title: 'Draft with AI',
    description: 'Generate a strong first draft, regenerate subject lines, and edit fast with rich controls.',
    icon: Send,
  },
  {
    title: 'Send + Save',
    description: 'Send immediately and persist the final email as a Sent Email with status and metadata.',
    icon: ShieldCheck,
  },
]

export function HowItWorks() {
  return (
    <section id="how-it-works" className="px-6 py-24 md:px-10">
      <div className="mx-auto max-w-6xl">
        <p className="mb-3 inline-flex rounded-full border border-[#3b82f6] bg-[#3b82f6]/10 px-4 py-1 text-xs text-[#93c5fd]">
          ✦ Workflow
        </p>
        <h2 className="font-display max-w-3xl text-4xl font-extrabold text-white md:text-6xl">
          Cold outreach, streamlined.
        </h2>

        <motion.div
          variants={{ visible: { transition: { staggerChildren: 0.15 } } }}
          initial="hidden"
          whileInView="visible"
          viewport={{ once: true, amount: 0.2 }}
          className="mt-12 grid gap-6 md:grid-cols-3"
        >
          {items.map((item) => (
            <motion.article
              key={item.title}
              variants={{
                hidden: { opacity: 0, y: 40 },
                visible: { opacity: 1, y: 0, transition: { duration: 0.45 } },
              }}
              whileHover={{ scale: 1.01, boxShadow: '0 8px 32px rgba(59,130,246,0.08)' }}
              className="rounded-xl border border-[#222] bg-[#141414] p-6"
            >
              <item.icon className="h-6 w-6 text-[#60a5fa]" />
              <h3 className="font-display mt-4 text-2xl font-bold text-white">{item.title}</h3>
              <p className="font-body mt-3 text-sm leading-relaxed text-[#9ca3af]">{item.description}</p>
            </motion.article>
          ))}
        </motion.div>
      </div>
    </section>
  )
}
