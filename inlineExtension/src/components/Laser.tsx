import { useEffect, useRef, useCallback } from 'react'
import { PANEL as C, FONT } from '../lib/extensionTheme'

interface LaserProps {
  onClose: () => void
}

const TRAIL_LENGTH = 8
const DOT_RADIUS = 6

export default function Laser({ onClose }: LaserProps) {
  const svgRef = useRef<SVGSVGElement | null>(null)
  const positionsRef = useRef<{ x: number; y: number }[]>([])
  const currentPos = useRef<{ x: number; y: number }>({ x: -100, y: -100 })
  const rafRef = useRef<number>(0)
  const circlesRef = useRef<SVGCircleElement[]>([])
  const glowRef = useRef<SVGCircleElement | null>(null)

  const render = useCallback(() => {
    const positions = positionsRef.current
    const circles = circlesRef.current
    const glow = glowRef.current

    if (glow) {
      glow.setAttribute('cx', String(currentPos.current.x))
      glow.setAttribute('cy', String(currentPos.current.y))
    }

    for (let i = 0; i < TRAIL_LENGTH; i++) {
      const circle = circles[i]
      if (!circle) continue
      const pos = positions[positions.length - 1 - i]
      if (pos) {
        circle.setAttribute('cx', String(pos.x))
        circle.setAttribute('cy', String(pos.y))
        circle.setAttribute('opacity', String(1 - (i / TRAIL_LENGTH) * 0.85))
        circle.setAttribute('r', String(DOT_RADIUS - i * 0.5))
      } else {
        circle.setAttribute('opacity', '0')
      }
    }

    rafRef.current = requestAnimationFrame(render)
  }, [])

  useEffect(() => {
    const existing = document.getElementById('inline-laser-svg')
    if (existing) existing.remove()

    const svg = document.createElementNS('http://www.w3.org/2000/svg', 'svg')
    svg.id = 'inline-laser-svg'
    svg.style.cssText =
      'position:fixed;top:0;left:0;width:100vw;height:100vh;z-index:2147483645;pointer-events:none;'

    const defs = document.createElementNS('http://www.w3.org/2000/svg', 'defs')
    const filter = document.createElementNS('http://www.w3.org/2000/svg', 'filter')
    filter.id = 'inline-laser-glow'
    filter.setAttribute('x', '-50%')
    filter.setAttribute('y', '-50%')
    filter.setAttribute('width', '200%')
    filter.setAttribute('height', '200%')
    const blur = document.createElementNS('http://www.w3.org/2000/svg', 'feGaussianBlur')
    blur.setAttribute('stdDeviation', '4')
    blur.setAttribute('result', 'blur')
    const merge = document.createElementNS('http://www.w3.org/2000/svg', 'feMerge')
    const mn1 = document.createElementNS('http://www.w3.org/2000/svg', 'feMergeNode')
    mn1.setAttribute('in', 'blur')
    const mn2 = document.createElementNS('http://www.w3.org/2000/svg', 'feMergeNode')
    mn2.setAttribute('in', 'SourceGraphic')
    merge.appendChild(mn1)
    merge.appendChild(mn2)
    filter.appendChild(blur)
    filter.appendChild(merge)
    defs.appendChild(filter)
    svg.appendChild(defs)

    const circles: SVGCircleElement[] = []
    for (let i = TRAIL_LENGTH - 1; i >= 0; i--) {
      const circle = document.createElementNS('http://www.w3.org/2000/svg', 'circle')
      circle.setAttribute('r', String(DOT_RADIUS - i * 0.5))
      circle.setAttribute('fill', i === 0 ? '#ef4444' : '#f87171')
      circle.setAttribute('opacity', '0')
      if (i === 0) circle.setAttribute('filter', 'url(#inline-laser-glow)')
      svg.appendChild(circle)
      circles.push(circle)
    }
    circlesRef.current = circles

    const glow = document.createElementNS('http://www.w3.org/2000/svg', 'circle')
    glow.setAttribute('r', String(DOT_RADIUS + 4))
    glow.setAttribute('fill', 'rgba(239, 68, 68, 0.25)')
    glow.setAttribute('filter', 'url(#inline-laser-glow)')
    svg.insertBefore(glow, svg.firstChild?.nextSibling ?? null)
    glowRef.current = glow

    document.body.appendChild(svg)
    svgRef.current = svg

    const onPointerMove = (e: PointerEvent) => {
      currentPos.current = { x: e.clientX, y: e.clientY }
      positionsRef.current.push({ x: e.clientX, y: e.clientY })
      if (positionsRef.current.length > TRAIL_LENGTH + 2) {
        positionsRef.current = positionsRef.current.slice(-TRAIL_LENGTH - 2)
      }
    }

    document.addEventListener('pointermove', onPointerMove)
    rafRef.current = requestAnimationFrame(render)

    return () => {
      document.removeEventListener('pointermove', onPointerMove)
      cancelAnimationFrame(rafRef.current)
      svg.remove()
      svgRef.current = null
    }
  }, [render])

  return (
    <div
      style={{
        position: 'fixed',
        top: 12,
        left: '50%',
        transform: 'translateX(-50%)',
        zIndex: 2147483647,
        display: 'flex',
        alignItems: 'center',
        gap: 10,
        padding: '5px 14px 5px 12px',
        background: C.bg,
        border: `1px solid ${C.border}`,
        borderRadius: C.radiusPill,
        boxShadow: C.shadowOuter,
        fontFamily: FONT,
        userSelect: 'none',
      }}
    >
      <span
        style={{
          width: 8,
          height: 8,
          borderRadius: '50%',
          background: '#ef4444',
          boxShadow: '0 0 6px rgba(239,68,68,0.6)',
          flexShrink: 0,
        }}
      />
      <span style={{ fontSize: 13, fontWeight: 500, color: C.text, letterSpacing: '-0.01em' }}>
        Laser active
      </span>
      <button
        type="button"
        onClick={onClose}
        style={{
          display: 'inline-flex',
          alignItems: 'center',
          justifyContent: 'center',
          width: 24,
          height: 24,
          border: 'none',
          borderRadius: C.radiusSm,
          background: 'rgba(255,255,255,0.35)',
          cursor: 'pointer',
          padding: 0,
          color: C.textMuted,
          fontSize: 14,
          fontWeight: 500,
        }}
      >
        ×
      </button>
    </div>
  )
}
