import { useState, useEffect, useRef, useCallback } from 'react'
import { PANEL as C, FONT } from '../lib/extensionTheme'

type Category = 'action' | 'annotate' | 'app' | 'toolbar'

interface Action {
  id: string
  label: string
  hint?: string
  icon: React.ReactNode
  category: Category
  shortcut?: string
}

interface CommandPaletteProps {
  onClose: () => void
  onAction: (actionId: string) => void
}

const IRewrite = () => (
  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.75" strokeLinecap="round" strokeLinejoin="round">
    <path d="M17 3a2.828 2.828 0 1 1 4 4L7.5 20.5 2 22l1.5-5.5L17 3z"/>
  </svg>
)
const IAi = () => (
  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.75" strokeLinecap="round" strokeLinejoin="round">
    <path d="M12 3l1.912 5.813a2 2 0 0 0 1.275 1.275L21 12l-5.813 1.912a2 2 0 0 0-1.275 1.275L12 21l-1.912-5.813a2 2 0 0 0-1.275-1.275L3 12l5.813-1.912a2 2 0 0 0 1.275-1.275L12 3z"/>
  </svg>
)
const INotes = () => (
  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.75" strokeLinecap="round" strokeLinejoin="round">
    <path d="M14.5 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V7.5L14.5 2z"/>
    <polyline points="14 2 14 8 20 8"/>
    <line x1="16" y1="13" x2="8" y2="13"/>
    <line x1="16" y1="17" x2="8" y2="17"/>
    <line x1="10" y1="9" x2="8" y2="9"/>
  </svg>
)
const IDraw = () => (
  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.75" strokeLinecap="round" strokeLinejoin="round">
    <path d="M12 19l7-7 3 3-7 7-3-3z"/>
    <path d="M18 13l-1.5-7.5L2 2l3.5 14.5L13 18l5-5z"/>
    <path d="M2 2l7.586 7.586"/>
    <circle cx="11" cy="11" r="2"/>
  </svg>
)
const IHighlight = () => (
  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.75" strokeLinecap="round" strokeLinejoin="round">
    <path d="M9 11l-6 6v3h9l3-3"/>
    <path d="M22 12l-4.6 4.6a2 2 0 0 1-2.8 0l-5.2-5.2a2 2 0 0 1 0-2.8L14 4"/>
  </svg>
)
const ISettings = () => (
  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.75" strokeLinecap="round" strokeLinejoin="round">
    <circle cx="12" cy="12" r="3"/>
    <path d="M12 1v2M12 21v2M4.22 4.22l1.42 1.42M18.36 18.36l1.42 1.42M1 12h2M21 12h2M4.22 19.78l1.42-1.42M18.36 5.64l1.42-1.42"/>
  </svg>
)
const ICollapse = () => (
  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.75" strokeLinecap="round" strokeLinejoin="round">
    <polyline points="4 14 10 14 10 20"/>
    <polyline points="20 10 14 10 14 4"/>
    <line x1="14" y1="10" x2="21" y2="3"/>
    <line x1="3" y1="21" x2="10" y2="14"/>
  </svg>
)
const IPause = () => (
  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.75" strokeLinecap="round" strokeLinejoin="round">
    <rect x="6" y="4" width="4" height="16"/>
    <rect x="14" y="4" width="4" height="16"/>
  </svg>
)
const ISearch = () => (
  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.9" strokeLinecap="round" strokeLinejoin="round">
    <circle cx="11" cy="11" r="8"/><line x1="21" y1="21" x2="16.65" y2="16.65"/>
  </svg>
)

const CATEGORY_LABEL: Record<Category, string> = {
  action: 'Actions',
  annotate: 'Annotate',
  app: 'Workspace',
  toolbar: 'Toolbar',
}

const ACTIONS: Action[] = [
  { id: 'ai', label: 'Ask AI', hint: 'Chat about the page or selection', icon: <IAi />, category: 'action', shortcut: 'A' },
  { id: 'rewrite', label: 'Rewrite', hint: 'Rephrase, shorten, summarize', icon: <IRewrite />, category: 'action', shortcut: 'R' },
  { id: 'highlighter', label: 'Highlighter', hint: 'Highlight passages', icon: <IHighlight />, category: 'annotate', shortcut: 'H' },
  { id: 'notes', label: 'Sticky note', hint: 'Drop a note on the page', icon: <INotes />, category: 'annotate', shortcut: 'N' },
  { id: 'draw', label: 'Draw', hint: 'Sketch over the page', icon: <IDraw />, category: 'annotate' },
  { id: 'settings', label: 'Settings', hint: 'Preferences & blocked sites', icon: <ISettings />, category: 'app' },
  { id: 'collapse', label: 'Toggle tools dock', hint: 'Show or hide the launcher dock', icon: <ICollapse />, category: 'toolbar' },
  { id: 'pause', label: 'Hide Inline', hint: 'Tuck the launcher away on this page', icon: <IPause />, category: 'toolbar' },
]

const FILTERS: { id: 'all' | Category; label: string }[] = [
  { id: 'all', label: 'All' },
  { id: 'action', label: 'Actions' },
  { id: 'annotate', label: 'Annotate' },
  { id: 'toolbar', label: 'Toolbar' },
]

export default function CommandPalette({ onClose, onAction }: CommandPaletteProps) {
  const [query, setQuery] = useState('')
  const [filter, setFilter] = useState<'all' | Category>('all')
  const [selectedIdx, setSelectedIdx] = useState(0)
  const inputRef = useRef<HTMLInputElement>(null)
  const listRef = useRef<HTMLDivElement>(null)

  const filtered = ACTIONS.filter(
    (a) =>
      (filter === 'all' || a.category === filter) &&
      (a.label.toLowerCase().includes(query.toLowerCase()) ||
        (a.hint?.toLowerCase().includes(query.toLowerCase()) ?? false)),
  )

  useEffect(() => { setSelectedIdx(0) }, [query, filter])
  useEffect(() => { inputRef.current?.focus() }, [])
  useEffect(() => {
    const row = listRef.current?.querySelector<HTMLElement>(`[data-cmd-idx="${selectedIdx}"]`)
    row?.scrollIntoView({ block: 'nearest' })
  }, [selectedIdx])

  const execute = useCallback(
    (id: string) => { onAction(id); onClose() },
    [onAction, onClose],
  )

  const handleKeyDown = useCallback(
    (e: React.KeyboardEvent) => {
      if (e.key === 'ArrowDown') {
        e.preventDefault()
        setSelectedIdx((i) => Math.min(i + 1, filtered.length - 1))
      } else if (e.key === 'ArrowUp') {
        e.preventDefault()
        setSelectedIdx((i) => Math.max(i - 1, 0))
      } else if (e.key === 'Enter') {
        e.preventDefault()
        if (filtered[selectedIdx]) execute(filtered[selectedIdx].id)
      } else if (e.key === 'Escape') {
        e.preventDefault()
        onClose()
      }
    },
    [filtered, selectedIdx, execute, onClose],
  )

  return (
    <div
      onClick={onClose}
      style={{
        position: 'fixed', inset: 0, zIndex: 2147483647, pointerEvents: 'auto',
        background: 'rgba(15,18,23,0.28)', backdropFilter: 'blur(2px)',
        display: 'flex', justifyContent: 'center', alignItems: 'flex-start',
        paddingTop: '16vh', fontFamily: FONT,
      }}
    >
      <div
        onClick={(e) => e.stopPropagation()}
        onKeyDown={handleKeyDown}
        style={{
          width: 480, maxWidth: 'calc(100vw - 32px)', maxHeight: 460,
          background: C.bg, borderRadius: C.radius, boxShadow: C.shadowOuter,
          border: `1px solid ${C.border}`,
          display: 'flex', flexDirection: 'column', overflow: 'hidden',
        }}
      >
        {/* Search input */}
        <div style={{ display: 'flex', alignItems: 'center', gap: 10, padding: '14px 16px 10px' }}>
          <span style={{ color: C.textLight, display: 'flex' }}><ISearch /></span>
          <input
            ref={inputRef}
            type="text"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Search for actions and tools…"
            style={{
              flex: 1, border: 'none', background: 'transparent',
              fontSize: 15, fontFamily: FONT, color: C.text, outline: 'none',
            }}
          />
        </div>

        {/* Filter chips */}
        <div style={{ display: 'flex', alignItems: 'center', gap: 8, padding: '2px 16px 12px', flexWrap: 'wrap' }}>
          <span style={{ fontSize: 11.5, color: C.textLight, marginRight: 2 }}>I&apos;m looking for…</span>
          {FILTERS.map((f) => {
            const active = filter === f.id
            return (
              <button
                key={f.id}
                type="button"
                onClick={() => setFilter(f.id)}
                style={{
                  padding: '5px 12px', borderRadius: C.radiusPill,
                  border: `1px solid ${active ? C.accent : C.border}`,
                  background: active ? C.accent : C.bg,
                  color: active ? '#fff' : C.text,
                  fontSize: 12, fontWeight: 500, cursor: 'pointer', fontFamily: FONT,
                  transition: 'background 0.13s, border-color 0.13s, color 0.13s',
                }}
              >
                {f.label}
              </button>
            )
          })}
        </div>

        <div style={{ height: 1, background: C.divider }} />

        {/* Sectioned list */}
        <div ref={listRef} style={{ flex: 1, overflowY: 'auto', padding: '8px 8px 10px' }}>
          {filtered.length === 0 && (
            <div style={{ padding: '22px 12px', textAlign: 'center', color: C.textMuted, fontSize: 13 }}>
              No matching commands
            </div>
          )}
          {filtered.map((action, idx) => {
            const showHeader = idx === 0 || filtered[idx - 1].category !== action.category
            const selected = idx === selectedIdx
            return (
              <div key={action.id}>
                {showHeader && (
                  <p style={{
                    margin: idx === 0 ? '4px 10px 4px' : '10px 10px 4px',
                    fontSize: 10.5, fontWeight: 600, letterSpacing: '0.06em',
                    textTransform: 'uppercase', color: C.textLight,
                  }}>
                    {CATEGORY_LABEL[action.category]}
                  </p>
                )}
                <button
                  data-cmd-idx={idx}
                  onClick={() => execute(action.id)}
                  onMouseEnter={() => setSelectedIdx(idx)}
                  style={{
                    display: 'flex', alignItems: 'center', gap: 12, width: '100%',
                    padding: '9px 10px', border: 'none', borderRadius: C.radiusSm,
                    background: selected ? C.hoverBg : 'transparent',
                    color: C.text, cursor: 'pointer', fontFamily: FONT,
                    textAlign: 'left', transition: 'background 0.1s',
                  }}
                >
                  <span style={{
                    display: 'flex', alignItems: 'center', justifyContent: 'center',
                    width: 30, height: 30, borderRadius: 9, flexShrink: 0,
                    background: selected ? C.bg : C.surfaceMuted,
                    border: `1px solid ${C.border}`,
                    color: C.textMuted,
                  }}>
                    {action.icon}
                  </span>
                  <span style={{ flex: 1, minWidth: 0 }}>
                    <span style={{ display: 'block', fontSize: 13.5, fontWeight: 500, color: C.text }}>{action.label}</span>
                    {action.hint && (
                      <span style={{ display: 'block', fontSize: 11.5, color: C.textLight, marginTop: 1, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{action.hint}</span>
                    )}
                  </span>
                  {action.shortcut && (
                    <span style={{
                      fontSize: 11, fontWeight: 600, color: C.textMuted,
                      background: C.surfaceMuted, border: `1px solid ${C.border}`,
                      padding: '2px 7px', borderRadius: 6, flexShrink: 0,
                    }}>
                      {action.shortcut}
                    </span>
                  )}
                </button>
              </div>
            )
          })}
        </div>

        {/* Footer */}
        <div style={{
          display: 'flex', alignItems: 'center', justifyContent: 'space-between',
          padding: '9px 14px', borderTop: `1px solid ${C.divider}`, background: C.surfaceBubble,
        }}>
          <span style={{ display: 'flex', alignItems: 'center', gap: 7, fontSize: 11, color: C.textLight }}>
            <span style={{ display: 'inline-flex', alignItems: 'center', justifyContent: 'center', width: 16, height: 16, borderRadius: 5, background: '#0B1735' }}>
              <span style={{ display: 'block', width: 2, height: 8, borderRadius: 2, background: '#fff', transform: 'rotate(-12deg)' }} />
            </span>
            Inline
          </span>
          <span style={{ fontSize: 11, color: C.textLight }}>
            <kbd style={kbd}>↑</kbd> <kbd style={kbd}>↓</kbd> to navigate · <kbd style={kbd}>↵</kbd> to run
          </span>
        </div>
      </div>
    </div>
  )
}

const kbd: React.CSSProperties = {
  display: 'inline-flex', alignItems: 'center', justifyContent: 'center',
  minWidth: 16, height: 16, padding: '0 4px', borderRadius: 5,
  background: C.surfaceMuted, border: `1px solid ${C.border}`,
  fontSize: 10, color: C.textMuted, fontFamily: FONT,
}
