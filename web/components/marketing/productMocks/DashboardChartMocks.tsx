import { cn } from '@/lib/utils'

const HEATMAP_LEVELS = [
  0, 0, 1, 2, 1, 0, 0,
  1, 2, 3, 2, 1, 0, 0,
  0, 1, 3, 4, 3, 2, 1,
  1, 2, 3, 4, 3, 2, 0,
  0, 1, 2, 3, 2, 1, 0,
] as const

const HEATMAP_COLORS = [
  'bg-muted',
  'bg-[#EDE9E3]',
  'bg-[#d6d3d1]',
  'bg-[#78716c]',
  'bg-[#1C1E26]',
] as const

const TOP_DOMAINS = [
  { domain: 'engineering.org', count: 12, width: '88%' },
  { domain: 'wikipedia.org', count: 9, width: '72%' },
  { domain: 'medium.com', count: 6, width: '54%' },
  { domain: 'arxiv.org', count: 4, width: '38%' },
  { domain: 'notion.so', count: 3, width: '28%' },
] as const

export function MockCaptureVolumeChart({ className }: { className?: string }) {
  return (
    <div className={cn('rounded-xl border border-border bg-card p-5', className)}>
      <div className="mb-4">
        <p className="text-sm font-semibold text-foreground">Capture Volume</p>
        <p className="mt-0.5 text-xs text-muted-foreground">Notes captured per day</p>
      </div>
      <svg viewBox="0 0 400 120" className="h-44 w-full" aria-hidden>
        <defs>
          <linearGradient id="mktCaptureFill" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor="#57534e" stopOpacity="0.14" />
            <stop offset="100%" stopColor="#57534e" stopOpacity="0" />
          </linearGradient>
        </defs>
        {[0, 1, 2, 3].map(i => (
          <line
            key={i}
            x1="0"
            y1={24 + i * 24}
            x2="400"
            y2={24 + i * 24}
            stroke="#e7e5e4"
            strokeDasharray="4 4"
          />
        ))}
        <path
          d="M0,92 C40,88 60,72 100,68 C140,64 160,48 200,42 C240,36 280,28 320,24 C360,20 380,18 400,16 L400,120 L0,120 Z"
          fill="url(#mktCaptureFill)"
        />
        <path
          d="M0,92 C40,88 60,72 100,68 C140,64 160,48 200,42 C240,36 280,28 320,24 C360,20 380,18 400,16"
          fill="none"
          stroke="#57534e"
          strokeWidth="2"
        />
      </svg>
    </div>
  )
}

export function MockTopDomainsChart({ className }: { className?: string }) {
  return (
    <div className={cn('rounded-xl border border-border bg-card p-5', className)}>
      <div className="mb-4">
        <p className="text-sm font-semibold text-foreground">Top Domains</p>
        <p className="mt-0.5 text-xs text-muted-foreground">Notes by website</p>
      </div>
      <div className="space-y-3">
        {TOP_DOMAINS.map(row => (
          <div key={row.domain} className="flex items-center gap-3">
            <span className="w-28 shrink-0 truncate text-[10px] text-muted-foreground">{row.domain}</span>
            <div className="relative h-2.5 min-w-0 flex-1 rounded-full bg-muted">
              <div
                className="absolute inset-y-0 left-0 rounded-full bg-[#57534e]"
                style={{ width: row.width }}
              />
            </div>
            <span className="w-6 shrink-0 text-right text-[10px] font-medium text-foreground">{row.count}</span>
          </div>
        ))}
      </div>
    </div>
  )
}

export function MockActivityHeatmap({ className }: { className?: string }) {
  return (
    <div className={cn('rounded-xl border border-border bg-card p-5', className)}>
      <div className="mb-4 flex flex-wrap items-center justify-between gap-3">
        <div>
          <p className="text-sm font-semibold text-foreground">Activity</p>
          <p className="mt-0.5 text-xs text-muted-foreground">Capture frequency, last 30 days</p>
        </div>
        <div className="flex items-center gap-1.5 text-[10px] text-muted-foreground">
          <span>Less</span>
          {HEATMAP_COLORS.map(color => (
            <div key={color} className={cn('h-3 w-3 rounded-sm', color)} />
          ))}
          <span>More</span>
        </div>
      </div>
      <div className="grid grid-cols-7 gap-1">
        {HEATMAP_LEVELS.map((level, i) => (
          <div key={i} className={cn('aspect-square rounded-sm', HEATMAP_COLORS[level])} />
        ))}
      </div>
    </div>
  )
}
