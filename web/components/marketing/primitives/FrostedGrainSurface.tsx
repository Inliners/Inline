'use client'

import { useId } from 'react'
import { cn } from '@/lib/utils'

type FrostedGrainSurfaceProps = {
  className?: string
  baseColor: string
  meshLayers: string[]
}

/** Frosted mesh + film grain — same tactile treatment as the homepage hero. */
export default function FrostedGrainSurface({
  className,
  baseColor,
  meshLayers,
}: FrostedGrainSurfaceProps) {
  const id = useId().replace(/:/g, '')
  const coarseId = `ring-grain-coarse-${id}`
  const fineId = `ring-grain-fine-${id}`

  return (
    <div className={cn('absolute inset-0 overflow-hidden', className)} aria-hidden>
      <div className="absolute inset-0" style={{ backgroundColor: baseColor }} />

      <div
        className="absolute inset-[-12%]"
        style={{
          filter: 'blur(48px) saturate(1.08) contrast(1.04)',
        }}
      >
        <div
          className="absolute inset-0"
          style={{ background: meshLayers.join(', ') }}
        />
      </div>

      <div
        className="absolute inset-0"
        style={{
          background:
            'radial-gradient(ellipse 100% 85% at 50% 40%, rgba(255, 255, 255, 0.16) 0%, rgba(255, 255, 255, 0.05) 45%, transparent 72%)',
          mixBlendMode: 'soft-light',
        }}
      />

      <svg
        className="absolute inset-0 h-full w-full opacity-[0.46] mix-blend-overlay"
        xmlns="http://www.w3.org/2000/svg"
        preserveAspectRatio="none"
      >
        <filter id={coarseId} x="0%" y="0%" width="100%" height="100%">
          <feTurbulence
            type="fractalNoise"
            baseFrequency="0.68"
            numOctaves="4"
            stitchTiles="stitch"
            result="noise"
          />
          <feColorMatrix type="saturate" values="0" in="noise" />
        </filter>
        <rect width="100%" height="100%" filter={`url(#${coarseId})`} />
      </svg>

      <svg
        className="absolute inset-0 h-full w-full opacity-[0.2] mix-blend-soft-light"
        xmlns="http://www.w3.org/2000/svg"
        preserveAspectRatio="none"
      >
        <filter id={fineId} x="0%" y="0%" width="100%" height="100%">
          <feTurbulence
            type="fractalNoise"
            baseFrequency="1.35"
            numOctaves="2"
            stitchTiles="stitch"
          />
          <feColorMatrix type="saturate" values="0" />
        </filter>
        <rect width="100%" height="100%" filter={`url(#${fineId})`} />
      </svg>
    </div>
  )
}
