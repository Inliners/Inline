'use client'

import { motion, useReducedMotion } from 'framer-motion'

/**
 * Frosted, grainy mesh behind the hero — one blended field (not separate blobs).
 * Square full-bleed; color anchors match Jeff-style placement: amber TR, navy BL, gray center.
 */
export default function HeroAtmosphere() {
  const reduce = useReducedMotion()

  return (
    <div className="pointer-events-none absolute inset-0 z-0 overflow-hidden" aria-hidden>
      {/* Cream base — page tone at edges */}
      <div className="absolute inset-0 bg-[#FDFBF7]" />

      {/* Blurred mesh field — saturated anchors blur into a single frosted wash */}
      <motion.div
        className="absolute inset-[-8%]"
        style={{
          filter: 'blur(72px) saturate(1.05) contrast(1.04)',
          willChange: reduce ? undefined : 'transform',
        }}
        animate={
          reduce
            ? undefined
            : {
                scale: [1, 1.03, 1],
                x: ['0%', '1.2%', '0%'],
                y: ['0%', '-0.8%', '0%'],
              }
        }
        transition={
          reduce
            ? undefined
            : { duration: 28, repeat: Infinity, ease: 'easeInOut' }
        }
      >
        <div
          className="absolute inset-0"
          style={{
            background: [
              'radial-gradient(circle at 92% 6%, #FCA311 0%, rgba(252, 163, 17, 0.55) 22%, transparent 52%)',
              'radial-gradient(circle at 78% 18%, rgba(255, 190, 90, 0.45) 0%, transparent 38%)',
              'radial-gradient(circle at 6% 94%, #0B1735 0%, rgba(18, 69, 89, 0.65) 28%, transparent 54%)',
              'radial-gradient(circle at 18% 72%, rgba(89, 131, 146, 0.5) 0%, transparent 42%)',
              'radial-gradient(ellipse 95% 80% at 48% 44%, #E8E8E8 0%, #D6D6D6 38%, rgba(210, 210, 210, 0.35) 62%, transparent 88%)',
              'radial-gradient(ellipse 70% 55% at 55% 52%, rgba(245, 245, 245, 0.9) 0%, transparent 70%)',
              'linear-gradient(160deg, #C5CCD4 0%, #E2E2E2 48%, #EDE8E2 100%)',
            ].join(', '),
          }}
        />
      </motion.div>

      {/* Matte frost — pulls mesh into a single tactile plane */}
      <div
        className="absolute inset-0"
        style={{
          background:
            'radial-gradient(ellipse 100% 85% at 50% 40%, rgba(255, 255, 255, 0.18) 0%, rgba(255, 255, 255, 0.06) 45%, transparent 72%)',
          mixBlendMode: 'soft-light',
        }}
      />

      {/* Coarse film grain */}
      <svg
        className="absolute inset-0 h-full w-full opacity-[0.48] mix-blend-overlay"
        xmlns="http://www.w3.org/2000/svg"
        preserveAspectRatio="none"
      >
        <filter id="hero-frost-grain-coarse" x="0%" y="0%" width="100%" height="100%">
          <feTurbulence
            type="fractalNoise"
            baseFrequency="0.68"
            numOctaves="4"
            stitchTiles="stitch"
            result="noise"
          />
          <feColorMatrix type="saturate" values="0" in="noise" />
        </filter>
        <rect width="100%" height="100%" filter="url(#hero-frost-grain-coarse)" />
      </svg>

      {/* Fine grain — adds the sandblasted-glass grit */}
      <svg
        className="absolute inset-0 h-full w-full opacity-[0.22] mix-blend-soft-light"
        xmlns="http://www.w3.org/2000/svg"
        preserveAspectRatio="none"
      >
        <filter id="hero-frost-grain-fine" x="0%" y="0%" width="100%" height="100%">
          <feTurbulence
            type="fractalNoise"
            baseFrequency="1.35"
            numOctaves="2"
            stitchTiles="stitch"
          />
          <feColorMatrix type="saturate" values="0" />
        </filter>
        <rect width="100%" height="100%" filter="url(#hero-frost-grain-fine)" />
      </svg>

      {/* Gentle center lift for headline legibility — not a white wash */}
      <div
        className="absolute inset-0 opacity-[0.35]"
        style={{
          background:
            'radial-gradient(ellipse 72% 58% at 50% 46%, rgba(253, 251, 247, 0.55) 0%, transparent 68%)',
        }}
      />
    </div>
  )
}
