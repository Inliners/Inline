'use client'

import { motion, useReducedMotion } from 'framer-motion'
import { celestial, product } from '@/components/marketing/marketingSurfaces'
import { cn } from '@/lib/utils'

type HeroContextRingsProps = {
  className?: string
}

/**
 * Concentric context rings — memory layers radiating across the full hero.
 * Absolute backdrop only; pulse is opacity/scale (no layout shift).
 */
export default function HeroContextRings({ className }: HeroContextRingsProps) {
  const reduce = useReducedMotion()

  return (
    <motion.div
      className={cn(
        'pointer-events-none absolute inset-0 z-0 flex items-center justify-center overflow-hidden',
        className,
      )}
      aria-hidden
      animate={
        reduce
          ? undefined
          : {
              opacity: [0.72, 0.96, 0.72],
              scale: [1, 1.022, 1],
            }
      }
      transition={
        reduce
          ? undefined
          : {
              duration: 9,
              repeat: Infinity,
              ease: 'easeInOut',
            }
      }
    >
      <div className="mask-[radial-gradient(ellipse_88%_78%_at_50%_48%,black_18%,transparent_82%)] flex h-full w-full items-center justify-center">
        <svg
          viewBox="0 0 400 400"
          className="h-[min(175vmin,1800px)] w-[min(175vmin,1800px)] max-h-none max-w-none shrink-0"
          fill="none"
          xmlns="http://www.w3.org/2000/svg"
        >
          <defs>
            <radialGradient id="hero-context-core" cx="50%" cy="50%" r="50%">
              <stop offset="0%" stopColor={product.brand} stopOpacity="0.11" />
              <stop offset="42%" stopColor={product.brandMid} stopOpacity="0.06" />
              <stop offset="100%" stopColor={product.brand} stopOpacity="0" />
            </radialGradient>
          </defs>

          {/* Navy memory core */}
          <circle cx="200" cy="200" r="92" fill="url(#hero-context-core)" />

          {/* Outermost halos — extend to hero edges when scaled */}
          <circle
            cx="200"
            cy="200"
            r="198"
            stroke={celestial.orbitSoft}
            strokeWidth="0.75"
            strokeOpacity="0.22"
          />
          <circle
            cx="200"
            cy="200"
            r="188"
            stroke={celestial.orbitSoft}
            strokeWidth="1"
            strokeOpacity="0.34"
          />

          {/* Dashed orbit */}
          <circle
            cx="200"
            cy="200"
            r="158"
            stroke={celestial.orbit}
            strokeWidth="1.25"
            strokeOpacity="0.48"
            strokeDasharray="5 9"
          />

          {/* Mid ring — warm bronze */}
          <circle
            cx="200"
            cy="200"
            r="126"
            stroke={celestial.star}
            strokeWidth="1.5"
            strokeOpacity="0.54"
          />

          {/* Inner context band */}
          <circle
            cx="200"
            cy="200"
            r="96"
            stroke={celestial.orbitSoft}
            strokeWidth="1"
            strokeOpacity="0.6"
          />

          {/* Tight ring around logo hub */}
          <circle
            cx="200"
            cy="200"
            r="64"
            stroke={celestial.hub}
            strokeWidth="1.5"
            strokeOpacity="0.2"
          />

          {/* Layer depth ticks */}
          {[0, 45, 90, 135, 180, 225, 270, 315].map(deg => {
            const rad = (deg * Math.PI) / 180
            const x1 = 200 + Math.cos(rad) * 148
            const y1 = 200 + Math.sin(rad) * 148
            const x2 = 200 + Math.cos(rad) * 154
            const y2 = 200 + Math.sin(rad) * 154
            return (
              <line
                key={deg}
                x1={x1}
                y1={y1}
                x2={x2}
                y2={y2}
                stroke={celestial.orbit}
                strokeWidth="1"
                strokeOpacity="0.32"
                strokeLinecap="round"
              />
            )
          })}
        </svg>
      </div>
    </motion.div>
  )
}
