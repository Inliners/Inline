'use client'

import { motion } from 'framer-motion'
import InsightsLoadingStatus from '@/components/insights/InsightsLoadingStatus'
import { chatEmptyFadeContainer, chatEmptyFadeItem } from '@/components/chat/chat-motion'
import { cn } from '@/lib/utils'

export type InsightsStats = {
  totalWeek: number
  aiWeek: number
  topDomains: { domain: string; count: number }[]
}

interface Props {
  narrative: string | null
  stats: InsightsStats | null
  loading?: boolean
  compact?: boolean
  /** card = bordered panel (sidebar); inline = flat assistant voice in analytics chat */
  variant?: 'card' | 'inline'
  /** Staggered float-in for inline analytics opener */
  animateIn?: boolean
  className?: string
  footer?: React.ReactNode
}

export default function InsightsSummary({
  narrative,
  stats,
  loading,
  compact,
  variant = 'card',
  animateIn,
  className,
  footer,
}: Props) {
  if (loading) {
    return (
      <div className={cn(variant === 'inline' ? 'py-1' : 'flex items-center justify-center py-6', className)}>
        <InsightsLoadingStatus />
      </div>
    )
  }

  const inline = variant === 'inline'
  const Root = animateIn && inline ? motion.div : 'div'
  const Section = animateIn && inline ? motion.div : 'div'
  const rootProps = animateIn && inline
    ? { variants: chatEmptyFadeContainer, initial: 'hidden' as const, animate: 'show' as const }
    : {}
  const sectionProps = animateIn && inline ? { variants: chatEmptyFadeItem } : {}

  return (
    <Root className={cn('space-y-4', className)} {...rootProps}>
      {narrative && (
        inline ? (
          <Section className="space-y-2" {...sectionProps}>
            <p className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
              What you&apos;re researching
            </p>
            <p className={cn('leading-relaxed text-foreground', compact ? 'text-sm' : 'text-sm sm:text-base')}>
              {narrative}
            </p>
          </Section>
        ) : (
          <div className="rounded-2xl border border-border bg-card p-5">
            <p className="text-xs font-semibold uppercase tracking-wider text-muted-foreground mb-2">
              What you&apos;re researching
            </p>
            <p className={cn('leading-relaxed text-foreground', compact ? 'text-sm' : 'text-base')}>
              {narrative}
            </p>
          </div>
        )
      )}

      {stats && (
        <Section
          className="flex flex-wrap gap-x-3 gap-y-1.5"
          {...sectionProps}
        >
          <span className={cn(
            'text-xs font-medium text-foreground',
            !inline && 'rounded-full border border-border bg-muted/50 px-3 py-1',
          )}>
            {stats.totalWeek} captures this week
          </span>
          {stats.aiWeek > 0 && (
            <span className={cn(
              'text-xs font-medium text-foreground',
              !inline && 'rounded-full border border-border bg-muted/50 px-3 py-1',
            )}>
              {stats.aiWeek} AI summaries
            </span>
          )}
          {stats.topDomains.slice(0, 3).map(d => (
            <span
              key={d.domain}
              className={cn(
                'text-xs text-muted-foreground',
                !inline && 'rounded-full border border-border bg-muted/50 px-3 py-1',
              )}
            >
              {d.domain} ({d.count})
            </span>
          ))}
        </Section>
      )}

      {!narrative && !stats && (
        <p className="text-sm text-muted-foreground">
          Capture a few pages with the extension — insights appear once you have activity this week.
        </p>
      )}

      {footer ? (
        <Section className="space-y-3" {...sectionProps}>
          {footer}
        </Section>
      ) : null}
    </Root>
  )
}
