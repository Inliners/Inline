import { useState, useCallback, useEffect, useLayoutEffect, useRef } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import Rewrite from './Rewrite'
import AI from './AI'
import {
  IconAi,
  IconDraw,
  IconEyeOff,
  IconHandwriting,
  IconHighlight,
  IconLaser,
  IconLayers,
  IconMore,
  IconNotebook,
  IconNotes,
  IconRewrite,
  IconScreenshot,
  IconSearch,
  IconSettings,
  IconStamp,
  DockMenuIcon,
} from './toolIcons'
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
import Handwriting from './Handwriting'
import { BRAND_GRADIENT, FONT, PANEL as C } from '../lib/extensionTheme'
import { isAiBusy } from '../lib/panelLock'
import { ensurePanelKeyframes } from './panelKit'
import { loadSettings } from '../lib/extensionSettings'
import { DEFAULT_WEB_URL } from '../lib/inlineUrls'
import {
  emitDockPanelClosed,
  emitDockPanelOpen,
  emitSelectionUiDismiss,
  onDockPanelDismiss,
  onSelectionUiActive,
} from '../content/inlineUiCoordinator'

type PanelId =
  | 'rewrite' | 'ai' | 'notes' | 'settings' | 'highlighter' | 'draw'
  | 'layers' | 'stamps' | 'search' | 'screenshot' | 'laser' | 'handwriting'
  | null

/** Open the Inline dashboard using the configured API base (not a hardcoded host). */
function openDashboard(path = '/app/dashboard') {
  void loadSettings()
    .then(s => { window.open(`${s.apiBaseUrl}${path}`, '_blank') })
    .catch(() => { window.open(`${DEFAULT_WEB_URL}${path}`, '_blank') })
}

const spring = { type: 'spring' as const, stiffness: 380, damping: 30, mass: 0.6 }
const panelSpring = { type: 'spring' as const, stiffness: 440, damping: 36, mass: 0.5 }

/* ─── Tool glyphs (shared with panel headers) ─── */
const IRewrite = () => <IconRewrite />
const IAi = () => <IconAi />
const INotes = () => <IconNotes />
const IDraw = () => <IconDraw />
const IHighlight = () => <IconHighlight />
const ISettings = () => <IconSettings />
const ILayers = () => <IconLayers />
const IStamps = () => <IconStamp />
const ISearch = () => <IconSearch />
const IScreenshot = () => <IconScreenshot />
const ILaser = () => <IconLaser />
const IHandwriting = () => <IconHandwriting />
const INotebook = () => <IconNotebook />
const IEyeOff = () => <IconEyeOff />
const IMore = () => <IconMore />

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

type InlineToastTone = 'success' | 'local' | 'error'

type InlineToast = {
  id: number
  message: string
  tone: InlineToastTone
  actionLabel?: string
  onAction?: () => void
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
  utility: ['screenshot', 'laser', 'layers', 'settings'],
}

/** Tools that swap content into the main docked panel. */
const PANEL_TOOLS = new Set<string>(['ai', 'rewrite', 'search', 'settings', 'highlighter', 'draw', 'handwriting', 'stamps', 'layers'])

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

/** A single rail icon button with a custom tooltip to its left. */
function RailButton({
  icon, label, active, onClick,
}: {
  icon: React.ReactNode; label: string; active: boolean
  onClick: (e: React.MouseEvent<HTMLButtonElement>) => void
}) {
  const [hov, setHov] = useState(false)
  const [focused, setFocused] = useState(false)
  const tooltipId = `inline-rail-tip-${label.toLowerCase().replace(/[^a-z0-9]+/g, '-')}`
  const showTip = hov || focused
  return (
    <div style={{ position: 'relative', display: 'flex', alignItems: 'center', flexShrink: 0 }}>
      <AnimatePresence>
        {showTip && (
          <motion.span
            id={tooltipId}
            role="tooltip"
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
        onFocus={() => setFocused(true)}
        onBlur={() => setFocused(false)}
        aria-label={label}
        aria-describedby={showTip ? tooltipId : undefined}
        aria-pressed={active}
        style={{
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          width: DOCK_BTN, height: DOCK_BTN, borderRadius: 11, border: 'none', padding: 0,
          background: active ? C.toneSelectedBg : hov ? C.hoverBg : 'transparent',
          color: active ? C.accent : C.textMuted,
          cursor: 'pointer', transition: 'background 0.14s, color 0.14s',
          boxShadow: active
            ? `inset 0 0 0 1px ${C.borderStrong}${focused ? ', 0 0 0 3px rgba(19, 42, 79, 0.18)' : ''}`
            : focused
              ? '0 0 0 3px rgba(19, 42, 79, 0.18)'
              : 'none',
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
  const paperHydrated = useRef(false)
  const [cmdPaletteOpen, setCmdPaletteOpen] = useState(false)
  const [screenshotUrl, setScreenshotUrl] = useState<string | null>(null)
  const [laserActive, setLaserActive] = useState(false)
  const [hidden, setHidden] = useState(false)
  const [dockOpen, setDockOpen] = useState(false)
  const [openGroup, setOpenGroup] = useState<DockGroupId | null>(null)
  const [launcherHover, setLauncherHover] = useState(false)
  const [launcherFocus, setLauncherFocus] = useState(false)
  const [toast, setToast] = useState<InlineToast | null>(null)
  const toastTimer = useRef<ReturnType<typeof setTimeout> | null>(null)

  /* Main-panel geometry — the panel is anchored to the LEFT of the launcher,
     top-aligned with the rail, and never moves when tools are swapped. */
  const [panelRight, setPanelRight] = useState<number>(16 + DOCK_BTN + 2 * DOCK_PAD + PANEL_GAP)
  const [smallScreen, setSmallScreen] = useState<boolean>(
    typeof window !== 'undefined' ? window.innerWidth < SMALL_SCREEN : false,
  )
  const colRef = useRef<HTMLDivElement>(null)
  const panelWrapRef = useRef<HTMLDivElement>(null)
  const flyoutRef = useRef<HTMLDivElement>(null)

  /* Inject the spinner keyframes into the shadow root once mounted. */
  useEffect(() => {
    const root = colRef.current?.getRootNode()
    ensurePanelKeyframes(root as ShadowRoot | Document | null)
  }, [])

  /* ─── Paper-note persistence ─── */
  const showToast = useCallback((message: string, tone: InlineToastTone = 'success', actionLabel?: string, onAction?: () => void) => {
    if (toastTimer.current) clearTimeout(toastTimer.current)
    setToast({ id: Date.now(), message, tone, actionLabel, onAction })
    toastTimer.current = setTimeout(() => setToast(null), 2600)
  }, [])

  useEffect(() => {
    return () => {
      if (toastTimer.current) clearTimeout(toastTimer.current)
    }
  }, [])

  useEffect(() => {
    const onToast = (e: Event) => {
      const detail = (e as CustomEvent<{ message?: string; tone?: InlineToastTone; action?: 'dashboard' }>).detail
      if (!detail?.message) return
      showToast(
        detail.message,
        detail.tone ?? 'success',
        detail.action === 'dashboard' ? 'Open →' : undefined,
        detail.action === 'dashboard' ? () => openDashboard() : undefined,
      )
    }
    document.addEventListener('inline:toast', onToast)
    return () => document.removeEventListener('inline:toast', onToast)
  }, [showToast])

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
    if (!paperHydrated.current) {
      paperHydrated.current = true
      return
    }
    if (paperSaveTimer.current) clearTimeout(paperSaveTimer.current)
    paperSaveTimer.current = setTimeout(() => {
      if (!chrome.runtime?.id) return
      chrome.storage.local.get(['inlineAccessToken', 'inlineActiveWorkspaceId'], auth => {
        const syncReady = typeof auth?.inlineAccessToken === 'string' && auth.inlineAccessToken.split('.').length === 3 && typeof auth?.inlineActiveWorkspaceId === 'string' && auth.inlineActiveWorkspaceId.length > 0
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
          (response) => {
            if (chrome.runtime.lastError) {
              showToast('Could not save. Try again.', 'error')
              return
            }
            if (response?.ok) {
              const synced = response.storageMode === 'workspace' || (response.storageMode !== 'local' && syncReady)
              if (synced) {
                showToast('Saved to Workspace', 'success', 'Open →', () => openDashboard())
              } else {
                showToast('Saved to browser.', 'local')
              }
              return
            }
            if (response?.queued) {
              showToast('Saved to browser.', 'local')
              return
            }
            showToast('Could not save. Try again.', 'error')
          },
        )
      })
    }, 500)
    return () => { if (paperSaveTimer.current) clearTimeout(paperSaveTimer.current) }
  }, [paperNotes, paperNotesLoaded, showToast])

  const updatePaperNote = useCallback((id: string, patch: Partial<PaperNote>) => {
    setPaperNotes(prev => prev.map(n => n.id === id ? { ...n, ...patch, updatedAt: Date.now() } : n))
  }, [])

  const closePaperNote = useCallback((id: string) => {
    setPaperNotes(prev => prev.filter(n => n.id !== id))
  }, [])

  const closePanel = useCallback(() => {
    setActivePanel(null)
    emitDockPanelClosed()
  }, [])

  /** Open/close Annotate or More tools flyout; dismisses the main panel when opening. */
  const toggleDockGroup = useCallback((groupId: DockGroupId) => {
    requestHaptic()
    const isClosing = openGroup === groupId
    if (!isClosing) closePanel()
    setOpenGroup(g => g === groupId ? null : groupId)
  }, [openGroup, closePanel])

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
    if (id === 'notes') {
      emitSelectionUiDismiss()
      spawnNote()
      return
    }
    if (id === 'screenshot') {
      emitSelectionUiDismiss()
      captureScreenshot()
      return
    }
    if (id === 'laser') {
      setLaserActive(p => {
        if (!p) emitSelectionUiDismiss()
        return !p
      })
      return
    }
    if (PANEL_TOOLS.has(id)) {
      setActivePanel(p => {
        const next = p === id ? null : id
        if (next) {
          emitSelectionUiDismiss()
          emitDockPanelOpen(next)
        } else {
          emitDockPanelClosed()
        }
        return next
      })
    }
  }, [spawnNote, captureScreenshot])

  /** The launcher opens the flagship Ask Inline surface (or toggles it shut). */
  const toggleLauncher = useCallback(() => {
    requestHaptic()
    setDockOpen(v => {
      const next = !v
      setOpenGroup(null)
      if (next) {
        emitSelectionUiDismiss()
        emitDockPanelOpen('ai')
        setActivePanel('ai')
      } else {
        setActivePanel(null)
        emitDockPanelClosed()
      }
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
        emitSelectionUiDismiss()
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
    if (detail.hidden) {
      closePanel(); setLaserActive(false); setScreenshotUrl(null)
      setDockOpen(false); setOpenGroup(null)
      emitSelectionUiDismiss()
    }
    }
    document.addEventListener('inline:hideAll', handler)
    return () => document.removeEventListener('inline:hideAll', handler)
  }, [closePanel])

  /* Collapse dock panel/flyouts when selection UI takes focus (rail stays). */
  useEffect(() => {
    const collapseDockPanel = () => {
      setOpenGroup(null)
      setActivePanel(current => {
        if (current !== null) emitDockPanelClosed()
        return null
      })
    }
    const offSelection = onSelectionUiActive(() => { collapseDockPanel() })
    const offDismiss = onDockPanelDismiss(collapseDockPanel)
    return () => {
      offSelection()
      offDismiss()
    }
  }, [])

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

  /* ─── Outside-click: close Annotate / More tools flyout ─── */
  useEffect(() => {
    if (!openGroup) return
    const onPointerDown = (e: Event) => {
      const path = (e as Event & { composedPath?: () => EventTarget[] }).composedPath?.() ?? []
      if (flyoutRef.current && path.includes(flyoutRef.current)) return
      if (colRef.current && path.includes(colRef.current)) return
      setOpenGroup(null)
    }
    document.addEventListener('pointerdown', onPointerDown, true)
    return () => document.removeEventListener('pointerdown', onPointerDown, true)
  }, [openGroup])

  /* ─── Escape: cancel mode, then close flyout, then close panel ─── */
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.key !== 'Escape') return
      if (laserActive) { e.stopPropagation(); setLaserActive(false); return }
      if (openGroup) { e.stopPropagation(); setOpenGroup(null); return }
      if (activePanel) { e.stopPropagation(); closePanel() }
    }
    document.addEventListener('keydown', onKey, true)
    return () => document.removeEventListener('keydown', onKey, true)
  }, [laserActive, openGroup, activePanel, closePanel])

  const handlePaletteAction = useCallback((actionId: string) => {
    switch (actionId) {
      case 'rewrite': case 'ai': case 'search': case 'settings':
      case 'highlighter': case 'draw': case 'handwriting':
      case 'stamps': case 'layers':
        runTool(actionId as PanelId); break
      case 'notes': spawnNote(); break
      case 'screenshot': captureScreenshot(); break
      case 'laser': setLaserActive(p => !p); break
      case 'notebooks': openDashboard(); break
      case 'collapse': setDockOpen(v => { const next = !v; setOpenGroup(null); setActivePanel(next ? 'ai' : null); return next }); break
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
        setDockOpen(true)
        setOpenGroup(null)
        setActivePanel('ai')
      }
    }
    document.addEventListener('keydown', handleKb)
    return () => document.removeEventListener('keydown', handleKb)
  }, [])

  const activeModeId: PanelId | 'laser' | null = laserActive
    ? 'laser'
    : activePanel && MODE_LABELS[activePanel]
      ? activePanel
      : null
  const modeLabel = activeModeId ? MODE_LABELS[activeModeId] : null
  const modeIcon = activeModeId ? TOOL_DEFS[activeModeId]?.icon : null

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
      </motion.div>
    </AnimatePresence>
  ) : null

  return (
    <>
      <AnimatePresence>
        {!hidden && modeLabel && (
          <motion.div
            data-inline-interactive=""
            key={activeModeId ?? modeLabel}
            initial={{ opacity: 0, y: -6, x: '-50%', scale: 0.96 }}
            animate={{ opacity: 1, y: 0, x: '-50%', scale: 1 }}
            exit={{ opacity: 0, y: -6, x: '-50%', scale: 0.96 }}
            transition={{ duration: 0.16, ease: 'easeOut' }}
            style={{
              position: 'fixed',
              top: 18,
              left: '50%',
              zIndex: 2147483647,
              pointerEvents: 'none',
              display: 'flex',
              alignItems: 'center',
              gap: 8,
              background: C.surfaceBubble,
              color: C.text,
              padding: '8px 14px',
              borderRadius: C.radiusMd,
              fontSize: 12,
              fontWeight: 500,
              letterSpacing: '-0.01em',
              whiteSpace: 'nowrap',
              border: `1px solid ${C.border}`,
              boxShadow: C.shadowOuter,
              fontFamily: FONT,
            }}
          >
            {modeIcon && (
              <DockMenuIcon size={24}>
                {modeIcon}
              </DockMenuIcon>
            )}
            {modeLabel}
          </motion.div>
        )}
      </AnimatePresence>

      {/* ─── Main docked panel: anchored top-left of the launcher (stable) ─── */}
      <AnimatePresence>
        {!hidden && toast && (
          <motion.div
            data-inline-interactive=""
            key={toast.id}
            initial={{ opacity: 0, y: -6, x: '-50%', scale: 0.96 }}
            animate={{ opacity: 1, y: 0, x: '-50%', scale: 1 }}
            exit={{ opacity: 0, y: -6, x: '-50%', scale: 0.96 }}
            transition={{ duration: 0.16, ease: 'easeOut' }}
            style={{
              position: 'fixed',
              top: modeLabel ? 56 : 18,
              left: '50%',
              zIndex: 2147483647,
              pointerEvents: toast.onAction ? 'auto' : 'none',
              display: 'flex',
              alignItems: 'center',
              gap: 7,
              background: toast.tone === 'error' ? '#FEF2F2' : C.surfaceBubble,
              color: toast.tone === 'error' ? '#991B1B' : C.text,
              padding: '8px 14px',
              borderRadius: C.radiusMd,
              fontSize: 12,
              fontWeight: 500,
              letterSpacing: '-0.01em',
              whiteSpace: 'nowrap',
              border: `1px solid ${toast.tone === 'error' ? '#FECACA' : C.border}`,
              boxShadow: C.shadowOuter,
              fontFamily: FONT,
            }}
          >
            <span style={{ width: 6, height: 6, borderRadius: '50%', background: toast.tone === 'error' ? '#DC2626' : toast.tone === 'local' ? '#D97706' : '#16A34A' }} />
            {toast.message}
            {toast.onAction && toast.actionLabel && (
              <button
                type="button"
                onClick={() => {
                  const action = toast?.onAction
                  action?.()
                  setToast(null)
                }}
                style={{
                  border: 'none',
                  background: 'transparent',
                  padding: '0 0 0 2px',
                  color: C.accent,
                  fontSize: 12,
                  fontWeight: 750,
                  cursor: 'pointer',
                  fontFamily: FONT,
                }}
              >
                {toast.actionLabel}
              </button>
            )}
          </motion.div>
        )}
      </AnimatePresence>

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
            {/* Launcher (master) */}
            <div style={{ position: 'relative', display: 'flex', alignItems: 'center', pointerEvents: 'auto' }}>
              {/* Launcher hover tooltip */}
              <AnimatePresence>
                {(launcherHover || launcherFocus) && !dockOpen && !activePanel && (
                  <motion.div
                    id="inline-launcher-tooltip"
                    role="tooltip"
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
                onFocus={() => setLauncherFocus(true)}
                onBlur={() => setLauncherFocus(false)}
                aria-label={dockOpen ? 'Close Inline tools' : 'Open Inline tools'}
                aria-expanded={dockOpen}
                aria-describedby={(launcherHover || launcherFocus) && !dockOpen && !activePanel ? 'inline-launcher-tooltip' : undefined}
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
                  boxShadow: `${C.shadowOuter}${launcherFocus ? ', 0 0 0 3px rgba(19, 42, 79, 0.18)' : ''}`,
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
                        onClick={() => toggleDockGroup(item.id)}
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
                  ref={flyoutRef}
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
                    width: 172,
                    padding: 6,
                    borderRadius: C.radiusMd,
                    border: `1px solid ${C.border}`,
                    background: C.bg,
                    boxShadow: C.shadowOuter,
                    display: 'flex',
                    flexDirection: 'column',
                    gap: 2,
                    fontFamily: FONT,
                  }}
                >
                  <div style={{
                    padding: '4px 8px 6px',
                    fontSize: 11,
                    fontWeight: 500,
                    color: C.textMuted,
                    letterSpacing: '0.01em',
                  }}>
                    {openGroup === 'annotate' ? 'Annotate' : 'More tools'}
                  </div>
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
                          minHeight: 36,
                          padding: '6px 8px',
                          borderRadius: C.radiusSm,
                          border: 'none',
                          background: isActive ? C.toneSelectedBg : 'transparent',
                          color: isActive ? C.text : C.textMuted,
                          cursor: 'pointer',
                          fontFamily: FONT,
                          fontSize: 12,
                          fontWeight: 500,
                          textAlign: 'left',
                          transition: 'background 0.14s',
                        }}
                      >
                        <DockMenuIcon size={28} active={isActive}>
                          {def.icon}
                        </DockMenuIcon>
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
