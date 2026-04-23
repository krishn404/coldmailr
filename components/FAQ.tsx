'use client'

import { AnimatePresence, motion } from 'framer-motion'
import { useState } from 'react'

const faqs = [
  {
    q: 'Do I need to connect Gmail to use Cold Mailr?',
    a: 'Yes — Gmail connection is required to send emails. You can still draft and edit with AI before connecting.',
  },
  {
    q: 'Does Cold Mailr send bulk campaigns?',
    a: 'No — it’s built for focused cold outreach. Draft, edit, and send individual emails with a clean sent log.',
  },
  {
    q: 'Can I regenerate just the subject line?',
    a: 'Yes. You can regenerate the subject with AI without overwriting your message body.',
  },
  {
    q: 'Where are my sent emails stored?',
    a: 'Each sent email is persisted with status and metadata so the dashboard always reflects the real state.',
  },
]

export function FAQ() {
  const [open, setOpen] = useState<number | null>(0)

  return (
    <section id="faq" className="px-6 py-24 md:px-10">
      <div className="mx-auto max-w-6xl">
        <p className="mb-3 inline-flex rounded-full border border-[#3b82f6] bg-[#3b82f6]/10 px-4 py-1 text-xs text-[#93c5fd]">
          ✦ FAQ
        </p>
        <h2 className="font-display max-w-3xl text-4xl font-extrabold text-white md:text-6xl">
          Questions, answered.
        </h2>

        <motion.div
          initial="hidden"
          whileInView="show"
          viewport={{ once: true, amount: 0.2 }}
          variants={{ show: { transition: { staggerChildren: 0.12 } } }}
          className="mt-10 space-y-4"
        >
          {faqs.map((item, idx) => {
            const isOpen = open === idx
            return (
              <motion.div
                key={item.q}
                layout
                variants={{
                  hidden: { opacity: 0, y: 18 },
                  show: { opacity: 1, y: 0, transition: { duration: 0.35 } },
                }}
                className="rounded-xl border border-[#222] bg-[#141414]"
              >
                <button
                  onClick={() => setOpen((prev) => (prev === idx ? null : idx))}
                  className="flex w-full items-center justify-between gap-6 px-6 py-5 text-left"
                >
                  <span className="font-body text-base font-medium text-white">{item.q}</span>
                  <span className="font-metric text-xs text-[#93c5fd]">{isOpen ? '—' : '+'}</span>
                </button>

                <AnimatePresence initial={false}>
                  {isOpen && (
                    <motion.div
                      layout
                      initial={{ opacity: 0 }}
                      animate={{ opacity: 1 }}
                      exit={{ opacity: 0 }}
                      transition={{ duration: 0.22 }}
                      className="overflow-hidden px-6 pb-6"
                    >
                      <p className="font-body text-sm leading-relaxed text-[#9ca3af]">{item.a}</p>
                    </motion.div>
                  )}
                </AnimatePresence>
              </motion.div>
            )
          })}
        </motion.div>
      </div>
    </section>
  )
}

