'use client'

import { useEffect, useRef, useState } from 'react'
import { useDraftStore } from '@/lib/store'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Textarea } from '@/components/ui/textarea'
import { CardContent } from '@/components/ui/card'
import { QuickActions } from '@/components/quick-actions'
import { EmailStats } from '@/components/email-stats'
import { VersionHistory } from '@/components/version-history'
import { generateEmailWithAction } from '@/lib/ai-utils'
import {
  ChevronDown,
  Send,
  RotateCcw,
  RotateCw,
  Sparkles,
  Zap,
  Copy,
} from 'lucide-react'

export function Composer() {
  const {
    from,
    to,
    cc,
    bcc,
    subject,
    body,
    context,
    tone,
    length,
    personalizationDepth,
    isGenerating,
    showCc,
    showBcc,
    showSubject,
    cursorPosition,
    canUndo,
    canRedo,
    setFrom,
    setTo,
    setCc,
    setBcc,
    setSubject,
    setBody,
    setContext,
    setTone,
    setLength,
    setPersonalizationDepth,
    setIsGenerating,
    setCursorPosition,
    toggleCc,
    toggleBcc,
    toggleSubject,
    undo,
    redo,
    insertAtCursor,
    appendBody,
    clear,
  } = useDraftStore()

  const bodyRef = useRef<HTMLTextAreaElement>(null)
  const [showAdvanced, setShowAdvanced] = useState(false)
  const [generatingStreaming, setGeneratingStreaming] = useState(false)

  // Handle streaming generation
  const handleGenerate = async () => {
    if (!to || !context) {
      alert('Please fill in the To and Context fields')
      return
    }

    setGeneratingStreaming(true)
    setIsGenerating(true)

    try {
      const response = await fetch('/api/generate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          to,
          context,
          tone,
          length,
          personalizationDepth,
          previousContent: body || undefined,
        }),
      })

      if (!response.ok) {
        throw new Error('Failed to generate email')
      }

      const reader = response.body?.getReader()
      if (!reader) throw new Error('No response body')

      const decoder = new TextDecoder()
      let generatedText = ''

      // Clear existing body or append based on whether there's content
      if (!body) {
        setBody('')
      }

      while (true) {
        const { done, value } = await reader.read()
        if (done) break

        const chunk = decoder.decode(value, { stream: true })
        generatedText += chunk

        // Update body with streamed content
        if (body) {
          appendBody(chunk)
        } else {
          setBody(generatedText)
        }
      }
    } catch (error) {
      console.error('[Composer] Generation error:', error)
      alert('Failed to generate email. Please try again.')
    } finally {
      setGeneratingStreaming(false)
      setIsGenerating(false)
    }
  }

  const handleBodyChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    const newBody = e.target.value
    setBody(newBody)
    if (bodyRef.current) {
      setCursorPosition(bodyRef.current.selectionStart)
    }
  }

  const handleQuickAction = async (action: string) => {
    if (!body) {
      alert('Please compose or generate an email first')
      return
    }

    setGeneratingStreaming(true)
    setIsGenerating(true)

    try {
      const stream = await generateEmailWithAction(
        action,
        body,
        context,
        tone,
        length,
        personalizationDepth
      )

      if (!stream) {
        throw new Error('No response stream')
      }

      const reader = stream.getReader()
      const decoder = new TextDecoder()
      let generatedText = ''

      while (true) {
        const { done, value } = await reader.read()
        if (done) break

        const chunk = decoder.decode(value, { stream: true })
        generatedText += chunk
        setBody(generatedText)
      }
    } catch (error) {
      console.error('[Composer] Quick action error:', error)
      alert('Failed to apply action. Please try again.')
    } finally {
      setGeneratingStreaming(false)
      setIsGenerating(false)
    }
  }

  const extractFirstName = (email: string): string => {
    const match = email.match(/^([a-zA-Z]+)/)
    return match ? match[1] : 'there'
  }

  useEffect(() => {
    if (bodyRef.current) {
      bodyRef.current.focus()
    }
  }, [])

  return (
    <div className="flex flex-col h-full bg-[#0a0a0a]">
      {/* Premium header with controls */}
      <div className="px-8 py-6 border-b border-[#1f1f1f] bg-gradient-to-b from-[#0f0f0f] to-[#0a0a0a]">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-4">
            <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-[#4a90ff] to-[#357ae8] flex items-center justify-center text-white text-sm font-semibold shadow-lg">
              ✉️
            </div>
            <div>
              <h2 className="text-base font-semibold text-white">New Email</h2>
              <p className="text-xs text-[#808080] mt-0.5">AI-powered cold outreach composer</p>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <button
              onClick={undo}
              disabled={!canUndo()}
              className="p-2 rounded-lg btn-glass disabled:opacity-50 disabled:cursor-not-allowed"
              title="Undo (Cmd+Z)"
            >
              <RotateCcw className="w-4 h-4 text-[#a0a0a0]" />
            </button>
            <button
              onClick={redo}
              disabled={!canRedo()}
              className="p-2 rounded-lg btn-glass disabled:opacity-50 disabled:cursor-not-allowed"
              title="Redo (Cmd+Y)"
            >
              <RotateCw className="w-4 h-4 text-[#a0a0a0]" />
            </button>
          </div>
        </div>
      </div>

      {/* Main content */}
      <div className="flex-1 overflow-y-auto px-8 py-6">
        {/* Email Headers Section */}
        <div className="space-y-4 mb-8 pb-8 border-b border-[#1f1f1f]">
          {/* From field */}
          <div className="space-y-2">
            <label className="text-xs font-medium text-[#a0a0a0] uppercase tracking-wider">From</label>
            <Input
              value={from}
              onChange={(e) => setFrom(e.target.value)}
              placeholder="your@email.com"
              className="input-premium"
            />
          </div>

          {/* To field with toggles */}
          <div className="space-y-3">
            <div className="space-y-2">
              <label className="text-xs font-medium text-[#a0a0a0] uppercase tracking-wider">To</label>
              <Input
                value={to}
                onChange={(e) => setTo(e.target.value)}
                placeholder="recipient@company.com"
                className="input-premium"
              />
            </div>
            <div className="flex gap-2 pt-2">
              <button
                onClick={toggleCc}
                className={`px-3 py-2 text-xs rounded-lg font-medium transition-all ${
                  showCc
                    ? 'bg-[#2a2a2a] text-white border border-[#4a90ff]'
                    : 'btn-glass text-[#a0a0a0] hover:text-white'
                }`}
              >
                CC
              </button>
              <button
                onClick={toggleBcc}
                className={`px-3 py-2 text-xs rounded-lg font-medium transition-all ${
                  showBcc
                    ? 'bg-[#2a2a2a] text-white border border-[#4a90ff]'
                    : 'btn-glass text-[#a0a0a0] hover:text-white'
                }`}
              >
                BCC
              </button>
              <button
                onClick={toggleSubject}
                className={`px-3 py-2 text-xs rounded-lg font-medium transition-all ${
                  showSubject
                    ? 'bg-[#2a2a2a] text-white border border-[#4a90ff]'
                    : 'btn-glass text-[#a0a0a0] hover:text-white'
                }`}
              >
                Subject
              </button>
            </div>
          </div>

          {/* CC field */}
          {showCc && (
            <div className="space-y-2 animate-in fade-in slide-in-from-top-2 duration-200">
              <label className="text-xs font-medium text-[#a0a0a0] uppercase tracking-wider">CC</label>
              <Input
                value={cc}
                onChange={(e) => setCc(e.target.value)}
                placeholder="cc@email.com"
                className="input-premium"
              />
            </div>
          )}

          {/* BCC field */}
          {showBcc && (
            <div className="space-y-2 animate-in fade-in slide-in-from-top-2 duration-200">
              <label className="text-xs font-medium text-[#a0a0a0] uppercase tracking-wider">BCC</label>
              <Input
                value={bcc}
                onChange={(e) => setBcc(e.target.value)}
                placeholder="bcc@email.com"
                className="input-premium"
              />
            </div>
          )}

          {/* Subject field */}
          {showSubject && (
            <div className="space-y-2 animate-in fade-in slide-in-from-top-2 duration-200">
              <label className="text-xs font-medium text-[#a0a0a0] uppercase tracking-wider">Subject</label>
              <Input
                value={subject}
                onChange={(e) => setSubject(e.target.value)}
                placeholder="Email subject (optional)"
                className="input-premium"
              />
            </div>
          )}
        </div>

        {/* Context input (AI input) */}
        <div className="mb-8">
          <label className="text-xs font-medium text-[#a0a0a0] uppercase tracking-wider block mb-3">
            AI Context
          </label>
          <Textarea
            value={context}
            onChange={(e) => setContext(e.target.value)}
            placeholder="Tell the AI about the recipient: their company, role, recent news, why you're reaching out, what pain points you solve..."
            className="input-premium w-full h-24 resize-none"
          />
          <p className="text-xs text-[#696969] mt-2">
            Share details to help the AI generate highly personalized emails
          </p>
        </div>

        {/* AI Controls - Glass morphism design */}
        <div className="mb-8 surface-glossy p-6">
          <div className="flex items-center justify-between mb-3">
            <label className="text-sm text-gray-400">Generation Settings</label>
            <button
              onClick={() => setShowAdvanced(!showAdvanced)}
              className="text-xs text-blue-400 hover:text-blue-300 flex items-center gap-1"
            >
              {showAdvanced ? 'Hide' : 'Show'}
              <ChevronDown className="w-3 h-3" />
            </button>
          </div>

          {showAdvanced && (
            <div className="space-y-3 mb-3 pb-3 border-b border-[#2a2a2a]">
              {/* Tone selector */}
              <div>
                <label className="text-xs text-gray-500 block mb-1">Tone</label>
                <div className="flex gap-2">
                  {['professional', 'casual', 'friendly', 'formal'].map((t) => (
                    <button
                      key={t}
                      onClick={() =>
                        setTone(
                          t as
                            | 'professional'
                            | 'casual'
                            | 'friendly'
                            | 'formal'
                        )
                      }
                      className={`px-3 py-1 text-xs rounded transition-colors ${
                        tone === t
                          ? 'bg-blue-500 text-white'
                          : 'bg-[#2a2a2a] text-gray-400 hover:bg-[#3a3a3a]'
                      }`}
                    >
                      {t.charAt(0).toUpperCase() + t.slice(1)}
                    </button>
                  ))}
                </div>
              </div>

              {/* Length selector */}
              <div>
                <label className="text-xs text-gray-500 block mb-1">Length</label>
                <div className="flex gap-2">
                  {['short', 'medium', 'long'].map((l) => (
                    <button
                      key={l}
                      onClick={() => setLength(l as 'short' | 'medium' | 'long')}
                      className={`px-3 py-1 text-xs rounded transition-colors ${
                        length === l
                          ? 'bg-blue-500 text-white'
                          : 'bg-[#2a2a2a] text-gray-400 hover:bg-[#3a3a3a]'
                      }`}
                    >
                      {l.charAt(0).toUpperCase() + l.slice(1)}
                    </button>
                  ))}
                </div>
              </div>

              {/* Personalization depth */}
              <div>
                <label className="text-xs text-gray-500 block mb-1">
                  Personalization
                </label>
                <div className="flex gap-2">
                  {['minimal', 'standard', 'deep'].map((p) => (
                    <button
                      key={p}
                      onClick={() =>
                        setPersonalizationDepth(
                          p as 'minimal' | 'standard' | 'deep'
                        )
                      }
                      className={`px-3 py-1 text-xs rounded transition-colors ${
                        personalizationDepth === p
                          ? 'bg-blue-500 text-white'
                          : 'bg-[#2a2a2a] text-gray-400 hover:bg-[#3a3a3a]'
                      }`}
                    >
                      {p.charAt(0).toUpperCase() + p.slice(1)}
                    </button>
                  ))}
                </div>
              </div>
            </div>
          )}

          <Button
            onClick={handleGenerate}
            disabled={isGenerating || generatingStreaming || !to || !context}
            className="btn-primary-glossy w-full disabled:opacity-50"
          >
            <Sparkles className="w-4 h-4 mr-2" />
            {generatingStreaming ? 'Generating...' : 'Generate with AI'}
          </Button>
        </div>

        {/* Email body - Premium design */}
        <div className="mb-8">
          <label className="text-xs font-medium text-[#a0a0a0] uppercase tracking-wider block mb-3">Message</label>
          <Textarea
            ref={bodyRef}
            value={body}
            onChange={handleBodyChange}
            placeholder={`Hi ${extractFirstName(to || 'there')},\n\nStart composing your cold email here. Use the "Generate with AI" button to create a personalized draft based on your context.`}
            className="input-premium w-full h-72 resize-none font-sans text-[15px] leading-relaxed"
          />
        </div>

        {/* Email stats */}
        {body && <EmailStats body={body} />}
      </div>

      {/* Quick actions bar */}
      {body && (
        <QuickActions 
          onGenerate={handleQuickAction} 
          isGenerating={generatingStreaming}
        />
      )}

      {/* Premium footer with actions */}
      <div className="flex items-center justify-between px-8 py-6 border-t border-[#1f1f1f] bg-gradient-to-t from-[#0a0a0a] to-transparent">
        <div className="flex items-center gap-3">
          <button
            onClick={() => setBody('')}
            className="btn-glass px-4 py-2 text-xs text-[#a0a0a0] hover:text-white"
          >
            Clear
          </button>
          <VersionHistory />
        </div>
        <div className="flex items-center gap-3">
          <button className="p-2 btn-glass rounded-lg transition-colors" title="Copy">
            <Copy className="w-4 h-4 text-[#a0a0a0]" />
          </button>
          <Button className="btn-primary-glossy px-6 py-2">
            <Send className="w-4 h-4 mr-2" />
            Send Email
          </Button>
        </div>
      </div>
    </div>
  )
}
