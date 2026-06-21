/**
 * Handwriting persistence — runs at content-script mount.
 *
 * Mirrors `drawingsRestore.ts` but for the pressure-sensitive canvas
 * strokes owned by Handwriting.tsx. Before this module, strokes were
 * only re-rendered when the Handwriting panel was re-opened AND the
 * panel's own useEffect re-created the canvas on every open/close —
 * meaning a plain page reload left strokes invisible.
 *
 * Now we create (or reuse) a single `#inline-handwriting-canvas` element
 * at page load and redraw every saved stroke onto it.
 */

type HWTool = 'pen' | 'highlighter' | 'eraser'

interface SavedPoint { x: number; y: number; pressure: number }
interface SavedStroke {
  id?: string
  points: SavedPoint[]
  color: string
  thickness: number
  tool: HWTool
}

const CANVAS_ID = 'inline-handwriting-canvas'

/** Create the fixed-position canvas if it doesn't already exist. */
export function ensureHandwritingCanvas(): HTMLCanvasElement {
  const existing = document.getElementById(CANVAS_ID) as HTMLCanvasElement | null
  if (existing) return existing
  const canvas = document.createElement('canvas')
  canvas.id = CANVAS_ID
  canvas.width = window.innerWidth
  canvas.height = window.innerHeight
  canvas.style.cssText =
    'position:fixed;top:0;left:0;width:100vw;height:100vh;z-index:2147483639;pointer-events:none;touch-action:none;'
  document.body.appendChild(canvas)

  window.addEventListener('resize', () => {
    canvas.width = window.innerWidth
    canvas.height = window.innerHeight
    // Re-render whatever is currently stored on the element.
    const saved = (canvas as unknown as { __inlineStrokes?: SavedStroke[] }).__inlineStrokes
    if (Array.isArray(saved)) renderAllStrokes(canvas, saved)
  })

  return canvas
}

function renderStroke(ctx: CanvasRenderingContext2D, stroke: SavedStroke): void {
  const pts = stroke.points
  if (!Array.isArray(pts) || pts.length === 0) return

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
}

function renderAllStrokes(canvas: HTMLCanvasElement, strokes: SavedStroke[]): void {
  const ctx = canvas.getContext('2d')
  if (!ctx) return
  ctx.clearRect(0, 0, canvas.width, canvas.height)
  for (const s of strokes) renderStroke(ctx, s)
}

/**
 * Fetch saved strokes from the backend (via the service worker) and
 * draw them onto the shared handwriting canvas. No-op if nothing is
 * saved for this page.
 */
export function restoreHandwriting(): void {
  try {
    if (!chrome.runtime?.id) return
    const canvas = ensureHandwritingCanvas()
    chrome.runtime.sendMessage(
      { type: 'LOAD_ANNOTATIONS', payload: { pageUrl: window.location.href } },
      (response) => {
        if (chrome.runtime.lastError || !response?.ok) return
        const saved = response.data?.elements?.handwriting as SavedStroke[] | undefined
        if (!Array.isArray(saved) || saved.length === 0) return
        // Stash on the element so the resize handler can re-render without
        // a round-trip to storage.
        ;(canvas as unknown as { __inlineStrokes?: SavedStroke[] }).__inlineStrokes = saved
        renderAllStrokes(canvas, saved)
      },
    )
  } catch {
    /* extension context unavailable */
  }
}
