import { useState, useRef, useEffect, useCallback } from 'react'
import { PANEL as C } from '../lib/extensionTheme'
import { PanelShell, SectionLabel } from './panelKit'
import { ensureHandwritingCanvas, restoreHandwriting } from '../content/handwritingRestore'
import { emitSaveToast } from '../lib/saveToast'

type HWTool = 'pen' | 'highlighter' | 'eraser'

const COLORS = [
  '#1C1E26', '#b42318', '#315a9f', '#0f7b6c', '#b7791f',
  '#7c3aed', '#ec4899', '#06b6d4', '#ea580c', '#78716c',
]

interface Point {
  x: number
  y: number
  pressure: number
}

interface Stroke {
  id?: string
  points: Point[]
  color: string
  thickness: number
  tool: HWTool
}

function makeStrokeId(): string {
  return `hw-${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 8)}`
}

const IPen = () => (
  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <path d="M17 3a2.828 2.828 0 1 1 4 4L7.5 20.5 2 22l1.5-5.5L17 3z" />
  </svg>
)
const IHighlighter = () => (
  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <path d="M9 11l-6 6v3h9l3-3" /><path d="M22 12l-4.6 4.6a2 2 0 0 1-2.8 0l-5.2-5.2a2 2 0 0 1 0-2.8L14 4" />
  </svg>
)
const IEraser = () => (
  <svg width="16" height="16" viewBox="0 0 16 16" fill="currentColor">
    <path d="M8.086 2.207a2 2 0 0 1 2.828 0l3.879 3.879a2 2 0 0 1 0 2.828l-5.5 5.5A2 2 0 0 1 7.879 15H5.12a2 2 0 0 1-1.414-.586l-2.5-2.5a2 2 0 0 1 0-2.828l5.88-5.879z" />
  </svg>
)
interface HandwritingProps {
  onClose: () => void
}

export default function Handwriting({ onClose }: HandwritingProps) {
  const [tool, setTool] = useState<HWTool>('pen')
  const [color, setColor] = useState(COLORS[0])
  const [thickness, setThickness] = useState(3)
  const canvasRef = useRef<HTMLCanvasElement | null>(null)
  const strokes = useRef<Stroke[]>([])
  const currentStroke = useRef<Stroke | null>(null)
  const drawing = useRef(false)
  const rafId = useRef(0)

  /* ─── Reuse the shared canvas owned by the content script ───
   *
   * The canvas and its saved strokes are created at content-script init
   * (handwritingRestore.ts). We only attach pointer listeners while the
   * panel is open and detach them on close — the canvas element itself
   * persists across panel open/close and across page reloads.
   */
  useEffect(() => {
    const canvas = ensureHandwritingCanvas()
    canvasRef.current = canvas

    // Hydrate our strokes cache from whatever the restore layer already
    // drew onto the canvas (it stashes the array on the element).
    const existing = (canvas as unknown as { __inlineStrokes?: Stroke[] }).__inlineStrokes
    if (Array.isArray(existing)) strokes.current = existing

    // Also re-request from storage in case the restore raced page load.
    restoreHandwriting()
    try {
      if (!chrome.runtime?.id) return
      chrome.runtime.sendMessage(
        { type: 'LOAD_ANNOTATIONS', payload: { pageUrl: window.location.href } },
        (response) => {
          if (chrome.runtime.lastError || !response?.ok) return
          const saved = response.data?.elements?.handwriting as Stroke[] | undefined
          if (Array.isArray(saved) && saved.length > 0) {
            strokes.current = saved
            ;(canvas as unknown as { __inlineStrokes?: Stroke[] }).__inlineStrokes = saved
            renderAllStrokes()
          }
        },
      )
    } catch { /* extension context unavailable */ }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  useEffect(() => {
    const canvas = canvasRef.current
    if (!canvas) return
    canvas.style.pointerEvents = 'auto'
    canvas.style.cursor = tool === 'eraser' ? 'cell' : 'crosshair'
    return () => {
      canvas.style.pointerEvents = 'none'
      canvas.style.cursor = ''
    }
  }, [tool])

  const renderStroke = useCallback((ctx: CanvasRenderingContext2D, stroke: Stroke) => {
    const pts = stroke.points
    if (pts.length === 0) return

    ctx.save()

    if (stroke.tool === 'highlighter') {
      ctx.globalCompositeOperation = 'multiply'
      ctx.globalAlpha = 0.35
    } else if (stroke.tool === 'eraser') {
      ctx.globalCompositeOperation = 'destination-out'
      ctx.globalAlpha = 1
    } else {
      ctx.globalCompositeOperation = 'source-over'
      ctx.globalAlpha = 1
    }

    ctx.lineCap = 'round'
    ctx.lineJoin = 'round'
    ctx.strokeStyle = stroke.tool === 'eraser' ? 'rgba(0,0,0,1)' : stroke.color

    if (pts.length === 1) {
      const p = pts[0]
      const r = stroke.thickness * (p.pressure || 0.5) * 0.5
      ctx.beginPath()
      ctx.arc(p.x, p.y, Math.max(r, 0.5), 0, Math.PI * 2)
      ctx.fillStyle = ctx.strokeStyle
      ctx.fill()
      ctx.restore()
      return
    }

    for (let i = 0; i < pts.length - 1; i++) {
      const p0 = pts[i]
      const p1 = pts[i + 1]
      const w = stroke.thickness * ((p0.pressure + p1.pressure) / 2 || 0.5)
      ctx.lineWidth = Math.max(w, 0.5)
      ctx.beginPath()
      ctx.moveTo(p0.x, p0.y)
      if (i + 2 < pts.length) {
        const p2 = pts[i + 1]
        const cpx = (p0.x + p2.x) / 2
        const cpy = (p0.y + p2.y) / 2
        ctx.quadraticCurveTo(p0.x, p0.y, cpx, cpy)
      } else {
        ctx.lineTo(p1.x, p1.y)
      }
      ctx.stroke()
    }

    ctx.restore()
  }, [])

  const renderAllStrokes = useCallback(() => {
    const canvas = canvasRef.current
    if (!canvas) return
    const ctx = canvas.getContext('2d')
    if (!ctx) return
    ctx.clearRect(0, 0, canvas.width, canvas.height)
    for (const s of strokes.current) renderStroke(ctx, s)
  }, [renderStroke])

  const persistData = useCallback(() => {
    try {
      if (!chrome.runtime?.id) return
      const data = strokes.current.map(s => ({ ...s, id: s.id ?? makeStrokeId() }))
      strokes.current = data
      // Mirror to the canvas element so the restore layer's resize handler
      // and any panel re-mount see the latest strokes without a storage
      // round-trip.
      const canvas = canvasRef.current
      if (canvas) (canvas as unknown as { __inlineStrokes?: Stroke[] }).__inlineStrokes = data
      chrome.runtime.sendMessage(
        {
          type: 'SAVE_ANNOTATIONS',
          payload: {
            pageUrl: window.location.href,
            featureKey: 'handwriting',
            data,
            pageTitle: document.title,
            domain: window.location.hostname,
            clearedAt: data.length === 0 ? Date.now() : null,
          },
        },
        (response) => {
          if (chrome.runtime.lastError) return
          emitSaveToast(response)
        },
      )
    } catch { /* extension context unavailable */ }
  }, [])

  useEffect(() => {
    const canvas = canvasRef.current
    if (!canvas) return
    const canvasEl = canvas

    function onPointerDown(e: PointerEvent) {
      e.preventDefault()
      e.stopPropagation()
      try { canvasEl.setPointerCapture(e.pointerId) } catch { /* unsupported */ }
      drawing.current = true
      const pressure = e.pressure > 0 ? e.pressure : 0.5
      currentStroke.current = {
        id: makeStrokeId(),
        points: [{ x: e.clientX, y: e.clientY, pressure }],
        color,
        thickness,
        tool,
      }
    }

    function onPointerMove(e: PointerEvent) {
      if (!drawing.current || !currentStroke.current) return
      e.preventDefault()
      e.stopPropagation()
      const pressure = e.pressure > 0 ? e.pressure : 0.5
      currentStroke.current.points.push({ x: e.clientX, y: e.clientY, pressure })

      cancelAnimationFrame(rafId.current)
      rafId.current = requestAnimationFrame(() => {
        const cvs = canvasRef.current
        if (!cvs) return
        const ctx = cvs.getContext('2d')
        if (!ctx) return
        ctx.clearRect(0, 0, cvs.width, cvs.height)
        for (const s of strokes.current) renderStroke(ctx, s)
        if (currentStroke.current) renderStroke(ctx, currentStroke.current)
      })
    }

    function onPointerUp(e: PointerEvent) {
      if (!drawing.current || !currentStroke.current) return
      e.preventDefault()
      e.stopPropagation()
      try { canvasEl.releasePointerCapture(e.pointerId) } catch { /* unsupported */ }
      drawing.current = false
      if (currentStroke.current.points.length > 0) {
        strokes.current = [...strokes.current, currentStroke.current]
      }
      currentStroke.current = null
      renderAllStrokes()
      persistData()
    }

    canvasEl.addEventListener('pointerdown', onPointerDown)
    canvasEl.addEventListener('pointermove', onPointerMove)
    canvasEl.addEventListener('pointerup', onPointerUp)
    canvasEl.addEventListener('pointerleave', onPointerUp)

    return () => {
      canvasEl.removeEventListener('pointerdown', onPointerDown)
      canvasEl.removeEventListener('pointermove', onPointerMove)
      canvasEl.removeEventListener('pointerup', onPointerUp)
      canvasEl.removeEventListener('pointerleave', onPointerUp)
    }
  }, [tool, color, thickness, renderStroke, renderAllStrokes, persistData])

  const handleClear = useCallback(() => {
    strokes.current = []
    currentStroke.current = null
    const canvas = canvasRef.current
    if (canvas) {
      const ctx = canvas.getContext('2d')
      if (ctx) ctx.clearRect(0, 0, canvas.width, canvas.height)
    }
    persistData()
  }, [persistData])

  const handleExport = useCallback(() => {
    const canvas = canvasRef.current
    if (!canvas) return
    const dataUrl = canvas.toDataURL('image/png')
    const link = document.createElement('a')
    link.download = `handwriting-${Date.now()}.png`
    link.href = dataUrl
    link.click()
  }, [])

  const tools: { id: HWTool; icon: React.ReactNode; label: string }[] = [
    { id: 'pen', icon: <IPen />, label: 'Pen' },
    { id: 'highlighter', icon: <IHighlighter />, label: 'Highlighter' },
    { id: 'eraser', icon: <IEraser />, label: 'Eraser' },
  ]
  const activeLabel = tools.find(t => t.id === tool)?.label ?? 'Pen'

  return (
    <PanelShell title="Pen" subtitle="Handwrite & highlight freely" chip={activeLabel} width={290} tool="handwriting" onClose={onClose}>
      <div style={{ padding: '16px 18px 18px', display: 'flex', flexDirection: 'column', gap: 18 }}>
        {/* Tools */}
        <div>
          <SectionLabel>Tool</SectionLabel>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 9 }}>
            {tools.map(t => {
              const on = tool === t.id
              return (
                <button key={t.id} type="button"
                  onClick={() => setTool(t.id)}
                  aria-label={t.label}
                  aria-pressed={on}
                  style={{
                    display: 'inline-flex', alignItems: 'center', justifyContent: 'center', gap: 8,
                    height: 46, borderRadius: 14,
                    border: `1px solid ${on ? C.accent : C.border}`,
                    background: on ? C.accent : C.surfaceBubble,
                    color: on ? '#fff' : C.textMuted,
                    cursor: 'pointer', fontSize: 12, fontWeight: 650,
                    boxShadow: 'none',
                    transition: 'background 0.14s, border-color 0.14s, color 0.14s',
                  }}
                >{t.icon}</button>
              )
            })}
          </div>
        </div>

        {/* Stroke */}
        <div>
          <SectionLabel>Stroke weight</SectionLabel>
          <div style={{
            display: 'flex', alignItems: 'center', gap: 12, padding: '10px 14px',
            border: `1px solid ${C.border}`, borderRadius: 16, background: C.surfaceBubble, boxShadow: C.shadowSoft,
          }}>
            <button type="button" onClick={() => setThickness(v => Math.max(1, v - 1))} aria-label="Thinner" style={sliderBtn}>−</button>
            <input
              type="range" min={1} max={16} value={thickness}
              onChange={e => setThickness(Number(e.target.value))}
              aria-label="Stroke weight"
              style={{ flex: 1, accentColor: C.accent, height: 6, cursor: 'pointer' }}
            />
            <button type="button" onClick={() => setThickness(v => Math.min(16, v + 1))} aria-label="Thicker" style={sliderBtn}>+</button>
            <span style={{
              display: 'inline-flex', alignItems: 'center', justifyContent: 'center',
              minWidth: 26, height: 26, borderRadius: 8, background: C.surfaceSunken,
              fontSize: 12, fontWeight: 700, color: C.text,
            }}>{thickness}</span>
          </div>
        </div>

        {/* Colour */}
        <div>
          <SectionLabel>Colour</SectionLabel>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(5, 1fr)', gap: 11 }}>
            {COLORS.map(c => {
              const on = color === c
              return (
                <button
                  key={c} type="button"
                  onClick={() => setColor(c)}
                  aria-label={`Colour ${c}`}
                  aria-pressed={on}
                  style={{
                    height: 34, borderRadius: 12, background: c, cursor: 'pointer', padding: 0,
                    border: on ? `2.5px solid ${C.accent}` : '1px solid rgba(17,19,33,0.08)',
                    boxShadow: 'none',
                    transform: 'none',
                    transition: 'border-color 0.13s',
                  }}
                />
              )
            })}
          </div>
        </div>

        {/* Actions */}
        <div style={{ display: 'flex', gap: 9 }}>
          <button type="button" onClick={handleClear} aria-label="Clear all" style={actionBtn}>Clear all</button>
          <button type="button" onClick={handleExport} aria-label="Export PNG" style={{ ...actionBtn, background: C.accent, color: '#fff', border: 'none', boxShadow: 'none' }}>Export PNG</button>
        </div>
      </div>
    </PanelShell>
  )
}

const sliderBtn: React.CSSProperties = {
  display: 'inline-flex', alignItems: 'center', justifyContent: 'center',
  width: 30, height: 30, borderRadius: 10, flexShrink: 0,
  border: `1px solid ${C.border}`, background: C.surfaceBubble,
  cursor: 'pointer', fontSize: 16, fontWeight: 600, color: C.textMuted,
  boxShadow: C.shadowSoft,
}

const actionBtn: React.CSSProperties = {
  flex: 1, padding: '11px 0', fontSize: 12.5, fontWeight: 700,
  borderRadius: 13, cursor: 'pointer', letterSpacing: '-0.01em',
  border: `1px solid ${C.border}`, background: C.surfaceBubble,
  color: C.text, transition: 'background 0.15s, border-color 0.15s', fontFamily: 'inherit',
}
