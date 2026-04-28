'use client'

import { useEffect, useMemo, useState } from 'react'
import { Pin, Search, Sparkles, RotateCcw } from 'lucide-react'
import { TemplateRecord, TemplateVersionRecord } from '@/components/templates-types'

type Props = {
  recipientEmail?: string
  onUseTemplate: (template: TemplateRecord) => void
  onInsertSection: (section: string) => void
}

type Filters = {
  search: string
  useCase: string
  industry: string
  tone: string
  length: string
}

function renderRecipientPreview(text: string, recipientEmail?: string) {
  const firstName = recipientEmail?.split('@')[0]?.split('.')[0] ?? 'there'
  return text
    .replace(/\{\{\s*firstName\s*\}\}/gi, firstName)
    .replace(/\{\{\s*first_name\s*\}\}/gi, firstName)
    .replace(/\{\{\s*email\s*\}\}/gi, recipientEmail || '')
}

export function TemplateGallery({ recipientEmail, onUseTemplate, onInsertSection }: Props) {
  const [templates, setTemplates] = useState<TemplateRecord[]>([])
  const [selected, setSelected] = useState<TemplateRecord | null>(null)
  const [versions, setVersions] = useState<TemplateVersionRecord[]>([])
  const [filters, setFilters] = useState<Filters>({ search: '', useCase: '', industry: '', tone: '', length: '' })
  const [isGenerating, setIsGenerating] = useState(false)
  const [editor, setEditor] = useState({ subject: '', context: '', body: '' })

  const loadTemplates = async () => {
    const params = new URLSearchParams()
    if (filters.search) params.set('search', filters.search)
    if (filters.useCase) params.set('useCase', filters.useCase)
    if (filters.industry) params.set('industry', filters.industry)
    if (filters.tone) params.set('tone', filters.tone)
    if (filters.length) params.set('length', filters.length)
    const response = await fetch(`/api/templates?${params.toString()}`, { cache: 'no-store' })
    const json = (await response.json()) as { data?: TemplateRecord[] }
    setTemplates(json.data ?? [])
  }

  useEffect(() => {
    void loadTemplates()
  }, [filters.search, filters.useCase, filters.industry, filters.tone, filters.length])

  useEffect(() => {
    if (!selected) return
    setEditor({
      subject: selected.subject || '',
      context: selected.context || '',
      body: selected.body || '',
    })
    void (async () => {
      const response = await fetch(`/api/templates/${selected.id}/versions`, { cache: 'no-store' })
      const json = (await response.json()) as { data?: TemplateVersionRecord[] }
      setVersions(json.data ?? [])
    })()
  }, [selected?.id])

  const recent = useMemo(() => templates.filter((item) => item.last_used_at).slice(0, 5), [templates])
  const pinned = useMemo(() => templates.filter((item) => item.is_pinned), [templates])

  const regenerate = async () => {
    if (!selected) return
    setIsGenerating(true)
    try {
      const response = await fetch('/api/templates/generate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          context: selected.context,
          tone: selected.tone || filters.tone || 'professional',
          length: selected.length_hint || filters.length || 'medium',
        }),
      })
      const json = (await response.json()) as { data?: { subject: string; body: string } }
      if (!json.data) return
      await fetch(`/api/templates/${selected.id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          subject: json.data.subject,
          body: json.data.body,
          note: 'ai regenerate',
        }),
      })
      await loadTemplates()
      setSelected((prev) => (prev ? { ...prev, subject: json.data!.subject, body: json.data!.body } : prev))
    } finally {
      setIsGenerating(false)
    }
  }

  const regeneratePart = async (part: 'subject' | 'body') => {
    if (!selected) return
    setIsGenerating(true)
    try {
      const response = await fetch('/api/templates/generate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          context: editor.context || selected.context,
          tone: filters.tone || selected.tone || 'professional',
          length: filters.length || selected.length_hint || 'medium',
        }),
      })
      const json = (await response.json()) as { data?: { subject: string; body: string } }
      if (!json.data) return
      setEditor((prev) => ({
        ...prev,
        subject: part === 'subject' ? json.data!.subject : prev.subject,
        body: part === 'body' ? json.data!.body : prev.body,
      }))
    } finally {
      setIsGenerating(false)
    }
  }

  const saveEdits = async () => {
    if (!selected) return
    const response = await fetch(`/api/templates/${selected.id}`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        subject: editor.subject,
        context: editor.context,
        body: editor.body,
        tone: filters.tone || selected.tone,
        lengthHint: filters.length || selected.length_hint,
        note: 'gallery edit',
      }),
    })
    if (!response.ok) return
    const json = (await response.json()) as { data?: TemplateRecord }
    if (!json.data) return
    setSelected(json.data)
    await loadTemplates()
  }

  const rollback = async (versionId: string) => {
    if (!selected) return
    const response = await fetch(`/api/templates/${selected.id}/versions`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ versionId }),
    })
    if (!response.ok) return
    const json = (await response.json()) as { data?: TemplateRecord }
    if (json.data) setSelected(json.data)
    await loadTemplates()
  }

  return (
    <div className="flex h-full">
      <div className="w-[360px] border-r border-[#2a2a2a] p-4 space-y-3 overflow-y-auto">
        <div className="relative">
          <Search className="w-4 h-4 text-[#666] absolute left-2 top-2.5" />
          <input
            value={filters.search}
            onChange={(e) => setFilters((prev) => ({ ...prev, search: e.target.value }))}
            placeholder="Search templates..."
            className="w-full pl-8 pr-3 py-2 bg-[#111] border border-[#2a2a2a] rounded text-sm text-white"
          />
        </div>
        <div className="grid grid-cols-2 gap-2">
          <input placeholder="Use case" className="bg-[#111] border border-[#2a2a2a] rounded px-2 py-1.5 text-xs text-white" value={filters.useCase} onChange={(e)=>setFilters((p)=>({...p,useCase:e.target.value}))}/>
          <input placeholder="Industry" className="bg-[#111] border border-[#2a2a2a] rounded px-2 py-1.5 text-xs text-white" value={filters.industry} onChange={(e)=>setFilters((p)=>({...p,industry:e.target.value}))}/>
          <input placeholder="Tone" className="bg-[#111] border border-[#2a2a2a] rounded px-2 py-1.5 text-xs text-white" value={filters.tone} onChange={(e)=>setFilters((p)=>({...p,tone:e.target.value}))}/>
          <input placeholder="Length" className="bg-[#111] border border-[#2a2a2a] rounded px-2 py-1.5 text-xs text-white" value={filters.length} onChange={(e)=>setFilters((p)=>({...p,length:e.target.value}))}/>
        </div>
        {pinned.length > 0 && <div className="text-xs text-[#888] uppercase">Pinned</div>}
        {pinned.map((template) => (
          <button key={template.id} onClick={() => setSelected(template)} className="w-full text-left bg-[#111] border border-[#2a2a2a] rounded p-3">
            <div className="text-sm text-white flex items-center gap-2"><Pin className="w-3 h-3" />{template.name}</div>
            <div className="text-xs text-[#9a9a9a] mt-1">{template.subject}</div>
          </button>
        ))}
        {recent.length > 0 && <div className="text-xs text-[#888] uppercase">Recent</div>}
        {templates.map((template) => (
          <button key={template.id} onClick={() => setSelected(template)} className="w-full text-left bg-[#111] border border-[#2a2a2a] rounded p-3">
            <div className="text-sm text-white">{template.name}</div>
            <div className="text-xs text-[#9a9a9a] mt-1">{template.subject}</div>
          </button>
        ))}
      </div>
      <div className="flex-1 p-5 overflow-y-auto">
        {!selected ? (
          <div className="text-[#777] text-sm">Select a template to preview and apply.</div>
        ) : (
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <h2 className="text-white font-semibold">{selected.name}</h2>
              <div className="flex gap-2">
                <button onClick={regenerate} disabled={isGenerating} className="px-3 py-2 text-xs border border-[#2a2a2a] rounded text-white inline-flex items-center gap-1"><Sparkles className="w-3 h-3" />{isGenerating ? 'Regenerating' : 'Regenerate All'}</button>
                <button onClick={() => void regeneratePart('subject')} disabled={isGenerating} className="px-3 py-2 text-xs border border-[#2a2a2a] rounded text-white">Regenerate Subject</button>
                <button onClick={() => void regeneratePart('body')} disabled={isGenerating} className="px-3 py-2 text-xs border border-[#2a2a2a] rounded text-white">Regenerate Body</button>
                <button onClick={saveEdits} className="px-3 py-2 text-xs border border-[#2a2a2a] rounded text-white">Save Edits</button>
                <button
                  onClick={async () => {
                    await fetch(`/api/templates/${selected.id}`, {
                      method: 'PUT',
                      headers: { 'Content-Type': 'application/json' },
                      body: JSON.stringify({ markUsed: true }),
                    })
                    onUseTemplate({ ...selected, subject: editor.subject, context: editor.context, body: editor.body })
                  }}
                  className="px-3 py-2 text-xs bg-white text-black rounded"
                >
                  Use Full Template
                </button>
              </div>
            </div>
            <div className="bg-[#111] border border-[#2a2a2a] rounded p-3">
              <div className="text-xs text-[#888] mb-1">Context</div>
              <textarea value={editor.context} onChange={(e)=>setEditor((prev)=>({...prev,context:e.target.value}))} className="w-full h-24 bg-[#0b0b0b] border border-[#2a2a2a] rounded p-2 text-sm text-[#ddd]" />
            </div>
            <div className="bg-[#111] border border-[#2a2a2a] rounded p-3">
              <div className="text-xs text-[#888] mb-1">Live Preview</div>
              <input value={editor.subject} onChange={(e)=>setEditor((prev)=>({...prev,subject:e.target.value}))} className="w-full bg-[#0b0b0b] border border-[#2a2a2a] rounded p-2 text-sm text-white" />
              <textarea value={editor.body} onChange={(e)=>setEditor((prev)=>({...prev,body:e.target.value}))} className="w-full mt-2 h-40 bg-[#0b0b0b] border border-[#2a2a2a] rounded p-2 text-sm text-[#ddd]" />
            </div>
            <div className="bg-[#111] border border-[#2a2a2a] rounded p-3">
              <div className="text-xs text-[#888] mb-1">Per-recipient Final Preview</div>
              <div className="text-sm text-white">Subject: {renderRecipientPreview(editor.subject, recipientEmail)}</div>
              <div className="text-sm text-[#ddd] whitespace-pre-wrap mt-2">{renderRecipientPreview(editor.body, recipientEmail)}</div>
            </div>
            <div className="bg-[#111] border border-[#2a2a2a] rounded p-3">
              <div className="text-xs text-[#888] mb-2">Quick Insert Sections</div>
              <div className="flex flex-wrap gap-2">
                {editor.body.split(/\n\s*\n/).filter(Boolean).map((section, idx) => (
                  <button key={idx} onClick={() => onInsertSection(section)} className="text-xs px-2 py-1 border border-[#2a2a2a] rounded text-[#ddd]">
                    Insert section {idx + 1}
                  </button>
                ))}
              </div>
            </div>
            <div className="bg-[#111] border border-[#2a2a2a] rounded p-3">
              <div className="text-xs text-[#888] mb-2">Versions</div>
              <div className="space-y-2">
                {versions.map((version) => (
                  <div key={version.id} className="border border-[#2a2a2a] rounded p-2">
                    <div className="text-xs text-[#9a9a9a]">{new Date(version.created_at).toLocaleString()} {version.note ? `- ${version.note}` : ''}</div>
                    <div className="text-xs text-white mt-1">Diff preview: {version.subject}</div>
                    <button onClick={() => rollback(version.id)} className="mt-2 text-xs inline-flex items-center gap-1 text-[#ddd]"><RotateCcw className="w-3 h-3" />Rollback</button>
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  )
}
