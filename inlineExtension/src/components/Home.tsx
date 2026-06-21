import { useState, useCallback, useEffect, useLayoutEffect, useRef } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import Rewrite from './Rewrite'
import AI from './AI'
import Notes from './Notes'
import Settings from './Settings'
import Highlighter from './Highlighter'
import Draw from './Draw'
import CommandPalette from './CommandPalette'
import Layers from './Layers'
import Stamps from './Stamps'
import Search from './Search'
import CropOverlay from './CropOverlay'
import Laser from './Laser'
import SharePanel from './SharePanel'
import Handwriting from './Handwriting'
import { BRAND_GRADIENT, FONT, PANEL as C } from '../lib/extensionTheme'
import { isAiBusy } from '../lib/panelLock'
import { ensurePanelKeyframes } from './panelKit'
import { loadSettings } from '../lib/extensionSettings'

type PanelId =
  | 'rewrite' | 'ai' | 'notes' | 'settings' | 'highlighter' | 'draw'
  | 'layers' | 'stamps' | 'search' | 'screenshot' | 'laser' | 'share' | 'handwriting'
  | null

/** Open the Inline dashboard using the configured API base (not a hardcoded host). */
function openDashboard(path = '/app/dashboard') {
  void loadSettings()
    .then(s => { window.open(`${s.apiBaseUrl}${path}`, '_blank') })
    .catch(() => { window.open(`http://localhost:3000${path}`, '_blank') })
}

const spring = { type: 'spring' as const, stiffness: 380, damping: 30, mass: 0.6 }
const panelSpring = { type: 'spring' as const, stiffness: 440, damping: 36, mass: 0.5 }

/* ─── Tool glyphs ─── */
const IRewrite = () => (
  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round" strokeLinejoin="round">
    <path d="M17 3a2.828 2.828 0 1 1 4 4L7.5 20.5 2 22l1.5-5.5L17 3z" />
  </svg>
)
const IAi = () => (
  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round" strokeLinejoin="round">
    <path d="M12 3l1.912 5.813a2 2 0 0 0 1.275 1.275L21 12l-5.813 1.912a2 2 0 0 0-1.275 1.275L12 21l-1.912-5.813a2 2 0 0 0-1.275-1.275L3 12l5.813-1.912a2 2 0 0 0 1.275-1.275L12 3z" />
  </svg>
)
const INotes = () => (
  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round" strokeLinejoin="round">
    <path d="M14.5 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V7.5L14.5 2z" />
    <polyline points="14 2 14 8 20 8" /><line x1="16" y1="13" x2="8" y2="13" />
    <line x1="16" y1="17" x2="8" y2="17" /><line x1="10" y1="9" x2="8" y2="9" />
  </svg>
)
const IDraw = () => (
  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round" strokeLinejoin="round">
    <path d="M12 19l7-7 3 3-7 7-3-3z" /><path d="M18 13l-1.5-7.5L2 2l3.5 14.5L13 18l5-5z" />
    <path d="M2 2l7.586 7.586" /><circle cx="11" cy="11" r="2" />
  </svg>
)
const IHighlight = () => (
  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round" strokeLinejoin="round">
    <path d="M9 11l-6 6v3h9l3-3" /><path d="M22 12l-4.6 4.6a2 2 0 0 1-2.8 0l-5.2-5.2a2 2 0 0 1 0-2.8L14 4" />
  </svg>
)
const ISettings = () => (
  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round" strokeLinejoin="round">
    <circle cx="12" cy="12" r="3" />
    <path d="M12 1v2M12 21v2M4.22 4.22l1.42 1.42M18.36 18.36l1.42 1.42M1 12h2M21 12h2M4.22 19.78l1.42-1.42M18.36 5.64l1.42-1.42" />
  </svg>
)
const ILayers = () => (
  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round" strokeLinejoin="round">
    <polygon points="12 2 2 7 12 12 22 7 12 2" /><polyline points="2 17 12 22 22 17" /><polyline points="2 12 12 17 22 12" />
  </svg>
)
const IStamps = () => (
  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round" strokeLinejoin="round">
    <polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2" />
  </svg>
)
const ISearch = () => (
  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round" strokeLinejoin="round">
    <circle cx="11" cy="11" r="8" /><line x1="21" y1="21" x2="16.65" y2="16.65" />
  </svg>
)
const IScreenshot = () => (
  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round" strokeLinejoin="round">
    <path d="M23 19a2 2 0 0 1-2 2H3a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h4l2-3h6l2 3h4a2 2 0 0 1 2 2z" /><circle cx="12" cy="13" r="4" />
  </svg>
)
const ILaser = () => (
  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round" strokeLinejoin="round">
    <circle cx="12" cy="12" r="2" fill="currentColor" />
    <path d="M12 2v4M12 18v4M2 12h4M18 12h4M4.93 4.93l2.83 2.83M16.24 16.24l2.83 2.83M4.93 19.07l2.83-2.83M16.24 7.76l2.83-2.83" />
  </svg>
)
const IShare = () => (
  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round" strokeLinejoin="round">
    <circle cx="18" cy="5" r="3" /><circle cx="6" cy="12" r="3" /><circle cx="18" cy="19" r="3" />
    <line x1="8.59" y1="13.51" x2="15.42" y2="17.49" /><line x1="15.41" y1="6.51" x2="8.59" y2="10.49" />
  </svg>
)
const IHandwriting = () => (
  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round" strokeLinejoin="round">
    <path d="M17 3a2.828 2.828 0 1 1 4 4L7.5 20.5 2 22l1.5-5.5L17 3z" />
    <path d="M2 22c2-2 4-3.5 6-3.5s3 1 5 1 4-1.5 6-3.5" />
  </svg>
)
const INotebook = () => (
  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round" strokeLinejoin="round">
    <path d="M4 19.5A2.5 2.5 0 0 1 6.5 17H20" /><path d="M6.5 2H20v20H6.5A2.5 2.5 0 0 1 4 19.5v-15A2.5 2.5 0 0 1 6.5 2z" />
  </svg>
)
const IEyeOff = () => (
  <svg width="17" height="17" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round" strokeLinejoin="round">
    <path d="M17.94 17.94A10.07 10.07 0 0 1 12 20c-7 0-11-8-11-8a18.45 18.45 0 0 1 5.06-5.94" />
    <path d="M9.9 4.24A9.12 9.12 0 0 1 12 4c7 0 11 8 11 8a18.5 18.5 0 0 1-2.16 3.19" />
    <path d="M14.12 14.12a3 3 0 1 1-4.24-4.24" /><line x1="1" y1="1" x2="23" y2="23" />
  </svg>
)
const IMore = () => (
  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
    <circle cx="12" cy="12" r="1.5" />
    <circle cx="19" cy="12" r="1.5" />
    <circle cx="5" cy="12" r="1.5" />
  </svg>
)

/** The Inline brand glyph — the slanted tick from the web wordmark, in white. */
/** Small dark keycap used inside the launcher tooltip. */
function BrandGlyph({ size = 22 }: { size?: number }) {
  return (
    <span style={{
      display: 'block',
      width: Math.max(3, Math.round(size * 0.16)),
      height: Math.round(size * 0.58),
      borderRadius: 2,
      background: '#FFFFFF',
      transform: 'rotate(-12deg)',
    }} />
  )
}

function Kbd({ children }: { children: React.ReactNode }) {
  return (
    <span style={{
      display: 'inline-flex', alignItems: 'center', justifyContent: 'center',
      minWidth: 15, height: 15, padding: '0 3px', borderRadius: 4,
      background: C.surfaceMuted, color: C.textMuted, border: `1px solid ${C.border}`,
      fontSize: 9.5, fontWeight: 700, lineHeight: 1,
    }}>{children}</span>
  )
}

const RAIL_TOP = 38
const LAUNCHER = 40
const DOCK_BTN = 34
const DOCK_PAD = 5
const PANEL_GAP = 12
const SMALL_SCREEN = 560

interface HomeProps {
  selectedText: string
  originalRange: Range | null
}

type PaperNote = {
  id: string; x: number; y: number; w: number; h: number
  content: string; paperStyle: 'Plain' | 'Ruled' | 'Grid' | 'Dotted'
  createdAt: number; updatedAt: number
}

/** Tool definitions keyed by panel id — used to build the rail. */
const TOOL_DEFS: Record<string, { icon: React.ReactNode; label: string }> = {
  ai: { icon: <IAi />, label: 'Ask Inline' },
  rewrite: { icon: <IRewrite />, label: 'Rewrite' },
  highlighter: { icon: <IHighlight />, label: 'Highlight' },
  notes: { icon: <INotes />, label: 'Sticky note' },
  draw: { icon: <IDraw />, label: 'Draw' },
  handwriting: { icon: <IHandwriting />, label: 'Pen' },
  stamps: { icon: <IStamps />, label: 'Stamp' },
  search: { icon: <ISearch />, label: 'Search' },
  screenshot: { icon: <IScreenshot />, label: 'Screenshot' },
  laser: { icon: <ILaser />, label: 'Laser pointer' },
  layers: { icon: <ILayers />, label: 'Layers' },
  share: { icon: <IShare />, label: 'Share' },
  settings: { icon: <ISettings />, label: 'Settings' },
}

type DockGroupId = 'annotate' | 'utility'

const DOCK_PRIMARY: ({ type: 'tool'; id: Exclude<PanelId, null> } | { type: 'group'; id: DockGroupId; icon: React.ReactNode; label: string })[] = [
  { type: 'tool', id: 'ai' },
  { type: 'tool', id: 'rewrite' },
  { type: 'group', id: 'annotate', icon: <IHighlight />, label: 'Annotate' },
  { type: 'tool', id: 'search' },
  { type: 'group', id: 'utility', icon: <IMore />, label: 'More tools' },
]

const DOCK_FLYOUTS: Record<DockGroupId, Exclude<PanelId, null>[]> = {
  annotate: ['highlighter', 'notes', 'draw', 'handwriting', 'stamps'],
  utility: ['screenshot', 'laser', 'layers', 'share', 'settings'],
}

/** Tools that swap content into the main docked panel. */
const PANEL_TOOLS = new Set<string>(['ai', 'rewrite', 'search', 'settings', 'highlighter', 'draw', 'handwriting', 'stamps', 'layers', 'share'])

/** Tools that enter a page-interaction mode and show a status toast. */
const MODE_LABELS: Record<string, string> = {
  highlighter: 'Highlight mode active',
  draw: 'Drawing mode active',
  handwriting: 'Pen mode active',
  stamps: 'Stamp mode active',
  laser: 'Laser pointer active',
}

/** Panels whose tool interacts with the page — keep these open on page clicks. */
const MODE_PANEL_TOOLS = new Set<string>(['highlighter', 'draw', 'handwriting', 'stamps'])

function makePaperNoteId(): string {
  return `pn-${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 8)}`
}

/** Hairline divider between vertical rail segments. */
function RailDivider() {
  return <span style={{ height: 1, width: 22, background: C.divider, margin: '4px 0', flexShrink: 0 }} />
}

function requestHaptic() {
  try {
    navigator.vibrate?.(12)
  } catch { /* unavailable */ }
}

/** A single rail icon button with a custom navy tooltip to its left. */
function RailButton({
  icon, label, active, suppressTip, onClick,
}: {
  icon: React.ReactNode; label: string; active: boolean; suppressTip?: boolean
  onClick: (e: React.MouseEvent<HTMLButtonElement>) => void
}) {
  const [hov, setHov] = useState(false)
  const showTip = hov && !suppressTip
  return (
    <div style={{ position: 'relative', display: 'flex', alignItems: 'center', flexShrink: 0 }}>
      <AnimatePresence>
        {showTip && (
          <motion.span
            initial={{ opacity: 0, x: 5, scale: 0.94 }}
            animate={{ opacity: 1, x: 0, scale: 1 }}
            exit={{ opacity: 0, x: 5, scale: 0.94 }}
            transition={{ duration: 0.12, ease: 'easeOut' }}
            style={{
              position: 'absolute', right: '100%', top: '50%', transform: 'translateY(-50%)',
              marginRight: 12, whiteSpace: 'nowrap', pointerEvents: 'none',
              background: C.surfaceBubble, color: C.text, fontSize: 11.5, fontWeight: 600,
              padding: '6px 11px', borderRadius: 9, letterSpacing: '-0.01em', lineHeight: 1,
              border: `1px solid ${C.border}`,
            }}
          >
            {label}
            <span style={{
              position: 'absolute', left: '100%', top: '50%', transform: 'translateY(-50%)',
              width: 0, height: 0, borderTop: '5px solid transparent', borderBottom: '5px solid transparent',
              borderLeft: `6px solid ${C.surfaceBubble}`,
            }} />
          </motion.span>
        )}
      </AnimatePresence>
      <button
        type="button"
        onClick={onClick}
        onMouseEnter={() => setHov(true)}
        onMouseLeave={() => setHov(false)}
        aria-label={label}
        aria-pressed={active}
        style={{
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          width: DOCK_BTN, height: DOCK_BTN, borderRadius: 11, border: 'none', padding: 0,
          background: active ? C.accent : hov ? C.hoverBg : 'transparent',
          color: active ? '#FFFFFF' : C.textMuted,
          cursor: 'pointer', transition: 'background 0.14s, color 0.14s',
          boxShadow: 'none',
        }}
      >{icon}</button>
    </div>
  )
}

export default function Home({ selectedText, originalRange }: HomeProps) {
  const [activePanel, setActivePanel] = useState<PanelId>(null)
  const [paperNotes, setPaperNotes] = useState<PaperNote[]>([])
  const [paperNotesLoaded, setPaperNotesLoaded] = useState(false)
  const paperSaveTimer = useRef<ReturnType<typeof setTimeout> | null>(null)
  const [cmdPaletteOpen, setCmdPaletteOpen] = useState(false)
  const [screenshotUrl, setScreenshotUrl] = useState<string | null>(null)
  const [laserActive, setLaserActive] = useState(false)
  const [hidden, setHidden] = useState(false)
  const [dockOpen, setDockOpen] = useState(false)
  const [openGroup, setOpenGroup] = useState<DockGroupId | null>(null)
  const [launcherHover, setLauncherHover] = useState(false)

  /* Main-panel geometry — the panel is anchored to the LEFT of the launcher,
     top-aligned with the rail, and never moves when tools are swapped. */
  const [panelRight, setPanelRight] = useState<number>(16 + DOCK_BTN + 2 * DOCK_PAD + PANEL_GAP)
  const [smallScreen, setSmallScreen] = useState<boolean>(
    typeof window !== 'undefined' ? window.innerWidth < SMALL_SCREEN : false,
  )
  const colRef = useRef<HTMLDivElement>(null)
  const panelWrapRef = useRef<HTMLDivElement>(null)

  /* Inject the spinner keyframes into the shadow root once mounted. */
  useEffect(() => {
    const root = colRef.current?.getRootNode()
    ensurePanelKeyframes(root as ShadowRoot | Document | null)
  }, [])

  /* ─── Paper-note persistence ─── */
  useEffect(() => {
    if (!chrome.runtime?.id) { setPaperNotesLoaded(true); return }
    chrome.runtime.sendMessage(
      { type: 'LOAD_ANNOTATIONS', payload: { pageUrl: window.location.href } },
      (response) => {
        if (chrome.runtime.lastError) { setPaperNotesLoaded(true); return }
        const saved = response?.data?.elements?.paperNotes as PaperNote[] | undefined
        if (Array.isArray(saved)) setPaperNotes(saved)
        setPaperNotesLoaded(true)
      },
    )
  }, [])

  useEffect(() => {
    if (!paperNotesLoaded) return
    if (paperSaveTimer.current) clearTimeout(paperSaveTimer.current)
    paperSaveTimer.current = setTimeout(() => {
      if (!chrome.runtime?.id) return
      chrome.runtime.sendMessage(
        {
          type: 'SAVE_ANNOTATIONS',
          payload: {
            pageUrl: window.location.href,
            featureKey: 'paperNotes',
            data: paperNotes,
            pageTitle: document.title,
            domain: window.location.hostname,
            clearedAt: paperNotes.length === 0 ? Date.now() : null,
          },
        },
        () => { if (chrome.runtime.lastError) { /* ignore */ } },
      )
    }, 500)
    return () => { if (paperSaveTimer.current) clearTimeout(paperSaveTimer.current) }
  }, [paperNotes, paperNotesLoaded])

  const updatePaperNote = useCallback((id: string, patch: Partial<PaperNote>) => {
    setPaperNotes(prev => prev.map(n => n.id === id ? { ...n, ...patch, updatedAt: Date.now() } : n))
  }, [])

  const closePaperNote = useCallback((id: string) => {
    setPaperNotes(prev => prev.filter(n => n.id !== id))
  }, [])

  const closePanel = useCallback(() => {
    setActivePanel(null)
  }, [])

  /* Spawn a sticky note (page object). */
  const spawnNote = useCallback(() => {
    setPaperNotes(prev => [...prev, {
      id: makePaperNoteId(),
      x: 120 + prev.length * 20, y: 120 + prev.length * 20,
      w: 320, h: 260, content: '', paperStyle: 'Plain',
      createdAt: Date.now(), updatedAt: Date.now(),
    }])
  }, [])

  /* Capture a screenshot, then open the crop overlay. */
  const captureScreenshot = useCallback(() => {
    if (!chrome.runtime?.id) return
    chrome.runtime.sendMessage({ type: 'CAPTURE_TAB' }, (response) => {
      if (chrome.runtime.lastError) return
      if (response?.ok && response.dataUrl) setScreenshotUrl(response.dataUrl)
    })
  }, [])

  /**
   * Run a tool from the rail. Panels swap content inside the single docked
   * surface (one at a time); the same icon toggles the panel/mode off.
   */
  const runTool = useCallback((id: PanelId) => {
    if (!id) return
    requestHaptic()
    setDockOpen(true)
    setOpenGroup(null)
    if (id === 'notes') { spawnNote(); return }
    if (id === 'screenshot') { captureScreenshot(); return }
    if (id === 'laser') { setLaserActive(p => !p); return }
    if (PANEL_TOOLS.has(id)) setActivePanel(p => (p === id ? null : id))
  }, [spawnNote, captureScreenshot])

  /** The launcher opens the flagship Ask Inline surface (or toggles it shut). */
  const toggleLauncher = useCallback(() => {
    requestHaptic()
    setDockOpen(v => {
      const next = !v
      if (!next) setOpenGroup(null)
      return next
    })
  }, [])

  const toggleHidden = useCallback(() => {
    setHidden(h => {
      const next = !h
      if (next) {
        closePanel(); setLaserActive(false); setScreenshotUrl(null)
        setDockOpen(false)
        setOpenGroup(null)
        document.dispatchEvent(new CustomEvent('inline:hideAll', { detail: { hidden: true } }))
      } else {
        document.dispatchEvent(new CustomEvent('inline:hideAll', { detail: { hidden: false } }))
      }
      return next
    })
  }, [closePanel])

  useEffect(() => {
    const handler = (e: Event) => {
      const detail = (e as CustomEvent<{ hidden: boolean }>).detail
      setHidden(detail.hidden)
    if (detail.hidden) { closePanel(); setLaserActive(false); setScreenshotUrl(null); setDockOpen(false); setOpenGroup(null) }
    }
    document.addEventListener('inline:hideAll', handler)
    return () => document.removeEventListener('inline:hideAll', handler)
  }, [closePanel])

  /* ─── Panel anchor: measure the rail's left edge, sit just left of it ─── */
  const recomputePanelRight = useCallback(() => {
    const rail = colRef.current
    if (!rail) return
    const r = rail.getBoundingClientRect()
    setPanelRight(Math.max(14, Math.round(window.innerWidth - r.left + PANEL_GAP)))
  }, [])

  useLayoutEffect(() => {
    recomputePanelRight()
  }, [recomputePanelRight, hidden, activePanel])

  useEffect(() => {
    const onResize = () => {
      setSmallScreen(window.innerWidth < SMALL_SCREEN)
      recomputePanelRight()
    }
    window.addEventListener('resize', onResize)
    return () => window.removeEventListener('resize', onResize)
  }, [recomputePanelRight])

  /* ─── Outside-click: close panel unless typing/editing or AI generating ─── */
  useEffect(() => {
    if (!activePanel) return
    const onPointerDown = (e: Event) => {
      const path = (e as Event & { composedPath?: () => EventTarget[] }).composedPath?.() ?? []
      const inPanel = panelWrapRef.current ? path.includes(panelWrapRef.current) : false
      const inRail = colRef.current ? path.includes(colRef.current) : false
      if (inPanel || inRail) return
      // Mode tools interact with the page itself (drawing, selecting, stamping)
      // — page clicks must not dismiss their panel.
      if (MODE_PANEL_TOOLS.has(activePanel)) return
      if (isAiBusy()) return
      const sr = panelWrapRef.current?.getRootNode() as ShadowRoot | null
      const ae = sr?.activeElement as HTMLElement | null
      const editing = !!ae && panelWrapRef.current?.contains(ae) && (
        ae.tagName === 'INPUT' || ae.tagName === 'TEXTAREA' || ae.isContentEditable
      )
      if (editing) return
      closePanel()
    }
    document.addEventListener('pointerdown', onPointerDown, true)
    return () => document.removeEventListener('pointerdown', onPointerDown, true)
  }, [activePanel, closePanel])

  /* ─── Escape: cancel mode, then close panel ─── */
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.key !== 'Escape') return
      if (laserActive) { e.stopPropagation(); setLaserActive(false); return }
      if (activePanel) { e.stopPropagation(); closePanel() }
    }
    document.addEventListener('keydown', onKey, true)
    return () => document.removeEventListener('keydown', onKey, true)
  }, [laserActive, activePanel, closePanel])

  const handlePaletteAction = useCallback((actionId: string) => {
    switch (actionId) {
      case 'rewrite': case 'ai': case 'search': case 'settings':
      case 'highlighter': case 'draw': case 'handwriting':
      case 'stamps': case 'layers': case 'share':
        runTool(actionId as PanelId); break
      case 'notes': spawnNote(); break
      case 'screenshot': captureScreenshot(); break
      case 'laser': setLaserActive(p => !p); break
      case 'notebooks': openDashboard(); break
      case 'collapse': setDockOpen(v => { const next = !v; if (!next) setOpenGroup(null); return next }); break
      case 'pause': toggleHidden(); break
    }
    setCmdPaletteOpen(false)
  }, [runTool, spawnNote, captureScreenshot, toggleHidden])

  useEffect(() => {
    const handleCommand = (e: Event) => {
      const command = (e as CustomEvent<{ command: string }>).detail.command
      switch (command) {
        case 'toggle-command-palette': setCmdPaletteOpen(v => !v); break
        case 'toggle-rewrite': runTool('rewrite'); break
        case 'toggle-ai': runTool('ai'); break
        case 'toggle-highlighter': runTool('highlighter'); break
        case 'new-note': spawnNote(); break
        case 'toggle-pause': toggleHidden(); break
      }
    }
    document.addEventListener('inline:command', handleCommand)
    return () => document.removeEventListener('inline:command', handleCommand)
  }, [runTool, spawnNote, toggleHidden])

  useEffect(() => {
    const handleKb = (e: KeyboardEvent) => {
      if ((e.ctrlKey || e.metaKey) && e.shiftKey && e.key.toLowerCase() === 'k') {
        e.preventDefault()
        setCmdPaletteOpen(v => !v)
      }
    }
    document.addEventListener('keydown', handleKb)
    return () => document.removeEventListener('keydown', handleKb)
  }, [])

  const modeLabel = laserActive
    ? MODE_LABELS.laser
    : activePanel && MODE_LABELS[activePanel]
      ? MODE_LABELS[activePanel]
      : null

  const panelInner = activePanel ? (
    <AnimatePresence mode="wait">
      <motion.div
        key={activePanel}
        initial={{ opacity: 0, x: 10, scale: 0.985 }}
        animate={{ opacity: 1, x: 0, scale: 1 }}
        exit={{ opacity: 0, x: 10, scale: 0.985 }}
        transition={panelSpring}
        style={{ pointerEvents: 'auto' }}
      >
        {activePanel === 'rewrite' && <Rewrite selectedText={selectedText} originalRange={originalRange} onClose={closePanel} />}
        {activePanel === 'ai' && <AI selectedText={selectedText} originalRange={originalRange} onClose={closePanel} />}
        {activePanel === 'search' && <Search onClose={closePanel} />}
        {activePanel === 'settings' && <Settings onClose={closePanel} onOpenDashboard={() => { openDashboard(); closePanel() }} />}
        {activePanel === 'highlighter' && <Highlighter onClose={closePanel} />}
        {activePanel === 'draw' && <Draw onClose={closePanel} />}
        {activePanel === 'handwriting' && <Handwriting onClose={closePanel} />}
        {activePanel === 'stamps' && <Stamps onClose={closePanel} />}
        {activePanel === 'layers' && <Layers onClose={closePanel} />}
        {activePanel === 'share' && <SharePanel onClose={closePanel} />}
      </motion.div>
    </AnimatePresence>
  ) : null

  return (
    <>
      {/* ─── Main docked panel: anchored top-left of the launcher (stable) ─── */}
      <AnimatePresence>
        {!hidden && activePanel && !smallScreen && (
          <motion.div
            data-inline-interactive=""
            ref={panelWrapRef}
            key="panel-wrap"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.14 }}
            style={{
              position: 'fixed', right: panelRight, top: RAIL_TOP,
              zIndex: 2147483646, pointerEvents: 'none',
              display: 'flex', fontFamily: FONT,
            }}
          >
            {panelInner}
          </motion.div>
        )}
      </AnimatePresence>

      {/* ─── Small-screen: centered floating card with scrim ─── */}
      <AnimatePresence>
        {!hidden && activePanel && smallScreen && (
          <>
            <motion.div
              data-inline-interactive=""
              key="scrim"
              initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
              transition={{ duration: 0.16 }}
              onPointerDown={() => { if (!isAiBusy()) closePanel() }}
              style={{
                position: 'fixed', inset: 0, zIndex: 2147483645,
                background: 'rgba(11,18,33,0.34)', pointerEvents: 'auto',
              }}
            />
            <motion.div
              data-inline-interactive=""
              ref={panelWrapRef}
              key="panel-sheet"
              initial={{ opacity: 0, y: 24, scale: 0.98 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              exit={{ opacity: 0, y: 24, scale: 0.98 }}
              transition={panelSpring}
              style={{
                position: 'fixed', left: '50%', top: '50%',
                transform: 'translate(-50%, -50%)',
                zIndex: 2147483646, pointerEvents: 'none', display: 'flex', fontFamily: FONT,
              }}
            >
              {panelInner}
            </motion.div>
          </>
        )}
      </AnimatePresence>

      {/* ─── Right rail: launcher (top) + vertical tool dock ─── */}
      <div
        data-inline-interactive=""
        ref={colRef}
        style={{
          position: 'fixed', right: 16, top: RAIL_TOP,
          zIndex: 2147483647, pointerEvents: 'none',
          display: 'flex', flexDirection: 'column', alignItems: 'flex-end', gap: 12,
          fontFamily: FONT,
        }}
      >
        {hidden ? (
          <motion.button
            type="button"
            onClick={toggleHidden}
            aria-label="Show Inline"
            initial={{ opacity: 0, scale: 0.8 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={spring}
            style={{
              pointerEvents: 'auto', width: 40, height: 40, borderRadius: 13,
              background: BRAND_GRADIENT, border: '1px solid rgba(255,255,255,0.14)',
              cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center',
              color: '#FFFFFF', boxShadow: C.shadowOuter, padding: 0,
            }}
          ><BrandGlyph size={20} /></motion.button>
        ) : (
          <>
            {/* Launcher (master) with mode toast floating directly above it */}
            <div style={{ position: 'relative', display: 'flex', alignItems: 'center', pointerEvents: 'auto' }}>
              {/* Tool-mode status toast — pinned above the launcher */}
              <AnimatePresence>
                {modeLabel && (
                  <motion.div
                    key={modeLabel}
                    initial={{ opacity: 0, y: 6, scale: 0.94 }}
                    animate={{ opacity: 1, y: 0, scale: 1 }}
                    exit={{ opacity: 0, y: 6, scale: 0.94 }}
                    transition={{ duration: 0.16, ease: 'easeOut' }}
                    style={{
                      position: 'absolute', bottom: 'calc(100% + 9px)', right: 0,
                      pointerEvents: 'none', display: 'flex', alignItems: 'center', gap: 7,
                      background: C.surfaceBubble, color: C.text, padding: '6px 12px', borderRadius: 11,
                      fontSize: 11.5, fontWeight: 600, letterSpacing: '-0.01em', whiteSpace: 'nowrap',
                      border: `1px solid ${C.border}`,
                    }}
                  >
                    <span style={{ width: 6, height: 6, borderRadius: '50%', background: '#16A34A' }} />
                    {modeLabel}
                  </motion.div>
                )}
              </AnimatePresence>

              {/* Launcher hover tooltip */}
              <AnimatePresence>
                {launcherHover && !dockOpen && !activePanel && (
                  <motion.div
                    initial={{ opacity: 0, x: 8, scale: 0.94 }}
                    animate={{ opacity: 1, x: 0, scale: 1 }}
                    exit={{ opacity: 0, x: 8, scale: 0.94 }}
                    transition={{ duration: 0.13, ease: 'easeOut' }}
                    style={{
                      position: 'absolute', right: '100%', marginRight: 13,
                      display: 'flex', alignItems: 'center', gap: 8, whiteSpace: 'nowrap',
                      background: C.surfaceBubble, color: C.text, padding: '7px 12px', borderRadius: 10,
                      fontSize: 11.5, fontWeight: 600, letterSpacing: '-0.01em', pointerEvents: 'none',
                      border: `1px solid ${C.border}`,
                    }}
                  >
                    <span>Open Inline tools</span>
                    <span style={{ display: 'inline-flex', gap: 3 }}><Kbd>⌘</Kbd><Kbd>⇧</Kbd><Kbd>K</Kbd></span>
                    <span style={{
                      position: 'absolute', left: '100%', top: '50%', transform: 'translateY(-50%)',
                      width: 0, height: 0, borderTop: '5px solid transparent', borderBottom: '5px solid transparent',
                      borderLeft: `6px solid ${C.surfaceBubble}`,
                    }} />
                  </motion.div>
                )}
              </AnimatePresence>

              <motion.button
                type="button"
                onClick={toggleLauncher}
                onMouseEnter={() => setLauncherHover(true)}
                onMouseLeave={() => setLauncherHover(false)}
                aria-label={dockOpen ? 'Close Inline tools' : 'Open Inline tools'}
                aria-expanded={dockOpen}
                initial={{ opacity: 0, scale: 0.8 }}
                animate={{ opacity: 1, scale: 1 }}
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.94 }}
                transition={spring}
                style={{
                  position: 'relative', width: LAUNCHER, height: LAUNCHER, borderRadius: 13,
                  background: BRAND_GRADIENT,
                  border: `1px solid ${dockOpen ? C.accent : 'rgba(17,24,39,0.18)'}`,
                  display: 'flex', alignItems: 'center', justifyContent: 'center',
                  cursor: 'pointer', padding: 0, outline: 'none',
                  color: '#FFFFFF',
                  boxShadow: C.shadowOuter,
                }}
              >
                <BrandGlyph size={21} />
              </motion.button>
            </div>

            {/* Vertical tool dock — always present, the persistent right rail */}
            <AnimatePresence>
              {dockOpen && (
                <motion.div
                  initial={{ opacity: 0, y: -8, scale: 0.98 }}
                  animate={{ opacity: 1, y: 0, scale: 1 }}
                  exit={{ opacity: 0, y: -8, scale: 0.98 }}
                  transition={spring}
                  style={{
                    pointerEvents: 'auto',
                    display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 2,
                    padding: DOCK_PAD, background: C.bg, border: `1px solid ${C.border}`,
                    borderRadius: 17, boxShadow: C.shadowOuter,
                    maxHeight: 'min(72vh, 640px)', overflowY: 'auto', overflowX: 'hidden',
                  }}
                >
                  {DOCK_PRIMARY.map((item) => {
                    if (item.type === 'tool') {
                      const def = TOOL_DEFS[item.id]
                      const isActive = item.id === 'laser' ? laserActive : activePanel === item.id
                      return (
                        <RailButton
                          key={item.id}
                          icon={def.icon}
                          label={def.label}
                          active={isActive}
                          suppressTip={isActive}
                          onClick={() => runTool(item.id)}
                        />
                      )
                    }
                    const groupActive = openGroup === item.id || DOCK_FLYOUTS[item.id].some(id => id === 'laser' ? laserActive : activePanel === id)
                    return (
                      <RailButton
                        key={item.id}
                        icon={item.icon}
                        label={item.label}
                        active={groupActive}
                        suppressTip={groupActive}
                        onClick={() => {
                          requestHaptic()
                          setOpenGroup(g => g === item.id ? null : item.id)
                        }}
                      />
                    )
                  })}
                  <RailDivider />
                  <RailButton icon={<INotebook />} label="Notebooks" active={false} onClick={() => { requestHaptic(); openDashboard() }} />
                  <RailButton icon={<IEyeOff />} label="Hide Inline" active={false} onClick={toggleHidden} />
                </motion.div>
              )}
            </AnimatePresence>
            <AnimatePresence>
              {dockOpen && openGroup && (
                <motion.div
                  key={openGroup}
                  initial={{ opacity: 0, x: 8, scale: 0.98 }}
                  animate={{ opacity: 1, x: 0, scale: 1 }}
                  exit={{ opacity: 0, x: 8, scale: 0.98 }}
                  transition={{ duration: 0.14, ease: 'easeOut' }}
                  style={{
                    position: 'absolute',
                    right: 'calc(100% + 10px)',
                    top: LAUNCHER + 10,
                    pointerEvents: 'auto',
                    width: 158,
                    padding: 5,
                    borderRadius: 15,
                    border: `1px solid ${C.border}`,
                    background: C.bg,
                    boxShadow: C.shadowOuter,
                    display: 'flex',
                    flexDirection: 'column',
                    gap: 2,
                  }}
                >
                  {DOCK_FLYOUTS[openGroup].map((id) => {
                    const def = TOOL_DEFS[id]
                    const isActive = id === 'laser' ? laserActive : activePanel === id
                    return (
                      <button
                        key={id}
                        type="button"
                        onClick={() => runTool(id)}
                        aria-label={def.label}
                        aria-pressed={isActive}
                        style={{
                          display: 'flex',
                          alignItems: 'center',
                          gap: 10,
                          width: '100%',
                          minHeight: 32,
                          padding: '6px 8px',
                          borderRadius: 10,
                          border: 'none',
                          background: isActive ? C.toneSelectedBg : 'transparent',
                          color: isActive ? C.text : C.textMuted,
                          cursor: 'pointer',
                          fontFamily: FONT,
                          fontSize: 12,
                          fontWeight: 600,
                          textAlign: 'left',
                        }}
                      >
                        <span style={{ display: 'inline-flex', color: isActive ? C.accent : C.textMuted }}>{def.icon}</span>
                        <span>{def.label}</span>
                      </button>
                    )
                  })}
                </motion.div>
              )}
            </AnimatePresence>
          </>
        )}
      </div>

      {/* ─── Page objects & overlays ─── */}
      {!hidden && paperNotes.map(n => (
        <Notes
          key={n.id}
          initialX={n.x} initialY={n.y} initialW={n.w} initialH={n.h}
          initialContent={n.content} initialPaperStyle={n.paperStyle}
          onClose={() => closePaperNote(n.id)}
          onUpdate={(patch) => updatePaperNote(n.id, patch)}
        />
      ))}

      {cmdPaletteOpen && (
        <CommandPalette onClose={() => setCmdPaletteOpen(false)} onAction={handlePaletteAction} />
      )}

      {!hidden && screenshotUrl && (
        <CropOverlay screenshot={screenshotUrl} onClose={() => setScreenshotUrl(null)} />
      )}

      {!hidden && laserActive && (
        <Laser onClose={() => setLaserActive(false)} />
      )}
    </>
  )
}
