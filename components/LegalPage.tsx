import Link from 'next/link'
import { Footer } from '@/components/Footer'
import { Navbar } from '@/components/Navbar'

type LegalSection = {
  title: string
  body: string[]
}

interface LegalPageProps {
  eyebrow: string
  title: string
  description: string
  sections: LegalSection[]
}

export function LegalPage({ eyebrow, title, description, sections }: LegalPageProps) {
  return (
    <div className="grain-overlay min-h-screen bg-[#0a0a0a] text-white">
      <Navbar />
      <main>
        <section className="relative overflow-hidden px-6 pb-12 pt-24 md:px-10 md:pb-16 md:pt-32">
          <div className="pointer-events-none absolute -left-24 top-6 h-80 w-80 rounded-full border border-white/10 bg-gradient-to-br from-white/10 to-transparent opacity-20 blur-2xl" />
          <div className="pointer-events-none absolute -right-24 -top-4 h-96 w-96 rounded-full border border-white/10 bg-gradient-to-bl from-white/10 to-transparent opacity-20 blur-2xl" />

          <div className="mx-auto max-w-4xl text-center">
            <p className="mb-7 inline-flex items-center rounded-full border border-[#3b82f6] bg-[#3b82f6]/10 px-4 py-1.5 text-xs text-[#93c5fd]">
              {eyebrow}
            </p>
            <h1 className="font-display text-5xl font-extrabold leading-[1.05] text-white md:text-7xl">
              {title}
            </h1>
            <p className="font-body mx-auto mt-6 max-w-2xl text-lg text-[#9ca3af]">{description}</p>
          </div>
        </section>

        <section className="px-6 pb-24 md:px-10">
          <div className="mx-auto max-w-4xl overflow-hidden rounded-2xl border border-[#222] bg-[#111111]">
            <div className="border-b border-[#222] px-6 py-5 md:px-8">
              <p className="font-body text-sm text-[#9ca3af]">Last updated: April 23, 2026</p>
            </div>
            <div className="space-y-8 p-6 md:p-8">
              {sections.map((section) => (
                <section key={section.title}>
                  <h2 className="font-display text-2xl font-bold text-white">{section.title}</h2>
                  <div className="mt-4 space-y-4">
                    {section.body.map((paragraph) => (
                      <p key={paragraph} className="font-body text-sm leading-7 text-[#b8b8b8]">
                        {paragraph}
                      </p>
                    ))}
                  </div>
                </section>
              ))}
              <div className="rounded-xl border border-[#222] bg-[#0f0f0f] p-5">
                <p className="font-body text-sm text-[#9ca3af]">
                  Questions about these terms, privacy practices, Google OAuth access, or data deletion can be sent to psyxdes@gmail.com.
                </p>
              </div>
              <div>
                <Link href="/" className="inline-flex rounded-md border border-white/30 px-5 py-3 text-sm font-semibold text-white transition-colors hover:border-white">
                  Back to Cold Mailr
                </Link>
              </div>
            </div>
          </div>
        </section>
      </main>
      <Footer />
    </div>
  )
}
