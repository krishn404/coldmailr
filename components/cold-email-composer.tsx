'use client'

import { useState, useRef, useEffect } from 'react'
import { X, Maximize2, Minimize2, ChevronDown } from 'lucide-react'
import { DeliverabilityScore } from '@/components/deliverability-score'
import { ContactPreview } from '@/components/contact-preview'
import { BroadcastRecord } from '@/components/broadcasts-types'

interface ColdEmailComposerProps {
  isOpen: boolean
  onClose: () => void
  fromEmail?: string | null
  canSend: boolean
  initialBroadcast?: BroadcastRecord | null
  onSaved?: () => void
}

type BroadcastApiResponse = {
  data?: BroadcastRecord
  error?: string | null
}

export function ColdEmailComposer({
  isOpen,
  onClose,
  fromEmail,
  canSend,
  initialBroadcast,
  onSaved,
}: ColdEmailComposerProps) {
  const [recipient, setRecipient] = useState('')
  const [subject, setSubject] = useState('')
  const [previewText, setPreviewText] = useState('')
  const [body, setBody] = useState('')
  const [signature, setSignature] = useState(fromEmail || '')
  const [selectedIdentity, setSelectedIdentity] = useState(fromEmail || '')
  const [showAdvancedFormatting, setShowAdvancedFormatting] = useState(false)
  const [isMaximized, setIsMaximized] = useState(false)
  const [isSending, setIsSending] = useState(false)
  const [isGenerating, setIsGenerating] = useState(false)
  const [mode, setMode] = useState<'cold' | 'freelance' | 'follow-up'>('cold')
  const [contextNotes, setContextNotes] = useState('')
  const [variations, setVariations] = useState(1)
  const [broadcastId, setBroadcastId] = useState<string | null>(null)
  const bodyRef = useRef<HTMLTextAreaElement>(null)

  useEffect(() => {
    if (fromEmail) {
      setSignature(fromEmail)
      setSelectedIdentity(fromEmail)
    }
  }, [fromEmail])

  useEffect(() => {
    if (!isOpen) return

    if (initialBroadcast) {
      setBroadcastId(initialBroadcast.id)
      setRecipient(initialBroadcast.toEmail || '')
      setSubject(initialBroadcast.subject === '(No subject)' ? '' : initialBroadcast.subject)
      setBody(initialBroadcast.body || '')
      setContextNotes(initialBroadcast.context || '')
      return
    }

    setBroadcastId(null)
    setRecipient('')
    setSubject('')
    setPreviewText('')
    setBody('')
    setContextNotes('')
    setMode('cold')
    setVariations(1)
  }, [initialBroadcast, isOpen])

  // Calculate deliverability metrics
  const linksCount = (body.match(/https?:\/\/\S+/g) || []).length
  const emailLength = body.length
  const spamTriggers = detectSpamTriggers(body)

  // Calculate token count (rough estimate: ~4 chars per token)
  const tokenCount = Math.ceil((recipient.length + subject.length + body.length) / 4)

  if (!isOpen) return null

  const handleSend = async () => {
    if (!canSend) {
      alert('Connect Gmail first to send emails')
      return
    }

    if (!recipient || !subject || !body) {
      alert('Please fill in all required fields')
      return
    }

    setIsSending(true)
    try {
      let resolvedBroadcastId = broadcastId
      if (!resolvedBroadcastId) {
        const createResponse = await fetch('/api/broadcasts', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            toEmail: recipient,
            subject,
            body,
            context: contextNotes,
            status: 'draft',
            fromEmail: selectedIdentity || fromEmail || '',
          }),
        })
        if (!createResponse.ok) {
          throw new Error('Unable to create broadcast before sending')
        }
        const created = (await createResponse.json()) as BroadcastApiResponse
        if (!created?.data?.id) {
          throw new Error('Unable to create broadcast before sending')
        }
        resolvedBroadcastId = created.data.id
        setBroadcastId(created.data.id)
      }

      const idempotencyKey = crypto.randomUUID()
      const response = await fetch('/api/gmail/send', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          to: recipient,
          subject,
          body,
          context: contextNotes,
          fromEmail: selectedIdentity || fromEmail || '',
          broadcastId: resolvedBroadcastId,
          idempotencyKey,
        }),
      })

      if (!response.ok) {
        const data = (await response.json()) as { error?: string }
        throw new Error(data.error || 'Failed to send email')
      }

      alert('Email sent successfully')
      onSaved?.()
      onClose()
    } catch (error) {
      alert(error instanceof Error ? error.message : 'Failed to send email')
    } finally {
      setIsSending(false)
    }
  }

  const parseSubjectAndBody = (generated: string) => {
    const lines = generated.replace(/\r/g, '').split('\n')
    const firstLine = lines[0]?.trim() || ''
    if (firstLine.toLowerCase().startsWith('subject:')) {
      const nextSubject = firstLine.replace(/^subject:\s*/i, '').trim()
      const nextBody = lines.slice(1).join('\n').trim()
      if (nextSubject) setSubject(nextSubject)
      if (nextBody) setBody(nextBody)
      return
    }

    setBody(generated.trim())
  }

  const handleGenerateDraft = async () => {
    if (!recipient || !contextNotes.trim()) {
      alert('Please fill recipient and Context / Notes first')
      return
    }

    setIsGenerating(true)
    try {
      const response = await fetch('/api/generate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          to: recipient,
          mode,
          context: contextNotes,
          recipient_name: recipient.split('@')[0]?.split('.')[0] || '',
          opportunity_type: mode === 'cold' ? 'career' : mode,
          goal: 'reply',
          variations,
        }),
      })

      if (!response.ok) {
        const data = (await response.json()) as { error?: string }
        throw new Error(data.error || 'Failed to generate draft')
      }

      const text = await response.text()
      parseSubjectAndBody(text)
    } catch (error) {
      alert(error instanceof Error ? error.message : 'Failed to generate draft')
    } finally {
      setIsGenerating(false)
    }
  }

  const handleSaveDraft = async () => {
    const payload = {
      toEmail: recipient,
      subject,
      body,
      context: contextNotes,
      status: 'draft',
      fromEmail: selectedIdentity || fromEmail || '',
    }

    const response = await fetch(broadcastId ? `/api/broadcasts/${broadcastId}` : '/api/broadcasts', {
      method: broadcastId ? 'PUT' : 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload),
    })

    if (!response.ok) {
      alert('Failed to save draft')
      return
    }

    const saved = (await response.json()) as BroadcastApiResponse
    if (!saved?.data?.id) {
      alert('Failed to save draft')
      return
    }
    setBroadcastId(saved.data.id)
    onSaved?.()
    alert('Draft saved')
  }

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
      <div
        className={`bg-[#1a1a1a] border border-[#2a2a2a] rounded-lg shadow-2xl flex flex-col transition-all ${
          isMaximized ? 'w-[90vw] h-[90vh]' : 'w-[800px] h-[600px]'
        }`}
      >
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-[#2a2a2a]">
          <h2 className="text-base font-semibold text-white">New message</h2>
          <div className="flex items-center gap-2">
            <button
              onClick={() => setIsMaximized(!isMaximized)}
              className="p-1.5 hover:bg-[#2a2a2a] rounded transition-colors"
            >
              {isMaximized ? (
                <Minimize2 className="w-4 h-4 text-[#999999]" />
              ) : (
                <Maximize2 className="w-4 h-4 text-[#999999]" />
              )}
            </button>
            <button
              onClick={onClose}
              className="p-1.5 hover:bg-[#2a2a2a] rounded transition-colors"
            >
              <X className="w-4 h-4 text-[#999999]" />
            </button>
          </div>
        </div>

        {/* Content */}
        <div className="flex-1 overflow-y-auto px-6 py-6 space-y-6">
          {/* Recipient Field */}
          <div>
            <label className="text-xs font-medium text-[#666666] uppercase tracking-wider block mb-2">
              To
            </label>
            <input
              type="email"
              value={recipient}
              onChange={(e) => setRecipient(e.target.value)}
              placeholder="recipient@company.com"
              className="w-full bg-[#0a0a0a] border border-[#2a2a2a] rounded-lg px-4 py-2.5 text-white placeholder-[#666666] focus:border-[#3a3a3a] focus:outline-none transition-colors"
            />
          </div>

          {/* Subject Field */}
          <div>
            <label className="text-xs font-medium text-[#666666] uppercase tracking-wider block mb-2">
              Subject
            </label>
            <input
              type="text"
              value={subject}
              onChange={(e) => setSubject(e.target.value)}
              placeholder="RE: Your inquiry"
              className="w-full bg-[#0a0a0a] border border-[#2a2a2a] rounded-lg px-4 py-2.5 text-white placeholder-[#666666] focus:border-[#3a3a3a] focus:outline-none transition-colors"
            />
          </div>

          {/* Preview Text Field */}
          <div>
            <label className="text-xs font-medium text-[#666666] uppercase tracking-wider block mb-2">
              Preview Text <span className="text-[#555555]">(optional)</span>
            </label>
            <input
              type="text"
              value={previewText}
              onChange={(e) => setPreviewText(e.target.value)}
              placeholder="Brief preview for email clients"
              className="w-full bg-[#0a0a0a] border border-[#2a2a2a] rounded-lg px-4 py-2.5 text-white placeholder-[#666666] focus:border-[#3a3a3a] focus:outline-none transition-colors"
            />
          </div>

          {/* Body */}
          <div>
            <label className="text-xs font-medium text-[#666666] uppercase tracking-wider block mb-2">
              Mode
            </label>
            <div className="flex gap-2">
              {(['cold', 'freelance', 'follow-up'] as const).map((item) => (
                <button
                  key={item}
                  onClick={() => setMode(item)}
                  className={`px-3 py-2 text-xs rounded border transition-colors ${
                    mode === item
                      ? 'bg-white text-black border-white'
                      : 'bg-[#0a0a0a] text-[#999999] border-[#2a2a2a] hover:text-white'
                  }`}
                >
                  {item}
                </button>
              ))}
            </div>
          </div>

          <div>
            <label className="text-xs font-medium text-[#666666] uppercase tracking-wider block mb-2">
              Context / Notes
            </label>
            <textarea
              value={contextNotes}
              onChange={(e) => setContextNotes(e.target.value)}
              placeholder="Recipient details, company, role/opportunity, prior interaction, portfolio links, value proposition, proof, constraints, desired CTA..."
              className="w-full h-32 bg-[#0a0a0a] border border-[#2a2a2a] rounded-lg px-4 py-3 text-white placeholder-[#666666] focus:border-[#3a3a3a] focus:outline-none transition-colors text-sm resize-none"
            />
            <div className="flex items-center justify-between mt-2">
              <label className="text-xs text-[#666666]">
                Variations:
                <select
                  value={variations}
                  onChange={(e) => setVariations(Number(e.target.value))}
                  className="ml-2 bg-[#0a0a0a] border border-[#2a2a2a] rounded px-2 py-1 text-[#999999]"
                >
                  <option value={1}>1</option>
                  <option value={2}>2</option>
                  <option value={3}>3</option>
                </select>
              </label>
              <button
                onClick={handleGenerateDraft}
                disabled={isGenerating || !recipient || !contextNotes.trim()}
                className="px-4 py-2 text-sm font-semibold text-white bg-black border border-[#3a3a3a] rounded-lg hover:bg-[#1a1a1a] disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
              >
                {isGenerating ? 'Generating...' : 'Generate Draft'}
              </button>
            </div>
          </div>

          <div>
            <div className="flex items-center justify-between mb-2">
              <label className="text-xs font-medium text-[#666666] uppercase tracking-wider">
                Message
              </label>
              <button
                onClick={() => setShowAdvancedFormatting(!showAdvancedFormatting)}
                className="text-xs text-[#666666] hover:text-[#999999] transition-colors flex items-center gap-1"
              >
                <span>Advanced</span>
                <ChevronDown className={`w-3 h-3 transition-transform ${showAdvancedFormatting ? 'rotate-180' : ''}`} />
              </button>
            </div>

            <textarea
              ref={bodyRef}
              value={body}
              onChange={(e) => setBody(e.target.value)}
              placeholder="Start typing your cold email here..."
              className="w-full h-48 bg-[#0a0a0a] border border-[#2a2a2a] rounded-lg px-4 py-3 text-white placeholder-[#666666] focus:border-[#3a3a3a] focus:outline-none transition-colors font-mono text-sm resize-none"
            />

            {/* Advanced Formatting */}
            {showAdvancedFormatting && (
              <div className="mt-3 flex items-center gap-2 p-3 bg-[#0a0a0a] rounded-lg border border-[#2a2a2a]">
                <button className="px-2 py-1 text-xs font-semibold text-[#999999] hover:text-white hover:bg-[#2a2a2a] rounded transition-colors">
                  B
                </button>
                <button className="px-2 py-1 text-xs italic text-[#999999] hover:text-white hover:bg-[#2a2a2a] rounded transition-colors">
                  I
                </button>
                <button className="px-2 py-1 text-xs underline text-[#999999] hover:text-white hover:bg-[#2a2a2a] rounded transition-colors">
                  U
                </button>
                <div className="flex-1" />
                <button className="px-2 py-1 text-xs text-[#999999] hover:text-white hover:bg-[#2a2a2a] rounded transition-colors">
                  Link
                </button>
              </div>
            )}
          </div>

          {/* Signature Section */}
          <div>
            <label className="text-xs font-medium text-[#666666] uppercase tracking-wider block mb-2">
              From
            </label>
            <div className="relative">
              <select
                value={selectedIdentity}
                onChange={(e) => setSelectedIdentity(e.target.value)}
                className="w-full bg-[#0a0a0a] border border-[#2a2a2a] rounded-lg px-4 py-2.5 text-white focus:border-[#3a3a3a] focus:outline-none transition-colors appearance-none pr-10"
              >
                <option value={selectedIdentity}>{selectedIdentity || 'No connected account'}</option>
              </select>
              <ChevronDown className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-[#666666] pointer-events-none" />
            </div>
          </div>

          {/* Contact Preview */}
          {recipient && <ContactPreview email={recipient} tokenCount={tokenCount} />}

          {/* Deliverability Score */}
          <DeliverabilityScore
            metrics={{
              linksCount,
              emailLength,
              spamTriggers,
            }}
          />
        </div>

        {/* Footer Actions */}
        <div className="flex items-center justify-end gap-3 px-6 py-4 border-t border-[#2a2a2a] bg-[#0a0a0a]">
          <button
            onClick={handleSaveDraft}
            className="px-4 py-2 text-sm font-medium text-[#999999] bg-[#1a1a1a] border border-[#2a2a2a] rounded-lg hover:bg-[#2a2a2a] transition-colors"
          >
            Save Draft
          </button>
          <button
            onClick={handleSend}
            disabled={!recipient || !subject || !body || isSending || !canSend}
            className="px-6 py-2 text-sm font-semibold text-white bg-black border border-[#3a3a3a] rounded-lg hover:bg-[#1a1a1a] disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
          >
            {isSending ? 'Sending...' : 'Send Now'}
          </button>
        </div>
      </div>
    </div>
  )
}

function detectSpamTriggers(text: string): string[] {
  const triggers: string[] = []

  // Basic spam pattern detection
  if (text.match(/\b(click here|buy now|limited time|act now|urgent|free money)\b/i)) {
    triggers.push('sales-language')
  }
  if (text.match(/\b(£|€|\$)\s*\d+|\d+\s*(?:pounds|euros|dollars)/i)) {
    triggers.push('currency-amounts')
  }
  if (text.match(/!!!+|[A-Z]{5,}/)) {
    triggers.push('excessive-caps')
  }

  return triggers
}
