import {
  useState,
  useEffect,
  useCallback,
  useRef,
  createContext,
  useContext,
  type ReactNode,
} from 'react'
import StickyNote from './StickyNote'
import { PALETTE } from './palette'
import {
  generateNoteId,
  type StickyNoteData,
} from './storage'
import { findMediaElements } from '../lib/mediaDetect'
import { emitSaveToast } from '../lib/saveToast'

const PAGE_URL = window.location.href
const SAVE_DEBOUNCE_MS = 500

const NEXT_COLOR = (() => {
  let i = 0
  return () => { const c = PALETTE[i % PALETTE.length].bg; i++; return c }
})()

type StickyNotesCtx = {
  notes: StickyNoteData[]
  notesVisible: boolean
  setNotesVisible: (v: boolean | ((p: boolean) => boolean)) => void
  handleAddNote: () => void
  handleUpdateNote: (id: string, updates: Partial<StickyNoteData>) => void
  handleDeleteNote: (id: string) => void
}

const StickyNotesContext = createContext<StickyNotesCtx | null>(null)

/** Notes only — visibility toggled elsewhere; never unmounts the rest of the extension. */
function StickyNotesLayer() {
  const ctx = useContext(StickyNotesContext)
  if (!ctx) return null
  const { notes, notesVisible, handleUpdateNote, handleDeleteNote } = ctx
  return (
    <>
      {notesVisible && notes.map(note => (
        <StickyNote key={note.id} note={note} onUpdate={handleUpdateNote} onDelete={handleDeleteNote} />
      ))}
    </>
  )
}

function useGlobalHide() {
  const [globalHidden, setGlobalHidden] = useState(false)
  useEffect(() => {
    const handler = (e: Event) => {
      const detail = (e as CustomEvent<{ hidden: boolean }>).detail
      setGlobalHidden(detail.hidden)
    }
    document.addEventListener('inline:hideAll', handler)
    return () => document.removeEventListener('inline:hideAll', handler)
  }, [])
  return globalHidden
}

function StickyNotesProvider({ children }: { children: ReactNode }) {
  const [notes, setNotes] = useState<StickyNoteData[]>([])
  const [loaded, setLoaded] = useState(false)
  const [notesVisible, setNotesVisible] = useState(true)
  const saveTimer = useRef<ReturnType<typeof setTimeout> | null>(null)

  useEffect(() => {
    if (!chrome.runtime?.id) { setLoaded(true); return }
    chrome.runtime.sendMessage(
      { type: 'LOAD_ANNOTATIONS', payload: { pageUrl: PAGE_URL } },
      (response) => {
        if (chrome.runtime.lastError) {
          console.error('[Inline] Load failed:', chrome.runtime.lastError.message)
        } else if (response?.ok && Array.isArray(response.data?.elements?.stickyNotes)) {
          setNotes(response.data.elements.stickyNotes)
        }
        setLoaded(true)
      },
    )
  }, [])

  useEffect(() => {
    if (!loaded) return

    if (saveTimer.current) clearTimeout(saveTimer.current)
    saveTimer.current = setTimeout(() => {
      if (!chrome.runtime?.id) return
      chrome.runtime.sendMessage(
        {
          type: 'SAVE_ANNOTATIONS',
          payload: { pageUrl: PAGE_URL, featureKey: 'stickyNotes', data: notes },
        },
        (response) => {
          if (chrome.runtime.lastError) {
            console.error('[Inline] Message failed:', chrome.runtime.lastError.message)
            return
          }
          emitSaveToast(response)
          if (!response?.ok) {
            const err = String(response?.error ?? '')
            if (response?.queued || /queued|offline|unreachable/i.test(err)) {
              return
            }
            console.error('[Inline] Backend sync failed:', response?.error)
          }
        },
      )
    }, SAVE_DEBOUNCE_MS)

    return () => {
      if (saveTimer.current) clearTimeout(saveTimer.current)
    }
  }, [notes, loaded])

  const handleAddNote = useCallback(() => {
    const now = Date.now()
    const media = findMediaElements()
    const playingMedia = media.find(m => !m.element.paused)
    const mediaTimestamp = playingMedia ? playingMedia.currentTime : undefined
    setNotes(prev => {
      const offset = prev.length * 18
      return [...prev, {
        id: generateNoteId(),
        pageUrl: PAGE_URL,
        x: Math.min(window.innerWidth - 260, window.innerWidth / 2 - 120 + offset),
        y: Math.min(window.innerHeight - 220, window.innerHeight / 2 - 100 + offset),
        width: 240,
        height: 190,
        content: '',
        color: NEXT_COLOR(),
        title: 'Note',
        createdAt: now,
        updatedAt: now,
        ...(mediaTimestamp !== undefined && { mediaTimestamp }),
      }]
    })
  }, [])

  const handleUpdateNote = useCallback(
    (id: string, updates: Partial<StickyNoteData>) =>
      setNotes(prev => prev.map(n => n.id === id ? { ...n, ...updates, updatedAt: Date.now() } : n)),
    [],
  )

  const handleDeleteNote = useCallback(
    (id: string) => setNotes(prev => prev.filter(n => n.id !== id)),
    [],
  )

  const value: StickyNotesCtx = {
    notes,
    notesVisible,
    setNotesVisible,
    handleAddNote,
    handleUpdateNote,
    handleDeleteNote,
  }

  return (
    <StickyNotesContext.Provider value={value}>
      {children}
    </StickyNotesContext.Provider>
  )
}

function HideAwareWrapper() {
  const globalHidden = useGlobalHide()
  if (globalHidden) return null
  return (
    <>
      <StickyNotesLayer />
    </>
  )
}

export default function StickyNotesManager() {
  return (
    <StickyNotesProvider>
      <HideAwareWrapper />
    </StickyNotesProvider>
  )
}
