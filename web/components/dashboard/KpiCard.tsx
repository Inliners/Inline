import Link from 'next/link'
import { cn } from '@/lib/utils'
import { TrendingUp, TrendingDown } from 'lucide-react'

interface KpiCardProps {
  title: string
  value: string | number
  delta?: number
  deltaLabel?: string
  icon: React.ElementType
  iconColor?: string
  description?: string
  href?: string
}

export default function KpiCard({
  title,
  value,
  delta,
  deltaLabel,
  icon: Icon,
  iconColor = 'text-foreground',
  description,
  href,
}: KpiCardProps) {
  const isPositive = delta !== undefined && delta >= 0

  const content = (
    <>
      <div className="flex items-center justify-between">
        <p className="text-xs font-medium tracking-wide text-muted-foreground">{title}</p>
        <div
          className={cn(
            'flex h-8 w-8 items-center justify-center rounded-lg bg-muted p-1.5',
            iconColor,
          )}
        >
          <Icon className="h-4 w-4" />
        </div>
      </div>
      <div>
        <p className="text-2xl font-bold tracking-tight text-foreground">{value}</p>
        {delta !== undefined && (
          <div className="mt-1 flex items-center gap-1.5">
            <span
              className={cn(
                'inline-flex items-center gap-0.5 text-xs font-medium',
                isPositive ? 'text-emerald-700' : 'text-red-600',
              )}
            >
              {isPositive ? <TrendingUp className="h-3 w-3" /> : <TrendingDown className="h-3 w-3" />}
              {isPositive ? '+' : ''}
              {delta}%
            </span>
            {deltaLabel && <span className="text-xs text-muted-foreground">{deltaLabel}</span>}
          </div>
        )}
        {description && !delta && (
          <p className="mt-1 text-xs text-muted-foreground">{description}</p>
        )}
      </div>
    </>
  )

  if (href) {
    return (
      <Link
        href={href}
        className="block space-y-3 rounded-xl border border-border bg-card p-5 transition-colors hover:border-stone-400/50 cursor-pointer"
      >
        {content}
      </Link>
    )
  }

  return <div className="space-y-3 rounded-xl border border-border bg-card p-5">{content}</div>
}
