'use client'

import Link from 'next/link'
import type { DailyCapture } from '@/lib/types'
import { cn } from '@/lib/utils'

interface ActivityHeatmapProps {
  data: DailyCapture[]
  linkHref?: string
}

const WEEKDAY_LABELS = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat']

function getIntensityClass(count: number, max: number) {
  if (count === 0) return 'bg-muted'
  const ratio = count / max
  if (ratio < 0.25) return 'bg-[#EDE9E3] dark:bg-[#1E3878]'
  if (ratio < 0.5)  return 'bg-[#d6d3d1] dark:bg-[#3A5AA8]'
  if (ratio < 0.75) return 'bg-[#78716c] dark:bg-[#6C8ED0]'
  return 'bg-[#1C1E26] dark:bg-[#B5CDEF]'
}

export default function ActivityHeatmap({ data, linkHref }: ActivityHeatmapProps) {
  const max = Math.max(...data.map(d => d.count), 1)

  const firstDate = new Date(data[0]?.date ?? new Date().toISOString())
  const startPadding = firstDate.getDay()
  const cells: (DailyCapture | null)[] = [
    ...Array(startPadding).fill(null),
    ...data,
  ]

  const remainder = cells.length % 7
  if (remainder > 0) {
    for (let i = 0; i < 7 - remainder; i++) cells.push(null)
  }

  const weeks: (DailyCapture | null)[][] = []
  for (let i = 0; i < cells.length; i += 7) {
    weeks.push(cells.slice(i, i + 7))
  }

  const shellClass = 'rounded-xl border border-border bg-card p-5'

  const body = (
    <>
      <div className="mb-5 flex items-center justify-between gap-3">
        <div>
          <p className="text-sm font-semibold text-foreground">Activity</p>
          <p className="mt-0.5 text-xs text-muted-foreground">Capture frequency, last 30 days</p>
        </div>
        <div className="flex shrink-0 items-center gap-1.5 text-xs text-muted-foreground">
          <span>Less</span>
          {[
            'bg-muted',
            'bg-[#EDE9E3] dark:bg-[#1E3878]',
            'bg-[#d6d3d1] dark:bg-[#3A5AA8]',
            'bg-[#78716c] dark:bg-[#6C8ED0]',
            'bg-[#1C1E26] dark:bg-[#B5CDEF]',
          ].map(cls => (
            <div key={cls} className={cn('w-3 h-3 rounded-sm', cls)} />
          ))}
          <span>More</span>
        </div>
      </div>

      <div className="flex gap-1 overflow-x-auto scrollbar-minimal">
        <div className="flex flex-col gap-1 mr-1 shrink-0">
          <div className="h-3" />
          {WEEKDAY_LABELS.map((day, i) => (
            <div key={day} className="h-3 flex items-center">
              {i % 2 === 1 && (
                <span className="w-6 text-[9px] leading-none text-muted-foreground">{day}</span>
              )}
              {i % 2 !== 1 && <span className="w-6" />}
            </div>
          ))}
        </div>

        {weeks.map((week, wi) => {
          const firstReal = week.find(d => d !== null)
          const monthLabel = firstReal
            ? new Date(firstReal.date).toLocaleDateString('en-US', { month: 'short' })
            : ''
          return (
            <div key={`w-${wi}`} className="flex flex-col gap-1 shrink-0">
              <div className="h-3 flex items-center">
                <span className="text-[9px] leading-none text-muted-foreground">{wi % 4 === 0 ? monthLabel : ''}</span>
              </div>
              {week.map((cell, di) => (
                <div
                  key={cell ? cell.date : `pad-${wi}-${di}`}
                  title={cell ? `${cell.date}: ${cell.count} notes` : ''}
                  className={cn(
                    'w-3 h-3 rounded-sm transition-opacity',
                    linkHref ? 'pointer-events-none' : 'hover:opacity-80',
                    cell ? getIntensityClass(cell.count, max) : 'bg-transparent',
                  )}
                />
              ))}
            </div>
          )
        })}
      </div>
    </>
  )

  if (linkHref) {
    return (
      <Link
        href={linkHref}
        className={cn(shellClass, 'block transition-colors hover:border-stone-400/50')}
        aria-label="View full activity on Analytics"
      >
        {body}
      </Link>
    )
  }

  return <div className={shellClass}>{body}</div>
}
