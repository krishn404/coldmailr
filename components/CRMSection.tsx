'use client'

import { animate, motion, useInView, useMotionValue, useTransform } from 'framer-motion'
import { useEffect, useRef } from 'react'

function Counter({ to, suffix = '' }: { to: number; suffix?: string }) {
  const ref = useRef<HTMLSpanElement | null>(null)
  const inView = useInView(ref, { once: true, margin: '-20% 0px -20% 0px' })
  const value = useMotionValue(0)
  const rounded = useTransform(value, (latest) => Math.round(latest))

  useEffect(() => {
    if (!inView) return
    const controls = animate(value, to, { duration: 1.2, ease: 'easeOut' })
    return () => controls.stop()
  }, [inView, to, value])

  return (
    <span ref={ref} className="font-metric text-4xl font-bold text-white">
      <motion.span>{rounded}</motion.span>
      {suffix}
    </span>
  )
}

export function CRMSection() {
  return (
    <section id="features" className="px-6 py-24 md:px-10">
      <div className="mx-auto grid max-w-6xl gap-8 md:grid-cols-2">
        <motion.div
          whileHover={{ scale: 1.01, boxShadow: '0 8px 32px rgba(59,130,246,0.08)' }}
          className="rounded-xl border border-[#222] bg-[#141414] p-8"
        >
          <p className="font-body text-sm uppercase tracking-[0.24em] text-[#6b7280]">Performance</p>
          <div className="mt-8 grid gap-6 sm:grid-cols-2">
            <div>
              <Counter to={47} suffix=".2%" />
              <p className="font-body mt-2 text-sm text-[#9ca3af]">Average open rate</p>
            </div>
            <div>
              <Counter to={24819} />
              <p className="font-body mt-2 text-sm text-[#9ca3af]">Emails delivered</p>
            </div>
          </div>
        </motion.div>

        <motion.div
          whileHover={{ scale: 1.01, boxShadow: '0 8px 32px rgba(59,130,246,0.08)' }}
          className="rounded-xl border border-[#222] bg-[#141414] p-8"
        >
          <p className="font-body text-sm uppercase tracking-[0.24em] text-[#6b7280]">Audience Segments</p>
          <div className="mt-8 space-y-6">
            {[
              ['Startup Founders', 72],
              ['Agency Owners', 58],
              ['Hiring Managers', 44],
            ].map(([label, value], i) => (
              <div key={label as string}>
                <div className="mb-2 flex items-center justify-between">
                  <span className="font-body text-sm text-[#cfcfcf]">{label}</span>
                  <span className="font-metric text-xs text-[#9ca3af]">{value}%</span>
                </div>
                <div className="h-2 rounded-full bg-[#0f0f0f]">
                  <motion.div
                    initial={{ width: 0 }}
                    whileInView={{ width: `${value}%` }}
                    viewport={{ once: true, amount: 0.6 }}
                    transition={{ duration: 0.9, delay: i * 0.12 }}
                    className="h-2 rounded-full bg-[#3b82f6]"
                  />
                </div>
              </div>
            ))}
          </div>
        </motion.div>
      </div>
    </section>
  )
}
