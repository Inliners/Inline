'use client'

import Link from 'next/link'
import {
  History,
  MessageCircle,
  Library,
  BarChart3,
  FileText,
  LayoutDashboard,
  Settings,
  type LucideIcon,
} from 'lucide-react'
import { motion, useReducedMotion } from 'framer-motion'
import { Reveal } from '@/components/marketing/primitives/Reveal'
import {
  celestial,
  mkt,
  mktBtnPrimary,
  mktEyebrow,
  product,
} from '@/components/marketing/marketingSurfaces'

type Orbit = {
  icon: LucideIcon
  title: string
  x: number
  y: number
  size?: number
  accent?: boolean
}

const ORBITS: Orbit[] = [
  { icon: MessageCircle, title: 'Ask Inline', x: 250, y: 70, size: 56, accent: true },
  { icon: LayoutDashboard, title: 'Home', x: 410, y: 120, size: 50 },
  { icon: Library, title: 'Library', x: 150, y: 175, size: 48 },
  { icon: History, title: 'Captures', x: 330, y: 215, size: 52 },
  { icon: BarChart3, title: 'Analytics', x: 470, y: 250, size: 46 },
  { icon: FileText, title: 'Auto-recaps', x: 235, y: 300, size: 48 },
  { icon: Settings, title: 'Settings', x: 388, y: 350, size: 50 },
]

const SECTION_STARS = [
  { x: 6, y: 22, r: 1.2, o: 0.4 },
  { x: 14, y: 58, r: 1, o: 0.32 },
  { x: 88, y: 16, r: 1.1, o: 0.35 },
  { x: 94, y: 68, r: 1.2, o: 0.3 },
] as const

function WorkspaceSpaceDecor() {
  return (
    <div className="pointer-events-none absolute inset-0 z-0" aria-hidden>
      <svg viewBox="0 0 100 100" preserveAspectRatio="none" className="absolute inset-0 h-full w-full">
        {SECTION_STARS.map((s, i) => (
          <circle key={i} cx={s.x} cy={s.y} r={s.r * 0.16} fill={celestial.star} fillOpacity={s.o} />
        ))}
      </svg>
      <svg
        viewBox="0 0 600 400"
        preserveAspectRatio="xMidYMid slice"
        className="absolute inset-0 h-full w-full opacity-60"
      >
        <ellipse
          cx="120"
          cy="210"
          rx="200"
          ry="120"
          stroke={celestial.orbit}
          strokeOpacity="0.35"
          strokeWidth="1"
          strokeDasharray="3 10"
          fill="none"
        />
        <circle cx="48" cy="88" r="4" fill={celestial.sparkle} fillOpacity="0.35" />
        <circle cx="48" cy="88" r="10" stroke={celestial.orbitSoft} strokeOpacity="0.5" strokeWidth="1" fill="none" />
      </svg>
    </div>
  )
}

function OrbitRings() {
  return (
    <svg viewBox="0 0 520 460" className="absolute inset-0 h-full w-full" fill="none" aria-hidden>
      {[210, 152, 96].map((r, i) => (
        <ellipse
          key={r}
          cx="300"
          cy="225"
          rx={r}
          ry={r * 0.92}
          stroke={celestial.orbit}
          strokeOpacity={0.28 + i * 0.06}
          strokeWidth="1"
          strokeDasharray="2 9"
        />
      ))}
      <circle cx="300" cy="225" r="22" fill={celestial.hub} />
      <circle cx="300" cy="225" r="22" stroke={product.ring} strokeOpacity="0.35" strokeWidth="1" fill="none" />
      <circle cx="396" cy="225" r="3" fill={celestial.sparkle} fillOpacity="0.55" />
      <circle cx="168" cy="312" r="3.5" fill={celestial.star} fillOpacity="0.45" />
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
        animate={reduce ? undefined : { y: [0, -5, 0] }}
        transition={{ duration: 4 + index * 0.4, repeat: Infinity, ease: 'easeInOut' }}
        className={`flex items-center justify-center rounded-xl border shadow-[0_1px_2px_rgba(28,30,38,0.06)] ${
          orbit.accent
            ? 'border-[#12203f]/20 bg-[#12203f] text-white'
            : 'border-[#d6d3d1] bg-white text-[#78716c] hover:border-[#a8a29e]'
        }`}
        style={{ width: size, height: size }}
        title={orbit.title}
      >
        <orbit.icon style={{ width: size * 0.4, height: size * 0.4 }} aria-hidden />
      </motion.div>
    </motion.div>
  )
}

export default function WorkspaceShowcase() {
  return (
    <section
      id="workspace"
      className="relative scroll-mt-24 overflow-hidden py-28 md:py-36"
      style={{
        background: `linear-gradient(to bottom, ${mkt.tan} 0%, ${mkt.cream} 12%, ${mkt.cream} 88%, ${mkt.mist} 100%)`,
      }}
    >
      <WorkspaceSpaceDecor />

      <div className="relative z-10 mx-auto grid max-w-6xl items-center gap-12 px-6 lg:grid-cols-2 lg:gap-8 lg:px-10">
        <Reveal>
          <p className={`mb-4 ${mktEyebrow}`}>The workspace</p>
          <h2 className="text-balance text-4xl font-semibold leading-[1.08] tracking-tight text-[#1C1E26] md:text-[3.25rem]">
            Everything you capture,
            <br className="hidden sm:block" /> across all your tools
          </h2>
          <p className="mt-6 max-w-md text-base leading-relaxed text-[#78716c]">
            Highlights, notes, rewrites, and recaps stay attached to the page — then roll up into one
            workspace you can search, chart, and ask.
          </p>
          <p className="mt-4 max-w-md text-base leading-relaxed text-[#78716c]/90">
            Every surface below is a real page in the app — connected, searchable, and grounded in the
            context you saved.
          </p>
          <Link href="/app/ws-1/dashboard" className={`mt-9 ${mktBtnPrimary}`}>
            Open workspace
          </Link>
        </Reveal>

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
