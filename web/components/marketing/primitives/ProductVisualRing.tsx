import type { ReactNode } from 'react'
import FrostedGrainSurface from '@/components/marketing/primitives/FrostedGrainSurface'
import {
  mktProductRing,
  mktProductRingMesh,
  type MktProductRingTone,
} from '@/components/marketing/marketingSurfaces'
import { cn } from '@/lib/utils'

const RING_RADIUS = {
  xl: 'rounded-[calc(var(--radius-xl)+0.75rem)] sm:rounded-[calc(var(--radius-xl)+1rem)]',
  '2xl': 'rounded-[calc(var(--radius-2xl)+0.75rem)] sm:rounded-[calc(var(--radius-2xl)+1rem)]',
} as const

type ProductVisualRingProps = {
  children: ReactNode
  className?: string
  /** Matches the inner mock corner radius so the ring runs parallel. */
  innerRadius?: keyof typeof RING_RADIUS
  /** Accent frame color — defaults to warm tan. */
  tone?: MktProductRingTone
}

/** Colored frosted frame around product mocks — extends outward so inner width stays unchanged. */
export function ProductVisualRing({
  children,
  className,
  innerRadius = 'xl',
  tone = 'tan',
}: ProductVisualRingProps) {
  return (
    <div className={cn('relative mx-auto', className)}>
      <div
        className={cn(
          'pointer-events-none absolute -inset-3 overflow-hidden sm:-inset-4',
          RING_RADIUS[innerRadius],
        )}
        aria-hidden
      >
        <FrostedGrainSurface
          baseColor={mktProductRing[tone]}
          meshLayers={mktProductRingMesh[tone]}
        />
      </div>
      <div className="relative">{children}</div>
    </div>
  )
}
