import { create } from 'zustand'

export interface EmailField {
  from: string
  to: string
  cc?: string
  bcc?: string
  subject?: string
  body: string
}

export interface DraftState {
  from: string
  to: string
  cc: string
  bcc: string
  subject: string
  body: string
  context: string
  tone: 'professional' | 'casual' | 'friendly' | 'formal'
  length: 'short' | 'medium' | 'long'
  personalizationDepth: 'minimal' | 'standard' | 'deep'
  isGenerating: boolean
  generatedAt: number | null
  draftId: string | null
}

export interface HistoryState {
  past: DraftState[]
  present: DraftState
  future: DraftState[]
}

export interface DraftStore {
  // Draft state
  from: string
  to: string
  cc: string
  bcc: string
  subject: string
  body: string
  context: string
  tone: 'professional' | 'casual' | 'friendly' | 'formal'
  length: 'short' | 'medium' | 'long'
  personalizationDepth: 'minimal' | 'standard' | 'deep'
  isGenerating: boolean
  generatedAt: number | null
  draftId: string | null
  showCc: boolean
  showBcc: boolean
  showSubject: boolean
  cursorPosition: number
  
  // History for undo/redo
  history: HistoryState
  
  // Actions - field updates
  setFrom: (value: string) => void
  setTo: (value: string) => void
  setCc: (value: string) => void
  setBcc: (value: string) => void
  setSubject: (value: string) => void
  setBody: (value: string) => void
  setContext: (value: string) => void
  setTone: (tone: 'professional' | 'casual' | 'friendly' | 'formal') => void
  setLength: (length: 'short' | 'medium' | 'long') => void
  setPersonalizationDepth: (depth: 'minimal' | 'standard' | 'deep') => void
  setIsGenerating: (value: boolean) => void
  setCursorPosition: (position: number) => void
  
  // Actions - UI toggles
  toggleCc: () => void
  toggleBcc: () => void
  toggleSubject: () => void
  
  // Actions - history management
  undo: () => void
  redo: () => void
  canUndo: () => boolean
  canRedo: () => boolean
  
  // Actions - draft management
  insertAtCursor: (text: string) => void
  replaceBody: (text: string) => void
  appendBody: (text: string) => void
  clear: () => void
  loadDraft: (draft: Partial<DraftState>) => void
}

const createInitialState = (): DraftState => ({
  from: '',
  to: '',
  cc: '',
  bcc: '',
  subject: 'Follow up',
  body: '',
  context: '',
  tone: 'professional',
  length: 'medium',
  personalizationDepth: 'standard',
  isGenerating: false,
  generatedAt: null,
  draftId: null,
})

export const useDraftStore = create<DraftStore>((set, get) => {
  const initialState = createInitialState()
  
  return {
    ...initialState,
    showCc: false,
    showBcc: false,
    showSubject: true,
    cursorPosition: 0,
    history: {
      past: [],
      present: initialState,
      future: [],
    },

    // Field setters with history tracking
    setFrom: (value: string) => {
      set((state) => {
        const newPresent = { ...state.history.present, from: value }
        return {
          from: value,
          history: {
            past: [...state.history.past, state.history.present],
            present: newPresent,
            future: [],
          },
        }
      })
    },

    setTo: (value: string) => {
      set((state) => {
        const newPresent = { ...state.history.present, to: value }
        return {
          to: value,
          history: {
            past: [...state.history.past, state.history.present],
            present: newPresent,
            future: [],
          },
        }
      })
    },

    setCc: (value: string) => {
      set((state) => {
        const newPresent = { ...state.history.present, cc: value }
        return {
          cc: value,
          history: {
            past: [...state.history.past, state.history.present],
            present: newPresent,
            future: [],
          },
        }
      })
    },

    setBcc: (value: string) => {
      set((state) => {
        const newPresent = { ...state.history.present, bcc: value }
        return {
          bcc: value,
          history: {
            past: [...state.history.past, state.history.present],
            present: newPresent,
            future: [],
          },
        }
      })
    },

    setSubject: (value: string) => {
      set((state) => {
        const newPresent = { ...state.history.present, subject: value }
        return {
          subject: value,
          history: {
            past: [...state.history.past, state.history.present],
            present: newPresent,
            future: [],
          },
        }
      })
    },

    setBody: (value: string) => {
      set((state) => {
        const newPresent = { ...state.history.present, body: value }
        return {
          body: value,
          history: {
            past: [...state.history.past, state.history.present],
            present: newPresent,
            future: [],
          },
        }
      })
    },

    setContext: (value: string) => {
      set((state) => {
        const newPresent = { ...state.history.present, context: value }
        return {
          context: value,
          history: {
            past: [...state.history.past, state.history.present],
            present: newPresent,
            future: [],
          },
        }
      })
    },

    setTone: (tone) => {
      set((state) => {
        const newPresent = { ...state.history.present, tone }
        return {
          tone,
          history: {
            past: [...state.history.past, state.history.present],
            present: newPresent,
            future: [],
          },
        }
      })
    },

    setLength: (length) => {
      set((state) => {
        const newPresent = { ...state.history.present, length }
        return {
          length,
          history: {
            past: [...state.history.past, state.history.present],
            present: newPresent,
            future: [],
          },
        }
      })
    },

    setPersonalizationDepth: (depth) => {
      set((state) => {
        const newPresent = { ...state.history.present, personalizationDepth: depth }
        return {
          personalizationDepth: depth,
          history: {
            past: [...state.history.past, state.history.present],
            present: newPresent,
            future: [],
          },
        }
      })
    },

    setIsGenerating: (value: boolean) => {
      set({ isGenerating: value })
    },

    setCursorPosition: (position: number) => {
      set({ cursorPosition: position })
    },

    toggleCc: () => {
      set((state) => ({ showCc: !state.showCc }))
    },

    toggleBcc: () => {
      set((state) => ({ showBcc: !state.showBcc }))
    },

    toggleSubject: () => {
      set((state) => ({ showSubject: !state.showSubject }))
    },

    undo: () => {
      set((state) => {
        if (state.history.past.length === 0) return state
        const newPast = state.history.past.slice(0, -1)
        const newPresent = state.history.past[state.history.past.length - 1]
        return {
          ...newPresent,
          history: {
            past: newPast,
            present: newPresent,
            future: [state.history.present, ...state.history.future],
          },
        }
      })
    },

    redo: () => {
      set((state) => {
        if (state.history.future.length === 0) return state
        const newPresent = state.history.future[0]
        const newFuture = state.history.future.slice(1)
        return {
          ...newPresent,
          history: {
            past: [...state.history.past, state.history.present],
            present: newPresent,
            future: newFuture,
          },
        }
      })
    },

    canUndo: () => get().history.past.length > 0,
    canRedo: () => get().history.future.length > 0,

    insertAtCursor: (text: string) => {
      set((state) => {
        const pos = state.cursorPosition
        const newBody = state.body.slice(0, pos) + text + state.body.slice(pos)
        const newPresent = { ...state.history.present, body: newBody }
        return {
          body: newBody,
          cursorPosition: pos + text.length,
          history: {
            past: [...state.history.past, state.history.present],
            present: newPresent,
            future: [],
          },
        }
      })
    },

    replaceBody: (text: string) => {
      set((state) => {
        const newPresent = { ...state.history.present, body: text }
        return {
          body: text,
          cursorPosition: text.length,
          history: {
            past: [...state.history.past, state.history.present],
            present: newPresent,
            future: [],
          },
        }
      })
    },

    appendBody: (text: string) => {
      set((state) => {
        const newBody = state.body + text
        const newPresent = { ...state.history.present, body: newBody }
        return {
          body: newBody,
          cursorPosition: newBody.length,
          history: {
            past: [...state.history.past, state.history.present],
            present: newPresent,
            future: [],
          },
        }
      })
    },

    clear: () => {
      const initial = createInitialState()
      set(() => ({
        ...initial,
        history: {
          past: [],
          present: initial,
          future: [],
        },
      }))
    },

    loadDraft: (draft: Partial<DraftState>) => {
      set((state) => {
        const newPresent = { ...state.history.present, ...draft }
        return {
          ...draft,
          draftId: draft.draftId || state.draftId,
          history: {
            past: [...state.history.past, state.history.present],
            present: newPresent,
            future: [],
          },
        }
      })
    },
  }
})
