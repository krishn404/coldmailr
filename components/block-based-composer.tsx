'use client'

import { useEffect, useMemo, useState } from 'react'
import { ArrowRight, Check, ChevronRight, Loader2, Maximize2, Minimize2, Sparkles, X } from 'lucide-react'
import { useBlockComposer } from '@/lib/hooks/use-block-composer'
import { Intent } from '@/lib/types/block-system'
import { toast } from 'sonner'

interface BlockBasedComposerProps {
  isOpen: boolean
  onClose: () => void
  fromEmail?: string | null
  canSend: boolean
  onSaved?: () => void
  onSent?: (broadcastId: string) => void
  initialBroadcast?: unknown
  selectedTemplate?: unknown
}

export function BlockBasedComposer({
  isOpen,
  onClose,
  fromEmail,
  canSend,
  onSaved,
  onSent,
}: BlockBasedComposerProps) {
  const composer = useBlockComposer()
  const [step, setStep] = useState(1)
  const [subject, setSubject] = useState('')
  const [isGenerating, setIsGenerating] = useState(false)
  const [isSending, setIsSending] = useState(false)
  const [isFullscreen, setIsFullscreen] = useState(false)

  useEffect(() => {
    if (!isOpen) return
    setStep(1)
    setSubject('')
    setIsFullscreen(false)
    composer.updateContext({
      recipient_name: '',
      recipient_email: '',
      company_name: '',
      recipient_role: '',
      company_industry: '',
      context_insights: '',
    })
  }, [isOpen])

  const steps = [
    { id: 1, label: 'Intent' },
    { id: 2, label: 'Context' },
    { id: 3, label: 'Review & Send' },
  ]

  const intentCards: Array<{
    value: Intent
    title: string
    subtitle: string
  }> = [
    {
      value: 'cold',
      title: 'Cold Outreach',
      subtitle: 'First-time contact focused on value',
    },
    {
      value: 'freelance',
      title: 'Freelance Pitch',
      subtitle: 'Service or portfolio offering',
    },
    {
      value: 'follow_up',
      title: 'Follow-up',
      subtitle: 'Reengagement after first contact',
    },
  ]

  const context = composer.state.context
  const contextInsights = context.context_insights || ''
  const previewBody = useMemo(() => {
    if (composer.state.blocks.length > 0) {
      return composer.state.blocks.map((block) => block.content).join('\n\n')
    }

    const recipient = context.recipient_name?.trim() || 'there'
    const company = context.company_name?.trim() || 'your team'
    const roleLine = context.recipient_role?.trim() ? ` ${context.recipient_role} at` : ''
    const note = contextInsights.trim()

    return [
      `Hi ${recipient},`,
      '',
      `I noticed ${company} and wanted to share a quick idea that could help.`,
      roleLine ? `I believe this could be especially relevant for your work as${roleLine} ${company}.` : '',
      note ? `Context: ${note}` : 'I can tailor this based on your current goals and priorities.',
      '',
      'Open to a quick 15-min conversation this week?',
      '',
      'Best,',
      '[Your Name]',
    ]
      .filter(Boolean)
      .join('\n')
  }, [composer.state.blocks, context.recipient_name, context.company_name, context.recipient_role, contextInsights])

  const previewSubject = useMemo(() => {
    if (subject.trim()) return subject
    const company = context.company_name?.trim() || 'your team'
    return `Quick idea to help ${company} drive better outcomes`
  }, [subject, context.company_name])

  const requiredContextReady = Boolean(
    context.recipient_name?.trim() &&
      context.recipient_email?.trim() &&
      context.company_name?.trim() &&
      contextInsights.trim(),
  )

  const handleGenerateEmail = async () => {
    if (!requiredContextReady) {
      toast.error('Please fill all required context fields first')
      return
    }

    const firstStrategyId = composer.state.strategies[0]?.id
    if (!firstStrategyId) {
      toast.error('No strategy available for this intent yet. Please try again.')
      return
    }

    setIsGenerating(true)
    try {
      await composer.selectStrategy(firstStrategyId)

      const response = await fetch('/api/generate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          to: context.recipient_email,
          mode: composer.state.intent === 'follow_up' ? 'follow-up' : composer.state.intent,
          context: contextInsights,
          recipient_name: context.recipient_name,
          opportunity_type: composer.state.intent,
          goal: 'reply',
          variations: 1,
        }),
      })

      if (response.ok) {
        const text = await response.text()
        const firstLine = text.replace(/\r/g, '').split('\n')[0]?.trim() || ''
        const generatedSubject = firstLine.toLowerCase().startsWith('subject:')
          ? firstLine.replace(/^subject:\s*/i, '').trim()
          : firstLine
        if (generatedSubject) setSubject(generatedSubject)
      }

      setStep(3)
      onSaved?.()
    } catch (error) {
      console.error('[generate email error]', error)
      toast.error('Failed to generate email')
    } finally {
      setIsGenerating(false)
    }
  }

  const handleSend = async () => {
    if (!canSend) {
      toast.error('Connect Gmail first to send emails')
      return
    }
    if (!context.recipient_email || !previewSubject.trim() || !previewBody.trim()) {
      toast.error('Missing required email details')
      return
    }

    setIsSending(true)
    try {
      const response = await fetch('/api/broadcasts', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          to_email: context.recipient_email,
          from_email: fromEmail,
          subject: previewSubject,
          body: previewBody,
          context: contextInsights,
          status: 'sent',
          sent_at: new Date().toISOString(),
          body_structure: {
            blocks: composer.state.blocks.map((b) => ({
              type: b.block_type,
              content: b.content,
            })),
            strategy_id: composer.state.selectedStrategy?.id,
          },
        }),
      })

      if (!response.ok) throw new Error('Failed to send email')
      const data = await response.json()
      toast.success('Email sent!')
      onSent?.(data.id)
      onClose()
    } catch (error) {
      console.error('[send error]', error)
      toast.error('Error sending email')
    } finally {
      setIsSending(false)
    }
  }

  if (!isOpen) return null

  return (
    <div className={`fixed inset-0 z-50 flex bg-black/45 backdrop-blur-sm ${isFullscreen ? 'p-0' : 'items-center justify-center p-4'}`}>
      <div
        className={`flex w-full flex-col overflow-hidden border bg-[#141414] shadow-[0_20px_55px_rgba(0,0,0,0.5)] ${
          isFullscreen
            ? 'h-screen max-h-screen max-w-none rounded-none border-transparent'
            : 'h-[88vh] max-h-[880px] max-w-[1180px] rounded-2xl border-[#2a2a2a]'
        }`}
      >
        <div className="flex items-center justify-between border-b border-[#2a2a2a] bg-[#141414] px-6 py-4">
          <div>
            <h2 className="text-lg font-semibold text-white">Email Composer</h2>
            <p className="text-sm text-[#8a8a8a]">Create a high-impact email in minutes</p>
          </div>
          <div className="flex items-center gap-2">
            <button
              onClick={() => setIsFullscreen((prev) => !prev)}
              className="rounded-lg p-2 text-[#9a9a9a] transition-colors hover:bg-[#1a1a1a] hover:text-white"
              title={isFullscreen ? 'Exit fullscreen' : 'Fullscreen'}
            >
              {isFullscreen ? <Minimize2 className="h-5 w-5" /> : <Maximize2 className="h-5 w-5" />}
            </button>
            <button
              onClick={onClose}
              className="rounded-lg p-2 text-[#9a9a9a] transition-colors hover:bg-[#1a1a1a] hover:text-white"
            >
              <X className="h-5 w-5" />
            </button>
          </div>
        </div>

        <div className="border-b border-[#2a2a2a] bg-[#141414] px-6 py-3">
          <div className="mx-auto flex w-full max-w-[780px] items-center justify-between">
            {steps.map((item, idx) => {
              const active = step === item.id
              const complete = step > item.id
              return (
                <div key={item.id} className="flex flex-1 items-center">
                  <button
                    onClick={() => setStep(item.id)}
                    className={`inline-flex items-center gap-2 rounded-full px-3 py-1.5 text-sm transition-colors ${
                      active
                        ? 'bg-[#1f1f1f] text-white'
                        : complete
                          ? 'text-white'
                          : 'text-[#8a8a8a]'
                    }`}
                  >
                    <span
                      className={`flex h-5 w-5 items-center justify-center rounded-full border text-xs ${
                        active
                          ? 'border-[#3a3a3a] bg-[#0a0a0a] text-white'
                          : complete
                            ? 'border-[#3a3a3a] bg-[#1a1a1a] text-white'
                            : 'border-[#333333] bg-[#0a0a0a] text-[#8a8a8a]'
                      }`}
                    >
                      {complete ? <Check className="h-3.5 w-3.5" /> : item.id}
                    </span>
                    {item.label}
                  </button>
                  {idx < steps.length - 1 ? <ChevronRight className="mx-2 h-4 w-4 text-[#4a4a4a]" /> : null}
                </div>
              )
            })}
          </div>
        </div>

        <div className="flex-1 overflow-y-auto p-6">
          {step === 1 ? (
            <div className="mx-auto max-w-[980px]">
              <h3 className="text-xl font-semibold text-white">1. Choose your email intent</h3>
              <p className="mt-1 text-sm text-[#8a8a8a]">Select the goal of your email so we can tailor it for maximum impact.</p>

              <div className="mt-6 grid grid-cols-1 gap-4 md:grid-cols-3">
                {intentCards.map((card) => {
                  const active = composer.state.intent === card.value
                  return (
                    <button
                      key={card.value}
                      onClick={() => composer.setIntent(card.value)}
                      className={`rounded-2xl border bg-[#0f0f0f] p-5 text-left shadow-sm transition-all ${
                        active
                          ? 'border-white ring-1 ring-white/30'
                          : 'border-[#2a2a2a] hover:border-[#3a3a3a] hover:shadow-md'
                      }`}
                    >
                      <div className="flex items-center justify-between">
                        <h4 className="text-lg font-semibold text-white">{card.title}</h4>
                        {active ? (
                          <span className="rounded-full bg-white px-2 py-1 text-xs font-medium text-black">Selected</span>
                        ) : null}
                      </div>
                      <p className="mt-2 text-sm text-[#8a8a8a]">{card.subtitle}</p>
                    </button>
                  )
                })}
              </div>
            </div>
          ) : null}

          {step === 2 ? (
            <div className="grid h-full grid-cols-1 gap-5 lg:grid-cols-[1.05fr_0.95fr]">
              <div className="rounded-2xl border border-[#2a2a2a] bg-[#0f0f0f] p-5 shadow-sm">
                <h3 className="text-lg font-semibold text-white">2. Add context about your recipient</h3>
                <p className="mt-1 text-sm text-[#8a8a8a]">The more context you provide, the better your email will be.</p>

                <div className="mt-5 grid grid-cols-1 gap-4 md:grid-cols-2">
                  <LabeledInput
                    label="Recipient Name"
                    value={context.recipient_name || ''}
                    onChange={(value) => composer.updateContext({ recipient_name: value })}
                    placeholder="Jane Smith"
                    required
                  />
                  <LabeledInput
                    label="Recipient Email"
                    value={context.recipient_email || ''}
                    onChange={(value) => composer.updateContext({ recipient_email: value })}
                    placeholder="jane.smith@acmecorp.com"
                    required
                    type="email"
                  />
                  <LabeledInput
                    label="Company Name"
                    value={context.company_name || ''}
                    onChange={(value) => composer.updateContext({ company_name: value })}
                    placeholder="Acme Corp"
                    required
                  />
                  <LabeledInput
                    label="Role (Optional)"
                    value={context.recipient_role || ''}
                    onChange={(value) => composer.updateContext({ recipient_role: value })}
                    placeholder="Marketing Manager"
                  />
                  <LabeledInput
                    label="Industry (Optional)"
                    value={context.company_industry || ''}
                    onChange={(value) => composer.updateContext({ company_industry: value })}
                    placeholder="SaaS"
                  />
                </div>

                <div className="mt-4">
                  <label className="mb-1.5 block text-sm font-medium text-white">
                    Message Context <span className="text-[#8a8a8a]">(Required)</span>
                  </label>
                  <textarea
                    value={contextInsights}
                    onChange={(e) => composer.updateContext({ context_insights: e.target.value })}
                    placeholder="We help SaaS companies increase demo bookings through targeted outreach and conversion optimization."
                    maxLength={600}
                    className="h-36 w-full resize-none rounded-xl border border-[#2a2a2a] bg-[#171717] px-3.5 py-3 text-sm text-white shadow-sm outline-none transition-all placeholder:text-[#666] focus:border-[#3a3a3a]"
                  />
                  <div className="mt-2 flex items-center justify-between text-xs">
                    <p className="text-[#8a8a8a]">Tip: Mention a challenge, goal, or recent initiative for more personalized emails.</p>
                    <span className="text-[#8a8a8a]">{contextInsights.length} / 600</span>
                  </div>
                </div>
              </div>

              <div className="rounded-2xl border border-[#2a2a2a] bg-[#0f0f0f] p-5 shadow-sm">
                <div className="flex items-center justify-between">
                  <p className="text-sm font-medium text-white">Live preview <span className="text-[#8a8a8a]">• Updates as you type</span></p>
                  <span className="rounded-full bg-[#1a1a1a] px-2.5 py-1 text-xs font-medium text-white">
                    {intentCards.find((item) => item.value === composer.state.intent)?.title || 'Intent'}
                  </span>
                </div>
                <div className="mt-4 rounded-xl border border-[#2a2a2a] bg-[#171717] p-4">
                  <p className="text-sm font-medium text-white">Subject: <span className="font-normal text-[#d0d0d0]">{previewSubject}</span></p>
                  <hr className="my-3 border-[#2a2a2a]" />
                  <pre className="whitespace-pre-wrap text-sm leading-6 text-[#d0d0d0]">{previewBody}</pre>
                </div>
              </div>
            </div>
          ) : null}

          {step === 3 ? (
            <div className="mx-auto max-w-[900px] rounded-2xl border border-[#2a2a2a] bg-[#0f0f0f] p-6 shadow-sm">
              <div className="mb-4 flex items-center gap-2 text-white">
                <Sparkles className="h-4 w-4" />
                <p className="text-sm font-medium">Review your finalized email before sending.</p>
              </div>
              <label className="mb-1.5 block text-sm font-medium text-white">Subject</label>
              <input
                value={subject}
                onChange={(e) => setSubject(e.target.value)}
                className="mb-4 h-11 w-full rounded-xl border border-[#2a2a2a] bg-[#171717] px-3.5 text-sm text-white outline-none focus:border-[#3a3a3a]"
              />
              <label className="mb-1.5 block text-sm font-medium text-white">Email Body</label>
              <textarea
                value={previewBody}
                readOnly
                className="h-[360px] w-full resize-none rounded-xl border border-[#2a2a2a] bg-[#171717] px-4 py-3 text-sm leading-6 text-[#d0d0d0] outline-none"
              />
            </div>
          ) : null}
        </div>

        <div className="flex items-center justify-between border-t border-[#2a2a2a] bg-[#141414] px-6 py-4">
          <div className="text-sm text-[#8a8a8a]">
            {step === 2 && !requiredContextReady ? 'Complete required fields to generate an email.' : ' '}
          </div>

          <div className="flex items-center gap-2.5">
            <button
              onClick={onClose}
              className="rounded-xl border border-[#2a2a2a] px-4 py-2.5 text-sm font-medium text-[#9a9a9a] transition-colors hover:bg-[#1a1a1a] hover:text-white"
            >
              Cancel
            </button>
            <button
              onClick={() => setStep((prev) => Math.max(1, prev - 1))}
              disabled={step === 1 || isGenerating || isSending}
              className="rounded-xl border border-[#2a2a2a] px-4 py-2.5 text-sm font-medium text-[#9a9a9a] transition-colors hover:bg-[#1a1a1a] hover:text-white disabled:cursor-not-allowed disabled:opacity-50"
            >
              Back
            </button>
            <button
              onClick={() => {
                if (step === 1) setStep(2)
                else if (step === 2) void handleGenerateEmail()
                else void handleSend()
              }}
              disabled={
                isGenerating ||
                isSending ||
                (step === 2 && !requiredContextReady) ||
                (step === 3 && (!subject.trim() || !canSend))
              }
              className="inline-flex items-center gap-2 rounded-xl bg-white px-5 py-2.5 text-sm font-semibold text-black transition-colors hover:bg-[#f0f0f0] disabled:cursor-not-allowed disabled:opacity-50"
            >
              {isGenerating || isSending ? <Loader2 className="h-4 w-4 animate-spin" /> : null}
              {step === 1 ? (
                <>
                  Continue
                  <ArrowRight className="h-4 w-4" />
                </>
              ) : null}
              {step === 2 ? (isGenerating ? 'Generating...' : 'Generate Email') : null}
              {step === 3 ? (isSending ? 'Sending...' : 'Send') : null}
            </button>
          </div>
        </div>
      </div>
    </div>
  )
}

function LabeledInput({
  label,
  value,
  onChange,
  placeholder,
  required,
  type = 'text',
}: {
  label: string
  value: string
  onChange: (value: string) => void
  placeholder: string
  required?: boolean
  type?: 'text' | 'email'
}) {
  return (
    <div>
      <label className="mb-1.5 block text-sm font-medium text-white">
        {label}
        {required ? <span className="text-[#8a8a8a]"> (Required)</span> : null}
      </label>
      <input
        type={type}
        value={value}
        onChange={(e) => onChange(e.target.value)}
        placeholder={placeholder}
        className="h-11 w-full rounded-xl border border-[#2a2a2a] bg-[#171717] px-3.5 text-sm text-white shadow-sm outline-none transition-all placeholder:text-[#666] focus:border-[#3a3a3a]"
      />
    </div>
  )
}
