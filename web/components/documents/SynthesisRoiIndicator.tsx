'use client'

import type { Note } from '@/lib/types'
import {
  computeSynthesisRoi,
  formatSynthesisRoiMessage,
  synthesisRoiSavedPercent,
} from '@/lib/synthesis-roi'
import AiFeedbackBar from '@/components/ai/AiFeedbackBar'
import { cn } from '@/lib/utils'

interface Props {
  workspaceId: string
  docId: string
  notes: Note[]
  recapHtml: string
  className?: string
}

const SIZE = 28
const STROKE = 2
const R = (SIZE - STROKE) / 2
const CIRC = 2 * Math.PI * R

export default function SynthesisRoiIndicator({
  workspaceId,
  docId,
  notes,
  recapHtml,
  className,
}: Props) {
  const roi = computeSynthesisRoi(notes, recapHtml)
  if (!roi) return null

  const percent = synthesisRoiSavedPercent(roi)
  const offset = CIRC * (1 - percent / 100)

  return (
    <div className={cn('relative group shrink-0', className)}>
      <button
        type="button"
        className="flex h-7 w-7 cursor-default items-center justify-center rounded-full outline-none focus-visible:ring-2 focus-visible:ring-primary/30"
        aria-label={`Synthesis ROI: ${formatSynthesisRoiMessage(roi)}`}
      >
        <svg
          width={SIZE}
          height={SIZE}
          viewBox={`0 0 ${SIZE} ${SIZE}`}
          className="-rotate-90"
          aria-hidden
        >
          <circle
            cx={SIZE / 2}
            cy={SIZE / 2}
            r={R}
            fill="none"
            className="stroke-border"
            strokeWidth={STROKE}
          />
          <circle
            cx={SIZE / 2}
            cy={SIZE / 2}
            r={R}
            fill="none"
            className="stroke-emerald-500/80 transition-[stroke-dashoffset] duration-500"
            strokeWidth={STROKE}
            strokeLinecap="round"
            strokeDasharray={CIRC}
            strokeDashoffset={offset}
          />
        </svg>
        <span className="pointer-events-none absolute text-[8px] font-semibold tabular-nums text-muted-foreground">
          {roi.minutesSaved}
        </span>
      </button>

      <div
        className={cn(
          'pointer-events-none absolute right-0 top-full z-50 mt-2 w-64 rounded-lg border border-border bg-popover p-3 shadow-md',
          'opacity-0 transition-opacity duration-150',
          'group-hover:pointer-events-auto group-hover:opacity-100',
          'group-focus-within:pointer-events-auto group-focus-within:opacity-100',
        )}
        role="tooltip"
      >
        <p className="text-xs leading-relaxed text-popover-foreground">
          {formatSynthesisRoiMessage(roi)}
        </p>
        <AiFeedbackBar
          workspaceId={workspaceId}
          surface="roi"
          targetId={docId}
          className="mt-2.5"
        />
      </div>
    </div>
  )
}
