'use client'

import { useState, useRef, useEffect } from 'react'
import { X, Maximize2, Minimize2, ChevronDown, Sparkles, Bold, Italic, Underline, Link2, Plus } from 'lucide-react'
import { AnimatePresence, motion } from 'framer-motion'
import { toast } from 'sonner'
import { DeliverabilityScore } from '@/components/deliverability-score'
import { ContactPreview } from '@/components/contact-preview'
import { BroadcastRecord } from '@/components/broadcasts-types'
import { TemplateRecord } from '@/components/templates-types'

interface ColdEmailComposerProps {
  isOpen: boolean
  onClose: () => void
  fromEmail?: string | null
  canSend: boolean
  initialBroadcast?: BroadcastRecord | null
  selectedTemplate?: TemplateRecord | null
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
  selectedTemplate,
  onSaved,
}: ColdEmailComposerProps) {
  const [recipient, setRecipient] = useState('')
  const [recipientInput, setRecipientInput] = useState('')
  const [isRecipientEditing, setIsRecipientEditing] = useState(true)
  const [subject, setSubject] = useState('')
  const [body, setBody] = useState('')
  const [signature, setSignature] = useState(fromEmail || '')
  const [selectedIdentity, setSelectedIdentity] = useState(fromEmail || '')
  const [showAdvancedFormatting, setShowAdvancedFormatting] = useState(false)
  const [isMaximized, setIsMaximized] = useState(false)
  const [isSending, setIsSending] = useState(false)
  const [isGenerating, setIsGenerating] = useState(false)
  const [isGeneratingSubject, setIsGeneratingSubject] = useState(false)
  const [mode, setMode] = useState<'cold' | 'freelance' | 'follow-up'>('cold')
  const [contextNotes, setContextNotes] = useState('')
  const [variations, setVariations] = useState(1)
  const [broadcastId, setBroadcastId] = useState<string | null>(null)
  const [templateTone, setTemplateTone] = useState('professional')
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
      setRecipientInput(initialBroadcast.toEmail || '')
      setIsRecipientEditing(!(initialBroadcast.toEmail || '').trim())
      setSubject(initialBroadcast.subject === '(No subject)' ? '' : initialBroadcast.subject)
      setBody(initialBroadcast.body || '')
      setContextNotes(initialBroadcast.context || '')
      return
    }

    setBroadcastId(null)
    setRecipient('')
    setRecipientInput('')
    setIsRecipientEditing(true)
    setSubject('')
    setBody('')
    setContextNotes('')
    setMode('cold')
    setVariations(1)
  }, [initialBroadcast, isOpen])

  useEffect(() => {
    if (!isOpen || !selectedTemplate) return
    setSubject(selectedTemplate.subject || '')
    setBody(selectedTemplate.body || '')
    setContextNotes(selectedTemplate.context || '')
    setTemplateTone(selectedTemplate.tone || 'professional')
  }, [selectedTemplate, isOpen])

  // Calculate deliverability metrics
  const linksCount = (body.match(/https?:\/\/\S+/g) || []).length
  const emailLength = body.length
  const spamTriggers = detectSpamTriggers(body)

  // Calculate token count (rough estimate: ~4 chars per token)
  const tokenCount = Math.ceil((recipient.length + subject.length + body.length) / 4)

  if (!isOpen) return null

  const handleSend = async () => {
    if (!canSend) {
      toast.error('Connect Gmail first to send emails')
      return
    }

    if (!recipient || !subject || !body) {
      toast.error('Please fill in all required fields')
      return
    }
    const unresolvedTokens = `${subject}\n${body}`.match(/\{\{\s*[a-zA-Z0-9_]+\s*\}\}/g) ?? []
    if (unresolvedTokens.length > 0) {
      toast.error(`Replace personalization tokens before sending: ${[...new Set(unresolvedTokens)].join(', ')}`)
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

      toast.success('Email sent successfully')
      onSaved?.()
      onClose()
    } catch (error) {
      toast.error(error instanceof Error ? error.message : 'Failed to send email')
    } finally {
      setIsSending(false)
    }
  }

  const normalizeRecipient = (value: string) => value.trim().replace(/[,;]$/, '')

  const commitRecipient = () => {
    const normalized = normalizeRecipient(recipientInput)
    setRecipient(normalized)
    setRecipientInput(normalized)
    if (normalized) setIsRecipientEditing(false)
  }

  const recipientInitial = (recipient || '?').trim().charAt(0).toUpperCase()

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
      toast.error('Please fill recipient and Context / Notes first')
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
          constraints: `Use concrete recipient-ready wording. Do not use variable placeholders like {{firstName}} or {{Your Name}}. Keep tone ${templateTone}.`,
        }),
      })

      if (!response.ok) {
        const data = (await response.json()) as { error?: string }
        throw new Error(data.error || 'Failed to generate draft')
      }

      const text = await response.text()
      parseSubjectAndBody(text)
    } catch (error) {
      toast.error(error instanceof Error ? error.message : 'Failed to generate draft')
    } finally {
      setIsGenerating(false)
    }
  }

  const handleRegenerateSubject = async () => {
    if (!recipient || !(contextNotes.trim() || body.trim())) {
      toast.error('Add recipient and some context/message first')
      return
    }

    setIsGeneratingSubject(true)
    try {
      const response = await fetch('/api/generate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          to: recipient,
          mode,
          context: contextNotes.trim() || body,
          recipient_name: recipient.split('@')[0]?.split('.')[0] || '',
          opportunity_type: mode === 'cold' ? 'career' : mode,
          goal: 'reply',
          variations: 1,
        }),
      })

      if (!response.ok) {
        const data = (await response.json()) as { error?: string }
        throw new Error(data.error || 'Failed to generate subject')
      }

      const text = await response.text()
      const firstLine = text.replace(/\r/g, '').split('\n')[0]?.trim() || ''
      const generatedSubject = firstLine.toLowerCase().startsWith('subject:')
        ? firstLine.replace(/^subject:\s*/i, '').trim()
        : firstLine

      if (generatedSubject) {
        setSubject(generatedSubject)
      }
    } catch (error) {
      toast.error(error instanceof Error ? error.message : 'Failed to generate subject')
    } finally {
      setIsGeneratingSubject(false)
    }
  }

  const formatSelection = (formatter: (text: string) => string) => {
    const textarea = bodyRef.current
    if (!textarea) return
    const start = textarea.selectionStart
    const end = textarea.selectionEnd
    const selected = body.slice(start, end)
    const fallback = selected || 'text'
    const formatted = formatter(fallback)
    const next = body.slice(0, start) + formatted + body.slice(end)
    setBody(next)
    requestAnimationFrame(() => {
      textarea.focus()
      const cursor = start + formatted.length
      textarea.setSelectionRange(cursor, cursor)
    })
  }

  const insertLink = () => {
    const url = window.prompt('Enter URL')
    if (!url) return
    formatSelection((text) => `[${text}](${url})`)
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
      toast.error('Failed to save draft')
      return
    }

    const saved = (await response.json()) as BroadcastApiResponse
    if (!saved?.data?.id) {
      toast.error('Failed to save draft')
      return
    }
    setBroadcastId(saved.data.id)
    onSaved?.()
    toast.success('Draft saved')
  }

  const handleSaveAsTemplate = async () => {
    if (!subject.trim() || !body.trim()) {
      toast.error('Add subject and body before saving template')
      return
    }
    const fallbackContext = contextNotes.trim() || `Intent: outreach\nAudience: ${recipient || '{{recipient}}'}\nValue proposition: ${subject}`
    const useCase = mode
    const lengthHint = body.length < 500 ? 'short' : body.length < 900 ? 'medium' : 'long'

    const response = await fetch('/api/templates', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        name: subject,
        subject,
        context: fallbackContext,
        body,
        tone: templateTone,
        useCase,
        lengthHint,
        tags: [mode, templateTone].filter(Boolean),
        sourceBroadcastId: broadcastId,
      }),
    })
    if (!response.ok) {
      toast.error('Failed to save template')
      return
    }
    toast.success('Saved to Template Gallery')
  }

  const handleInsertTemplateSection = () => {
    if (!selectedTemplate?.body) {
      toast.error('Open from Template Gallery to insert sections')
      return
    }
    const sections = selectedTemplate.body.split(/\n\s*\n/).filter(Boolean)
    if (!sections.length) return
    const section = sections[0]
    const textarea = bodyRef.current
    if (!textarea) {
      setBody((prev) => (prev ? `${prev}\n\n${section}` : section))
      return
    }
    const start = textarea.selectionStart
    const end = textarea.selectionEnd
    const next = body.slice(0, start) + section + body.slice(end)
    setBody(next)
  }

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="fixed inset-0 bg-black/35 backdrop-blur-md flex items-center justify-center z-50"
    >
      <motion.div
        initial={{ opacity: 0, y: 18, scale: 0.98 }}
        animate={{ opacity: 1, y: 0, scale: 1 }}
        transition={{ duration: 0.2 }}
        className={`bg-[#141414]/85 border border-white/10 rounded-lg shadow-2xl backdrop-blur-xl flex flex-col overflow-hidden transition-all ${
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
            <div className="w-full min-h-[44px] bg-[#0a0a0a] border border-[#2a2a2a] rounded-lg px-2 py-1.5 focus-within:border-[#3a3a3a] transition-colors flex items-center gap-2 flex-wrap">
              <AnimatePresence initial={false}>
                {!isRecipientEditing && recipient ? (
                  <motion.button
                    key="recipient-chip"
                    initial={{ opacity: 0, y: -6, scale: 0.96 }}
                    animate={{ opacity: 1, y: 0, scale: 1 }}
                    exit={{ opacity: 0, y: -6, scale: 0.96 }}
                    whileHover={{ scale: 1.01 }}
                    onClick={() => setIsRecipientEditing(true)}
                    className="inline-flex items-center gap-2 rounded-full border border-[#35517c] bg-[#111b2c] pl-1 pr-2 py-1 text-sm text-white"
                    title="Click to edit recipient"
                  >
                    <span className="w-6 h-6 rounded-full bg-gradient-to-br from-[#5f8dff] to-[#7f5fff] text-[11px] font-semibold flex items-center justify-center">
                      {recipientInitial}
                    </span>
                    <span>{recipient}</span>
                    <span
                      className="text-[#9fb6ff] hover:text-white"
                      onClick={(event) => {
                        event.stopPropagation()
                        setRecipient('')
                        setRecipientInput('')
                        setIsRecipientEditing(true)
                      }}
                    >
                      <X className="w-3.5 h-3.5" />
                    </span>
                  </motion.button>
                ) : null}
              </AnimatePresence>
              {isRecipientEditing && (
                <input
                  type="email"
                  value={recipientInput}
                  onChange={(e) => setRecipientInput(e.target.value)}
                  onBlur={commitRecipient}
                  onKeyDown={(e) => {
                    if (e.key === 'Enter' || e.key === ',' || e.key === ';') {
                      e.preventDefault()
                      commitRecipient()
                    }
                  }}
                  placeholder="recipient@company.com"
                  className="flex-1 min-w-[220px] bg-transparent px-2 py-1.5 text-white placeholder-[#666666] focus:outline-none"
                />
              )}
              {!isRecipientEditing && recipient && (
                <button
                  onClick={() => setIsRecipientEditing(true)}
                  className="p-1.5 rounded-full hover:bg-[#1a1a1a] text-[#8a8a8a] hover:text-white transition-colors"
                  title="Add or edit recipient"
                >
                  <Plus className="w-3.5 h-3.5" />
                </button>
              )}
            </div>
          </div>

          {/* Subject Field */}
          <div>
            <label className="text-xs font-medium text-[#666666] uppercase tracking-wider block mb-2">
              Subject
            </label>
            <div className="flex items-center gap-2">
              <input
                type="text"
                value={subject}
                onChange={(e) => setSubject(e.target.value)}
                placeholder="RE: Your inquiry"
                className="w-full bg-[#0a0a0a] border border-[#2a2a2a] rounded-lg px-4 py-2.5 text-white placeholder-[#666666] focus:border-[#3a3a3a] focus:outline-none transition-colors"
              />
              <motion.button
                whileTap={{ scale: 0.96 }}
                onClick={handleRegenerateSubject}
                disabled={isGeneratingSubject}
                className="inline-flex items-center gap-1 px-3 py-2.5 text-xs bg-[#0a0a0a] border border-[#2a2a2a] rounded-lg text-[#cfcfcf] hover:bg-[#141414] disabled:opacity-50"
                title="Regenerate subject with AI"
              >
                <Sparkles className={`w-3.5 h-3.5 ${isGeneratingSubject ? 'animate-spin' : ''}`} />
                {isGeneratingSubject ? 'Generating' : 'AI'}
              </motion.button>
            </div>
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
              <label className="text-xs text-[#666666]">
                Tone:
                <select
                  value={templateTone}
                  onChange={(e) => setTemplateTone(e.target.value)}
                  className="ml-2 bg-[#0a0a0a] border border-[#2a2a2a] rounded px-2 py-1 text-[#999999]"
                >
                  <option value="professional">Professional</option>
                  <option value="friendly">Friendly</option>
                  <option value="confident">Confident</option>
                  <option value="concise">Concise</option>
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

            <AnimatePresence initial={false}>
              {/* Advanced Formatting */}
              {showAdvancedFormatting && (
                <motion.div
                  initial={{ opacity: 0, height: 0, y: -4 }}
                  animate={{ opacity: 1, height: 'auto', y: 0 }}
                  exit={{ opacity: 0, height: 0, y: -4 }}
                  transition={{ duration: 0.16 }}
                  className="mt-3 flex items-center gap-2 p-3 bg-[#0a0a0a] rounded-lg border border-[#2a2a2a] overflow-hidden"
                >
                  <button
                    onClick={() => formatSelection((text) => `**${text}**`)}
                    className="px-2 py-1 text-xs text-[#999999] hover:text-white hover:bg-[#2a2a2a] rounded transition-colors inline-flex items-center gap-1"
                  >
                    <Bold className="w-3.5 h-3.5" />
                    Bold
                  </button>
                  <button
                    onClick={() => formatSelection((text) => `*${text}*`)}
                    className="px-2 py-1 text-xs text-[#999999] hover:text-white hover:bg-[#2a2a2a] rounded transition-colors inline-flex items-center gap-1"
                  >
                    <Italic className="w-3.5 h-3.5" />
                    Italic
                  </button>
                  <button
                    onClick={() => formatSelection((text) => `<u>${text}</u>`)}
                    className="px-2 py-1 text-xs text-[#999999] hover:text-white hover:bg-[#2a2a2a] rounded transition-colors inline-flex items-center gap-1"
                  >
                    <Underline className="w-3.5 h-3.5" />
                    Underline
                  </button>
                  <div className="flex-1" />
                  <button
                    onClick={insertLink}
                    className="px-2 py-1 text-xs text-[#999999] hover:text-white hover:bg-[#2a2a2a] rounded transition-colors inline-flex items-center gap-1"
                  >
                    <Link2 className="w-3.5 h-3.5" />
                    Link
                  </button>
                </motion.div>
              )}
            </AnimatePresence>
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
        <div className="flex items-center justify-end gap-3 px-6 py-4 border-t border-[#2a2a2a] bg-[#0a0a0a] rounded-b-lg">
          <button
            onClick={handleInsertTemplateSection}
            className="px-4 py-2 text-sm font-medium text-[#999999] bg-[#1a1a1a] border border-[#2a2a2a] rounded-lg hover:bg-[#2a2a2a] transition-colors"
          >
            Insert Section
          </button>
          <button
            onClick={handleSaveAsTemplate}
            className="px-4 py-2 text-sm font-medium text-[#999999] bg-[#1a1a1a] border border-[#2a2a2a] rounded-lg hover:bg-[#2a2a2a] transition-colors"
          >
            Save as Template
          </button>
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
      </motion.div>
    </motion.div>
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
