'use client'

import type { DailyCapture } from '@/lib/types'

function formatShortDate(iso: string) {
  return new Date(iso + 'T12:00:00').toLocaleDateString('en-US', {
    weekday: 'short',
    month: 'short',
    day: 'numeric',
  })
}

export default function ActivityDetailPanel({ data }: { data: DailyCapture[] }) {
  if (!data.length) {
    return (
      <div className="rounded-xl border border-dashed border-slate-200 bg-white/80 p-6 text-sm text-slate-400 dark:border-border dark:bg-card dark:text-muted-foreground">
        No activity data for this period.
      </div>
    )
  }

  const totalCaptures = data.reduce((s, d) => s + d.count, 0)
  const activeDays = data.filter(d => d.count > 0).length
  const maxEntry = data.reduce(
    (best, d) => (d.count > best.count ? d : best),
    data[0]!,
  )

  return (
    <div className="rounded-xl border border-slate-200 bg-white p-5 dark:border-border dark:bg-card">
      <h3 className="text-sm font-semibold text-slate-700 dark:text-white">Activity details</h3>
      <p className="text-xs text-slate-400 mt-0.5 mb-4 dark:text-muted-foreground">
        Last {data.length} days of note captures in this workspace.
      </p>

      <dl className="grid grid-cols-2 gap-3 text-sm">
        <div className="rounded-lg bg-slate-50 px-3 py-2 border border-slate-200 dark:bg-muted dark:border-border">
          <dt className="text-[10px] font-semibold uppercase tracking-wider text-slate-400 dark:text-muted-foreground">Total captures</dt>
          <dd className="text-lg font-bold tabular-nums mt-0.5 text-slate-800 dark:text-white">{totalCaptures}</dd>
        </div>
        <div className="rounded-lg bg-slate-50 px-3 py-2 border border-slate-200 dark:bg-muted dark:border-border">
          <dt className="text-[10px] font-semibold uppercase tracking-wider text-slate-400 dark:text-muted-foreground">Active days</dt>
          <dd className="text-lg font-bold tabular-nums mt-0.5 text-slate-800 dark:text-white">
            {activeDays}
            <span className="text-xs font-normal text-slate-400 dark:text-muted-foreground"> / {data.length}</span>
          </dd>
        </div>
        <div className="rounded-lg bg-slate-50 px-3 py-2 border border-slate-200 col-span-2 dark:bg-muted dark:border-border">
          <dt className="text-[10px] font-semibold uppercase tracking-wider text-slate-400 dark:text-muted-foreground">Busiest day</dt>
          <dd className="text-sm font-semibold mt-0.5 text-slate-800 dark:text-white">
            {maxEntry.count > 0 ? (
              <>
                {maxEntry.count} notes on{' '}
                <span className="text-slate-700 dark:text-foreground">{formatShortDate(maxEntry.date)}</span>
              </>
            ) : (
              <span className="text-slate-400 dark:text-muted-foreground">No activity yet</span>
            )}
          </dd>
        </div>
      </dl>
    </div>
  )
}
