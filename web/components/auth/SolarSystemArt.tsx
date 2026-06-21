'use client'

import { motion } from 'framer-motion'
import { cn } from '@/lib/utils'

const EASE: [number, number, number, number] = [0.25, 0.46, 0.45, 0.94]

/** 4-point sparkle star used across auth and marketing backgrounds. */
function Sparkle({
  size = 14,
  className = '',
  delay = 0,
  color = '#C9DAF0',
}: {
  size?: number
  className?: string
  delay?: number
  color?: string
}) {
  return (
    <motion.svg
      viewBox="0 0 10 10"
      width={size}
      height={size}
      className={className}
      initial={{ opacity: 0, scale: 0.4 }}
      animate={{ opacity: 1, scale: 1 }}
      transition={{ duration: 0.7, delay, ease: EASE }}
      aria-hidden
    >
      <path
        d="M5 0 L5.9 4.1 L10 5 L5.9 5.9 L5 10 L4.1 5.9 L0 5 L4.1 4.1 Z"
        fill={color}
      />
    </motion.svg>
  )
}

/**
 * Full-bleed navy "solar system" art used on auth pages and the marketing hero.
 * Deep navy background, pastel-blue dashed orbits, satellite planets, constellation
 * dots, a sweeping dashed flight path, and sparkles.
 *
 * Pass an optional `tagline` for the auth-panel caption. Set `background` for hero
 * use (full-bleed, no caption, slightly reframed for landscape).
 */
export default function SolarSystemArt({
  tagline = 'Capture anywhere. Find everything.',
  background = false,
  className = '',
}: {
  tagline?: string
  background?: boolean
  className?: string
}) {
  // Constellation dots — deterministic so there's no hydration drift.
  // viewBox is 700 x 900 (portrait) to fit the tall right column.
  const DOTS = [
    { x:  60, y:  80, r: 1.6, o: 0.45 },
    { x: 150, y:  40, r: 1.2, o: 0.3  },
    { x: 240, y:  95, r: 1.3, o: 0.3  },
    { x: 520, y:  70, r: 1.6, o: 0.45 },
    { x: 620, y: 140, r: 1.2, o: 0.3  },
    { x: 660, y: 260, r: 1.4, o: 0.35 },
    { x: 640, y: 430, r: 1.2, o: 0.3  },
    { x:  40, y: 340, r: 1.6, o: 0.4  },
    { x: 110, y: 520, r: 1.3, o: 0.3  },
    { x:  60, y: 640, r: 1.5, o: 0.35 },
    { x: 180, y: 760, r: 1.2, o: 0.3  },
    { x: 360, y: 820, r: 1.4, o: 0.35 },
    { x: 540, y: 790, r: 1.2, o: 0.3  },
    { x: 630, y: 680, r: 1.5, o: 0.35 },
    { x: 580, y: 560, r: 1.3, o: 0.3  },
    { x: 270, y: 480, r: 1.2, o: 0.25 },
  ] as const

  const showTagline = !background && Boolean(tagline)

  return (
    <div className={`relative h-full w-full overflow-hidden bg-[#0B1735] ${className}`}>
      <div
        className={cn(
          'absolute inset-0',
          background &&
            'scale-[1.42] translate-y-[14%] opacity-75 [mask-image:radial-gradient(ellipse_62%_52%_at_50%_38%,transparent_22%,black_78%)]',
        )}
        aria-hidden
      >
      {!background && (
        <div
          className="absolute inset-0 opacity-[0.04]"
          style={{
            backgroundImage:
              'url("data:image/svg+xml,%3Csvg viewBox=%220 0 200 200%22 xmlns=%22http://www.w3.org/2000/svg%22%3E%3Cfilter id=%22noiseFilter%22%3E%3CfeTurbulence type=%22fractalNoise%22 baseFrequency=%220.65%22 numOctaves=%223%22 stitchTiles=%22stitch%22/%3E%3C/filter%3E%3Crect width=%22100%25%22 height=%22100%25%22 filter=%22url(%23noiseFilter)%22/%3E%3C/svg%3E")',
          }}
        />
      )}

      {/* Main solar-system SVG — fills the column. */}
      <svg
        viewBox="0 0 700 900"
        preserveAspectRatio="xMidYMid slice"
        className="absolute inset-0 h-full w-full"
      >
        {/* --- Concentric dashed rings (solar-system orbits), centered ~(350, 460) --- */}
        <g opacity="0.95">
          <motion.circle
            cx="350" cy="460" r="120"
            stroke="#B5CDEF" strokeOpacity="0.55" strokeWidth="1.25"
            strokeDasharray="4 8" fill="none"
            initial={{ pathLength: 0, opacity: 0 }}
            animate={{ pathLength: 1, opacity: 1 }}
            transition={{ duration: 1.6, delay: 0.2, ease: 'easeOut' }}
          />
          <motion.circle
            cx="350" cy="460" r="200"
            stroke="#8AACDB" strokeOpacity="0.45" strokeWidth="1.25"
            strokeDasharray="4 8" fill="none"
            initial={{ pathLength: 0, opacity: 0 }}
            animate={{ pathLength: 1, opacity: 1 }}
            transition={{ duration: 2.0, delay: 0.4, ease: 'easeOut' }}
          />
          <motion.circle
            cx="350" cy="460" r="290"
            stroke="#8AACDB" strokeOpacity="0.35" strokeWidth="1.25"
            strokeDasharray="4 8" fill="none"
            initial={{ pathLength: 0, opacity: 0 }}
            animate={{ pathLength: 1, opacity: 1 }}
            transition={{ duration: 2.4, delay: 0.6, ease: 'easeOut' }}
          />
          <motion.circle
            cx="350" cy="460" r="390"
            stroke="#8AACDB" strokeOpacity="0.25" strokeWidth="1.25"
            strokeDasharray="4 8" fill="none"
            initial={{ pathLength: 0, opacity: 0 }}
            animate={{ pathLength: 1, opacity: 1 }}
            transition={{ duration: 2.8, delay: 0.8, ease: 'easeOut' }}
          />
        </g>

        {/* --- The "sun": a soft filled planet at center --- */}
        <motion.g
          initial={{ opacity: 0, scale: 0.6 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ duration: 0.9, delay: 0.25, ease: EASE }}
        >
          <circle cx="350" cy="460" r="52" fill="#1A2B57" />
          <circle cx="350" cy="460" r="52" stroke="#B5CDEF" strokeOpacity="0.55" strokeWidth="1.5" fill="none" />
          {/* Inner highlight ring for a subtle planet look. */}
          <circle cx="338" cy="446" r="18" fill="#8AACDB" fillOpacity="0.12" />
        </motion.g>

        {/* --- Orbiting satellite planets (filled dots sitting on orbit paths) --- */}
        <motion.g
          initial={{ opacity: 0, scale: 0.5 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ duration: 0.7, delay: 1.4, ease: EASE }}
        >
          {/* Inner-orbit satellite (small) */}
          <circle cx="468" cy="440" r="7" fill="#B5CDEF" fillOpacity="0.85" />
          <circle cx="468" cy="440" r="7" stroke="#B5CDEF" strokeOpacity="0.35" strokeWidth="1" fill="none" />
        </motion.g>
        <motion.g
          initial={{ opacity: 0, scale: 0.5 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ duration: 0.7, delay: 1.55, ease: EASE }}
        >
          {/* Mid-orbit satellite with ring (Saturn-like) */}
          <g transform="translate(218 330) rotate(-18)">
            <ellipse cx="0" cy="0" rx="22" ry="6" stroke="#B5CDEF" strokeOpacity="0.5" strokeWidth="1.25" fill="none" />
            <circle cx="0" cy="0" r="9" fill="#8AACDB" fillOpacity="0.85" />
          </g>
        </motion.g>
        <motion.g
          initial={{ opacity: 0, scale: 0.5 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ duration: 0.7, delay: 1.7, ease: EASE }}
        >
          {/* Outer-orbit satellite (medium) */}
          <circle cx="540" cy="700" r="11" fill="#B5CDEF" fillOpacity="0.85" />
          <circle cx="540" cy="700" r="22" stroke="#B5CDEF" strokeOpacity="0.35" strokeWidth="1" fill="none" />
        </motion.g>
        <motion.g
          initial={{ opacity: 0, scale: 0.5 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ duration: 0.7, delay: 1.85, ease: EASE }}
        >
          {/* Far-orbit satellite (tiny) */}
          <circle cx="96" cy="186" r="5" fill="#C9DAF0" fillOpacity="0.9" />
        </motion.g>

        {/* --- Sweeping dashed flight path w/ paper airplane --- */}
        <motion.path
          d="M -60 760 C 80 680, 160 620, 240 620 C 360 620, 440 760, 580 820"
          stroke="#B5CDEF"
          strokeOpacity="0.5"
          strokeWidth="1.5"
          strokeDasharray="6 8"
          fill="none"
          initial={{ pathLength: 0, opacity: 0 }}
          animate={{ pathLength: 1, opacity: 1 }}
          transition={{ duration: 2.2, delay: 1.0, ease: 'easeOut' }}
        />
        <motion.g
          initial={{ opacity: 0, scale: 0.4 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ duration: 0.5, delay: 2.6, ease: EASE }}
        >
          <g transform="translate(580 820) rotate(24)">
            <path d="M 0 0 L -24 -9 L -7 -2 L -20 7 Z" fill="#B5CDEF" fillOpacity="0.9" />
            <line x1="-7" y1="-2" x2="-14" y2="2" stroke="#B5CDEF" strokeOpacity="0.7" strokeWidth="0.9" />
          </g>
        </motion.g>

        {/* --- Counter-arc sweeping the other way, upper area --- */}
        <motion.path
          d="M 700 120 C 540 60, 360 40, 200 90 C 100 120, 40 180, -40 240"
          stroke="#8AACDB"
          strokeOpacity="0.4"
          strokeWidth="1.25"
          strokeDasharray="3 9"
          fill="none"
          initial={{ pathLength: 0, opacity: 0 }}
          animate={{ pathLength: 1, opacity: 1 }}
          transition={{ duration: 2.4, delay: 1.2, ease: 'easeOut' }}
        />

        {/* --- Constellation dots scattered across the canvas --- */}
        <g>
          {DOTS.map((d, i) => (
            <motion.circle
              key={i}
              cx={d.x}
              cy={d.y}
              r={d.r * 1.5}
              fill="#B5CDEF"
              fillOpacity={Math.min(1, d.o + 0.2)}
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ duration: 0.6, delay: 0.9 + i * 0.04, ease: EASE }}
            />
          ))}
        </g>
      </svg>

      {/* --- Sparkles layered in DOM so they can animate on entry and scale nicely --- */}
      {background ? (
        <>
          <Sparkle size={20} delay={0.9} className="absolute top-[8%] left-[12%]" />
          <Sparkle size={16} delay={1.1} className="absolute top-[12%] right-[10%]" />
          <Sparkle size={14} delay={1.3} className="absolute top-[72%] left-[10%]" />
          <Sparkle size={18} delay={1.5} className="absolute top-[68%] right-[14%]" />
        </>
      ) : (
        <>
          <Sparkle size={26} delay={0.9}  className="absolute top-[10%] left-[18%]" />
          <Sparkle size={18} delay={1.05} className="absolute top-[16%] right-[12%]" />
          <Sparkle size={14} delay={1.25} className="absolute top-[40%] left-[8%]" />
          <Sparkle size={22} delay={1.45} className="absolute top-[34%] right-[8%]" />
          <Sparkle size={16} delay={1.65} className="absolute top-[62%] left-[14%]" />
          <Sparkle size={20} delay={1.85} className="absolute top-[74%] right-[18%]" />
          <Sparkle size={12} delay={2.05} className="absolute top-[86%] left-[38%]" />
          <Sparkle size={14} delay={2.25} className="absolute top-[52%] right-[32%]" />
        </>
      )}
      </div>

      {/* --- Editorial tagline sitting quietly at the bottom-left --- */}
      {showTagline && (
        <motion.div
          initial={{ opacity: 0, y: 12 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.7, delay: 1.8, ease: EASE }}
          className="pointer-events-none absolute left-10 bottom-10 right-10 max-w-md"
        >
          <div className="text-[11px] font-medium uppercase tracking-[0.25em] text-[#B5CDEF]/80 mb-3">
            Inline
          </div>
          <div className="text-white text-2xl md:text-3xl font-semibold leading-tight tracking-tight">
            {tagline}
          </div>
          <div className="text-[#B5CDEF]/70 text-sm mt-3 leading-relaxed">
            Notes, highlights, drawings, and AI — right on top of any website.
          </div>
        </motion.div>
      )}
    </div>
  )
}
