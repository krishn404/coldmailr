'use client'

import { motion } from 'framer-motion'

const testimonials = [
  {
    quote:
      'Cold Mailr replaced three disconnected tools for us. Campaign setup and follow-up logic now take minutes.',
    author: 'Ava R., Growth Lead',
  },
  {
    quote:
      'The personalization quality is consistently strong. We saw faster replies without increasing team workload.',
    author: 'Noah T., Agency Founder',
  },
  {
    quote:
      'Analytics are finally actionable. We know which sequences move pipeline and which ones need rewriting.',
    author: 'Mina K., RevOps Manager',
  },
]

export function Testimonials() {
  return (
    <section id="faq" className="px-6 py-20 md:px-10">
      <div className="mx-auto max-w-6xl">
        <h2 className="font-display text-center text-4xl font-extrabold text-white md:text-5xl">
          What others are saying.
        </h2>
        <motion.div
          initial="hidden"
          whileInView="show"
          viewport={{ once: true, amount: 0.2 }}
          variants={{ show: { transition: { staggerChildren: 0.12 } } }}
          className="mt-12 grid gap-5 md:grid-cols-3"
        >
          {testimonials.map((item) => (
            <motion.article
              key={item.author}
              variants={{
                hidden: { opacity: 0, y: 24 },
                show: { opacity: 1, y: 0, transition: { duration: 0.35 } },
              }}
              whileHover={{ scale: 1.01, boxShadow: '0 8px 32px rgba(59,130,246,0.08)' }}
              className="rounded-xl border border-[#222] bg-[#141414] p-6"
            >
              <p className="font-body text-sm leading-relaxed text-[#d1d5db]">{item.quote}</p>
              <p className="font-metric mt-5 text-xs uppercase tracking-[0.2em] text-[#93c5fd]">{item.author}</p>
            </motion.article>
          ))}
        </motion.div>
      </div>
    </section>
  )
}
