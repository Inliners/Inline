import { useState, useRef, useEffect, useCallback } from 'react'
import { PANEL as C } from '../lib/extensionTheme'
import { PanelShell, SectionLabel, Segmented } from './panelKit'
import { ensureDrawCanvas, restoreDrawings, clearAllDrawings, setDrawHitTesting } from '../content/drawingsRestore'
import { emitSaveToast } from '../lib/saveToast'

type Tool = 'pen' | 'marker' | 'arrow' | 'rectangle' | 'ellipse' | 'eraser' | 'lasso'

const COLORS = [
  '#1C1E26', '#b42318', '#315a9f', '#0f7b6c', '#b7791f',
  '#7c3aed', '#ec4899', '#06b6d4', '#ea580c', '#78716c',
]

/* ─── Tool icons ─── */
const IPen = () => (
  <svg width="16" height="16" viewBox="0 0 16 16" fill="currentColor">
    <path d="M12.854.146a.5.5 0 0 0-.707 0L10.5 1.793 14.207 5.5l1.647-1.646a.5.5 0 0 0 0-.708l-3-3zm.646 6.061L9.793 2.5 3.293 9H3.5a.5.5 0 0 1 .5.5v.5h.5a.5.5 0 0 1 .5.5v.5h.5a.5.5 0 0 1 .5.5v.5h.5a.5.5 0 0 1 .5.5v.207l6.5-6.5z"/>
  </svg>
)
const IMarker = () => (
  <svg width="16" height="16" viewBox="0 0 16 16" fill="currentColor">
    <path d="M8.5 1a.5.5 0 0 0-1 0v5.7L5.354 4.354a.5.5 0 1 0-.708.708L7.5 7.916V11.5a.5.5 0 0 0 1 0V7.916l2.854-2.854a.5.5 0 0 0-.708-.708L8.5 6.7V1z"/>
    <path d="M3 13.5a.5.5 0 0 1 .5-.5h9a.5.5 0 0 1 0 1h-9a.5.5 0 0 1-.5-.5z"/>
  </svg>
)
const IArrow = () => (
  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <line x1="5" y1="19" x2="19" y2="5"/>
    <polyline points="12 5 19 5 19 12"/>
  </svg>
)
const IRectangle = () => (
  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <rect x="3" y="3" width="18" height="18" rx="2"/>
  </svg>
)
const IEllipse = () => (
  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <ellipse cx="12" cy="12" rx="10" ry="7"/>
  </svg>
)
const IEraser = () => (
  <svg width="16" height="16" viewBox="0 0 16 16" fill="currentColor">
    <path d="M8.086 2.207a2 2 0 0 1 2.828 0l3.879 3.879a2 2 0 0 1 0 2.828l-5.5 5.5A2 2 0 0 1 7.879 15H5.12a2 2 0 0 1-1.414-.586l-2.5-2.5a2 2 0 0 1 0-2.828l5.88-5.879zm2.121.707a1 1 0 0 0-1.414 0L4.16 7.547l5.293 5.293 4.633-4.633a1 1 0 0 0 0-1.414l-3.879-3.879zM8.746 13.547 3.453 8.254 1.914 9.793a1 1 0 0 0 0 1.414l2.5 2.5a1 1 0 0 0 .707.293H7.88a1 1 0 0 0 .707-.293l.16-.16z"/>
  </svg>
)
const ILasso = () => (
  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <path d="M7 22a5 5 0 0 1-2-4"/>
    <path d="M7 16.93c.96.43 1.96.74 2.99.91"/>
    <path d="M3.34 14A6.8 6.8 0 0 1 2 10c0-4.42 4.48-8 10-8s10 3.58 10 8-4.48 8-10 8a12 12 0 0 1-3-.38"/>
    <circle cx="7" cy="22" r="2"/>
  </svg>
)
interface DrawProps {
  onClose: () => void
}

export default function Draw({ onClose }: DrawProps) {
  const [tool, setTool] = useState<Tool>('pen')
  const [color, setColor] = useState(COLORS[0])
  const [thickness, setThickness] = useState(3)
  const [eraserMode, setEraserMode] = useState<'object' | 'pixel'>('object')
  const [confirmClear, setConfirmClear] = useState(false)
  const canvasRef = useRef<SVGSVGElement | null>(null)
  const drawing = useRef(false)
  const pathData = useRef('')
  const currentPath = useRef<SVGPathElement | null>(null)
  const startPos = useRef<{ x: number; y: number }>({ x: 0, y: 0 })
  const currentShapeEl = useRef<SVGElement | null>(null)
  const startTime = useRef(0)
  const pointsArray = useRef<{ x: number; y: number }[]>([])
  const lassoPath = useRef<SVGPathElement | null>(null)
  const selectedGroup = useRef<SVGGElement | null>(null)
  const isDraggingGroup = useRef(false)
  const dragStart = useRef<{ x: number; y: number }>({ x: 0, y: 0 })
  const groupTranslate = useRef<{ x: number; y: number }>({ x: 0, y: 0 })
  const eraserDown = useRef(false)

  /* ─── Reuse the shared SVG canvas owned by the content script ───
   *
   * The canvas is created once at content-script init (drawingsRestore.ts)
   * so saved shapes are visible on every page load, independent of whether
   * this panel has ever been mounted. We only *activate* pointer events
   * while the panel is open and *deactivate* them on close — we never
   * remove the element, because that would wipe the user's drawings.
   */
  useEffect(() => {
    canvasRef.current = ensureDrawCanvas()
    // If the user opened the panel before the async restore finished (or
    // navigated between pages in a SPA), pull saved shapes again. It's a
    // cheap idempotent call.
    restoreDrawings()
  }, [])

  const activateCanvas = useCallback(() => {
    if (!canvasRef.current) return
    canvasRef.current.style.pointerEvents = 'all'
    setDrawHitTesting(true)
    canvasRef.current.style.cursor = tool === 'eraser' ? 'cell' : tool === 'lasso' ? 'crosshair' : 'crosshair'
  }, [tool])

  const deactivateCanvas = useCallback(() => {
    if (!canvasRef.current) return
    setDrawHitTesting(false)
    canvasRef.current.style.pointerEvents = 'none'
    canvasRef.current.style.cursor = ''
  }, [])

  useEffect(() => { activateCanvas(); return deactivateCanvas }, [activateCanvas, deactivateCanvas, tool])

  /* ─── Drawing handlers ─── */
  useEffect(() => {
    if (!canvasRef.current) return
    const svgEl: SVGSVGElement = canvasRef.current

    function deselectGroup() {
      if (!selectedGroup.current || !svgEl) return
      const g = selectedGroup.current
      const border = g.querySelector('.inline-lasso-border')
      if (border) border.remove()
      while (g.firstChild) svgEl.insertBefore(g.firstChild, g)
      g.remove()
      selectedGroup.current = null
    }

    function ptToLineDist(px: number, py: number, x1: number, y1: number, x2: number, y2: number) {
      const A = px - x1, B = py - y1, C = x2 - x1, D = y2 - y1
      const lenSq = C * C + D * D
      if (lenSq === 0) return Math.hypot(A, B)
      const t = Math.max(0, Math.min(1, (A * C + B * D) / lenSq))
      return Math.hypot(px - (x1 + t * C), py - (y1 + t * D))
    }

    function recognizeShape(pts: { x: number; y: number }[], elapsed: number) {
      if (pts.length < 2 || pts.length > 50 || elapsed < 300) return null
      const xs = pts.map(p => p.x), ys = pts.map(p => p.y)
      const minX = Math.min(...xs), maxX = Math.max(...xs)
      const minY = Math.min(...ys), maxY = Math.max(...ys)
      const bw = maxX - minX, bh = maxY - minY
      const first = pts[0], last = pts[pts.length - 1]
      const closedDist = Math.hypot(last.x - first.x, last.y - first.y)
      const isClosed = closedDist < Math.max(bw, bh) * 0.3

      const lineLen = Math.hypot(last.x - first.x, last.y - first.y)
      if (lineLen > 20) {
        const maxDist = Math.max(...pts.map(p => ptToLineDist(p.x, p.y, first.x, first.y, last.x, last.y)))
        if (maxDist < 15) return { type: 'line' as const, x1: first.x, y1: first.y, x2: last.x, y2: last.y }
      }

      if (!isClosed || bw < 15 || bh < 15) return null

      const edgeThresh = Math.max(bw, bh) * 0.2
      const nearEdge = pts.filter(p => {
        const dL = Math.abs(p.x - minX), dR = Math.abs(p.x - maxX)
        const dT = Math.abs(p.y - minY), dB = Math.abs(p.y - maxY)
        return Math.min(dL, dR) < edgeThresh || Math.min(dT, dB) < edgeThresh
      })
      if (nearEdge.length > pts.length * 0.7) {
        const aspect = bw / bh
        if (aspect > 0.3 && aspect < 3.5) {
          return { type: 'rect' as const, x: minX, y: minY, width: bw, height: bh }
        }
      }

      const cx = (minX + maxX) / 2, cy = (minY + maxY) / 2
      const rx = bw / 2, ry = bh / 2
      if (rx > 5 && ry > 5) {
        const nDists = pts.map(p => {
          const nx = (p.x - cx) / rx, ny = (p.y - cy) / ry
          return Math.sqrt(nx * nx + ny * ny)
        })
        const avg = nDists.reduce((a, b) => a + b, 0) / nDists.length
        const maxDev = Math.max(...nDists.map(d => Math.abs(d - avg)))
        if (maxDev < 0.4) return { type: 'ellipse' as const, cx, cy, rx, ry }
      }

      return null
    }

    function pixelErase(ex: number, ey: number) {
      const radius = Math.max(8, thickness * 2)
      const els = svgEl.querySelectorAll('[data-inline-draw]')
      els.forEach(el => {
        const tag = el.tagName.toLowerCase()
        if (tag === 'path') {
          const d = el.getAttribute('d') ?? ''
          const segments = d.match(/[ML][^ML]*/g)
          if (!segments) return
          const kept: string[][] = [[]]
          let prevInside = false
          for (const seg of segments) {
            const nums = seg.trim().substring(1).trim().split(/[\s,]+/).map(Number)
            if (nums.length < 2) continue
            const px = nums[0], py = nums[1]
            const inside = Math.hypot(px - ex, py - ey) < radius
            if (inside) {
              if (!prevInside && kept[kept.length - 1].length > 0) kept.push([])
              prevInside = true
            } else {
              const cmd = seg.trim()[0]
              if (prevInside || kept[kept.length - 1].length === 0) {
                kept[kept.length - 1].push(`M${px} ${py}`)
              } else {
                kept[kept.length - 1].push(`${cmd}${px} ${py}`)
              }
              prevInside = false
            }
          }
          const newPaths = kept.filter(k => k.length > 1)
          if (newPaths.length === 0) {
            el.remove()
          } else if (newPaths.length === 1) {
            el.setAttribute('d', newPaths[0].join(' '))
          } else {
            const stroke = el.getAttribute('stroke') ?? ''
            const sw = el.getAttribute('stroke-width') ?? ''
            const opacity = el.getAttribute('opacity')
            const fill = el.getAttribute('fill') ?? 'none'
            el.remove()
            for (const segs of newPaths) {
              const p = document.createElementNS('http://www.w3.org/2000/svg', 'path')
              p.setAttribute('d', segs.join(' '))
              p.setAttribute('stroke', stroke)
              p.setAttribute('stroke-width', sw)
              p.setAttribute('fill', fill)
              p.setAttribute('stroke-linecap', 'round')
              p.setAttribute('stroke-linejoin', 'round')
              if (opacity) p.setAttribute('opacity', opacity)
              p.setAttribute('data-inline-draw', 'true')
              svgEl.appendChild(p)
            }
          }
        } else {
          try {
            const bbox = (el as SVGGraphicsElement).getBBox?.()
            if (bbox) {
              const cx = bbox.x + bbox.width / 2, cy = bbox.y + bbox.height / 2
              if (Math.hypot(cx - ex, cy - ey) < radius + Math.max(bbox.width, bbox.height) / 2) {
                el.remove()
              }
            }
          } catch { /* ignore */ }
        }
      })
    }

    function start(e: PointerEvent) {
      e.preventDefault()
      e.stopPropagation()
      // If the user made a lasso selection and then switched to the eraser,
      // treat the first eraser click as "delete the whole selection". This
      // is the natural way to wipe a batch of drawings AND any text/content
      // the user looped with the lasso (matches the user's mental model of
      // "lasso → eraser → gone").
      if (tool === 'eraser' && selectedGroup.current) {
        selectedGroup.current.remove()
        selectedGroup.current = null
        persistDrawData()
        return
      }

      if (selectedGroup.current && tool !== 'lasso') deselectGroup()

      if (tool === 'eraser' && eraserMode === 'pixel') {
        eraserDown.current = true
        return
      }
      if (tool === 'eraser') return

      if (tool === 'lasso' && selectedGroup.current) {
        const target = document.elementFromPoint(e.clientX, e.clientY)
        if (selectedGroup.current.contains(target as Node)) {
          isDraggingGroup.current = true
          dragStart.current = { x: e.clientX, y: e.clientY }
          const existing = selectedGroup.current.getAttribute('transform')
          const match = existing?.match(/translate\(([-\d.]+)[, ]+([-\d.]+)\)/)
          groupTranslate.current = match
            ? { x: parseFloat(match[1]), y: parseFloat(match[2]) }
            : { x: 0, y: 0 }
          return
        }
        deselectGroup()
      }

      drawing.current = true
      startPos.current = { x: e.clientX, y: e.clientY }
      startTime.current = Date.now()
      pointsArray.current = [{ x: e.clientX, y: e.clientY }]

      if (tool === 'lasso') {
        pathData.current = `M${e.clientX} ${e.clientY}`
        const path = document.createElementNS('http://www.w3.org/2000/svg', 'path')
        path.setAttribute('d', pathData.current)
        path.setAttribute('stroke', '#315a9f')
        path.setAttribute('stroke-width', '1.5')
        path.setAttribute('fill', 'none')
        path.setAttribute('stroke-dasharray', '6 3')
        path.setAttribute('opacity', '0.7')
        svgEl.appendChild(path)
        lassoPath.current = path
      } else if (tool === 'pen' || tool === 'marker') {
        pathData.current = `M${e.clientX} ${e.clientY}`
        const path = document.createElementNS('http://www.w3.org/2000/svg', 'path')
        path.setAttribute('d', pathData.current)
        path.setAttribute('stroke', color)
        path.setAttribute('stroke-width', String(tool === 'marker' ? thickness * 3 : thickness))
        path.setAttribute('fill', 'none')
        path.setAttribute('stroke-linecap', 'round')
        path.setAttribute('stroke-linejoin', 'round')
        if (tool === 'marker') path.setAttribute('opacity', '0.4')
        path.setAttribute('data-inline-draw', 'true')
        svgEl.appendChild(path)
        currentPath.current = path
      } else if (tool === 'arrow') {
        const g = document.createElementNS('http://www.w3.org/2000/svg', 'g')
        g.setAttribute('data-inline-draw', 'true')
        const line = document.createElementNS('http://www.w3.org/2000/svg', 'line')
        line.setAttribute('x1', String(e.clientX))
        line.setAttribute('y1', String(e.clientY))
        line.setAttribute('x2', String(e.clientX))
        line.setAttribute('y2', String(e.clientY))
        line.setAttribute('stroke', color)
        line.setAttribute('stroke-width', String(thickness))
        line.setAttribute('stroke-linecap', 'round')
        const head = document.createElementNS('http://www.w3.org/2000/svg', 'polygon')
        head.setAttribute('fill', color)
        head.setAttribute('points', '0,0 0,0 0,0')
        g.appendChild(line)
        g.appendChild(head)
        svgEl.appendChild(g)
        currentShapeEl.current = g
      } else if (tool === 'rectangle') {
        const rect = document.createElementNS('http://www.w3.org/2000/svg', 'rect')
        rect.setAttribute('x', String(e.clientX))
        rect.setAttribute('y', String(e.clientY))
        rect.setAttribute('width', '0')
        rect.setAttribute('height', '0')
        rect.setAttribute('stroke', color)
        rect.setAttribute('stroke-width', String(thickness))
        rect.setAttribute('fill', 'none')
        rect.setAttribute('rx', '2')
        rect.setAttribute('data-inline-draw', 'true')
        svgEl.appendChild(rect)
        currentShapeEl.current = rect
      } else if (tool === 'ellipse') {
        const ellipse = document.createElementNS('http://www.w3.org/2000/svg', 'ellipse')
        ellipse.setAttribute('cx', String(e.clientX))
        ellipse.setAttribute('cy', String(e.clientY))
        ellipse.setAttribute('rx', '0')
        ellipse.setAttribute('ry', '0')
        ellipse.setAttribute('stroke', color)
        ellipse.setAttribute('stroke-width', String(thickness))
        ellipse.setAttribute('fill', 'none')
        ellipse.setAttribute('data-inline-draw', 'true')
        svgEl.appendChild(ellipse)
        currentShapeEl.current = ellipse
      }
    }

    function move(e: PointerEvent) {
      e.preventDefault()
      e.stopPropagation()
      if (tool === 'eraser' && eraserMode === 'pixel' && eraserDown.current) {
        pixelErase(e.clientX, e.clientY)
        return
      }

      if (isDraggingGroup.current && selectedGroup.current) {
        const dx = e.clientX - dragStart.current.x + groupTranslate.current.x
        const dy = e.clientY - dragStart.current.y + groupTranslate.current.y
        selectedGroup.current.setAttribute('transform', `translate(${dx}, ${dy})`)
        return
      }

      if (!drawing.current) return

      if (tool === 'lasso' && lassoPath.current) {
        pathData.current += ` L${e.clientX} ${e.clientY}`
        lassoPath.current.setAttribute('d', pathData.current)
        pointsArray.current.push({ x: e.clientX, y: e.clientY })
      } else if ((tool === 'pen' || tool === 'marker') && currentPath.current) {
        pathData.current += ` L${e.clientX} ${e.clientY}`
        currentPath.current.setAttribute('d', pathData.current)
        pointsArray.current.push({ x: e.clientX, y: e.clientY })
      } else if (tool === 'arrow' && currentShapeEl.current) {
        const g = currentShapeEl.current
        const line = g.querySelector('line')
        const head = g.querySelector('polygon')
        if (line && head) {
          line.setAttribute('x2', String(e.clientX))
          line.setAttribute('y2', String(e.clientY))
          const sx = startPos.current.x, sy = startPos.current.y
          const ex = e.clientX, ey = e.clientY
          const angle = Math.atan2(ey - sy, ex - sx)
          const headLen = Math.max(10, thickness * 4)
          const p1x = ex - headLen * Math.cos(angle - Math.PI / 6)
          const p1y = ey - headLen * Math.sin(angle - Math.PI / 6)
          const p2x = ex - headLen * Math.cos(angle + Math.PI / 6)
          const p2y = ey - headLen * Math.sin(angle + Math.PI / 6)
          head.setAttribute('points', `${ex},${ey} ${p1x},${p1y} ${p2x},${p2y}`)
        }
      } else if (tool === 'rectangle' && currentShapeEl.current) {
        const rect = currentShapeEl.current as SVGRectElement
        const sx = startPos.current.x, sy = startPos.current.y
        const x = Math.min(sx, e.clientX)
        const y = Math.min(sy, e.clientY)
        const w = Math.abs(e.clientX - sx)
        const h = Math.abs(e.clientY - sy)
        rect.setAttribute('x', String(x))
        rect.setAttribute('y', String(y))
        rect.setAttribute('width', String(w))
        rect.setAttribute('height', String(h))
      } else if (tool === 'ellipse' && currentShapeEl.current) {
        const ellipse = currentShapeEl.current as SVGEllipseElement
        const sx = startPos.current.x, sy = startPos.current.y
        const cx = (sx + e.clientX) / 2
        const cy = (sy + e.clientY) / 2
        const rx = Math.abs(e.clientX - sx) / 2
        const ry = Math.abs(e.clientY - sy) / 2
        ellipse.setAttribute('cx', String(cx))
        ellipse.setAttribute('cy', String(cy))
        ellipse.setAttribute('rx', String(rx))
        ellipse.setAttribute('ry', String(ry))
      }
    }

    function ensureInlineId(el: Element): string {
      let id = el.getAttribute('data-inline-id')
      if (!id) {
        id = `dp-${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 8)}`
        el.setAttribute('data-inline-id', id)
      }
      return id
    }

    function serializeDrawElements(): Record<string, unknown>[] {
      if (!svgEl) return []
      const els = svgEl.querySelectorAll('[data-inline-draw]')
      const result: Record<string, unknown>[] = []
      els.forEach((el) => {
        const tag = el.tagName.toLowerCase()
        const id = ensureInlineId(el)
        if (tag === 'path') {
          result.push({
            id,
            type: 'path',
            d: el.getAttribute('d') ?? '',
            stroke: el.getAttribute('stroke') ?? '',
            strokeWidth: el.getAttribute('stroke-width') ?? '',
            opacity: el.getAttribute('opacity') ?? undefined,
            fill: el.getAttribute('fill') ?? 'none',
          })
        } else if (tag === 'rect') {
          result.push({
            id,
            type: 'rect',
            x: el.getAttribute('x') ?? '0',
            y: el.getAttribute('y') ?? '0',
            width: el.getAttribute('width') ?? '0',
            height: el.getAttribute('height') ?? '0',
            stroke: el.getAttribute('stroke') ?? '',
            strokeWidth: el.getAttribute('stroke-width') ?? '',
          })
        } else if (tag === 'ellipse') {
          result.push({
            id,
            type: 'ellipse',
            cx: el.getAttribute('cx') ?? '0',
            cy: el.getAttribute('cy') ?? '0',
            rx: el.getAttribute('rx') ?? '0',
            ry: el.getAttribute('ry') ?? '0',
            stroke: el.getAttribute('stroke') ?? '',
            strokeWidth: el.getAttribute('stroke-width') ?? '',
          })
        } else if (tag === 'line') {
          result.push({
            id,
            type: 'line',
            x1: el.getAttribute('x1') ?? '0',
            y1: el.getAttribute('y1') ?? '0',
            x2: el.getAttribute('x2') ?? '0',
            y2: el.getAttribute('y2') ?? '0',
            stroke: el.getAttribute('stroke') ?? '',
            strokeWidth: el.getAttribute('stroke-width') ?? '',
          })
        } else if (tag === 'g' && !el.classList.contains('inline-lasso-group')) {
          const line = el.querySelector('line')
          const polygon = el.querySelector('polygon')
          if (line && polygon) {
            result.push({
              id,
              type: 'arrow',
              x1: line.getAttribute('x1') ?? '0',
              y1: line.getAttribute('y1') ?? '0',
              x2: line.getAttribute('x2') ?? '0',
              y2: line.getAttribute('y2') ?? '0',
              stroke: line.getAttribute('stroke') ?? '',
              strokeWidth: line.getAttribute('stroke-width') ?? '',
              points: polygon.getAttribute('points') ?? '',
              fill: polygon.getAttribute('fill') ?? '',
            })
          }
        }
      })
      return result
    }

    function persistDrawData() {
      const serialized = serializeDrawElements()
      try {
        if (!chrome.runtime?.id) return
        chrome.runtime.sendMessage(
          {
            type: 'SAVE_ANNOTATIONS',
            payload: {
              pageUrl: window.location.href,
              featureKey: 'drawPaths',
              data: serialized,
              pageTitle: document.title,
              domain: window.location.hostname,
              clearedAt: serialized.length === 0 ? Date.now() : null,
            },
          },
          (response) => {
            if (chrome.runtime.lastError) return
            emitSaveToast(response)
          },
        )
      } catch { /* extension context unavailable */ }
    }

    function end() {
      // Pointer-up may happen while the transparent SVG hit layer is active;
      // keep it inside the drawing mode instead of leaking to the host page.
      if (tool === 'eraser' && eraserMode === 'pixel') {
        eraserDown.current = false
        persistDrawData()
        return
      }

      if (isDraggingGroup.current) {
        isDraggingGroup.current = false
        const t = selectedGroup.current?.getAttribute('transform')
        const match = t?.match(/translate\(([-\d.]+)[, ]+([-\d.]+)\)/)
        if (match) groupTranslate.current = { x: parseFloat(match[1]), y: parseFloat(match[2]) }
        return
      }

      if (tool === 'lasso' && drawing.current && lassoPath.current) {
        drawing.current = false
        const pts = pointsArray.current
        if (pts.length > 2) {
          const lxs = pts.map(p => p.x), lys = pts.map(p => p.y)
          const lMinX = Math.min(...lxs), lMaxX = Math.max(...lxs)
          const lMinY = Math.min(...lys), lMaxY = Math.max(...lys)
          const drawEls = svgEl.querySelectorAll('[data-inline-draw]')
          const selected: SVGElement[] = []
          drawEls.forEach(el => {
            if (el === lassoPath.current) return
            if (el.classList.contains('inline-lasso-group')) return
            try {
              const bbox = (el as SVGGraphicsElement).getBBox()
              const cx = bbox.x + bbox.width / 2, cy = bbox.y + bbox.height / 2
              if (cx >= lMinX && cx <= lMaxX && cy >= lMinY && cy <= lMaxY) {
                selected.push(el as SVGElement)
              }
            } catch { /* ignore */ }
          })

          lassoPath.current.remove()
          lassoPath.current = null

          if (selected.length > 0) {
            const g = document.createElementNS('http://www.w3.org/2000/svg', 'g')
            g.classList.add('inline-lasso-group')
            g.setAttribute('data-inline-draw', 'true')
            svgEl.appendChild(g)
            let gMinX = Infinity, gMinY = Infinity, gMaxX = -Infinity, gMaxY = -Infinity
            for (const el of selected) {
              try {
                const bbox = (el as SVGGraphicsElement).getBBox()
                gMinX = Math.min(gMinX, bbox.x)
                gMinY = Math.min(gMinY, bbox.y)
                gMaxX = Math.max(gMaxX, bbox.x + bbox.width)
                gMaxY = Math.max(gMaxY, bbox.y + bbox.height)
              } catch { /* ignore */ }
              g.appendChild(el)
            }
            const border = document.createElementNS('http://www.w3.org/2000/svg', 'rect')
            border.classList.add('inline-lasso-border')
            border.setAttribute('x', String(gMinX - 4))
            border.setAttribute('y', String(gMinY - 4))
            border.setAttribute('width', String(gMaxX - gMinX + 8))
            border.setAttribute('height', String(gMaxY - gMinY + 8))
            border.setAttribute('stroke', '#315a9f')
            border.setAttribute('stroke-width', '1.5')
            border.setAttribute('stroke-dasharray', '5 3')
            border.setAttribute('fill', 'none')
            border.setAttribute('rx', '3')
            g.insertBefore(border, g.firstChild)
            selectedGroup.current = g
            groupTranslate.current = { x: 0, y: 0 }
          }
        } else {
          lassoPath.current.remove()
          lassoPath.current = null
        }
        pointsArray.current = []
        return
      }

      if (tool === 'pen' && drawing.current && currentPath.current) {
        const pts = pointsArray.current
        const elapsed = Date.now() - startTime.current
        const shape = recognizeShape(pts, elapsed)
        if (shape) {
          const oldPath = currentPath.current
          const stroke = oldPath.getAttribute('stroke') ?? color
          const sw = oldPath.getAttribute('stroke-width') ?? String(thickness)
          oldPath.remove()
          if (shape.type === 'line') {
            const ln = document.createElementNS('http://www.w3.org/2000/svg', 'line')
            ln.setAttribute('x1', String(shape.x1))
            ln.setAttribute('y1', String(shape.y1))
            ln.setAttribute('x2', String(shape.x2))
            ln.setAttribute('y2', String(shape.y2))
            ln.setAttribute('stroke', stroke)
            ln.setAttribute('stroke-width', sw)
            ln.setAttribute('stroke-linecap', 'round')
            ln.setAttribute('data-inline-draw', 'true')
            svgEl.appendChild(ln)
          } else if (shape.type === 'rect') {
            const rc = document.createElementNS('http://www.w3.org/2000/svg', 'rect')
            rc.setAttribute('x', String(shape.x))
            rc.setAttribute('y', String(shape.y))
            rc.setAttribute('width', String(shape.width))
            rc.setAttribute('height', String(shape.height))
            rc.setAttribute('stroke', stroke)
            rc.setAttribute('stroke-width', sw)
            rc.setAttribute('fill', 'none')
            rc.setAttribute('rx', '2')
            rc.setAttribute('data-inline-draw', 'true')
            svgEl.appendChild(rc)
          } else if (shape.type === 'ellipse') {
            const el = document.createElementNS('http://www.w3.org/2000/svg', 'ellipse')
            el.setAttribute('cx', String(shape.cx))
            el.setAttribute('cy', String(shape.cy))
            el.setAttribute('rx', String(shape.rx))
            el.setAttribute('ry', String(shape.ry))
            el.setAttribute('stroke', stroke)
            el.setAttribute('stroke-width', sw)
            el.setAttribute('fill', 'none')
            el.setAttribute('data-inline-draw', 'true')
            svgEl.appendChild(el)
          }
        }
      }

      drawing.current = false
      currentPath.current = null
      currentShapeEl.current = null
      pointsArray.current = []
      persistDrawData()
    }

    function erase(e: PointerEvent) {
      if (tool !== 'eraser' || eraserMode !== 'object') return
      e.preventDefault()
      e.stopPropagation()
      const el = document.elementFromPoint(e.clientX, e.clientY)
      if (el && el.hasAttribute('data-inline-draw')) el.remove()
      if (el?.parentElement && el.parentElement.hasAttribute('data-inline-draw')) el.parentElement.remove()
      persistDrawData()
    }

    function onKeyDown(e: KeyboardEvent) {
      if ((e.key === 'Delete' || e.key === 'Backspace') && selectedGroup.current) {
        selectedGroup.current.remove()
        selectedGroup.current = null
        persistDrawData()
      }
    }

    svgEl.addEventListener('pointerdown', start)
    svgEl.addEventListener('pointermove', move)
    svgEl.addEventListener('pointerup', end)
    svgEl.addEventListener('click', erase)
    document.addEventListener('keydown', onKeyDown)
    return () => {
      svgEl.removeEventListener('pointerdown', start)
      svgEl.removeEventListener('pointermove', move)
      svgEl.removeEventListener('pointerup', end)
      svgEl.removeEventListener('click', erase)
      document.removeEventListener('keydown', onKeyDown)
    }
  }, [tool, color, thickness, eraserMode])

  const tools: { id: Tool; icon: React.ReactNode; label: string }[] = [
    { id: 'pen', icon: <IPen />, label: 'Pen' },
    { id: 'marker', icon: <IMarker />, label: 'Marker' },
    { id: 'arrow', icon: <IArrow />, label: 'Arrow' },
    { id: 'rectangle', icon: <IRectangle />, label: 'Rectangle' },
    { id: 'ellipse', icon: <IEllipse />, label: 'Ellipse' },
    { id: 'eraser', icon: <IEraser />, label: 'Eraser' },
    { id: 'lasso', icon: <ILasso />, label: 'Lasso' },
  ]
  const activeLabel = tools.find(t => t.id === tool)?.label ?? 'Pen'

  return (
    <PanelShell title="Draw" subtitle="Annotate directly on the page" chip={activeLabel} width={290} tool="draw" onClose={onClose}>
      <div style={{ padding: '16px 18px 18px', display: 'flex', flexDirection: 'column', gap: 18 }}>
        {/* Tools */}
        <div>
          <SectionLabel>Tools</SectionLabel>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 9 }}>
            {tools.map(t => {
              const on = tool === t.id
              return (
                <button key={t.id} type="button"
                  onClick={() => setTool(t.id)}
                  aria-label={t.label}
                  aria-pressed={on}
                  style={{
                    display: 'inline-flex', alignItems: 'center', justifyContent: 'center',
                    height: 46, borderRadius: 14,
                    border: `1px solid ${on ? C.accent : C.border}`,
                    background: on ? C.accent : C.surfaceBubble,
                    color: on ? '#fff' : C.textMuted,
                    cursor: 'pointer',
                    boxShadow: 'none',
                    transition: 'background 0.14s, border-color 0.14s, color 0.14s',
                  }}
                >{t.icon}</button>
              )
            })}
          </div>
          {/* Eraser sub-mode */}
          {tool === 'eraser' && (
            <div style={{ marginTop: 10 }}>
              <Segmented
                options={[{ value: 'object', label: 'Object' }, { value: 'pixel', label: 'Pixel' }]}
                value={eraserMode}
                onChange={setEraserMode}
              />
            </div>
          )}
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
              type="range" min={1} max={12} value={thickness}
              onChange={e => setThickness(Number(e.target.value))}
              aria-label="Stroke weight"
              style={{ flex: 1, accentColor: C.accent, height: 6, cursor: 'pointer' }}
            />
            <button type="button" onClick={() => setThickness(v => Math.min(12, v + 1))} aria-label="Thicker" style={sliderBtn}>+</button>
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

        {/* Clear all */}
        {!confirmClear ? (
          <button
            type="button"
            onClick={() => setConfirmClear(true)}
            aria-label="Clear all drawings on this page"
            style={{
              padding: '11px 0', fontSize: 12.5, fontWeight: 700,
              borderRadius: 14, cursor: 'pointer', width: '100%',
              border: `1px solid rgba(220,38,38,0.28)`,
              background: '#FEF2F2', color: '#DC2626',
              transition: 'background 0.15s', letterSpacing: '-0.01em', fontFamily: 'inherit',
            }}
          >Clear all drawings</button>
        ) : (
          <div role="alertdialog" aria-label="Clear all drawings?" style={{
            background: C.surfaceBubble, border: `1px solid rgba(220,38,38,0.22)`,
            borderRadius: 16, padding: 14, boxShadow: C.shadowCard,
          }}>
            <p style={{ margin: '0 0 3px', fontSize: 13, fontWeight: 700, color: C.text }}>Clear all drawings?</p>
            <p style={{ margin: '0 0 12px', fontSize: 11.5, lineHeight: 1.5, color: C.textMuted }}>
              This removes every drawing on this page and can&apos;t be undone.
            </p>
            <div style={{ display: 'flex', gap: 8, justifyContent: 'flex-end' }}>
              <button type="button" onClick={() => setConfirmClear(false)} style={{
                padding: '8px 14px', fontSize: 12, fontWeight: 600, borderRadius: C.radiusPill, cursor: 'pointer',
                border: `1px solid ${C.border}`, background: C.surfaceBubble, color: C.text,
              }}>Cancel</button>
              <button type="button" onClick={() => { clearAllDrawings(); setConfirmClear(false) }} style={{
                padding: '8px 16px', fontSize: 12, fontWeight: 700, borderRadius: C.radiusPill, cursor: 'pointer',
                border: 'none', background: '#DC2626', color: '#fff',
              }}>Clear all</button>
            </div>
          </div>
        )}
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
