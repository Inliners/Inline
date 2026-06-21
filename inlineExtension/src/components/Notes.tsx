import { useState, useRef, useCallback, useEffect } from 'react'
import { PANEL as C, FONT } from '../lib/extensionTheme'

type HeadingLevel = 'Normal' | 'Subheading' | 'Heading'
type PaperStyle = 'Plain' | 'Ruled' | 'Grid' | 'Dotted'

const PAPER_BG: Record<PaperStyle, string> = {
  Plain: 'none',
  Ruled: 'repeating-linear-gradient(to bottom, transparent, transparent 27px, rgba(180,170,160,0.18) 27px, rgba(180,170,160,0.18) 28px)',
  Grid: 'repeating-linear-gradient(to bottom, transparent, transparent 27px, rgba(180,170,160,0.18) 27px, rgba(180,170,160,0.18) 28px), repeating-linear-gradient(to right, transparent, transparent 27px, rgba(180,170,160,0.18) 27px, rgba(180,170,160,0.18) 28px)',
  Dotted: 'radial-gradient(circle, rgba(180,170,160,0.3) 1px, transparent 1px)',
}

const PAPER_SIZE: Record<PaperStyle, string> = {
  Plain: 'auto',
  Ruled: 'auto',
  Grid: 'auto',
  Dotted: '20px 20px',
}

/* ─── Icons ─── */
const INote = () => (
  <svg width="14" height="14" viewBox="0 0 16 16" fill="#1C1E26">
    <path d="M5 0h8a2 2 0 0 1 2 2v10a2 2 0 0 1-2 2 2 2 0 0 1-2 2H3a2 2 0 0 1-2-2h1a1 1 0 0 0 1 1h8a1 1 0 0 0 1-1V4a1 1 0 0 0-1-1H3a1 1 0 0 0-1 1H1a2 2 0 0 1 2-2h2V1a1 1 0 0 0-1 1H3a2 2 0 0 1 2-2z"/>
    <path d="M1 6v-.5a.5.5 0 0 1 1 0V6h.5a.5.5 0 0 1 0 1H2v.5a.5.5 0 0 1-1 0V7h-.5a.5.5 0 0 1 0-1H1z"/>
  </svg>
)
const IClose = () => (
  <svg width="14" height="14" viewBox="0 0 16 16" fill="#78716c">
    <path d="M2.146 2.854a.5.5 0 1 1 .708-.708L8 7.293l5.146-5.147a.5.5 0 0 1 .708.708L8.707 8l5.147 5.146a.5.5 0 0 1-.708.708L8 8.707l-5.146 5.147a.5.5 0 0 1-.708-.708L7.293 8 2.146 2.854z"/>
  </svg>
)

const HEADING_MAP: Record<HeadingLevel, { tag: string; size: number; weight: number }> = {
  Normal: { tag: 'div', size: 13, weight: 400 },
  Subheading: { tag: 'h3', size: 15, weight: 500 },
  Heading: { tag: 'h2', size: 18, weight: 500 },
}

interface NotesProps {
  onClose: () => void
  initialX?: number
  initialY?: number
  initialW?: number
  initialH?: number
  initialContent?: string
  initialPaperStyle?: PaperStyle
  onUpdate?: (patch: {
    x?: number; y?: number; w?: number; h?: number;
    content?: string; paperStyle?: PaperStyle;
  }) => void
}

export default function Notes({
  onClose,
  initialX = 100,
  initialY = 100,
  initialW = 320,
  initialH = 260,
  initialContent = '',
  initialPaperStyle = 'Plain',
  onUpdate,
}: NotesProps) {
  const [headingLevel, setHeadingLevel] = useState<HeadingLevel>('Normal')
  const [showHeadingMenu, setShowHeadingMenu] = useState(false)
  const [paperStyle, setPaperStyle] = useState<PaperStyle>(initialPaperStyle)
  const [showPaperMenu, setShowPaperMenu] = useState(false)
  const [pos, setPos] = useState({ x: initialX, y: initialY })
  const [size, setSize] = useState({ w: initialW, h: initialH })
  const bodyRef = useRef<HTMLDivElement>(null)
  const dragRef = useRef<{ ox: number; oy: number } | null>(null)
  const latestPosRef = useRef(pos)
  const latestSizeRef = useRef(size)

  const author = 'You'
  const timestamp = new Date().toLocaleDateString('en-US', { month: 'short', day: 'numeric' })
    + ', ' + new Date().toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit' })

  /* ─── Drag ─── */
  const onPointerDown = useCallback((e: React.PointerEvent) => {
    e.preventDefault()
    dragRef.current = { ox: e.clientX - pos.x, oy: e.clientY - pos.y }
    ;(e.target as HTMLElement).setPointerCapture(e.pointerId)
  }, [pos])

  const onPointerMove = useCallback((e: React.PointerEvent) => {
    if (!dragRef.current) return
    const next = {
      x: Math.max(8, Math.min(window.innerWidth - 48, e.clientX - dragRef.current.ox)),
      y: Math.max(8, Math.min(window.innerHeight - 48, e.clientY - dragRef.current.oy)),
    }
    latestPosRef.current = next
    setPos(next)
  }, [])

  const onPointerUp = useCallback(() => {
    if (!dragRef.current) return
    dragRef.current = null
    onUpdate?.(latestPosRef.current)
  }, [onUpdate])

  /* ─── Resize ─── */
  const onResizeDown = useCallback((e: React.MouseEvent) => {
    e.preventDefault(); e.stopPropagation()
    const sx = e.clientX, sy = e.clientY, sw = size.w, sh = size.h
    let latest = { w: sw, h: sh }
    const move = (ev: MouseEvent) => {
      latest = {
        w: Math.max(240, sw + ev.clientX - sx),
        h: Math.max(180, sh + ev.clientY - sy),
      }
      latestSizeRef.current = latest
      setSize(latest)
    }
    const up = () => {
      window.removeEventListener('mousemove', move)
      window.removeEventListener('mouseup', up)
      onUpdate?.(latestSizeRef.current)
    }
    window.addEventListener('mousemove', move)
    window.addEventListener('mouseup', up)
  }, [size, onUpdate])

  /* ─── Formatting commands ─── */
  function fmt(cmd: string) {
    bodyRef.current?.focus()
    document.execCommand(cmd, false, undefined)
  }

  function applyHeading(level: HeadingLevel) {
    setHeadingLevel(level)
    setShowHeadingMenu(false)
    bodyRef.current?.focus()
    if (level === 'Heading') document.execCommand('formatBlock', false, 'h2')
    else if (level === 'Subheading') document.execCommand('formatBlock', false, 'h3')
    else document.execCommand('formatBlock', false, 'div')
  }

  useEffect(() => {
    if (bodyRef.current && initialContent) {
      bodyRef.current.innerHTML = initialContent
    }
    bodyRef.current?.focus()
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  const contentTimer = useRef<ReturnType<typeof setTimeout> | null>(null)
  const onBodyInput = useCallback(() => {
    if (!onUpdate) return
    if (contentTimer.current) clearTimeout(contentTimer.current)
    contentTimer.current = setTimeout(() => {
      onUpdate({ content: bodyRef.current?.innerHTML ?? '' })
    }, 400)
  }, [onUpdate])

  return (
    <div style={{
      position: 'fixed', left: pos.x, top: pos.y,
      width: size.w, height: size.h,
      background: C.bg, border: `1px solid ${C.border}`,
      borderRadius: C.radius, boxShadow: C.shadow,
      fontFamily: FONT,
      display: 'flex', flexDirection: 'column',
      overflow: 'hidden', zIndex: 2147483646,
      pointerEvents: 'auto',
    }}>
      {/* Header + Toolbar */}
      <div
        onPointerDown={onPointerDown}
        onPointerMove={onPointerMove}
        onPointerUp={onPointerUp}
        style={{
          display: 'flex', alignItems: 'center', gap: 2,
          padding: '8px 12px', background: C.headerBg,
          borderBottom: `1px solid ${C.divider}`,
          cursor: 'grab', flexShrink: 0, touchAction: 'none',
        }}
      >
        <INote />

        {/* Font dropdown */}
        <div style={{ position: 'relative', marginLeft: 6 }}>
          <button
            onPointerDown={e => e.stopPropagation()}
            onClick={() => setShowHeadingMenu(v => !v)}
            style={{
              display: 'flex', alignItems: 'center', gap: 3,
              padding: '5px 12px', border: `1px solid ${C.border}`, borderRadius: C.radiusPill,
              background: C.surfaceBubble, fontSize: 11, fontWeight: 500, color: C.text,
              cursor: 'pointer', boxShadow: C.shadowSoft,
            }}
          >
            Aa <span style={{ fontSize: 8, color: C.textLight }}>▼</span>
          </button>
          {showHeadingMenu && (
            <div style={{
              position: 'absolute', top: '100%', left: 0, marginTop: 6,
              background: C.bg, border: `1px solid ${C.border}`, borderRadius: C.radiusMd,
              boxShadow: C.shadow, zIndex: 10, overflow: 'hidden', minWidth: 128,
            }}>
              {(['Normal', 'Subheading', 'Heading'] as const).map(l => (
                <button key={l}
                  onPointerDown={e => e.stopPropagation()}
                  onClick={() => applyHeading(l)}
                  style={{
                    display: 'block', width: '100%', textAlign: 'left',
                    padding: '7px 12px', border: 'none', borderRadius: 0,
                    background: headingLevel === l ? C.headerBg : 'transparent',
                    fontSize: HEADING_MAP[l].size * 0.75, fontWeight: HEADING_MAP[l].weight,
                    color: C.text, cursor: 'pointer',
                  }}
                >{l}</button>
              ))}
            </div>
          )}
        </div>

        {/* Paper dropdown */}
        <div style={{ position: 'relative', marginLeft: 2 }}>
          <button
            onPointerDown={e => e.stopPropagation()}
            onClick={() => { setShowPaperMenu(v => !v); setShowHeadingMenu(false) }}
            style={{
              display: 'flex', alignItems: 'center', gap: 3,
              padding: '5px 10px', border: `1px solid ${C.border}`, borderRadius: C.radiusPill,
              background: C.surfaceBubble, fontSize: 11, fontWeight: 500, color: C.text,
              cursor: 'pointer', boxShadow: C.shadowSoft,
            }}
          >
            <svg width="12" height="12" viewBox="0 0 16 16" fill="currentColor"><path d="M2 2a2 2 0 0 1 2-2h8a2 2 0 0 1 2 2v12a2 2 0 0 1-2 2H4a2 2 0 0 1-2-2V2zm2-1a1 1 0 0 0-1 1v12a1 1 0 0 0 1 1h8a1 1 0 0 0 1-1V2a1 1 0 0 0-1-1H4z"/></svg>
            <span style={{ fontSize: 8, color: C.textLight }}>▼</span>
          </button>
          {showPaperMenu && (
            <div style={{
              position: 'absolute', top: '100%', left: 0, marginTop: 6,
              background: C.bg, border: `1px solid ${C.border}`, borderRadius: C.radiusMd,
              boxShadow: C.shadow, zIndex: 10, overflow: 'hidden', minWidth: 110,
            }}>
              {(['Plain', 'Ruled', 'Grid', 'Dotted'] as const).map(p => (
                <button key={p}
                  onPointerDown={e => e.stopPropagation()}
                  onClick={() => { setPaperStyle(p); setShowPaperMenu(false); onUpdate?.({ paperStyle: p }) }}
                  style={{
                    display: 'block', width: '100%', textAlign: 'left',
                    padding: '7px 12px', border: 'none', borderRadius: 0,
                    background: paperStyle === p ? C.headerBg : 'transparent',
                    fontSize: 12, fontWeight: 500,
                    color: C.text, cursor: 'pointer', fontFamily: FONT,
                  }}
                >{p}</button>
              ))}
            </div>
          )}
        </div>

        <div style={{ width: 1, height: 18, background: C.divider, margin: '0 4px', flexShrink: 0 }} />

        {/* Formatting buttons */}
        <ToolbarBtn onPointerDown={e => e.stopPropagation()} onClick={() => fmt('bold')} aria-label="Bold"><b style={{ fontSize: 12 }}>B</b></ToolbarBtn>
        <ToolbarBtn onPointerDown={e => e.stopPropagation()} onClick={() => fmt('italic')} aria-label="Italic"><i style={{ fontSize: 12 }}>I</i></ToolbarBtn>
        <ToolbarBtn onPointerDown={e => e.stopPropagation()} onClick={() => fmt('underline')} aria-label="Underline">
          <span style={{ fontSize: 12, fontWeight: 500, color: '#1C1E26' }}>A</span>
        </ToolbarBtn>

        <div style={{ width: 1, height: 18, background: C.divider, margin: '0 4px', flexShrink: 0 }} />

        <ToolbarBtn onPointerDown={e => e.stopPropagation()} onClick={() => fmt('insertUnorderedList')} aria-label="Bullet list">
          <svg width="12" height="12" viewBox="0 0 16 16" fill="currentColor"><path d="M5 11.5a.5.5 0 0 1 .5-.5h9a.5.5 0 0 1 0 1h-9a.5.5 0 0 1-.5-.5zm0-4a.5.5 0 0 1 .5-.5h9a.5.5 0 0 1 0 1h-9a.5.5 0 0 1-.5-.5zm0-4a.5.5 0 0 1 .5-.5h9a.5.5 0 0 1 0 1h-9a.5.5 0 0 1-.5-.5zM3 8a1 1 0 1 1 0-2 1 1 0 0 1 0 2zm0 4a1 1 0 1 1 0-2 1 1 0 0 1 0 2zm0-8a1 1 0 1 1 0-2 1 1 0 0 1 0 2z"/></svg>
        </ToolbarBtn>
        <ToolbarBtn onPointerDown={e => e.stopPropagation()} onClick={() => fmt('insertOrderedList')} aria-label="Numbered list">
          <svg width="12" height="12" viewBox="0 0 16 16" fill="currentColor"><path d="M5 11.5a.5.5 0 0 1 .5-.5h9a.5.5 0 0 1 0 1h-9a.5.5 0 0 1-.5-.5zm0-4a.5.5 0 0 1 .5-.5h9a.5.5 0 0 1 0 1h-9a.5.5 0 0 1-.5-.5zm0-4a.5.5 0 0 1 .5-.5h9a.5.5 0 0 1 0 1h-9a.5.5 0 0 1-.5-.5z"/><path d="M1.713 11.865v-.474H2c.217 0 .363-.137.363-.317 0-.185-.158-.31-.361-.31-.223 0-.367.152-.373.31h-.59c.016-.467.373-.787.986-.787.588-.002.954.291.957.703a.595.595 0 0 1-.492.594v.015a.63.63 0 0 1 .569.631c0 .438-.395.744-1.017.744-.564 0-.954-.303-.965-.754h.6c.01.175.155.303.376.303.218 0 .38-.152.38-.347 0-.227-.186-.347-.437-.347h-.215v-.468z"/><path d="M2 1a1 1 0 0 0-1 1v.217l.652-.33.348.667L.5 3.476V5h2V4H1.5v-.39l1.217-.66L2 1.5V2z"/></svg>
        </ToolbarBtn>

        <div style={{ flex: 1 }} />

        {/* Close */}
        <button
          onPointerDown={e => e.stopPropagation()}
          onClick={onClose}
          style={{
            display: 'inline-flex', alignItems: 'center', justifyContent: 'center',
            width: 26, height: 26, border: 'none', borderRadius: 999,
            background: 'transparent', cursor: 'pointer', padding: 0,
          }}
        ><IClose /></button>
      </div>

      {/* Body – contenteditable */}
      <div
        ref={bodyRef}
        contentEditable
        suppressContentEditableWarning
        onInput={onBodyInput}
        data-placeholder="Start typing…"
        style={{
          flex: 1, padding: '10px 14px', fontSize: 13, lineHeight: 1.65,
          color: C.text, outline: 'none', overflowY: 'auto',
          cursor: 'text', userSelect: 'text',
          backgroundImage: PAPER_BG[paperStyle],
          backgroundSize: PAPER_SIZE[paperStyle],
        }}
      />

      {/* Footer */}
      <div style={{
        display: 'flex', alignItems: 'center', justifyContent: 'space-between',
        padding: '8px 14px', borderTop: `1px solid ${C.divider}`,
        background: C.surfaceMuted, flexShrink: 0,
      }}>
        <span style={{ fontSize: 10, color: C.textLight }}>By {author} | {timestamp}</span>
        <div
          onMouseDown={onResizeDown}
          role="separator"
          aria-label="Resize note"
          style={{ cursor: 'nwse-resize', color: C.textLight, fontSize: 10, userSelect: 'none' }}
        >⠿</div>
      </div>
    </div>
  )
}

function ToolbarBtn({ children, ...props }: React.ButtonHTMLAttributes<HTMLButtonElement>) {
  return (
    <button
      type="button"
      {...props}
      style={{
        display: 'inline-flex', alignItems: 'center', justifyContent: 'center',
        width: 28, height: 28, border: 'none', borderRadius: C.radiusSm,
        background: 'rgba(255,255,255,0.35)', cursor: 'pointer', color: C.textMuted, padding: 0,
        ...props.style,
      }}
    >{children}</button>
  )
}
