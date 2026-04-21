'use client'

import { useState } from 'react'
import { Plus, FileText, BookMarked, Menu, X } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { useDraftStore } from '@/lib/store'

interface RecentDraft {
  id: string
  to: string
  subject: string
  preview: string
  updatedAt: Date
}

interface Template {
  id: string
  name: string
  category: string
  description: string
}

export function Sidebar() {
  const [isOpen, setIsOpen] = useState(true)
  const [recentDrafts] = useState<RecentDraft[]>([
    {
      id: '1',
      to: 'john@acme.com',
      subject: 'Collaboration opportunity',
      preview: 'Hi John, I noticed your company is expanding...',
      updatedAt: new Date(Date.now() - 1000 * 60 * 30),
    },
    {
      id: '2',
      to: 'sarah@tech.io',
      subject: 'Product integration',
      preview: 'Hi Sarah, I came across your tool and...',
      updatedAt: new Date(Date.now() - 1000 * 60 * 120),
    },
  ])

  const [templates] = useState<Template[]>([
    {
      id: '1',
      name: 'Partnership',
      category: 'Business Dev',
      description: 'Outreach for partnerships',
    },
    {
      id: '2',
      name: 'Sales',
      category: 'Enterprise',
      description: 'Product/service pitches',
    },
    {
      id: '3',
      name: 'Recruiting',
      category: 'HR',
      description: 'Talent acquisition outreach',
    },
  ])

  const { clear } = useDraftStore()

  const handleNewDraft = () => {
    clear()
    setIsOpen(false)
  }

  if (!isOpen) {
    return (
      <button
        onClick={() => setIsOpen(true)}
        className="fixed bottom-8 left-8 p-3 rounded-xl btn-glass border-[#4a90ff] border-opacity-20 text-[#a0a0a0] hover:text-white transition-all z-50 shadow-lg"
        title="Open sidebar"
      >
        <Menu className="w-5 h-5" />
      </button>
    )
  }

  return (
    <aside className="w-64 bg-[#0a0a0a] border-r border-[#1f1f1f] flex flex-col h-full">
      {/* Premium header with gradient */}
      <div className="px-6 py-5 border-b border-[#1f1f1f] bg-gradient-to-b from-[#0f0f0f] to-[#0a0a0a]">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-[#4a90ff] to-[#357ae8] flex items-center justify-center text-white text-sm font-bold shadow-lg">
              ✉️
            </div>
            <h1 className="text-base font-semibold text-white">coldmailr</h1>
          </div>
          <button
            onClick={() => setIsOpen(false)}
            className="p-1.5 rounded-lg btn-glass text-[#a0a0a0]"
          >
            <X className="w-4 h-4" />
          </button>
        </div>
      </div>

      {/* New Draft Button - Glossy primary action */}
      <div className="px-6 py-4 border-b border-[#1f1f1f] bg-gradient-to-b from-[#0f0f0f] to-[#0a0a0a]">
        <Button
          onClick={handleNewDraft}
          className="btn-primary-glossy w-full"
        >
          <Plus className="w-4 h-4 mr-2" />
          New Draft
        </Button>
      </div>

      {/* Content */}
      <div className="flex-1 overflow-y-auto px-4 py-5">
        {/* Recent Drafts Section */}
        <div className="mb-8">
          <h2 className="text-xs font-semibold text-[#a0a0a0] uppercase tracking-widest mb-4">
            Recent Drafts
          </h2>
          {recentDrafts.length > 0 ? (
            <div className="space-y-2">
              {recentDrafts.map((draft) => (
                <button
                  key={draft.id}
                  className="w-full text-left p-3 rounded-lg btn-glass transition-all hover:border-[#4a90ff] hover:border-opacity-50 group"
                >
                  <div className="flex items-start gap-2.5">
                    <FileText className="w-4 h-4 text-[#4a90ff] mt-0.5 flex-shrink-0" />
                    <div className="flex-1 min-w-0">
                      <p className="text-sm text-white truncate font-medium">
                        {draft.to}
                      </p>
                      <p className="text-xs text-[#696969] truncate mt-1">
                        {draft.subject}
                      </p>
                      <p className="text-xs text-[#696969] truncate mt-1.5">
                        {draft.preview}
                      </p>
                      <time className="text-xs text-[#696969] mt-2 block">
                        {formatTime(draft.updatedAt)}
                      </time>
                    </div>
                  </div>
                </button>
              ))}
            </div>
          ) : (
            <p className="text-xs text-[#696969]">No recent drafts</p>
          )}
        </div>

        {/* Templates Section */}
        <div className="mb-4">
          <h2 className="text-xs font-semibold text-[#a0a0a0] uppercase tracking-widest mb-4">
            Templates
          </h2>
          {templates.length > 0 ? (
            <div className="space-y-2">
              {templates.map((template) => (
                <button
                  key={template.id}
                  className="w-full text-left p-3 rounded-lg btn-glass transition-all hover:border-[#4a90ff] hover:border-opacity-50"
                >
                  <div className="flex items-start gap-2.5">
                    <BookMarked className="w-4 h-4 text-[#4a90ff] mt-0.5 flex-shrink-0" />
                    <div className="flex-1 min-w-0">
                      <p className="text-sm text-white truncate font-medium">
                        {template.name}
                      </p>
                      <p className="text-xs text-[#696969] mt-1">
                        {template.category}
                      </p>
                      <p className="text-xs text-[#696969] mt-1.5">
                        {template.description}
                      </p>
                    </div>
                  </div>
                </button>
              ))}
            </div>
          ) : (
            <p className="text-xs text-[#696969]">No templates yet</p>
          )}
        </div>
      </div>

      {/* Footer - Premium settings button */}
      <div className="px-4 py-4 border-t border-[#1f1f1f] bg-gradient-to-t from-[#0a0a0a] to-transparent">
        <button className="w-full px-3 py-2 btn-glass text-xs text-[#a0a0a0] hover:text-white transition-all rounded-lg">
          ⚙️ Settings
        </button>
      </div>
    </aside>
  )
}

function formatTime(date: Date): string {
  const now = new Date()
  const diffMs = now.getTime() - date.getTime()
  const diffMins = Math.floor(diffMs / 60000)
  const diffHours = Math.floor(diffMs / 3600000)
  const diffDays = Math.floor(diffMs / 86400000)

  if (diffMins < 60) {
    return `${diffMins}m ago`
  } else if (diffHours < 24) {
    return `${diffHours}h ago`
  } else if (diffDays < 7) {
    return `${diffDays}d ago`
  } else {
    return date.toLocaleDateString()
  }
}
