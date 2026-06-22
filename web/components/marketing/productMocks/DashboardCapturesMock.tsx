import { Globe, Star } from 'lucide-react'
import { DEMO_CAPTURES } from '@/components/marketing/productMocks/sampleData'
import { cn } from '@/lib/utils'

type DashboardCapturesMockProps = {
  className?: string
  limit?: number
  size?: 'default' | 'compact'
}

export default function DashboardCapturesMock({
  className,
  limit = 3,
  size = 'default',
}: DashboardCapturesMockProps) {
  const captures = DEMO_CAPTURES.slice(0, limit)
  const compact = size === 'compact'

  return (
    <div className={cn('flex gap-3 overflow-x-auto overflow-y-hidden pb-2 scrollbar-minimal', className)}>
      {captures.map(capture => (
        <div
          key={capture.title}
          className={cn(
            'relative flex shrink-0 snap-start flex-col justify-between rounded-2xl border border-border bg-card',
            compact ? 'h-36 w-[200px] p-4' : 'h-40 w-[240px] p-5',
          )}
        >
          {capture.pinned && (
            <Star className="absolute right-3 top-3 h-4 w-4 fill-amber-400 text-amber-400" aria-hidden />
          )}
          <div>
            <p
              className={cn(
                'line-clamp-1 pr-6 font-semibold tracking-tight text-foreground',
                compact ? 'text-sm' : 'text-base',
              )}
            >
              {capture.title}
            </p>
            <p className="mt-1 line-clamp-2 text-xs text-muted-foreground">{capture.preview}</p>
          </div>
          <div className="mt-4 flex items-center justify-between gap-2">
            <span className="inline-flex min-w-0 items-center gap-1 text-[10px] text-muted-foreground">
              <Globe className="h-3 w-3 shrink-0" aria-hidden />
              <span className="truncate">{capture.domain}</span>
            </span>
            <span className="shrink-0 text-[10px] text-muted-foreground">{capture.time}</span>
          </div>
        </div>
      ))}
    </div>
  )
}
