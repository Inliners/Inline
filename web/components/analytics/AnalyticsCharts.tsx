'use client'

import { useState, useMemo } from 'react'
import ActivityHeatmap from '@/components/dashboard/ActivityHeatmap'
import ActivityDetailPanel from '@/components/analytics/ActivityDetailPanel'
import {
  ResponsiveContainer, BarChart, Bar,
  XAxis, YAxis, CartesianGrid, Tooltip, Legend,
  PieChart, Pie, Cell, AreaChart, Area,
} from 'recharts'
import type { DashboardStats } from '@/lib/types'
import { cn } from '@/lib/utils'
import {
  TrendingUp, TrendingDown, BookMarked, Globe, BrainCircuit, Flame,
  Pencil, Highlighter, Anchor,
} from 'lucide-react'

interface TimeSeries { date: string; count: number; ai: number }
interface Props {
  stats:        DashboardStats
  timeSeries30: TimeSeries[]
  timeSeries7:  TimeSeries[]
  workspaceId:  string
}

const CHART_COLORS = {
  primary:  '#4B83C4',
  teal:     '#0F7B6C',
  amber:    '#CB912F',
  violet:   '#9065B0',
  grid:     '#E3E2DE',
  text:     '#9B9A97',
}

const NOTE_TYPE_PALETTE: Record<string, { label: string; color: string }> = {
  text:         { label: 'Text',         color: '#4B83C4' },
  canvas:       { label: 'Canvas',       color: '#9065B0' },
  'ai-summary': { label: 'AI Summary',   color: '#0F7B6C' },
  sticky:       { label: 'Sticky',       color: '#CB912F' },
  anchor:       { label: 'Anchor',       color: '#B8651B' },
  drawing:      { label: 'Drawing',      color: '#7C3AED' },
  handwriting:  { label: 'Handwriting',  color: '#C026D3' },
  highlight:    { label: 'Highlight',    color: '#65A30D' },
  clip:         { label: 'Clip',         color: '#0EA5E9' },
  stamp:        { label: 'Stamp',        color: '#E11D48' },
  'paper-note': { label: 'Paper note',   color: '#EA580C' },
}

type Period = '7d' | '30d'

// ---------------------------------------------------------------------------
// Sub-components
// ---------------------------------------------------------------------------
function StatChip({ label, value, delta, icon: Icon, iconColor }: {
  label: string; value: string | number; delta?: number; icon: React.ElementType; iconColor: string
}) {
  const pos = delta !== undefined && delta >= 0
  return (
    <div className="rounded-xl border border-slate-200 bg-white p-4 flex items-start gap-3 dark:border-[#263E7A] dark:bg-[#15285C]">
      <div className={cn('w-9 h-9 rounded-lg bg-slate-100 flex items-center justify-center shrink-0 dark:bg-[#1B326D]', iconColor)}>
        <Icon className="w-4 h-4" />
      </div>
      <div>
        <p className="text-xs font-medium text-slate-400 uppercase tracking-wider mb-1 dark:text-[#9BBCE5]">{label}</p>
        <p className="text-2xl font-bold tracking-tight text-slate-800 dark:text-white">{value}</p>
        {delta !== undefined && (
          <span className={cn('text-xs font-medium flex items-center gap-1 mt-0.5', pos ? 'text-emerald-500 dark:text-emerald-300' : 'text-red-400 dark:text-red-300')}>
            {pos ? <TrendingUp className="w-3 h-3" /> : <TrendingDown className="w-3 h-3" />}
            {pos ? '+' : ''}{delta}% vs last period
          </span>
        )}
      </div>
    </div>
  )
}

function PeriodToggle({ period, onChange }: { period: Period; onChange: (p: Period) => void }) {
  return (
    <div className="flex rounded-lg border border-slate-200 bg-slate-50 p-0.5 gap-0.5 dark:border-[#263E7A] dark:bg-[#10214A]">
      {(['7d', '30d'] as Period[]).map(p => (
        <button
          key={p}
          onClick={() => onChange(p)}
          className={cn(
            'px-3 py-1 rounded-md text-xs font-semibold transition-all cursor-pointer',
            period === p
              ? 'bg-white border border-slate-200 text-slate-700 dark:bg-[#1B326D] dark:border-[#355199] dark:text-white'
              : 'text-slate-400 hover:text-slate-700 dark:text-[#9BBCE5] dark:hover:text-white',
          )}
        >
          {p === '7d' ? 'Last 7 days' : 'Last 30 days'}
        </button>
      ))}
    </div>
  )
}

// Custom Recharts tooltip
function CustomTooltip({ active, payload, label }: { active?: boolean; payload?: { name: string; value: number; color: string }[]; label?: string }) {
  if (!active || !payload?.length) return null
  return (
    <div className="bg-white border border-slate-200 rounded-xl px-3 py-2 text-sm dark:bg-[#1E3878] dark:border-[#355199]">
      <p className="text-xs text-slate-400 mb-1 dark:text-[#9BBCE5]">{label}</p>
      {payload.map((p, i) => (
        <div key={i} className="flex items-center gap-2">
          <span className="w-2 h-2 rounded-full" style={{ background: p.color }} />
          <span className="text-slate-700 font-medium dark:text-white">{p.name}: {p.value}</span>
        </div>
      ))}
    </div>
  )
}

// ---------------------------------------------------------------------------
// Main charts component
// ---------------------------------------------------------------------------
export default function AnalyticsCharts({ stats, timeSeries30, timeSeries7 }: Props) {
  const [period, setPeriod] = useState<Period>('30d')

  const series = period === '7d' ? timeSeries7 : timeSeries30

  // Format date labels
  const chartData = useMemo(() => series.map(d => ({
    ...d,
    label: new Date(d.date + 'T00:00:00').toLocaleDateString('en-US', { month: 'short', day: 'numeric' }),
  })), [series])

  const noteTypeData = useMemo(() => {
    const tc = stats.typeCounts ?? {}
    const entries = Object.entries(tc) as [string, number][]
    if (entries.length === 0) {
      // Fall back to a neutral single bucket if the DB has no data yet.
      return [{ name: 'Notes', value: Math.max(1, stats.totalNotes), color: NOTE_TYPE_PALETTE.text.color }]
    }
    return entries
      .filter(([, v]) => v > 0)
      .sort((a, b) => b[1] - a[1])
      .map(([type, value]) => ({
        name: NOTE_TYPE_PALETTE[type]?.label ?? type,
        value,
        color: NOTE_TYPE_PALETTE[type]?.color ?? '#6B7280',
      }))
  }, [stats.typeCounts, stats.totalNotes])

  // Domain data from topDomains
  const domainData = stats.topDomains.slice(0, 8).map(d => ({
    domain:  d.domain.replace(/^www\./, '').slice(0, 18),
    count:   d.count,
    pct:     d.percentage,
  }))

  const totalCaptures = series.reduce((sum, d) => sum + d.count, 0)
  const totalAI       = series.reduce((sum, d) => sum + d.ai, 0)
  const avgPerDay     = totalCaptures > 0 ? (totalCaptures / series.length).toFixed(1) : '0'

  return (
    <div className="space-y-6">
      <section id="activity" className="scroll-mt-28 space-y-4">
        <div>
          <h2 className="text-base font-semibold text-slate-700 dark:text-white">Activity</h2>
          <p className="text-xs text-slate-400 mt-0.5 max-w-2xl dark:text-[#9BBCE5]">
            Daily capture intensity plus a breakdown of totals, your busiest day, and a recent day-by-day log.
          </p>
        </div>
        <div className="grid lg:grid-cols-5 gap-6 items-start">
          <div className="lg:col-span-3 min-w-0">
            <ActivityHeatmap data={stats.captureHistory} />
          </div>
          <div className="lg:col-span-2 min-w-0">
            <ActivityDetailPanel data={stats.captureHistory} />
          </div>
        </div>
      </section>

      {/* ── KPI row ── */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <StatChip label="Total Notes"     value={stats.totalNotes}      icon={BookMarked}   iconColor="text-[#37352F]" />
        <StatChip label="Domains Tracked" value={stats.totalDomains}    icon={Globe}        iconColor="text-sky-500" delta={stats.notesThisWeekDelta} />
        <StatChip label="AI Queries"      value={stats.aiQueriesRun}    icon={BrainCircuit} iconColor="text-emerald-500" />
        <StatChip label="Day Streak"      value={`${stats.streakDays}d`} icon={Flame}       iconColor="text-amber-500" />
      </div>

      {/* ── Activity type KPI row ── */}
      <div className="grid grid-cols-3 gap-4">
        <StatChip label="Drawings"   value={stats.typeCounts?.drawing ?? 0}   icon={Pencil}      iconColor="text-violet-500" />
        <StatChip label="Highlights" value={stats.typeCounts?.highlight ?? 0} icon={Highlighter} iconColor="text-lime-600" />
        <StatChip label="Anchors"    value={stats.typeCounts?.anchor ?? 0}    icon={Anchor}      iconColor="text-amber-600" />
      </div>

      {/* ── Capture volume chart ── */}
      <div className="rounded-2xl border border-slate-200 bg-white p-5 dark:border-[#263E7A] dark:bg-[#15285C]">
        <div className="flex items-center justify-between mb-5">
          <div>
            <h2 className="text-sm font-semibold text-slate-800 dark:text-white">Capture Volume</h2>
            <p className="text-xs text-slate-400 mt-0.5 dark:text-[#9BBCE5]">
              {totalCaptures} total · {avgPerDay}/day avg · {totalAI} AI summaries
            </p>
          </div>
          <PeriodToggle period={period} onChange={setPeriod} />
        </div>
        <ResponsiveContainer width="100%" height={240}>
          <AreaChart data={chartData} margin={{ top: 4, right: 4, left: -20, bottom: 0 }}>
            <defs>
              <linearGradient id="captureGrad" x1="0" y1="0" x2="0" y2="1">
                <stop offset="5%"  stopColor={CHART_COLORS.primary} stopOpacity={0.15} />
                <stop offset="95%" stopColor={CHART_COLORS.primary} stopOpacity={0}    />
              </linearGradient>
              <linearGradient id="aiGrad" x1="0" y1="0" x2="0" y2="1">
                <stop offset="5%"  stopColor={CHART_COLORS.teal} stopOpacity={0.15} />
                <stop offset="95%" stopColor={CHART_COLORS.teal} stopOpacity={0}    />
              </linearGradient>
            </defs>
            <CartesianGrid strokeDasharray="3 3" stroke={CHART_COLORS.grid} vertical={false} />
            <XAxis dataKey="label" tick={{ fill: CHART_COLORS.text, fontSize: 10 }} tickLine={false} axisLine={false}
              interval={period === '7d' ? 0 : 'preserveStartEnd'} />
            <YAxis tick={{ fill: CHART_COLORS.text, fontSize: 10 }} tickLine={false} axisLine={false} allowDecimals={false} />
            <Tooltip content={<CustomTooltip />} />
            <Legend wrapperStyle={{ fontSize: 11, paddingTop: 8 }} />
            <Area type="monotone" dataKey="count" name="Notes" stroke={CHART_COLORS.primary} strokeWidth={2} fill="url(#captureGrad)" dot={false} activeDot={{ r: 5 }} />
            <Area type="monotone" dataKey="ai"    name="AI"    stroke={CHART_COLORS.teal}    strokeWidth={2} fill="url(#aiGrad)"      dot={false} activeDot={{ r: 5 }} />
          </AreaChart>
        </ResponsiveContainer>
      </div>

      {/* ── Bottom row: domains + type split ── */}
      <div className="grid lg:grid-cols-2 gap-5">

        {/* Domain breakdown */}
        <div className="rounded-2xl border border-slate-200 bg-white p-5 dark:border-[#263E7A] dark:bg-[#15285C]">
          <h2 className="text-sm font-semibold mb-4 text-slate-800 dark:text-white">Top Domains</h2>
          <ResponsiveContainer width="100%" height={220}>
            <BarChart data={domainData} layout="vertical" margin={{ top: 0, right: 4, left: 0, bottom: 0 }}>
              <CartesianGrid strokeDasharray="3 3" stroke={CHART_COLORS.grid} horizontal={false} />
              <XAxis type="number" tick={{ fill: CHART_COLORS.text, fontSize: 10 }} tickLine={false} axisLine={false} />
              <YAxis type="category" dataKey="domain" width={90} tick={{ fill: CHART_COLORS.text, fontSize: 10 }} tickLine={false} axisLine={false} />
              <Tooltip content={<CustomTooltip />} />
              <Bar dataKey="count" name="Notes" fill={CHART_COLORS.primary} radius={[0, 6, 6, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </div>

        {/* Note type split */}
        <div className="rounded-2xl border border-slate-200 bg-white p-5 flex flex-col dark:border-[#263E7A] dark:bg-[#15285C]">
          <h2 className="text-sm font-semibold mb-4 text-slate-800 dark:text-white">Note Type Distribution</h2>
          <div className="flex-1 flex items-center justify-center">
            <div className="w-full flex items-center gap-6">
              <ResponsiveContainer width="60%" height={180}>
                <PieChart>
                  <Pie
                    data={noteTypeData}
                    cx="50%" cy="50%"
                    innerRadius={50} outerRadius={75}
                    paddingAngle={3}
                    dataKey="value"
                  >
                    {noteTypeData.map((d, i) => (
                      <Cell key={i} fill={d.color} />
                    ))}
                  </Pie>
                  <Tooltip content={<CustomTooltip />} />
                </PieChart>
              </ResponsiveContainer>
              <div className="space-y-3 overflow-y-auto max-h-[180px] pr-1">
                {noteTypeData.map((item) => (
                  <div key={item.name} className="flex items-center gap-2">
                    <span className="w-3 h-3 rounded-full shrink-0" style={{ background: item.color }} />
                    <div>
                      <p className="text-xs font-semibold text-slate-700 dark:text-white">{item.name}</p>
                      <p className="text-xs text-slate-400 dark:text-[#9BBCE5]">{item.value} notes</p>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      </div>

    </div>
  )
}
