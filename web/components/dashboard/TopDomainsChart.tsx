'use client'

import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid,
  Tooltip, ResponsiveContainer, Cell,
} from 'recharts'
import type { DomainStat } from '@/lib/types'

const COLORS = ['#57534e', '#0f766e', '#b45309', '#7c3aed', '#a16207', '#9f1239', '#78716c']

function CustomTooltip({ active, payload }: { active?: boolean; payload?: { payload: DomainStat }[] }) {
  if (!active || !payload?.length) return null
  const d = payload[0].payload
  return (
    <div className="rounded-lg border border-border bg-card px-3 py-2 text-xs shadow-sm">
      <p className="mb-1 font-medium text-foreground">{d.domain}</p>
      <p className="text-muted-foreground">
        {d.count} notes &middot; {d.percentage}%
      </p>
    </div>
  )
}

interface TopDomainsChartProps {
  data: DomainStat[]
}

export default function TopDomainsChart({ data }: TopDomainsChartProps) {
  return (
    <div className="rounded-xl border border-border bg-card p-5">
      <div className="mb-5">
        <p className="text-sm font-semibold text-foreground">Top Domains</p>
        <p className="mt-0.5 text-xs text-muted-foreground">Notes by website</p>
      </div>
      <div className="relative h-48">
        <ResponsiveContainer width="100%" height="100%" minWidth={1} minHeight={1}>
          <BarChart
            data={data.slice(0, 6)}
            layout="vertical"
            margin={{ top: 0, right: 8, left: 0, bottom: 0 }}
            barSize={10}
          >
            <CartesianGrid strokeDasharray="3 3" stroke="#e7e5e4" horizontal={false} />
            <XAxis
              type="number"
              tick={{ fontSize: 10, fill: '#78716c' }}
              tickLine={false}
              axisLine={false}
            />
            <YAxis
              type="category"
              dataKey="domain"
              tick={{ fontSize: 10, fill: '#78716c' }}
              tickLine={false}
              axisLine={false}
              width={120}
            />
            <Tooltip content={<CustomTooltip />} cursor={{ fill: '#f5f5f4' }} />
            <Bar dataKey="count" radius={[0, 4, 4, 0]}>
              {data.slice(0, 6).map((_, i) => (
                <Cell key={i} fill={COLORS[i % COLORS.length]} />
              ))}
            </Bar>
          </BarChart>
        </ResponsiveContainer>
      </div>
    </div>
  )
}
