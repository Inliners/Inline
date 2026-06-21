import {
  useCallback,
  useEffect,
  useRef,
  useState,
  type Dispatch,
  type MutableRefObject,
  type SetStateAction,
} from 'react'
import { wrapSelectionWithHighlight } from './highlightWrap'
import { loadSettings } from '../lib/extensionSettings'
import { speakWithElevenLabs } from '../lib/elevenLabsTts'
import { fetchViaBackground } from '../lib/backgroundFetch'
import { buildAIInsertMark } from '../lib/insertBadge'
import { saveAIReplacement } from './aiReplacements'
import { TOOLBAR as TB, HIGHLIGHT_SWATCHES } from '../lib/extensionTheme'

type Pt = { x: number; y: number }
type AnchorNote = { id: string; x: number; y: number; text: string }
type SubPanel = 'rewrite' | 'insight' | null

/* ─── window.ai ─── */
async function tryWindowAi(task: string, text: string): Promise<string | null> {
  const w = window as unknown as {
    ai?: { languageModel?: { create?: () => Promise<{ prompt: (s: string) => Promise<string> }> } }
  }
  try {
    const create = w.ai?.languageModel?.create
    if (!create) return null
    const session = await create.call(w.ai!.languageModel!)
    const prompt =
      task === 'summarize' ? `Summarize in 3 short bullets:\n\n${text}` :
      task === 'shorten'   ? `Shorten by ~40%, keep meaning:\n\n${text}` :
      `Rewrite clearly, same meaning:\n\n${text}`
    return await session.prompt(prompt.slice(0, 8000))
  } catch { return null }
}

async function serverTask(
  apiBase: string, token: string, task: string, text: string, instruction?: string,
): Promise<string | null> {
  const h: Record<string, string> = { 'Content-Type': 'application/json' }
  if (token) h.Authorization = `Bearer ${token}`
  try {
    const res = await fetchViaBackground(`${apiBase}/api/ai/extension-light`, {
      method: 'POST', headers: h,
      body: JSON.stringify({ task, text, instruction }),
    })
    if (!res.ok) {
      try {
        const body = await res.json<{ error?: string }>()
        if (body.error) return `[Error] ${body.error}`
      } catch { /* non-JSON body */ }
      return null
    }
    const body = await res.json<{ result?: string }>()
    return body.result ?? null
  } catch (err) {
    return `[Error] ${err instanceof Error ? err.message : 'AI request failed'}`
  }
}

/* ─── Theme (Attio "New toolbar" — light) ─── */
const DARK = '#0B1735'              // primary text / accent on light surfaces
const CREAM = '#FFFFFF'             // popups are clean white (Attio pages are white)
const SURFACE = '#FFFFFF'
const BORDER = 'rgba(15,18,23,0.09)'
const PANEL_BORDER = 'rgba(15,18,23,0.10)'
const MUTED = '#8A8F98'
const FONT = '-apple-system, BlinkMacSystemFont, "Inter", "SF Pro Text", system-ui, sans-serif'

/* ─── SVG icons (stroke style, 16×16) ─── */
const IHighlight = () => (
  <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <path d="M9 11l-6 6v3h9l3-3"/>
    <path d="M22 12l-4.6 4.6a2 2 0 0 1-2.8 0l-5.2-5.2a2 2 0 0 1 0-2.8L14 4"/>
  </svg>
)
const IEdit = () => (
  <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <path d="M17 3a2.828 2.828 0 1 1 4 4L7.5 20.5 2 22l1.5-5.5L17 3z"/>
  </svg>
)
const IGrid = () => (
  <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <rect x="3" y="3" width="7" height="7"/><rect x="14" y="3" width="7" height="7"/>
    <rect x="3" y="14" width="7" height="7"/><rect x="14" y="14" width="7" height="7"/>
  </svg>
)
const IAlert = () => (
  <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <path d="M10.29 3.86L1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0z"/>
    <line x1="12" y1="9" x2="12" y2="13"/><line x1="12" y1="17" x2="12.01" y2="17"/>
  </svg>
)
const IMapPin = () => (
  <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0 1 18 0z"/>
    <circle cx="12" cy="10" r="3"/>
  </svg>
)
const ITag = () => (
  <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <path d="M20.59 13.41l-7.17 7.17a2 2 0 0 1-2.83 0L2 12V2h10l8.59 8.59a2 2 0 0 1 0 2.82z"/>
    <line x1="7" y1="7" x2="7.01" y2="7"/>
  </svg>
)
const IVolume = () => (
  <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <polygon points="11 5 6 9 2 9 2 15 6 15 11 19 11 5"/>
    <path d="M19.07 4.93a10 10 0 0 1 0 14.14M15.54 8.46a5 5 0 0 1 0 7.07"/>
  </svg>
)
const IAi = () => (
  <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <path d="M12 3l1.912 5.813a2 2 0 0 0 1.275 1.275L21 12l-5.813 1.912a2 2 0 0 0-1.275 1.275L12 21l-1.912-5.813a2 2 0 0 0-1.275-1.275L3 12l5.813-1.912a2 2 0 0 0 1.275-1.275L12 3z"/>
  </svg>
)
const INote = () => (
  <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <path d="M14.5 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V7.5L14.5 2z"/>
    <polyline points="14 2 14 8 20 8"/>
  </svg>
)

/* ─── Separator (vertical line between groups) ─── */
const Sep = () => (
  <div style={{ width: 1, height: 20, background: BORDER, margin: '0 4px', flexShrink: 0 }} />
)

/* ─── Custom floating tooltip (replaces native title attributes) ─── */
function ToolTip({ label, show }: { label: string; show: boolean }) {
  return (
    <span
      role="tooltip"
      style={{
        position: 'absolute',
        bottom: 'calc(100% + 8px)',
        left: '50%',
        transform: `translateX(-50%) translateY(${show ? '0' : '3px'})`,
        background: '#0B1735',
        color: '#fff',
        border: '1px solid rgba(255,255,255,0.16)',
        borderRadius: 8,
        padding: '5px 9px',
        fontSize: 11,
        fontWeight: 600,
        lineHeight: 1,
        letterSpacing: '0.01em',
        whiteSpace: 'nowrap',
        fontFamily: FONT,
        pointerEvents: 'none',
        opacity: show ? 1 : 0,
        transition: 'opacity 0.12s ease, transform 0.12s ease',
        boxShadow: 'none',
        zIndex: 2147483647,
      }}
    >
      {label}
      {/* downward pointer */}
      <span
        style={{
          position: 'absolute', top: '100%', left: '50%',
          transform: 'translateX(-50%) rotate(45deg)', marginTop: -3,
          width: 6, height: 6, background: '#0B1735',
          borderRight: '1px solid rgba(255,255,255,0.16)',
          borderBottom: '1px solid rgba(255,255,255,0.16)',
        }}
      />
    </span>
  )
}

/* ─── Toolbar button ─── */
function TBtn({
  children, active, onClick, title, isText,
}: {
  children: React.ReactNode
  active?: boolean
  onClick: () => void
  title?: string
  isText?: boolean
}) {
  const [hov, setHov] = useState(false)
  return (
    <button
      type="button"
      aria-label={title}
      onClick={onClick}
      onMouseEnter={() => setHov(true)}
      onMouseLeave={() => setHov(false)}
      onFocus={() => setHov(true)}
      onBlur={() => setHov(false)}
      style={isText ? {
        position: 'relative',
        display: 'inline-flex', alignItems: 'center', justifyContent: 'center',
        padding: '6px 11px', border: 'none', borderRadius: TB.radiusInner,
        background: hov ? TB.hover : 'transparent',
        color: hov ? TB.textStrong : TB.text,
        fontSize: 12.5, fontWeight: 500,
        fontFamily: FONT,
        cursor: 'pointer', lineHeight: 1, whiteSpace: 'nowrap',
        transition: 'background 0.13s, color 0.13s',
        letterSpacing: '-0.01em',
      } : {
        position: 'relative',
        display: 'inline-flex', alignItems: 'center', justifyContent: 'center',
        padding: '7px', border: 'none', borderRadius: TB.radiusInner,
        background: active ? TB.active : hov ? TB.hover : 'transparent',
        color: active ? TB.textStrong : hov ? TB.textStrong : TB.text,
        cursor: 'pointer', lineHeight: 1,
        transition: 'background 0.13s, color 0.13s',
      }}
    >
      {children}
      {title && <ToolTip label={title} show={hov} />}
    </button>
  )
}

/* ─── Context menu item ─── */
type CtxItem = { label: string; icon: React.ReactNode; action: () => void; danger?: boolean }

function ContextMenuItem({ item }: { item: CtxItem }) {
  const [hov, setHov] = useState(false)
  return (
    <button
      type="button"
      onClick={item.action}
      onMouseEnter={() => setHov(true)}
      onMouseLeave={() => setHov(false)}
      style={{
        display: 'flex', alignItems: 'center', gap: 10,
        width: '100%', padding: '8px 10px', border: 'none',
        borderRadius: 7,
        background: hov ? (item.danger ? 'rgba(239,68,68,0.08)' : TB.hover) : 'transparent',
        color: item.danger ? '#ef4444' : hov ? DARK : '#4B5563',
        fontSize: 12.5, fontWeight: 500, cursor: 'pointer',
        fontFamily: FONT, textAlign: 'left',
        transition: 'background 0.12s, color 0.12s',
      }}
    >
      <span style={{ display: 'flex', color: item.danger ? '#ef4444' : MUTED }}>{item.icon}</span>
      {item.label}
    </button>
  )
}

/* ─── Main component ─── */
export default function SmartOverlay() {
  const [toolbar, setToolbar] = useState<Pt | null>(null)
  const [colorRow, setColorRow] = useState(false)
  const [subPanel, setSubPanel] = useState<SubPanel>(null)
  const [subInput, setSubInput] = useState('')
  const [riskOpen, setRiskOpen] = useState(false)
  const [riskText, setRiskText] = useState('')
  const [riskLoading, setRiskLoading] = useState(false)
  const [spatialOpen, setSpatialOpen] = useState(false)
  const [spatialAddr, setSpatialAddr] = useState('')
  const [spatialNote, setSpatialNote] = useState('')
  const [anchors, setAnchors] = useState<AnchorNote[]>([])
  const [anchorsLoaded, setAnchorsLoaded] = useState(false)
  const [ctxMenu, setCtxMenu] = useState<Pt | null>(null)
  // Separate "custom rewrite" prompt, anchored to where the context menu
  // was opened. We keep the selection stored in `selRef` and restore it
  // into a Range inside the Go handler so wrapSelectionWithHighlight can
  // wrap the original text.
  const [ctxRewrite, setCtxRewrite] = useState<Pt | null>(null)
  const [ctxRewriteInput, setCtxRewriteInput] = useState('')
  const ctxRewriteInputRef = useRef<HTMLInputElement>(null)
  // Remember the live Range from the right-click / pill-open moment so we
  // can restore the selection before running an AI task. Typing in any of
  // our panels steals focus, which collapses the live selection — without
  // this snapshot, wrapSelectionWithHighlight would return null.
  const savedRangeRef = useRef<Range | null>(null)
  // Mirror of `subPanel` for synchronous reads inside the mouseup-driven
  // refreshSelection callback. State updates are async; a ref lets the
  // callback know "a subpanel is open, don't dismiss the pill".
  const subPanelRef = useRef<SubPanel>(null)
  const [aiResult, setAiResult] = useState<{
    title: string
    body: string
    loading?: boolean
    task?: 'summarize' | 'rewrite' | 'shorten'
    instruction?: string
    inserted?: boolean
  } | null>(null)
  const dragRef = useRef<{ id: string; ox: number; oy: number } | null>(null)
  // The <span> that wrapSelectionWithHighlight created for the current AI
  // task. We keep a ref to it so the "Insert" button in the result card can
  // swap its contents with the AI output and persist via saveAIReplacement.
  const lastHighlightSpan = useRef<HTMLElement | null>(null)
  const lastOriginalText = useRef<string>('')
  const selRef = useRef('')
  const subInputRef = useRef<HTMLInputElement>(null)
  const anchorSaveTimer = useRef<ReturnType<typeof setTimeout> | null>(null)

  /* ── Load persisted anchor notes on mount ── */
  useEffect(() => {
    if (!chrome.runtime?.id) { setAnchorsLoaded(true); return }
    chrome.runtime.sendMessage(
      { type: 'LOAD_ANNOTATIONS', payload: { pageUrl: window.location.href } },
      (response) => {
        if (chrome.runtime.lastError) {
          setAnchorsLoaded(true); return
        }
        const saved = response?.data?.elements?.anchorNotes as AnchorNote[] | undefined
        if (Array.isArray(saved)) setAnchors(saved)
        setAnchorsLoaded(true)
      },
    )
  }, [])

  /* ── Debounced persist for anchor notes ── */
  useEffect(() => {
    if (!anchorsLoaded) return
    if (anchorSaveTimer.current) clearTimeout(anchorSaveTimer.current)
    anchorSaveTimer.current = setTimeout(() => {
      if (!chrome.runtime?.id) return
      chrome.runtime.sendMessage(
        {
          type: 'SAVE_ANNOTATIONS',
          payload: {
            pageUrl: window.location.href,
            featureKey: 'anchorNotes',
            data: anchors,
            pageTitle: document.title,
            domain: window.location.hostname,
            clearedAt: anchors.length === 0 ? Date.now() : null,
          },
        },
        () => { if (chrome.runtime.lastError) { /* ignore */ } },
      )
    }, 500)
    return () => {
      if (anchorSaveTimer.current) clearTimeout(anchorSaveTimer.current)
    }
  }, [anchors, anchorsLoaded])

  const refreshSelection = useCallback(() => {
    const sel = window.getSelection()
    const hasSelection = sel && !sel.isCollapsed && sel.toString().trim().length > 0

    if (!hasSelection) {
      // Don't dismiss the pill while a subpanel (e.g. the rewrite input)
      // is open — the user is mid-interaction with the pill and the only
      // reason the selection went away is because focus moved into our
      // own input. The pill stays anchored at its current position.
      if (subPanelRef.current) return
      setToolbar(null); setSubPanel(null); setColorRow(false); selRef.current = ''
      savedRangeRef.current = null
      return
    }

    const range = sel!.getRangeAt(0)
    const rect = range.getBoundingClientRect()
    if (!rect.width && !rect.height) { setToolbar(null); return }
    selRef.current = sel!.toString()
    // Keep the Range snapshot fresh while the user is actively selecting.
    // Once a subpanel opens we stop overwriting this so the pre-focus
    // snapshot survives until the user commits via Go / Enter.
    try { savedRangeRef.current = range.cloneRange() } catch { /* ignore */ }
    setToolbar({ x: rect.left + rect.width / 2, y: rect.top + window.scrollY })
  }, [])

  useEffect(() => {
    const up = () => requestAnimationFrame(refreshSelection)
    document.addEventListener('mouseup', up)
    document.addEventListener('keyup', up)
    return () => { document.removeEventListener('mouseup', up); document.removeEventListener('keyup', up) }
  }, [refreshSelection])

  /* Right-click context menu */
  useEffect(() => {
    const handler = (e: MouseEvent) => {
      const sel = window.getSelection()
      if (!sel || sel.isCollapsed || !sel.toString().trim()) return
      e.preventDefault()
      selRef.current = sel.toString()
      // Snapshot the range so we can restore the selection later — opening
      // the custom-rewrite input will steal focus, which in turn collapses
      // the live selection. Cloning lets us call wrapSelectionWithHighlight
      // after the user hits Go.
      try { savedRangeRef.current = sel.getRangeAt(0).cloneRange() }
      catch { savedRangeRef.current = null }
      setCtxMenu({ x: e.clientX, y: e.clientY })
    }
    const dismiss = () => setCtxMenu(null)
    document.addEventListener('contextmenu', handler)
    document.addEventListener('click', dismiss)
    return () => {
      document.removeEventListener('contextmenu', handler)
      document.removeEventListener('click', dismiss)
    }
  }, [])

  // Auto-focus the custom rewrite input whenever it opens.
  useEffect(() => {
    if (ctxRewrite) setTimeout(() => ctxRewriteInputRef.current?.focus(), 60)
  }, [ctxRewrite])

  /** Re-apply the saved selection before running the rewrite task so
   *  wrapSelectionWithHighlight has a non-collapsed Range to work with. */
  function restoreSavedSelection(): boolean {
    const range = savedRangeRef.current
    if (!range) return false
    const sel = window.getSelection()
    if (!sel) return false
    try {
      sel.removeAllRanges()
      sel.addRange(range)
      return !sel.isCollapsed && sel.toString().trim().length > 0
    } catch {
      return false
    }
  }

  function runCustomRewriteFromContext() {
    const instruction = ctxRewriteInput.trim()
    if (!instruction) return
    if (!restoreSavedSelection()) return
    setCtxRewrite(null)
    setCtxRewriteInput('')
    savedRangeRef.current = null
    void runAiTask('rewrite', instruction)
  }

  useEffect(() => {
    const onMsg = (msg: { type?: string }) => {
      if (msg?.type !== 'INLINE_PAGE_RISK') return
      runPageRisk()
    }
    chrome.runtime.onMessage.addListener(onMsg)
    return () => chrome.runtime.onMessage.removeListener(onMsg)
  }, [])

  useEffect(() => {
    subPanelRef.current = subPanel
    if (subPanel) setTimeout(() => subInputRef.current?.focus(), 60)
  }, [subPanel])

  function toggleSub(panel: SubPanel) {
    // Moment of truth for "keep the pill alive". Clicking the pencil
    // button in the pill focuses a toolbar element, which is enough for
    // some browsers to collapse the selection before our onClick fires
    // the next time. Snapshot whatever the user had selected right now
    // so we can restore it in runPillAiTask.
    if (!savedRangeRef.current) {
      const sel = window.getSelection()
      if (sel && !sel.isCollapsed && sel.rangeCount > 0) {
        try { savedRangeRef.current = sel.getRangeAt(0).cloneRange() } catch { /* ignore */ }
        selRef.current = sel.toString()
      }
    }
    setColorRow(false)
    setSubPanel(p => p === panel ? null : panel)
    setSubInput('')
  }

  /** Reapply the saved selection (if any) before calling runAiTask so the
   *  live selection is non-collapsed when wrapSelectionWithHighlight runs.
   *  Used by every pill button that triggers an AI task — not just custom
   *  rewrite — so selection loss never silently swallows a click. */
  function runPillAiTask(task: 'summarize' | 'rewrite' | 'shorten', instruction?: string) {
    // Prefer the saved Range because the live selection has almost
    // certainly been collapsed by the time the click handler runs.
    restoreSavedSelection()
    void runAiTask(task, instruction)
  }

  async function runAiTask(task: 'summarize' | 'rewrite' | 'shorten', instruction?: string) {
    const wrapped = wrapSelectionWithHighlight(task)
    if (!wrapped) return
    // Remember the highlighted span + its original text so the user can
    // click "Insert" later to make the edit persistent across reloads.
    lastHighlightSpan.current = wrapped.span
    lastOriginalText.current = wrapped.text
    setToolbar(null); setSubPanel(null); setCtxMenu(null)
    const label = task === 'summarize' ? 'Summary' : task === 'rewrite' ? 'Rephrased' : 'Shortened'
    setAiResult({ title: label, body: '', loading: true, task, instruction })
    let out = await tryWindowAi(task, wrapped.text)
    if (!out) {
      const { apiBaseUrl, accessToken } = await loadSettings()
      out = await serverTask(apiBaseUrl, accessToken, task, wrapped.text, instruction)
    }
    setAiResult({
      title: label,
      body: out ?? 'AI unavailable — set API URL + token in the popup.',
      loading: false,
      task,
      instruction,
    })
  }

  /** Replace the AI-highlighted selection with the AI result and persist
   *  it via saveAIReplacement so it survives a page reload. The user can
   *  still remove the edit later by hovering the mark and clicking the
   *  "×" badge that saveAIReplacement attaches. */
  function handleInsertAiResult() {
    const span = lastHighlightSpan.current
    const originalText = lastOriginalText.current
    if (!span || !aiResult || !aiResult.body || !aiResult.task) return
    if (aiResult.body.startsWith('[Error]')) return

    try {
      const mark = buildAIInsertMark(aiResult.body, aiResult.task, aiResult.instruction)
      // Swap the original highlight span with the AI mark in-place so the
      // DOM keeps the same position and layout as before.
      const parent = span.parentNode
      if (!parent) return
      parent.replaceChild(mark, span)

      saveAIReplacement(mark, originalText, aiResult.body, aiResult.task, aiResult.instruction)

      setAiResult(r => r ? { ...r, inserted: true } : r)
      lastHighlightSpan.current = null
      lastOriginalText.current = ''
    } catch {
      /* span detached — nothing to do */
    }
  }

  function runPageRisk() {
    setRiskOpen(true); setRiskLoading(true); setRiskText('')
    void (async () => {
      const sample = (document.body?.innerText ?? '').slice(0, 12000)
      const { apiBaseUrl, accessToken } = await loadSettings()
      const h: Record<string, string> = { 'Content-Type': 'application/json' }
      if (accessToken) h.Authorization = `Bearer ${accessToken}`
      try {
        // Routed through the background worker — content scripts can't reach
        // localhost directly under Chrome's Private Network Access policy.
        const res = await fetchViaBackground(`${apiBaseUrl}/api/ai/page-risk`, {
          method: 'POST', headers: h, body: JSON.stringify({ pageTextSample: sample }),
        })
        const j = await res.json()
        setRiskText((j as { analysis?: string }).analysis ?? (j as { error?: string }).error ?? 'No response')
      } catch (e) { setRiskText(e instanceof Error ? e.message : 'Failed') }
      finally { setRiskLoading(false) }
    })()
  }

  /** Highlight the current selection, optionally with a custom colour from
   *  the Attio-style swatch row. Selection survives because the toolbar's
   *  onMouseDown calls preventDefault. */
  function highlightWithColor(color?: string) {
    wrapSelectionWithHighlight('extract', color)
    setToolbar(null); setColorRow(false); setSubPanel(null)
  }

  function addAnchor() {
    setToolbar(null); setSubPanel(null); setCtxMenu(null)
    const offset = anchors.length * 16
    setAnchors(a => [...a, {
      id: `an-${Date.now()}`,
      x: Math.min(window.innerWidth - 252, 40 + offset),
      y: Math.min(window.innerHeight - 200, 140 + offset),
      text: selRef.current ? `"${selRef.current.slice(0, 120)}"` : '',
    }])
  }

  if (!toolbar && !riskOpen && !spatialOpen && !ctxMenu && !ctxRewrite && !aiResult && anchors.length === 0) return null

  const tbLeft = toolbar
    ? Math.max(8, Math.min(window.innerWidth - 500, toolbar.x - 230))
    : 0
  const tbTop = toolbar ? Math.max(8, toolbar.y - 50) : 0

  /* Context menu items */
  const ctxItems: CtxItem[] = [
    { label: 'Highlight', icon: <IHighlight />, action: () => { wrapSelectionWithHighlight('extract'); setCtxMenu(null) } },
    { label: 'Summarize', icon: <IAi />, action: () => { void runAiTask('summarize'); setCtxMenu(null) } },
    { label: 'Rephrase', icon: <IEdit />, action: () => { void runAiTask('rewrite'); setCtxMenu(null) } },
    { label: 'Shorten', icon: <IGrid />, action: () => { void runAiTask('shorten'); setCtxMenu(null) } },
    // Custom Rewrite — opens a free-form instruction prompt at the context
    // menu position. The user's instruction is forwarded to runAiTask so
    // it shares the same "Insert + persist" flow as the pill's custom
    // rewrite subpanel.
    {
      label: 'Custom Rewrite…',
      icon: <IEdit />,
      action: () => {
        const pt = ctxMenu
        setCtxMenu(null)
        if (!pt) return
        setCtxRewriteInput('')
        setCtxRewrite(pt)
      },
    },
    { label: 'Add Note', icon: <INote />, action: addAnchor },
    { label: 'Read Aloud', icon: <IVolume />, action: () => { void speakWithElevenLabs(selRef.current.slice(0, 800)); setCtxMenu(null) } },
    { label: 'Save to Map', icon: <IMapPin />, action: () => { setCtxMenu(null); setSpatialOpen(true) } },
    { label: 'Page Risk', icon: <IAlert />, action: () => { setCtxMenu(null); runPageRisk() } },
  ]

  return (
    <>
      {/* ── Selection toolbar ── */}
      {toolbar && (
        <>
          <div
            className="inline-toolbar"
            // preventDefault on mousedown stops the click from shifting
            // focus / collapsing the text selection. Without this, clicking
            // any pill button (especially the pencil for custom rewrite)
            // would blur the document and blow away the selection before
            // our onClick handler could read it.
            onMouseDown={e => { e.preventDefault() }}
            style={{
              position: 'fixed',
              left: tbLeft,
              top: tbTop,
              zIndex: 2147483646,
              background: TB.bg,
              border: `1px solid ${TB.border}`,
              borderRadius: TB.radius,
              pointerEvents: 'auto',
              width: 'max-content',
              fontFamily: FONT,
              display: 'flex',
              alignItems: 'center',
              gap: 1,
              padding: '5px 6px',
              boxShadow: TB.shadow,
            }}
          >
            {/* Highlight segment with current-colour swatch (toggles colour row) */}
            <TBtn isText active={colorRow} onClick={() => { setSubPanel(null); setColorRow(v => !v) }} title="Highlight">
              <span style={{ display: 'inline-flex', alignItems: 'center', gap: 7 }}>
                Highlight
                <span style={{
                  width: 15, height: 15, borderRadius: 5,
                  background: HIGHLIGHT_SWATCHES[0].value,
                  border: `1px solid ${TB.divider}`,
                }} />
                <span style={{ color: TB.textMuted, fontSize: 9, marginLeft: -2 }}>
                  {colorRow ? '▴' : '▾'}
                </span>
              </span>
            </TBtn>

            <Sep />

            <TBtn isText onClick={() => runPillAiTask('summarize')} title="Summarize">Summarize</TBtn>
            <TBtn isText onClick={() => runPillAiTask('rewrite')} title="Rephrase">Rephrase</TBtn>
            <TBtn isText onClick={() => runPillAiTask('shorten')} title="Shorten">Shorten</TBtn>
            <TBtn active={subPanel === 'rewrite'} onClick={() => toggleSub('rewrite')} title="Custom rewrite">
              <IEdit />
            </TBtn>

            <Sep />

            <TBtn onClick={() => { wrapSelectionWithHighlight('extract'); setToolbar(null) }} title="Extract data">
              <IGrid />
            </TBtn>
            <TBtn onClick={() => { setToolbar(null); runPageRisk() }} title="Page risk">
              <IAlert />
            </TBtn>
            <TBtn onClick={() => { setToolbar(null); setSpatialOpen(true) }} title="Save to map">
              <IMapPin />
            </TBtn>

            <Sep />

            <TBtn active={subPanel === 'insight'} onClick={() => toggleSub('insight')} title="Tag insight">
              <ITag />
            </TBtn>
            <TBtn onClick={() => { void speakWithElevenLabs(selRef.current.slice(0, 800)) }} title="Read aloud">
              <IVolume />
            </TBtn>
            <TBtn isText onClick={addAnchor} title="Pin a note here">Note</TBtn>
          </div>

          {/* ── Colour-swatch row (Attio second pill) ── */}
          {colorRow && (
            <div
              className="inline-toolbar"
              onMouseDown={e => { e.preventDefault() }}
              style={{
                position: 'fixed', left: tbLeft, top: tbTop + 50,
                zIndex: 2147483646,
                background: TB.bg,
                border: `1px solid ${TB.border}`,
                borderRadius: TB.radius,
                pointerEvents: 'auto',
                fontFamily: FONT,
                display: 'flex', alignItems: 'center', gap: 6,
                padding: '6px 10px',
                boxShadow: TB.shadow,
              }}
            >
              <button
                type="button"
                onClick={() => setColorRow(false)}
                aria-label="Back"
                style={{
                  display: 'inline-flex', alignItems: 'center', gap: 5,
                  border: 'none', background: 'transparent', cursor: 'pointer',
                  color: TB.text, fontSize: 12.5, fontWeight: 500, fontFamily: FONT,
                  padding: '4px 6px', borderRadius: TB.radiusInner,
                }}
              >
                <span style={{ fontSize: 13, lineHeight: 1 }}>‹</span> Highlight
              </button>
              <div style={{ width: 1, height: 18, background: TB.divider, margin: '0 2px' }} />
              {HIGHLIGHT_SWATCHES.map(sw => (
                <button
                  key={sw.name}
                  type="button"
                  onClick={() => highlightWithColor(sw.value)}
                  aria-label={`Highlight ${sw.name}`}
                  title={sw.name}
                  style={{
                    width: 22, height: 22, borderRadius: 7,
                    background: sw.value,
                    border: `1px solid ${TB.divider}`,
                    cursor: 'pointer', padding: 0, flexShrink: 0,
                    transition: 'transform 0.1s',
                  }}
                  onMouseEnter={e => (e.currentTarget.style.transform = 'scale(1.12)')}
                  onMouseLeave={e => (e.currentTarget.style.transform = 'scale(1)')}
                />
              ))}
            </div>
          )}

          {/* Sub-panel: rewrite */}
          {subPanel === 'rewrite' && (
            <div
              className="inline-toolbar"
              // Same selection-preserving trick as the pill, but we only
              // apply it when the click target isn't the <input> itself —
              // otherwise preventDefault would stop the input from focusing
              // and the user couldn't type.
              onMouseDown={e => {
                const t = e.target as HTMLElement
                if (t.tagName !== 'INPUT' && t.tagName !== 'TEXTAREA') e.preventDefault()
              }}
              style={{
                position: 'fixed', left: tbLeft, top: tbTop + 50,
                zIndex: 2147483645,
                background: TB.bg, border: `1px solid ${TB.border}`, borderRadius: TB.radius,
                pointerEvents: 'auto', width: 320,
                display: 'flex', alignItems: 'center', gap: 6,
                padding: '7px 8px 7px 10px', fontFamily: FONT,
                boxShadow: TB.shadow,
              }}
            >
              <input
                ref={subInputRef}
                value={subInput}
                onChange={e => setSubInput(e.target.value)}
                onKeyDown={e => {
                  if (e.key === 'Enter' && subInput.trim()) {
                    runPillAiTask('rewrite', subInput.trim())
                  }
                  if (e.key === 'Escape') setSubPanel(null)
                }}
                placeholder="How should I rewrite this?"
                style={{
                  flex: 1, padding: '8px 10px',
                  border: 'none',
                  borderRadius: 8, fontSize: 12.5, fontFamily: FONT,
                  outline: 'none', color: DARK,
                  background: 'transparent',
                }}
              />
              <button type="button"
                disabled={!subInput.trim()}
                onClick={() => {
                  if (!subInput.trim()) return
                  runPillAiTask('rewrite', subInput.trim())
                }}
                style={{
                  padding: '7px 16px', borderRadius: 9999, border: 'none',
                  background: subInput.trim() ? DARK : '#E5E3DF',
                  color: subInput.trim() ? '#fff' : MUTED, fontWeight: 600, fontSize: 12,
                  cursor: subInput.trim() ? 'pointer' : 'default',
                  whiteSpace: 'nowrap',
                }}>
                Go
              </button>
              <button type="button" onClick={() => setSubPanel(null)}
                style={{ padding: '4px 8px', borderRadius: 6, border: 'none', background: 'transparent', color: MUTED, fontSize: 15, cursor: 'pointer' }}>×</button>
            </div>
          )}

          {/* Sub-panel: insight */}
          {subPanel === 'insight' && (
            <div
              className="inline-toolbar"
              onMouseDown={e => {
                const t = e.target as HTMLElement
                if (t.tagName !== 'INPUT' && t.tagName !== 'TEXTAREA') e.preventDefault()
              }}
              style={{
                position: 'fixed', left: tbLeft, top: tbTop + 50,
                zIndex: 2147483645,
                background: TB.bg, border: `1px solid ${TB.border}`, borderRadius: TB.radius,
                pointerEvents: 'auto', width: 300,
                display: 'flex', alignItems: 'center', gap: 6,
                padding: '7px 8px 7px 10px', fontFamily: FONT,
                boxShadow: TB.shadow,
              }}
            >
              <input
                ref={subInputRef}
                value={subInput}
                onChange={e => setSubInput(e.target.value)}
                onKeyDown={e => {
                  if (e.key === 'Enter' && subInput.trim()) {
                    wrapSelectionWithHighlight('extract')
                    const saved = subInput
                    setSubPanel(null); setToolbar(null); setSubInput('')
                    setAiResult({ title: 'Insight saved', body: saved, loading: false })
                  }
                }}
                placeholder="Add insight…"
                style={{
                  flex: 1, padding: '8px 10px',
                  border: 'none',
                  borderRadius: 8, fontSize: 12.5, fontFamily: FONT,
                  outline: 'none', color: DARK,
                  background: 'transparent',
                }}
              />
              <button type="button" onClick={() => {
                if (subInput.trim()) {
                  wrapSelectionWithHighlight('extract')
                  setAiResult({ title: 'Insight saved', body: subInput, loading: false })
                }
                setSubPanel(null); setToolbar(null); setSubInput('')
              }}
                style={{ padding: '7px 16px', borderRadius: 9999, border: 'none', background: DARK, color: '#fff', fontWeight: 600, fontSize: 12, cursor: 'pointer', whiteSpace: 'nowrap' }}>
                Save
              </button>
              <button type="button" onClick={() => setSubPanel(null)}
                style={{ padding: '4px 8px', borderRadius: 6, border: 'none', background: 'transparent', color: MUTED, fontSize: 15, cursor: 'pointer' }}>×</button>
            </div>
          )}
        </>
      )}

      {/* ── Right-click context menu ── */}
      {ctxMenu && (
        <div
          className="inline-toolbar"
          style={{
            position: 'fixed',
            left: Math.min(ctxMenu.x, window.innerWidth - 200),
            top: Math.min(ctxMenu.y, window.innerHeight - 360),
            zIndex: 2147483647,
            background: SURFACE,
            border: `1px solid ${PANEL_BORDER}`,
            borderRadius: 13,
            pointerEvents: 'auto',
            width: 192,
            padding: '6px',
            fontFamily: FONT,
            boxShadow: TB.shadow,
          }}
          onClick={e => e.stopPropagation()}
        >
          {/* Header */}
          <div style={{
            display: 'flex', alignItems: 'center', gap: 7,
            padding: '5px 8px 8px', borderBottom: `1px solid ${BORDER}`, marginBottom: 4,
          }}>
            <span style={{
              display: 'inline-flex', alignItems: 'center', justifyContent: 'center',
              width: 18, height: 18, borderRadius: 6, background: DARK, flexShrink: 0,
            }}>
              <span style={{ display: 'block', width: 2.5, height: 9, borderRadius: 2, background: '#fff', transform: 'rotate(-12deg)' }} />
            </span>
            <span style={{ fontSize: 11, fontWeight: 700, color: MUTED, letterSpacing: '0.06em' }}>
              INLINE
            </span>
          </div>
          {ctxItems.map(item => (
            <ContextMenuItem key={item.label} item={item} />
          ))}
        </div>
      )}

      {/* ── Custom Rewrite prompt (right-click → Custom Rewrite…) ── */}
      {ctxRewrite && (
        <div
          className="inline-toolbar"
          style={{
            position: 'fixed',
            left: Math.min(ctxRewrite.x, window.innerWidth - 340),
            top: Math.min(ctxRewrite.y, window.innerHeight - 80),
            zIndex: 2147483647,
            background: SURFACE, border: `1px solid ${PANEL_BORDER}`, borderRadius: TB.radius,
            pointerEvents: 'auto', width: 340,
            display: 'flex', alignItems: 'center', gap: 6,
            padding: '8px 8px 8px 12px', fontFamily: FONT,
            boxShadow: TB.shadow,
          }}
          onClick={e => e.stopPropagation()}
        >
          <input
            ref={ctxRewriteInputRef}
            value={ctxRewriteInput}
            onChange={e => setCtxRewriteInput(e.target.value)}
            onKeyDown={e => {
              if (e.key === 'Enter') runCustomRewriteFromContext()
              if (e.key === 'Escape') { setCtxRewrite(null); setCtxRewriteInput('') }
            }}
            placeholder="How should I rewrite this?"
            style={{
              flex: 1, padding: '8px 6px',
              border: 'none',
              borderRadius: 8, fontSize: 12.5, fontFamily: FONT,
              outline: 'none', color: DARK,
              background: 'transparent',
            }}
          />
          <button type="button" onClick={runCustomRewriteFromContext}
            disabled={!ctxRewriteInput.trim()}
            style={{
              padding: '7px 16px', borderRadius: 9999, border: 'none',
              background: ctxRewriteInput.trim() ? DARK : '#E5E3DF',
              color: ctxRewriteInput.trim() ? '#fff' : MUTED, fontWeight: 600, fontSize: 12,
              cursor: ctxRewriteInput.trim() ? 'pointer' : 'default',
              whiteSpace: 'nowrap',
            }}>
            Go
          </button>
          <button type="button"
            onClick={() => { setCtxRewrite(null); setCtxRewriteInput(''); savedRangeRef.current = null }}
            style={{ padding: '4px 8px', borderRadius: 6, border: 'none', background: 'transparent', color: MUTED, fontSize: 15, cursor: 'pointer' }}>×</button>
        </div>
      )}

      {/* ── Anchor note panels ── */}
      {anchors.map(a => (
        <AnchorPanel key={a.id} note={a} dragRef={dragRef}
          onChange={text => setAnchors(l => l.map(x => x.id === a.id ? { ...x, text } : x))}
          onClose={() => setAnchors(l => l.filter(x => x.id !== a.id))}
        />
      ))}

      {/* ── Spatial save modal ── */}
      {spatialOpen && (
        <div className="inline-modal-backdrop" style={{ position: 'fixed', inset: 0, background: 'rgba(15,23,42,0.4)', zIndex: 2147483647, display: 'flex', alignItems: 'center', justifyContent: 'center', pointerEvents: 'auto' }}>
          <div style={{ width: 'min(100vw - 24px,380px)', background: CREAM, border: `1px solid ${PANEL_BORDER}`, borderRadius: 18, padding: 20, fontFamily: FONT, boxShadow: TB.shadow }}>
            <h3 style={{ margin: '0 0 14px', fontSize: 14, fontWeight: 700, color: DARK }}>Save spatial data</h3>
            <label style={{ fontSize: 11, color: '#6B7280', display: 'block', marginBottom: 4 }}>Location / address</label>
            <input value={spatialAddr} onChange={e => setSpatialAddr(e.target.value)} placeholder="123 Main St, City"
              style={{ width: '100%', boxSizing: 'border-box', marginBottom: 10, padding: '8px 10px', border: '1px solid rgba(15,18,23,0.10)', borderRadius: 8, fontSize: 12, outline: 'none', background: '#fff' }} />
            <label style={{ fontSize: 11, color: '#6B7280', display: 'block', marginBottom: 4 }}>Insight / note</label>
            <textarea value={spatialNote} onChange={e => setSpatialNote(e.target.value)} placeholder="What did you notice here?"
              style={{ width: '100%', boxSizing: 'border-box', minHeight: 72, marginBottom: 14, padding: '8px 10px', border: '1px solid rgba(15,18,23,0.10)', borderRadius: 8, fontSize: 12, resize: 'vertical', outline: 'none', fontFamily: FONT, background: '#fff' }} />
            <div style={{ display: 'flex', gap: 8, justifyContent: 'flex-end' }}>
              <button type="button" onClick={() => { setSpatialOpen(false); setSpatialAddr(''); setSpatialNote('') }}
                style={{ border: '1px solid rgba(15,18,23,0.10)', borderRadius: 8, padding: '7px 14px', background: '#fff', fontSize: 12, cursor: 'pointer', fontWeight: 600, color: DARK }}>Cancel</button>
              <button type="button" onClick={async () => {
                const { apiBaseUrl, accessToken } = await loadSettings()
                const workspaceId = await new Promise<string>(resolve => {
                  chrome.storage.local.get(['inlineActiveWorkspaceId'], r => {
                    resolve(typeof r.inlineActiveWorkspaceId === 'string' && r.inlineActiveWorkspaceId
                      ? r.inlineActiveWorkspaceId : '')
                  })
                })
                const h: Record<string, string> = { 'Content-Type': 'application/json' }
                if (accessToken) h.Authorization = `Bearer ${accessToken}`
                try {
                  const res = await fetchViaBackground(`${apiBaseUrl}/api/spatial/save`, {
                    method: 'POST', headers: h,
                    body: JSON.stringify({ address: spatialAddr, insight: spatialNote, workspaceId, sourceUrl: window.location.href }),
                  })
                  const j = await res.json()
                  if (!res.ok) setAiResult({ title: 'Save to map', body: (j as { error?: string }).error ?? 'Save failed', loading: false })
                  else setAiResult({ title: 'Saved to map', body: spatialAddr || 'Pin saved.', loading: false })
                } catch (e) {
                  setAiResult({ title: 'Save failed', body: e instanceof Error ? e.message : 'Failed', loading: false })
                }
                setSpatialOpen(false); setSpatialAddr(''); setSpatialNote('')
              }}
                style={{ border: 'none', borderRadius: 8, padding: '7px 14px', background: DARK, color: '#fff', fontSize: 12, cursor: 'pointer', fontWeight: 600 }}>Save</button>
            </div>
          </div>
        </div>
      )}

      {/* ── Page risk panel ── */}
      {riskOpen && (
        <div style={{ position: 'fixed', right: 16, top: 16, width: 'min(100vw - 32px, 340px)', maxHeight: '70vh', overflow: 'auto', zIndex: 2147483646, background: CREAM, border: '1px solid rgba(15,18,23,0.10)', borderRadius: 16, padding: '14px 16px', pointerEvents: 'auto', fontFamily: FONT, fontSize: 12, boxShadow: TB.shadow }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 10 }}>
            <strong style={{ fontSize: 13, color: DARK }}>Page risk analysis</strong>
            <button type="button" onClick={() => setRiskOpen(false)}
              style={{ border: '1px solid rgba(15,18,23,0.10)', borderRadius: 6, background: '#fff', cursor: 'pointer', padding: '2px 7px', fontSize: 13, color: DARK }}>×</button>
          </div>
          {riskLoading
            ? <p style={{ color: '#6B7280', margin: 0 }}>Analysing…</p>
            : <pre style={{ whiteSpace: 'pre-wrap', margin: 0, color: DARK, lineHeight: 1.5 }}>{riskText}</pre>}
        </div>
      )}

      {/* ── Inline AI result card (replaces window.alert) ── */}
      {aiResult && (
        <div
          className="inline-toolbar"
          style={{
            position: 'fixed', right: 16, top: 16,
            width: 'min(100vw - 32px, 360px)', maxHeight: '70vh', overflow: 'auto',
            zIndex: 2147483646,
            background: CREAM, border: '1px solid rgba(15,18,23,0.10)', borderRadius: 16,
            padding: '14px 16px', pointerEvents: 'auto',
            fontFamily: FONT, fontSize: 12,
            boxShadow: TB.shadow,
          }}
        >
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 10 }}>
            <strong style={{ fontSize: 13, color: DARK }}>{aiResult.title}</strong>
            <button type="button" onClick={() => setAiResult(null)}
              style={{ border: '1px solid rgba(15,18,23,0.10)', borderRadius: 6, background: '#fff', cursor: 'pointer', padding: '2px 7px', fontSize: 13, color: DARK }}>×</button>
          </div>
          {aiResult.loading
            ? <p style={{ color: '#6B7280', margin: 0 }}>Thinking…</p>
            : <pre style={{ whiteSpace: 'pre-wrap', margin: 0, color: DARK, lineHeight: 1.5, fontFamily: FONT }}>{aiResult.body}</pre>}
          {!aiResult.loading && aiResult.body && (
            <div style={{ display: 'flex', gap: 6, marginTop: 10, justifyContent: 'flex-end' }}>
              <button type="button"
                onClick={() => { void navigator.clipboard.writeText(aiResult.body).catch(() => {}) }}
                style={{ border: '1px solid rgba(15,18,23,0.10)', borderRadius: 8, padding: '5px 10px', background: '#fff', fontSize: 11, cursor: 'pointer', fontWeight: 600, color: DARK }}>Copy</button>
              {/* Insert + persist — only shown for the three AI text tasks
                  and only when we still have a live highlight span to
                  replace. Once clicked we set `inserted: true` so the
                  button flips to a confirmation state. */}
              {aiResult.task && !aiResult.body.startsWith('[Error]') && (
                <button type="button"
                  disabled={aiResult.inserted || !lastHighlightSpan.current}
                  onClick={handleInsertAiResult}
                  title={aiResult.inserted
                    ? 'The AI edit is now part of the page and will come back on reload. Hover it and click × to remove.'
                    : 'Replace the highlighted text with this result. Persists across reloads.'}
                  style={{
                    border: 'none', borderRadius: 8,
                    padding: '5px 12px', fontSize: 11,
                    cursor: aiResult.inserted ? 'default' : 'pointer', fontWeight: 700,
                    background: aiResult.inserted ? '#16a34a' : DARK,
                    color: '#fff',
                    opacity: aiResult.inserted || !lastHighlightSpan.current ? 0.85 : 1,
                  }}
                >{aiResult.inserted ? 'Inserted ✓' : 'Insert'}</button>
              )}
            </div>
          )}
        </div>
      )}

      <GlobalDragHandler setAnchors={setAnchors} dragRef={dragRef} />
    </>
  )
}

/* ─── Anchor note panel ─── */
function AnchorPanel({
  note, dragRef, onChange, onClose,
}: {
  note: AnchorNote
  dragRef: MutableRefObject<{ id: string; ox: number; oy: number } | null>
  onChange: (t: string) => void
  onClose: () => void
}) {
  return (
    <div
      className="inline-anchor"
      style={{ position: 'fixed', left: note.x, top: note.y, width: 240, zIndex: 2147483645, background: CREAM, border: '1px solid rgba(15,18,23,0.10)', borderRadius: 14, overflow: 'hidden', pointerEvents: 'auto', fontFamily: FONT, boxShadow: TB.shadow }}
    >
      <div
        onMouseDown={e => { dragRef.current = { id: note.id, ox: e.clientX - note.x, oy: e.clientY - note.y }; e.preventDefault() }}
        style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '8px 11px', background: '#F6F5F3', borderBottom: '1px solid rgba(15,18,23,0.06)', cursor: 'grab', userSelect: 'none' }}
      >
        <span style={{ fontSize: 10, fontWeight: 700, color: '#6B7280', letterSpacing: 1 }}>⠿ ANCHOR NOTE</span>
        <button type="button" onClick={onClose}
          style={{ border: 'none', background: 'none', cursor: 'pointer', color: '#6B7280', fontSize: 15, padding: 0, lineHeight: 1 }}>×</button>
      </div>
      <textarea
        value={note.text}
        onChange={e => onChange(e.target.value)}
        placeholder="Start typing…"
        style={{ display: 'block', width: '100%', boxSizing: 'border-box', border: 'none', padding: '8px 10px', fontSize: 12, resize: 'vertical', minHeight: 90, outline: 'none', fontFamily: FONT, color: DARK, background: CREAM }}
      />
    </div>
  )
}

/* ─── global drag listener ─── */
function GlobalDragHandler({
  setAnchors, dragRef,
}: {
  setAnchors: Dispatch<SetStateAction<AnchorNote[]>>
  dragRef: MutableRefObject<{ id: string; ox: number; oy: number } | null>
}) {
  useEffect(() => {
    const move = (e: MouseEvent) => {
      const d = dragRef.current; if (!d) return
      setAnchors(l => l.map(a => a.id === d.id ? { ...a, x: Math.max(0, e.clientX - d.ox), y: Math.max(0, e.clientY - d.oy) } : a))
    }
    const up = () => { dragRef.current = null }
    window.addEventListener('mousemove', move)
    window.addEventListener('mouseup', up)
    return () => { window.removeEventListener('mousemove', move); window.removeEventListener('mouseup', up) }
  }, [dragRef, setAnchors])
  return null
}
