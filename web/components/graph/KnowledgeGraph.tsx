'use client'

/* eslint-disable @typescript-eslint/no-explicit-any */
import { useEffect, useRef, useState, useCallback } from 'react'
import dynamic from 'next/dynamic'
import type { GraphData, GraphNode } from '@/lib/types'
import { Skeleton } from '@/components/ui/skeleton'
import { RotateCcw, Share2 } from 'lucide-react'
import { useSidebar } from '@/lib/sidebar-context'

const ForceGraph2D = dynamic(
  () => import('react-force-graph-2d').then(m => m.default),
  { ssr: false, loading: () => <Skeleton className="w-full h-full rounded-none" /> },
)

interface KnowledgeGraphProps {
  data: GraphData
}

/** Two complete palettes — one for the warm-cream light theme, one for the
 *  navy "solar system" dark theme. We swap both the canvas drawing colors and
 *  the decorative SVG strokes based on whichever is active. */
const PALETTE = {
  light: {
    canvasBg:     'rgba(0,0,0,0)',
    surface:      '#FFFFFF',
    nodeByType:   { url: '#416D9E', note: '#B9822A', tag: '#4F8F87' } as const,
    nodeOutline:  'rgba(28,30,38,0.35)',
    haloAlpha:    '22',
    linkStroke:   'rgba(65,109,158,0.22)',
    linkParticle: 'rgba(79,143,135,0.75)',
    hoverFill:    '#FFFFFF',
    labelText:    'rgba(28,30,38,0.68)',
    glyphText:    '#1C1E26',
    pill:         'bg-white/95 border-stone-200 text-stone-700 shadow-[0_10px_30px_-22px_rgba(28,30,38,0.35)]',
    pillLabel:    'text-stone-700',
    tooltipTitle: 'text-stone-900',
    tooltipSub:   'text-stone-500',
    sparkleFill:  '#5FA8A1',
    sparkleAlpha: 0.55,
    orbitStroke:  '#5FA8A1',
    arcStroke:    '#6C91C2',
    dotFill:      '#5FA8A1',
    planetRing:   '#6C91C2',
    planetFill:   '#6C91C2',
  },
  dark: {
    canvasBg:     'rgba(0,0,0,0)',
    surface:      '#0B1735',
    nodeByType:   { url: '#B5CDEF', note: '#F2D6A2', tag: '#8AACDB' } as const,
    nodeOutline:  'rgba(255,255,255,0.85)',
    haloAlpha:    '22',
    linkStroke:   'rgba(181,205,239,0.25)',
    linkParticle: 'rgba(201,218,240,0.8)',
    hoverFill:    '#FFFFFF',
    labelText:    'rgba(201,218,240,0.85)',
    glyphText:    '#0B1735',
    pill:         'bg-[#152A55]/90 border-white/10 text-[#C9DAF0]',
    pillLabel:    'text-[#C9DAF0]',
    tooltipTitle: 'text-white',
    tooltipSub:   'text-[#B5CDEF]/80',
    sparkleFill:  '#C9DAF0',
    sparkleAlpha: 0.85,
    orbitStroke:  '#B5CDEF',
    arcStroke:    '#B5CDEF',
    dotFill:      '#B5CDEF',
    planetRing:   '#B5CDEF',
    planetFill:   '#B5CDEF',
  },
} as const
type Palette = typeof PALETTE.light | typeof PALETTE.dark

/** Small hook that tracks the `.dark` class on <html> — stays in sync with the
 *  sidebar toggle and the Appearance tab via the shared `inline-theme-changed` event. */
function useIsDark() {
  const [isDark, setIsDark] = useState(false)
  useEffect(() => {
    const read = () => setIsDark(document.documentElement.classList.contains('dark'))
    read()
    const onChange = (e: Event) => {
      const val = (e as CustomEvent<'light' | 'dark'>).detail
      setIsDark(val === 'dark')
    }
    window.addEventListener('inline-theme-changed', onChange)
    // Also catch external class mutations just in case.
    const obs = new MutationObserver(read)
    obs.observe(document.documentElement, { attributes: true, attributeFilter: ['class'] })
    return () => {
      window.removeEventListener('inline-theme-changed', onChange)
      obs.disconnect()
    }
  }, [])
  return isDark
}

function SolarBackdrop({ palette }: { palette: Palette }) {
  const DOTS = [
    { x:  80, y:  70, r: 1.6, o: 0.45 },
    { x: 200, y: 120, r: 1.2, o: 0.3  },
    { x: 340, y:  50, r: 1.4, o: 0.35 },
    { x: 560, y:  90, r: 1.6, o: 0.4  },
    { x: 720, y: 180, r: 1.2, o: 0.3  },
    { x: 880, y: 120, r: 1.5, o: 0.35 },
    { x: 960, y: 320, r: 1.3, o: 0.3  },
    { x: 120, y: 380, r: 1.6, o: 0.35 },
    { x:  60, y: 560, r: 1.2, o: 0.3  },
    { x: 200, y: 640, r: 1.4, o: 0.3  },
    { x: 440, y: 680, r: 1.3, o: 0.3  },
    { x: 760, y: 620, r: 1.5, o: 0.3  },
    { x: 900, y: 500, r: 1.2, o: 0.25 },
    { x: 840, y: 700, r: 1.4, o: 0.3  },
  ] as const

  return (
    <div className="pointer-events-none absolute inset-0 overflow-hidden" aria-hidden>
      <svg
        viewBox="0 0 1000 700"
        preserveAspectRatio="xMidYMid slice"
        className="absolute inset-0 w-full h-full"
      >
        <g opacity="0.95">
          <circle cx="500" cy="350" r="150" stroke={palette.orbitStroke} strokeOpacity="0.25" strokeWidth="1.25" strokeDasharray="4 8" fill="none" />
          <circle cx="500" cy="350" r="240" stroke={palette.orbitStroke} strokeOpacity="0.22" strokeWidth="1.25" strokeDasharray="4 8" fill="none" />
          <circle cx="500" cy="350" r="340" stroke={palette.orbitStroke} strokeOpacity="0.18" strokeWidth="1.25" strokeDasharray="4 8" fill="none" />
          <circle cx="500" cy="350" r="440" stroke={palette.orbitStroke} strokeOpacity="0.14" strokeWidth="1.25" strokeDasharray="4 8" fill="none" />
        </g>

        <g transform="translate(-40 -40)" opacity="0.85">
          <circle cx="180" cy="180" r="220" stroke={palette.orbitStroke} strokeOpacity="0.2"  strokeWidth="1.25" strokeDasharray="4 8" fill="none" />
          <circle cx="180" cy="180" r="160" stroke={palette.orbitStroke} strokeOpacity="0.24" strokeWidth="1.25" strokeDasharray="4 8" fill="none" />
          <circle cx="180" cy="180" r="100" stroke={palette.orbitStroke} strokeOpacity="0.3"  strokeWidth="1.25" strokeDasharray="4 8" fill="none" />
        </g>

        <path
          d="M 1100 540 C 900 620, 700 620, 500 560 C 360 520, 220 460, 80 420"
          stroke={palette.arcStroke} strokeOpacity="0.28" strokeWidth="1.25"
          strokeDasharray="3 9" fill="none"
        />

        <g opacity="0.75">
          <circle cx="840" cy="180" r="16" stroke={palette.planetRing} strokeOpacity="0.45" strokeWidth="1.25" fill="none" />
          <circle cx="840" cy="180" r="5"  fill={palette.planetFill} fillOpacity="0.6" />
        </g>

        {DOTS.map((d, i) => (
          <circle
            key={i}
            cx={d.x}
            cy={d.y}
            r={d.r * 1.5}
            fill={palette.dotFill}
            fillOpacity={Math.min(1, d.o + 0.1)}
          />
        ))}
      </svg>

      <Sparkle size={22} color={palette.sparkleFill} alpha={palette.sparkleAlpha} className="absolute top-[8%] left-[12%]" />
      <Sparkle size={16} color={palette.sparkleFill} alpha={palette.sparkleAlpha} className="absolute top-[16%] right-[10%]" />
      <Sparkle size={14} color={palette.sparkleFill} alpha={palette.sparkleAlpha} className="absolute top-[70%] left-[18%]" />
      <Sparkle size={20} color={palette.sparkleFill} alpha={palette.sparkleAlpha} className="absolute top-[82%] right-[18%]" />
      <Sparkle size={12} color={palette.sparkleFill} alpha={palette.sparkleAlpha} className="absolute top-[46%] right-[6%]" />
      <Sparkle size={14} color={palette.sparkleFill} alpha={palette.sparkleAlpha} className="absolute top-[54%] left-[6%]" />
    </div>
  )
}

function Sparkle({
  size = 14,
  color = '#C9DAF0',
  alpha = 0.85,
  className = '',
}: { size?: number; color?: string; alpha?: number; className?: string }) {
  return (
    <svg viewBox="0 0 10 10" width={size} height={size} className={className} aria-hidden>
      <path d="M5 0 L5.9 4.1 L10 5 L5.9 5.9 L5 10 L4.1 5.9 L0 5 L4.1 4.1 Z" fill={color} fillOpacity={alpha} />
    </svg>
  )
}

export default function KnowledgeGraph({ data }: KnowledgeGraphProps) {
  const graphRef = useRef<any>(null)
  const [hoveredNode, setHoveredNode] = useState<GraphNode | null>(null)
  const [mounted, setMounted] = useState(false)
  const { collapsed } = useSidebar()
  const isDark = useIsDark()
  const palette: Palette = isDark ? PALETTE.dark : PALETTE.light

  useEffect(() => setMounted(true), [])

  const handleZoomFit = useCallback(() => graphRef.current?.zoomToFit(600, 60), [])

  useEffect(() => {
    const t = setTimeout(handleZoomFit, 350)
    return () => clearTimeout(t)
  }, [collapsed, handleZoomFit])

  const nodeCanvasObject = useCallback((node: any, ctx: CanvasRenderingContext2D, globalScale: number) => {
    const gNode = node as GraphNode
    const size = (gNode.size ?? 6) / globalScale * 2
    const color = gNode.color ?? palette.nodeByType[gNode.type] ?? palette.nodeByType.url
    const x = gNode.x ?? 0
    const y = gNode.y ?? 0
    const isHover = gNode === hoveredNode

    if (gNode.type === 'url' || isHover) {
      ctx.beginPath()
      ctx.arc(x, y, size * 2.1, 0, 2 * Math.PI)
      ctx.fillStyle = color + palette.haloAlpha
      ctx.fill()
    }

    ctx.beginPath()
    ctx.arc(x, y, size, 0, 2 * Math.PI)
    ctx.fillStyle = isHover ? palette.hoverFill : color
    ctx.fill()

    ctx.strokeStyle = palette.nodeOutline
    ctx.lineWidth = 1.5 / globalScale
    ctx.stroke()

    if (gNode.glyph) {
      const glyphSize = Math.max(size * 1.2, 5 / globalScale)
      ctx.font = `${glyphSize}px "Apple Color Emoji", "Segoe UI Emoji", system-ui`
      ctx.textAlign = 'center'
      ctx.textBaseline = 'middle'
      ctx.fillStyle = palette.glyphText
      ctx.fillText(gNode.glyph, x, y)
    }

    const label = gNode.label ?? ''
    const fontSize = Math.max(8 / globalScale, 3)
    ctx.font = `600 ${fontSize}px system-ui`
    ctx.textAlign = 'center'
    ctx.textBaseline = 'top'
    ctx.fillStyle = palette.labelText
    ctx.fillText(label.length > 20 ? label.slice(0, 18) + '…' : label, x, y + size + 3 / globalScale)
  }, [hoveredNode, palette])

  const nodePointerAreaPaint = useCallback((node: any, color: string, ctx: CanvasRenderingContext2D, globalScale: number) => {
    const gNode = node as GraphNode
    const size = (gNode.size ?? 6) / globalScale * 2.5
    ctx.beginPath()
    ctx.arc(gNode.x ?? 0, gNode.y ?? 0, size, 0, 2 * Math.PI)
    ctx.fillStyle = color
    ctx.fill()
  }, [])

  return (
    <div
      className="relative w-full h-full overflow-hidden"
      style={{ background: palette.surface }}
    >
      {isDark && <SolarBackdrop palette={palette} />}
      {!isDark && (
        <div
          className="pointer-events-none absolute inset-0"
          style={{
            backgroundImage: 'radial-gradient(circle at 1px 1px, rgba(28,30,38,0.08) 1px, transparent 0)',
            backgroundSize: '28px 28px',
          }}
          aria-hidden
        />
      )}

      {mounted && (
        <ForceGraph2D
          ref={graphRef}
          graphData={data as any}
          backgroundColor={palette.canvasBg}
          nodeCanvasObject={nodeCanvasObject}
          nodePointerAreaPaint={nodePointerAreaPaint}
          linkColor={() => palette.linkStroke}
          linkWidth={1.1}
          linkDirectionalParticles={2}
          linkDirectionalParticleSpeed={0.003}
          linkDirectionalParticleWidth={2}
          linkDirectionalParticleColor={() => palette.linkParticle}
          onNodeHover={(node: any) => setHoveredNode(node as GraphNode | null)}
          cooldownTicks={80}
          onEngineStop={handleZoomFit}
          enableNodeDrag
          enableZoomInteraction
        />
      )}

      <div className={`absolute left-4 top-4 z-10 max-w-sm overflow-hidden rounded-2xl border backdrop-blur-sm ${palette.pill}`}>
        <div className="flex items-start gap-3 px-4 py-3">
          <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-[#1C1E26] text-white">
            <Share2 className="h-4 w-4" />
          </div>
          <div className="min-w-0">
            <p className="text-sm font-semibold text-foreground dark:text-white">Connections</p>
            <p className="mt-0.5 text-xs leading-relaxed text-muted-foreground dark:text-[#B5CDEF]/80">
              Explore how websites, captures, and tags relate inside this workspace.
            </p>
          </div>
        </div>
        <div className="grid grid-cols-2 border-t border-border/70 text-xs dark:border-white/10">
          <div className="px-4 py-2">
            <p className="font-semibold text-foreground dark:text-white">{data.nodes.length}</p>
            <p className="text-muted-foreground dark:text-[#B5CDEF]/80">Items</p>
          </div>
          <div className="border-l border-border/70 px-4 py-2 dark:border-white/10">
            <p className="font-semibold text-foreground dark:text-white">{data.links.length}</p>
            <p className="text-muted-foreground dark:text-[#B5CDEF]/80">Links</p>
          </div>
        </div>
      </div>

      {/* Recenter button (bottom-right) */}
      <button
        type="button"
        onClick={handleZoomFit}
        className={`absolute bottom-6 right-6 z-10 flex h-9 w-9 cursor-pointer items-center justify-center rounded-full border backdrop-blur-sm transition-colors ${palette.pill} hover:brightness-110`}
        title="Fit to view"
      >
        <RotateCcw className="h-3.5 w-3.5" />
      </button>

      {/* Floating legend */}
      <div className={`absolute right-4 top-4 z-10 flex items-center gap-4 rounded-full border backdrop-blur-sm px-4 py-2 ${palette.pill}`}>
        {[
          { label: 'Website', color: palette.nodeByType.url },
          { label: 'Note',    color: palette.nodeByType.note },
          { label: 'Tag',     color: palette.nodeByType.tag },
        ].map(item => (
          <div key={item.label} className="flex items-center gap-1.5">
            <div
              className="h-2.5 w-2.5 rounded-full"
              style={{ backgroundColor: item.color }}
            />
            <span className={`text-xs font-medium ${palette.pillLabel}`}>{item.label}</span>
          </div>
        ))}
      </div>

      {/* Hover tooltip */}
      {hoveredNode && (
        <div className={`pointer-events-none absolute bottom-6 left-1/2 z-10 -translate-x-1/2 rounded-full border backdrop-blur-sm px-4 py-2 text-center text-xs ${palette.pill}`}>
          <p className={`font-semibold ${palette.tooltipTitle}`}>{hoveredNode.label}</p>
          {hoveredNode.domain && (
            <p className={palette.tooltipSub}>{hoveredNode.domain}</p>
          )}
        </div>
      )}

    </div>
  )
}
