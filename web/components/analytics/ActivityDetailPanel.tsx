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
      <div className="rounded-xl border border-dashed border-slate-200 bg-white/80 p-6 text-sm text-slate-400 dark:border-[#263E7A] dark:bg-[#15285C] dark:text-[#9BBCE5]">
        No activity data for this period.
      </div>
    )
  }

  const sorted = [...data].sort((a, b) => b.date.localeCompare(a.date))
  const totalCaptures = data.reduce((s, d) => s + d.count, 0)
  const activeDays = data.filter(d => d.count > 0).length
  const maxEntry = data.reduce(
    (best, d) => (d.count > best.count ? d : best),
    data[0]!,
  )
  const avgPerActiveDay =
    activeDays > 0 ? (totalCaptures / activeDays).toFixed(1) : '—'
  const longestGap = (() => {
    let maxGap = 0
    const withActivity = data.filter(d => d.count > 0).sort((a, b) => a.date.localeCompare(b.date))
    for (let i = 1; i < withActivity.length; i++) {
      const a = new Date(withActivity[i - 1]!.date).getTime()
      const b = new Date(withActivity[i]!.date).getTime()
      const days = Math.round((b - a) / 86400000)
      maxGap = Math.max(maxGap, days - 1)
    }
    return maxGap
  })()

  const recent = sorted.slice(0, 14)

  return (
    <div className="rounded-xl border border-slate-200 bg-white p-5 flex flex-col min-h-[280px] lg:min-h-0 dark:border-[#263E7A] dark:bg-[#15285C]">
      <h3 className="text-sm font-semibold text-slate-700 dark:text-white">Activity details</h3>
      <p className="text-xs text-slate-400 mt-0.5 mb-4 dark:text-[#9BBCE5]">
        Last {data.length} days of note captures in this workspace.
      </p>

      <dl className="grid grid-cols-2 gap-3 text-sm">
        <div className="rounded-lg bg-slate-50 px-3 py-2 border border-slate-200 dark:bg-[#1B326D] dark:border-[#263E7A]">
          <dt className="text-[10px] font-semibold uppercase tracking-wider text-slate-400 dark:text-[#9BBCE5]">Total captures</dt>
          <dd className="text-lg font-bold tabular-nums mt-0.5 text-slate-800 dark:text-white">{totalCaptures}</dd>
        </div>
        <div className="rounded-lg bg-slate-50 px-3 py-2 border border-slate-200 dark:bg-[#1B326D] dark:border-[#263E7A]">
          <dt className="text-[10px] font-semibold uppercase tracking-wider text-slate-400 dark:text-[#9BBCE5]">Active days</dt>
          <dd className="text-lg font-bold tabular-nums mt-0.5 text-slate-800 dark:text-white">
            {activeDays}
            <span className="text-xs font-normal text-slate-400 dark:text-[#9BBCE5]"> / {data.length}</span>
          </dd>
        </div>
        <div className="rounded-lg bg-slate-50 px-3 py-2 border border-slate-200 col-span-2 dark:bg-[#1B326D] dark:border-[#263E7A]">
          <dt className="text-[10px] font-semibold uppercase tracking-wider text-slate-400 dark:text-[#9BBCE5]">Busiest day</dt>
          <dd className="text-sm font-semibold mt-0.5 text-slate-800 dark:text-white">
            {maxEntry.count > 0 ? (
              <>
                {maxEntry.count} notes on{' '}
                <span className="text-slate-700 dark:text-[#C9DAF0]">{formatShortDate(maxEntry.date)}</span>
              </>
            ) : (
              <span className="text-slate-400 dark:text-[#9BBCE5]">No activity yet</span>
            )}
          </dd>
        </div>
        <div className="rounded-lg bg-slate-50 px-3 py-2 border border-slate-200 dark:bg-[#1B326D] dark:border-[#263E7A]">
          <dt className="text-[10px] font-semibold uppercase tracking-wider text-slate-400 dark:text-[#9BBCE5]">Avg / active day</dt>
          <dd className="text-base font-semibold tabular-nums mt-0.5 text-slate-800 dark:text-white">{avgPerActiveDay}</dd>
        </div>
        <div className="rounded-lg bg-slate-50 px-3 py-2 border border-slate-200 dark:bg-[#1B326D] dark:border-[#263E7A]">
          <dt className="text-[10px] font-semibold uppercase tracking-wider text-slate-400 dark:text-[#9BBCE5]">Longest idle gap</dt>
          <dd className="text-base font-semibold tabular-nums mt-0.5 text-slate-800 dark:text-white">
            {activeDays <= 1 ? '—' : `${longestGap}d`}
          </dd>
        </div>
      </dl>

      <div className="mt-4 pt-4 border-t border-slate-200 flex-1 flex flex-col min-h-0 dark:border-[#263E7A]">
        <p className="text-[10px] font-semibold uppercase tracking-wider text-slate-400 mb-2 dark:text-[#9BBCE5]">
          Day-by-day (newest first)
        </p>
        <ul className="text-xs space-y-1.5 overflow-y-auto scrollbar-minimal flex-1 max-h-52 lg:max-h-none pr-1">
          {recent.map(d => (
            <li
              key={d.date}
              className="flex items-center justify-between gap-2 py-1 px-2 rounded-md hover:bg-slate-50 dark:hover:bg-[#1B326D]"
            >
              <span className="text-slate-400 tabular-nums dark:text-[#9BBCE5]">{formatShortDate(d.date)}</span>
              <span className={d.count > 0
                ? 'font-semibold text-slate-700 tabular-nums dark:text-white'
                : 'text-slate-300 tabular-nums dark:text-[#4D6BA0]'}>
                {d.count === 0 ? '—' : `${d.count} ${d.count === 1 ? 'note' : 'notes'}`}
              </span>
            </li>
          ))}
        </ul>
      </div>
    </div>
  )
}
