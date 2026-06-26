'use client'

import { useCallback, useEffect, useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import EmbeddedInsightsChat from '@/components/analytics/EmbeddedInsightsChat'
import AiFeedbackBar from '@/components/ai/AiFeedbackBar'
import type { InsightsStats } from '@/components/insights/InsightsSummary'
import { cn } from '@/lib/utils'

interface Props {
  workspaceId: string
}

export default function AnalyticsInsightsView({ workspaceId }: Props) {
  const [narrative, setNarrative] = useState<string | null>(null)
  const [stats, setStats] = useState<InsightsStats | null>(null)
  const [loading, setLoading] = useState(true)

  const load = useCallback(async () => {
    setLoading(true)
    try {
      const res = await fetch('/api/ai/insights', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ workspaceId }),
      })
      if (res.ok) {
        const json = await res.json() as {
          narrative?: string
          stats?: InsightsStats
        }
        setNarrative(json.narrative ?? null)
        setStats(json.stats ?? null)
      }
    } catch { /* ignore */ }
    finally { setLoading(false) }
  }, [workspaceId])

  useEffect(() => { void load() }, [load])

  const topDomain = stats?.topDomains?.[0]?.domain

  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -6 }}
      transition={{ duration: 0.28 }}
      className="flex h-full min-h-0 flex-1 flex-col"
    >
      <EmbeddedInsightsChat
        workspaceId={workspaceId}
        topDomain={topDomain}
        narrative={narrative}
        stats={stats}
        insightsLoading={loading}
        insightsFooter={
          !loading && narrative ? (
            <AiFeedbackBar
              workspaceId={workspaceId}
              surface="insights"
              targetId={`insights-${workspaceId}`}
            />
          ) : undefined
        }
        contextLabel={
          stats && stats.totalWeek > 0
            ? `Recent research · ${stats.totalWeek} capture${stats.totalWeek === 1 ? '' : 's'} this week`
            : 'Ask about your captures — answers cite your sources'
        }
      />
    </motion.div>
  )
}

export function AnalyticsViewToggle({
  mode,
  onChange,
  className,
}: {
  mode: 'charts' | 'insights'
  onChange: (mode: 'charts' | 'insights') => void
  className?: string
}) {
  return (
    <div
      className={cn(
        'inline-flex w-fit self-start rounded-full border border-border bg-muted p-1',
        className,
      )}
      role="tablist"
      aria-label="Analytics view"
    >
      {(['charts', 'insights'] as const).map(v => (
        <button
          key={v}
          type="button"
          role="tab"
          aria-selected={mode === v}
          onClick={() => onChange(v)}
          className={cn(
            'rounded-full px-4 py-1.5 text-sm font-medium transition-colors cursor-pointer capitalize',
            mode === v
              ? 'bg-card text-foreground shadow-sm'
              : 'text-muted-foreground hover:text-foreground',
          )}
        >
          {v}
        </button>
      ))}
    </div>
  )
}

export function AnalyticsModeShell({
  mode,
  onModeChange,
  charts,
  workspaceId,
}: {
  mode: 'charts' | 'insights'
  onModeChange: (m: 'charts' | 'insights') => void
  charts: React.ReactNode
  workspaceId: string
}) {
  return (
    <div
      className={cn(
        'flex flex-col',
        mode === 'insights' && 'h-full min-h-0 overflow-hidden',
      )}
    >
      <AnalyticsViewToggle mode={mode} onChange={onModeChange} className="shrink-0" />

      <AnimatePresence mode="wait">
        {mode === 'charts' ? (
          <motion.div
            key="charts"
            initial={{ opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -6 }}
            transition={{ duration: 0.25 }}
            className="mt-6"
          >
            {charts}
          </motion.div>
        ) : (
          <motion.div
            key="insights"
            initial={{ opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -6 }}
            transition={{ duration: 0.25 }}
            className="mt-6 flex min-h-0 flex-1 flex-col overflow-hidden"
          >
            <AnalyticsInsightsView workspaceId={workspaceId} />
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  )
}
