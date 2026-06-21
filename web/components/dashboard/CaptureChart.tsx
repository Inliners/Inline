'use client'

import {
  AreaChart, Area, XAxis, YAxis, CartesianGrid,
  Tooltip, ResponsiveContainer,
} from 'recharts'
import type { DailyCapture } from '@/lib/types'

interface CaptureChartProps {
  data: DailyCapture[]
}

function formatDate(dateStr: string) {
  const d = new Date(dateStr)
  return d.toLocaleDateString('en-US', { month: 'short', day: 'numeric' })
}

const CHART_STROKE = '#57534e'

function CustomTooltip({ active, payload, label }: { active?: boolean; payload?: { value: number }[]; label?: string }) {
  if (!active || !payload?.length) return null
  return (
    <div className="rounded-lg border border-border bg-card px-3 py-2 text-xs shadow-sm">
      <p className="mb-1 text-muted-foreground">{label}</p>
      <p className="font-semibold text-foreground">{payload[0].value} notes</p>
    </div>
  )
}

export default function CaptureChart({ data }: CaptureChartProps) {
  const formatted = data.map(d => ({ ...d, label: formatDate(d.date) }))

  return (
    <div className="rounded-xl border border-border bg-card p-5">
      <div className="mb-5">
        <p className="text-sm font-semibold text-foreground">Capture Volume</p>
        <p className="mt-0.5 text-xs text-muted-foreground">Notes captured per day</p>
      </div>
      <div className="relative h-48">
        <ResponsiveContainer width="100%" height="100%" minWidth={1} minHeight={1}>
          <AreaChart data={formatted} margin={{ top: 4, right: 4, left: -24, bottom: 0 }}>
            <defs>
              <linearGradient id="captureGradient" x1="0" y1="0" x2="0" y2="1">
                <stop offset="0%" stopColor={CHART_STROKE} stopOpacity={0.14} />
                <stop offset="100%" stopColor={CHART_STROKE} stopOpacity={0} />
              </linearGradient>
            </defs>
            <CartesianGrid strokeDasharray="3 3" stroke="#e7e5e4" vertical={false} />
            <XAxis
              dataKey="label"
              tick={{ fontSize: 10, fill: '#78716c' }}
              tickLine={false}
              axisLine={false}
              interval={5}
            />
            <YAxis
              tick={{ fontSize: 10, fill: '#78716c' }}
              tickLine={false}
              axisLine={false}
            />
            <Tooltip content={<CustomTooltip />} cursor={{ stroke: '#d6d3d1' }} />
            <Area
              type="monotone"
              dataKey="count"
              stroke={CHART_STROKE}
              strokeWidth={2}
              fill="url(#captureGradient)"
              dot={false}
              activeDot={{ r: 4, fill: CHART_STROKE, strokeWidth: 0 }}
            />
          </AreaChart>
        </ResponsiveContainer>
      </div>
    </div>
  )
}
