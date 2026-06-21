/**
 * Drawing persistence — runs at content-script mount.
 *
 * Before this module existed, drawings were only restored when the user
 * reopened the Draw panel (Draw.tsx loaded them in its own useEffect).
 * That meant a page reload left the SVG canvas empty until the user
 * manually reopened the panel. We now create the canvas and redraw
 * every saved shape as part of content-script init, so drawings feel
 * permanent from the user's perspective.
 *
 * Draw.tsx still writes the *same* feature key (`drawPaths`) on every
 * stroke; this module just ensures the canvas + shapes exist on every
 * page load, independent of whether the panel has ever been opened.
 */

const SVG_NS = 'http://www.w3.org/2000/svg'
const CANVAS_ID = 'inline-draw-canvas'
const HIT_ID = 'inline-draw-hit-area'

type SavedShape = Record<string, unknown>

/** Create the fixed-position SVG canvas if it doesn't already exist. */
export function ensureDrawCanvas(): SVGSVGElement {
  const existing = document.getElementById(CANVAS_ID)
  if (existing) {
    const svg = existing as unknown as SVGSVGElement
    ensureHitArea(svg)
    return svg
  }
  const svg = document.createElementNS(SVG_NS, 'svg')
  svg.id = CANVAS_ID
  svg.style.cssText =
    'position:fixed;top:0;left:0;width:100vw;height:100vh;z-index:2147483640;pointer-events:none;touch-action:none;'
  svg.setAttribute('width', String(window.innerWidth))
  svg.setAttribute('height', String(window.innerHeight))
  svg.setAttribute('viewBox', `0 0 ${window.innerWidth} ${window.innerHeight}`)
  ensureHitArea(svg)
  document.body.appendChild(svg)
  window.addEventListener('resize', () => {
    svg.setAttribute('width', String(window.innerWidth))
    svg.setAttribute('height', String(window.innerHeight))
    svg.setAttribute('viewBox', `0 0 ${window.innerWidth} ${window.innerHeight}`)
  })
  return svg
}

function ensureHitArea(svg: SVGSVGElement): void {
  svg.setAttribute('width', String(window.innerWidth))
  svg.setAttribute('height', String(window.innerHeight))
  svg.setAttribute('viewBox', `0 0 ${window.innerWidth} ${window.innerHeight}`)
  if (svg.querySelector(`#${HIT_ID}`)) return
  const hit = document.createElementNS(SVG_NS, 'rect')
  hit.id = HIT_ID
  hit.setAttribute('x', '0')
  hit.setAttribute('y', '0')
  hit.setAttribute('width', '100%')
  hit.setAttribute('height', '100%')
  hit.setAttribute('fill', 'transparent')
  hit.setAttribute('pointer-events', 'none')
  svg.insertBefore(hit, svg.firstChild)
}

export function setDrawHitTesting(enabled: boolean): void {
  const svg = document.getElementById(CANVAS_ID) as unknown as SVGSVGElement | null
  if (!svg) return
  ensureHitArea(svg)
  const hit = svg.querySelector<SVGRectElement>(`#${HIT_ID}`)
  if (hit) hit.setAttribute('pointer-events', enabled ? 'all' : 'none')
}

function setId(el: Element, item: SavedShape) {
  if (typeof item.id === 'string' && item.id) el.setAttribute('data-inline-id', item.id)
}

function renderShape(svg: SVGSVGElement, item: SavedShape): void {
  if (item.type === 'path') {
    const path = document.createElementNS(SVG_NS, 'path')
    path.setAttribute('d', String(item.d))
    path.setAttribute('stroke', String(item.stroke))
    path.setAttribute('stroke-width', String(item.strokeWidth))
    path.setAttribute('fill', String(item.fill ?? 'none'))
    path.setAttribute('stroke-linecap', 'round')
    path.setAttribute('stroke-linejoin', 'round')
    if (item.opacity) path.setAttribute('opacity', String(item.opacity))
    path.setAttribute('data-inline-draw', 'true')
    setId(path, item)
    svg.appendChild(path)
  } else if (item.type === 'rect') {
    const rect = document.createElementNS(SVG_NS, 'rect')
    rect.setAttribute('x', String(item.x))
    rect.setAttribute('y', String(item.y))
    rect.setAttribute('width', String(item.width))
    rect.setAttribute('height', String(item.height))
    rect.setAttribute('stroke', String(item.stroke))
    rect.setAttribute('stroke-width', String(item.strokeWidth))
    rect.setAttribute('fill', 'none')
    rect.setAttribute('rx', '2')
    rect.setAttribute('data-inline-draw', 'true')
    setId(rect, item)
    svg.appendChild(rect)
  } else if (item.type === 'ellipse') {
    const ellipse = document.createElementNS(SVG_NS, 'ellipse')
    ellipse.setAttribute('cx', String(item.cx))
    ellipse.setAttribute('cy', String(item.cy))
    ellipse.setAttribute('rx', String(item.rx))
    ellipse.setAttribute('ry', String(item.ry))
    ellipse.setAttribute('stroke', String(item.stroke))
    ellipse.setAttribute('stroke-width', String(item.strokeWidth))
    ellipse.setAttribute('fill', 'none')
    ellipse.setAttribute('data-inline-draw', 'true')
    setId(ellipse, item)
    svg.appendChild(ellipse)
  } else if (item.type === 'arrow') {
    const g = document.createElementNS(SVG_NS, 'g')
    g.setAttribute('data-inline-draw', 'true')
    setId(g, item)
    const line = document.createElementNS(SVG_NS, 'line')
    line.setAttribute('x1', String(item.x1))
    line.setAttribute('y1', String(item.y1))
    line.setAttribute('x2', String(item.x2))
    line.setAttribute('y2', String(item.y2))
    line.setAttribute('stroke', String(item.stroke))
    line.setAttribute('stroke-width', String(item.strokeWidth))
    line.setAttribute('stroke-linecap', 'round')
    const head = document.createElementNS(SVG_NS, 'polygon')
    head.setAttribute('fill', String(item.fill))
    head.setAttribute('points', String(item.points))
    g.appendChild(line)
    g.appendChild(head)
    svg.appendChild(g)
  } else if (item.type === 'line') {
    const line = document.createElementNS(SVG_NS, 'line')
    line.setAttribute('x1', String(item.x1))
    line.setAttribute('y1', String(item.y1))
    line.setAttribute('x2', String(item.x2))
    line.setAttribute('y2', String(item.y2))
    line.setAttribute('stroke', String(item.stroke))
    line.setAttribute('stroke-width', String(item.strokeWidth))
    line.setAttribute('stroke-linecap', 'round')
    line.setAttribute('data-inline-draw', 'true')
    setId(line, item)
    svg.appendChild(line)
  }
}

/**
 * Wipe every drawing off the shared canvas AND tell the backend this page
 * has been cleared. Used by the "Clear" button in the Draw panel.
 *
 * We send `data: []` with a `clearedAt` timestamp so the backend records
 * the clear and won't rehydrate stale shapes on the next load.
 */
export function clearAllDrawings(): void {
  const svg = document.getElementById(CANVAS_ID)
  if (svg) {
    // Remove every drawn element but keep the canvas itself so subsequent
    // strokes still land on a live SVG.
    svg.querySelectorAll('[data-inline-draw]').forEach(el => el.remove())
  }
  try {
    if (!chrome.runtime?.id) return
    chrome.runtime.sendMessage(
      {
        type: 'SAVE_ANNOTATIONS',
        payload: {
          pageUrl: window.location.href,
          featureKey: 'drawPaths',
          data: [],
          pageTitle: document.title,
          domain: window.location.hostname,
          clearedAt: Date.now(),
        },
      },
      () => { if (chrome.runtime.lastError) { /* ignore */ } },
    )
  } catch { /* extension context unavailable */ }
}

/**
 * Fetch saved drawings from the backend (via the service worker) and render
 * them onto the shared SVG canvas. Safe to call at any time — it's a no-op
 * if nothing has been saved for this page.
 */
export function restoreDrawings(): void {
  try {
    if (!chrome.runtime?.id) return
    const svg = ensureDrawCanvas()
    chrome.runtime.sendMessage(
      { type: 'LOAD_ANNOTATIONS', payload: { pageUrl: window.location.href } },
      (response) => {
        if (chrome.runtime.lastError || !response?.ok) return
        const paths = response.data?.elements?.drawPaths as SavedShape[] | undefined
        if (!Array.isArray(paths) || paths.length === 0) return
        for (const item of paths) {
          const id = typeof item.id === 'string' ? item.id : ''
          if (id && svg.querySelector(`[data-inline-id="${CSS.escape(id)}"]`)) continue
          renderShape(svg, item)
        }
      },
    )
  } catch {
    /* extension context unavailable — e.g. host page stripped chrome.* */
  }
}
