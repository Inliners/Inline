'use client'

import Link from 'next/link'
import {
  History,
  MessageSquareText,
  Library,
  BarChart3,
  Map,
  Share2,
  FileText,
  LayoutDashboard,
  type LucideIcon,
} from 'lucide-react'
import { motion, useReducedMotion } from 'framer-motion'
import { Reveal } from '@/components/marketing/primitives/Reveal'

/**
 * #workspace — modelled on the Attio/Slite "Ask beyond … across all your
 * tools" section: a dark band with cream curved transitions top and bottom,
 * a left-aligned headline + CTA, and the eight real workspace surfaces
 * orbiting on dashed rings to the right.
 */

type Orbit = {
  icon: LucideIcon
  title: string
  /** position within the 520×460 orbital stage (px) */
  x: number
  y: number
  /** tile size */
  size?: number
  accent?: boolean
}

const ORBITS: Orbit[] = [
  { icon: MessageSquareText, title: 'Ask Inline', x: 250, y: 70, size: 56, accent: true },
  { icon: LayoutDashboard, title: 'Home', x: 410, y: 120, size: 50 },
  { icon: Library, title: 'Library', x: 150, y: 175, size: 48 },
  { icon: History, title: 'Captures', x: 330, y: 215, size: 52 },
  { icon: BarChart3, title: 'Analytics', x: 470, y: 250, size: 46 },
  { icon: Map, title: 'Map', x: 235, y: 300, size: 48 },
  { icon: Share2, title: 'Graph', x: 388, y: 350, size: 50 },
  { icon: FileText, title: 'Auto-recaps', x: 110, y: 360, size: 44 },
]

const SECTION_STARS = [
  { x: 6, y: 22, r: 1.2, o: 0.35 },
  { x: 14, y: 58, r: 1, o: 0.28 },
  { x: 22, y: 78, r: 1.3, o: 0.32 },
  { x: 88, y: 16, r: 1.1, o: 0.3 },
  { x: 72, y: 42, r: 0.9, o: 0.24 },
  { x: 94, y: 68, r: 1.2, o: 0.3 },
] as const

/** 4-point sparkle — matches hero / auth accents. */
function Sparkle({ size = 12, className = '' }: { size?: number; className?: string }) {
  return (
    <svg viewBox="0 0 10 10" width={size} height={size} className={className} aria-hidden>
      <path d="M5 0 L5.9 4.1 L10 5 L5.9 5.9 L5 10 L4.1 5.9 L0 5 L4.1 4.1 Z" fill="#C9DAF0" />
    </svg>
  )
}

/** Flat space accents across the full section — stars, arcs, no gradients. */
function WorkspaceSpaceDecor() {
  return (
    <div className="pointer-events-none absolute inset-0 z-1" aria-hidden>
      <svg viewBox="0 0 100 100" preserveAspectRatio="none" className="absolute inset-0 h-full w-full">
        {SECTION_STARS.map((s, i) => (
          <circle key={i} cx={s.x} cy={s.y} r={s.r * 0.16} fill="#DCE8FA" fillOpacity={s.o} />
        ))}
      </svg>

      <svg
        viewBox="0 0 600 400"
        preserveAspectRatio="xMidYMid slice"
        className="absolute inset-0 h-full w-full opacity-70"
      >
        <ellipse
          cx="120"
          cy="210"
          rx="200"
          ry="120"
          stroke="#8AACDB"
          strokeOpacity="0.14"
          strokeWidth="1"
          strokeDasharray="3 10"
          fill="none"
        />
        <path
          d="M -20 320 C 80 260, 180 240, 280 280"
          stroke="#B5CDEF"
          strokeOpacity="0.16"
          strokeWidth="1"
          strokeDasharray="2 9"
          fill="none"
        />
        <circle cx="48" cy="88" r="4" fill="#C9DAF0" fillOpacity="0.55" />
        <circle cx="48" cy="88" r="10" stroke="#B5CDEF" strokeOpacity="0.25" strokeWidth="1" fill="none" />
      </svg>

      <Sparkle size={18} className="absolute left-[8%] top-[22%] opacity-80" />
      <Sparkle size={12} className="absolute left-[18%] top-[62%] opacity-60" />
      <Sparkle size={14} className="absolute right-[12%] top-[28%] opacity-70" />
    </div>
  )
}

/** Dashed concentric orbit rings centred toward the right of the stage. */
function OrbitRings() {
  return (
    <svg
      viewBox="0 0 520 460"
      className="absolute inset-0 h-full w-full"
      fill="none"
      aria-hidden
    >
      {[210, 152, 96].map((r, i) => (
        <ellipse
          key={r}
          cx="300"
          cy="225"
          rx={r}
          ry={r * 0.92}
          stroke="#9FB3D9"
          strokeOpacity={0.16 + i * 0.04}
          strokeWidth="1"
          strokeDasharray="2 9"
        />
      ))}
      <circle cx="300" cy="225" r="28" fill="#1A2B57" />
      <circle cx="300" cy="225" r="28" stroke="#B5CDEF" strokeOpacity="0.45" strokeWidth="1.25" fill="none" />
      <circle cx="292" cy="216" r="9" fill="#8AACDB" fillOpacity="0.14" />
      <circle cx="396" cy="225" r="3.5" fill="#B5CDEF" fillOpacity="0.7" />
      <circle cx="300" cy="33" r="2.5" fill="#B5CDEF" fillOpacity="0.5" />
      <circle cx="168" cy="312" r="4" fill="#C9DAF0" fillOpacity="0.75" />
      <path
        d="M 40 120 C 140 80, 260 90, 360 140"
        stroke="#8AACDB"
        strokeOpacity="0.2"
        strokeWidth="1"
        strokeDasharray="2 8"
        fill="none"
      />
    </svg>
  )
}

function OrbitTile({ orbit, index }: { orbit: Orbit; index: number }) {
  const reduce = useReducedMotion()
  const size = orbit.size ?? 48
  return (
    <motion.div
      className="absolute -translate-x-1/2 -translate-y-1/2"
      style={{ left: `${(orbit.x / 520) * 100}%`, top: `${(orbit.y / 460) * 100}%` }}
      initial={reduce ? false : { opacity: 0, scale: 0.7 }}
      whileInView={{ opacity: 1, scale: 1 }}
      viewport={{ once: true, margin: '-60px' }}
      transition={{ duration: 0.5, delay: index * 0.07, ease: [0.25, 0.46, 0.45, 0.94] }}
    >
      <motion.div
        animate={reduce ? undefined : { y: [0, -6, 0] }}
        transition={{ duration: 4 + index * 0.4, repeat: Infinity, ease: 'easeInOut' }}
        className={`group flex items-center justify-center rounded-2xl border backdrop-blur-sm transition-colors ${
          orbit.accent
            ? 'border-white/20 bg-[#1A2B57]'
            : 'border-white/12 bg-white/6 hover:bg-white/10'
        }`}
        style={{
          width: size,
          height: size,
        }}
        title={orbit.title}
      >
        <orbit.icon
          className={orbit.accent ? 'text-white' : 'text-[#B5CDEF]'}
          style={{ width: size * 0.4, height: size * 0.4 }}
          aria-hidden
        />
      </motion.div>
    </motion.div>
  )
}

export default function WorkspaceShowcase() {
  return (
    <section
      id="workspace"
      className="relative scroll-mt-24 overflow-hidden bg-[#0B1735] py-28 md:py-36"
    >
      {/* ── Top curve: white (ExtensionShowcase) dipping down into the dark ── */}
      <div className="pointer-events-none absolute inset-x-0 top-0 z-10 overflow-hidden" style={{ height: 120 }} aria-hidden>
        <svg viewBox="0 0 1440 120" preserveAspectRatio="none" className="block w-full" style={{ height: 120 }}>
          <path d="M0,0 L1440,0 L1440,46 C1020,112 420,112 0,46 Z" fill="#FFFFFF" />
        </svg>
      </div>

      {/* ── Bottom curve: cream (RagSection) rising up into the dark ── */}
      <div className="pointer-events-none absolute inset-x-0 bottom-0 z-10 overflow-hidden" style={{ height: 120 }} aria-hidden>
        <svg viewBox="0 0 1440 120" preserveAspectRatio="none" className="absolute bottom-0 block w-full" style={{ height: 120 }}>
          <path d="M0,120 L0,74 C420,10 1020,10 1440,74 L1440,120 Z" fill="#FFFFFF" />
        </svg>
      </div>

      <WorkspaceSpaceDecor />

      <div className="relative z-20 mx-auto grid max-w-6xl items-center gap-12 px-6 lg:grid-cols-2 lg:gap-8 lg:px-10">
        {/* Left: copy + CTA */}
        <Reveal>
          <p className="mb-4 text-xs font-semibold uppercase tracking-[0.18em] text-[#B5CDEF]">
            The workspace
          </p>
          <h2 className="text-balance text-4xl font-semibold leading-[1.08] tracking-tight text-white md:text-[3.25rem]">
            Everything you capture,
            <br className="hidden sm:block" /> across all your tools
          </h2>
          <p className="mt-6 max-w-md text-base leading-relaxed text-stone-300/90">
            Highlights, notes, rewrites, and recaps stay attached to the page — then
            roll up into one workspace you can search, chart, map, and ask.
          </p>
          <p className="mt-4 max-w-md text-base leading-relaxed text-stone-400">
            Every surface below is a real page in the app — connected, searchable, and
            grounded in the context you saved.
          </p>
          <Link
            href="/app/ws-1/dashboard"
            className="mt-9 inline-flex items-center justify-center rounded-full border border-white/25 bg-white/4 px-7 py-3 text-sm font-semibold text-white transition-colors hover:border-white/50 hover:bg-white/10 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-white/70"
          >
            Open workspace
          </Link>
        </Reveal>

        {/* Right: orbital surfaces */}
        <div className="relative mx-auto aspect-520/460 w-full max-w-[520px]">
          <OrbitRings />
          {ORBITS.map((o, i) => (
            <OrbitTile key={o.title} orbit={o} index={i} />
          ))}
        </div>
      </div>
    </section>
  )
}
