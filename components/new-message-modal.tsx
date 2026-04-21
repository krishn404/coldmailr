'use client'

import { useState, useRef } from 'react'
import { X, Minimize2, Maximize2, Bold, Italic, Underline, AlignLeft, AlignCenter, AlignRight, Link2, Paperclip, Trash2, Clock } from 'lucide-react'

interface NewMessageModalProps {
  isOpen: boolean
  onClose: () => void
}

interface EmailRecipient {
  email: string
}

interface Attachment {
  id: string
  name: string
  size: string
  progress: number
}

export function NewMessageModal({ isOpen, onClose }: NewMessageModalProps) {
  const [toRecipients, setToRecipients] = useState<EmailRecipient[]>([
    { email: 'hi@chloehertz.co' },
    { email: 'admin@chloehertz.co' },
  ])
  const [ccRecipients, setCcRecipients] = useState<EmailRecipient[]>([
    { email: 'amelia@untitledui.com' },
  ])
  const [toInput, setToInput] = useState('')
  const [subject, setSubject] = useState('RE: Concepts for the mobile onboarding flow')
  const [body, setBody] = useState(`Hi @Chloe

Just had a chance to run through the new onboarding screens — absolutely loving the direction so far. Super clean and aligns well with the updated brand system.

A couple of small notes [mostly spacing and copy tweaks] which I've left as comments in Figma. Nothing blocking through — feel free to keep rolling on the motion ideas we chatted about yesterday. I've also attached the updated example deck.

Also, I've looped in @Amelia for a quick accessibility check before we move forward.

Nice work as always 🙌
– Dani`)
  const [attachments, setAttachments] = useState<Attachment[]>([
    {
      id: '1',
      name: 'Mobile onboarding flow redesign.pdf',
      size: '6.4 MB of 16.8 MB',
      progress: 40,
    },
  ])

  if (!isOpen) return null

  const removeToRecipient = (email: string) => {
    setToRecipients(toRecipients.filter((r) => r.email !== email))
  }

  const removeCcRecipient = (email: string) => {
    setCcRecipients(ccRecipients.filter((r) => r.email !== email))
  }

  const addToRecipient = () => {
    if (toInput.trim() && toInput.includes('@')) {
      setToRecipients([...toRecipients, { email: toInput }])
      setToInput('')
    }
  }

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter') {
      e.preventDefault()
      addToRecipient()
    }
  }

  return (
    <div className="fixed inset-0 bg-black/40 flex items-center justify-center z-50">
      <div className="bg-[#1a1a1a] rounded-lg shadow-2xl w-full max-w-2xl max-h-[90vh] flex flex-col border border-[#2a2a2a]">
        {/* Header */}
        <div className="px-6 py-4 border-b border-[#2a2a2a] flex items-center justify-between">
          <h2 className="text-white font-medium">New message</h2>
          <div className="flex items-center gap-2">
            <button className="p-1 hover:bg-[#2a2a2a] rounded transition-colors">
              <Minimize2 className="w-4 h-4 text-[#666666]" />
            </button>
            <button className="p-1 hover:bg-[#2a2a2a] rounded transition-colors">
              <Maximize2 className="w-4 h-4 text-[#666666]" />
            </button>
            <button onClick={onClose} className="p-1 hover:bg-[#2a2a2a] rounded transition-colors">
              <X className="w-4 h-4 text-[#666666]" />
            </button>
          </div>
        </div>

        {/* Content */}
        <div className="flex-1 overflow-y-auto">
          {/* To Field */}
          <div className="px-6 py-4 border-b border-[#2a2a2a]">
            <label className="text-sm text-[#999999] block mb-2">To</label>
            <div className="flex flex-wrap gap-2 items-center bg-[#0f0f0f] border border-[#2a2a2a] rounded px-3 py-3">
              {toRecipients.map((recipient) => (
                <div
                  key={recipient.email}
                  className="flex items-center gap-2 bg-[#2a2a2a] px-3 py-1 rounded text-sm text-white"
                >
                  <span>{recipient.email}</span>
                  <button
                    onClick={() => removeToRecipient(recipient.email)}
                    className="text-[#666666] hover:text-white"
                  >
                    ×
                  </button>
                </div>
              ))}
              <input
                type="email"
                value={toInput}
                onChange={(e) => setToInput(e.target.value)}
                onKeyDown={handleKeyDown}
                placeholder="Add recipient..."
                className="flex-1 bg-transparent text-white text-sm focus:outline-none placeholder-[#666666]"
              />
            </div>
          </div>

          {/* Cc Field */}
          <div className="px-6 py-4 border-b border-[#2a2a2a]">
            <label className="text-sm text-[#999999] block mb-2">Cc</label>
            <div className="flex flex-wrap gap-2 items-center bg-[#0f0f0f] border border-[#2a2a2a] rounded px-3 py-3">
              {ccRecipients.map((recipient) => (
                <div
                  key={recipient.email}
                  className="flex items-center gap-2 bg-[#2a2a2a] px-3 py-1 rounded text-sm text-white"
                >
                  <span>{recipient.email}</span>
                  <button
                    onClick={() => removeCcRecipient(recipient.email)}
                    className="text-[#666666] hover:text-white"
                  >
                    ×
                  </button>
                </div>
              ))}
              <input
                type="email"
                placeholder="Add recipient..."
                className="flex-1 bg-transparent text-white text-sm focus:outline-none placeholder-[#666666]"
              />
            </div>
          </div>

          {/* Subject */}
          <div className="px-6 py-4 border-b border-[#2a2a2a]">
            <input
              type="text"
              value={subject}
              onChange={(e) => setSubject(e.target.value)}
              className="w-full bg-transparent text-white text-base focus:outline-none placeholder-[#666666]"
            />
          </div>

          {/* Rich Text Editor */}
          <div className="px-6 py-4 border-b border-[#2a2a2a]">
            {/* Toolbar */}
            <div className="mb-3 flex items-center gap-1 bg-[#0f0f0f] border border-[#2a2a2a] rounded p-2">
              <button className="p-2 hover:bg-[#2a2a2a] rounded text-[#999999]">
                <Bold className="w-4 h-4" />
              </button>
              <button className="p-2 hover:bg-[#2a2a2a] rounded text-[#999999]">
                <Italic className="w-4 h-4" />
              </button>
              <button className="p-2 hover:bg-[#2a2a2a] rounded text-[#999999]">
                <Underline className="w-4 h-4" />
              </button>
              <div className="w-px h-4 bg-[#2a2a2a] mx-1" />
              <button className="p-2 hover:bg-[#2a2a2a] rounded text-[#999999]">
                <AlignLeft className="w-4 h-4" />
              </button>
              <button className="p-2 hover:bg-[#2a2a2a] rounded text-[#999999]">
                <AlignCenter className="w-4 h-4" />
              </button>
              <button className="p-2 hover:bg-[#2a2a2a] rounded text-[#999999]">
                <AlignRight className="w-4 h-4" />
              </button>
              <div className="w-px h-4 bg-[#2a2a2a] mx-1" />
              <button className="p-2 hover:bg-[#2a2a2a] rounded text-[#999999]">
                <Link2 className="w-4 h-4" />
              </button>
            </div>

            {/* Text Area */}
            <textarea
              value={body}
              onChange={(e) => setBody(e.target.value)}
              className="w-full h-64 bg-[#0f0f0f] border border-[#2a2a2a] rounded px-4 py-3 text-white text-sm leading-relaxed focus:outline-none placeholder-[#666666] resize-none"
            />
          </div>

          {/* Attachments */}
          {attachments.length > 0 && (
            <div className="px-6 py-4 border-b border-[#2a2a2a]">
              {attachments.map((attachment) => (
                <div
                  key={attachment.id}
                  className="bg-[#0f0f0f] border border-[#2a2a2a] rounded p-4 flex items-center justify-between"
                >
                  <div className="flex-1">
                    <div className="text-sm text-white mb-2">{attachment.name}</div>
                    <div className="flex items-center gap-3">
                      <div className="flex-1 bg-[#2a2a2a] rounded-full h-2">
                        <div
                          className="bg-[#999999] h-2 rounded-full"
                          style={{ width: `${attachment.progress}%` }}
                        />
                      </div>
                      <span className="text-xs text-[#666666]">{attachment.progress}%</span>
                    </div>
                    <div className="text-xs text-[#666666] mt-2">{attachment.size}</div>
                  </div>
                  <button className="p-2 hover:bg-[#2a2a2a] rounded ml-4">
                    <X className="w-4 h-4 text-[#666666]" />
                  </button>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Footer Actions */}
        <div className="px-6 py-4 border-t border-[#2a2a2a] flex items-center justify-between bg-[#0f0f0f]">
          <div className="flex items-center gap-3">
            <button className="p-2 hover:bg-[#2a2a2a] rounded transition-colors">
              <Paperclip className="w-4 h-4 text-[#666666]" />
            </button>
            <button className="p-2 hover:bg-[#2a2a2a] rounded transition-colors">
              <Clock className="w-4 h-4 text-[#666666]" />
            </button>
            <button className="p-2 hover:bg-[#2a2a2a] rounded transition-colors">
              <Trash2 className="w-4 h-4 text-[#666666]" />
            </button>
            <button className="flex items-center gap-2 text-sm text-white hover:opacity-80 transition-opacity">
              <span>✨</span>
              <span>Ask AI</span>
            </button>
          </div>

          <div className="flex items-center gap-3">
            <button className="px-4 py-2 text-sm text-white hover:bg-[#2a2a2a] rounded transition-colors">
              Remind me
            </button>
            <button className="px-4 py-2 text-sm text-white hover:bg-[#2a2a2a] rounded transition-colors">
              Send later
            </button>
            <button className="px-4 py-2 bg-black text-white text-sm font-medium rounded hover:bg-[#1a1a1a] transition-colors">
              Send
            </button>
          </div>
        </div>
      </div>
    </div>
  )
}
