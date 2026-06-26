'use client'

import { useEffect, useState, useCallback } from 'react'
import { usePathname } from 'next/navigation'
import { motion } from 'framer-motion'
import InsightsSummary, { type InsightsStats } from '@/components/insights/InsightsSummary'
import { Clock, Globe, BrainCircuit, TrendingUp, Activity, FileText, Loader2 } from 'lucide-react'
import { cn } from '@/lib/utils'

/* ─── types ─── */
interface FeedItem {
  id:      string
  kind:    'note' | 'extraction'
  label:   string
  sub:     string
  type:    string
  snippet: string
  time:    string
}

function relTime(iso: string): string {
  const diff = Date.now() - new Date(iso).getTime()
  const mins = Math.floor(diff / 60000)
  if (mins < 1)  return 'just now'
  if (mins < 60) return `${mins}m ago`
  const hrs = Math.floor(mins / 60)
  if (hrs < 24)  return `${hrs}h ago`
  return `${Math.floor(hrs / 24)}d ago`
}

import { resolveWorkspaceIdFromBrowserPath } from '@/lib/workspace-routes'

function getWsId(pathname: string): string {
  return resolveWorkspaceIdFromBrowserPath(pathname)
}

const KIND_ICON: Record<string, React.ElementType> = {
  note:        Globe,
  'ai-summary': BrainCircuit,
  extraction:  TrendingUp,
  highlight:   FileText,
}

export default function RightContextPanel() {
  const pathname  = usePathname()
  const wsId      = getWsId(pathname)
  const [tab, setTab] = useState<'activity' | 'insights'>('activity')

  /* ─── activity feed ─── */
  const [feed, setFeed]         = useState<FeedItem[]>([])
  const [feedLoading, setFeedLoading] = useState(false)

  const loadActivity = useCallback(async () => {
    setFeedLoading(true)
    try {
      const res = await fetch(`/api/workspace/${wsId}/activity`)
      if (res.ok) {
        const json = await res.json() as { feed: FeedItem[] }
        setFeed(json.feed ?? [])
      }
    } catch { /* ignore */ }
    finally { setFeedLoading(false) }
  }, [wsId])

  useEffect(() => { void loadActivity() }, [loadActivity])
  useEffect(() => { setTab('activity') }, [pathname])

  /* ─── insights ─── */
  const [insightText,    setInsightText]    = useState<string | null>(null)
  const [insightStats,   setInsightStats]   = useState<InsightsStats | null>(null)
  const [insightLoading, setInsightLoading] = useState(false)

  const loadInsights = useCallback(async () => {
    if (insightText) return
    setInsightLoading(true)
    try {
      const res = await fetch('/api/ai/insights', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ workspaceId: wsId }),
      })
      if (res.ok) {
        const json = await res.json() as { narrative?: string; stats?: InsightsStats }
        setInsightText(json.narrative ?? null)
        setInsightStats(json.stats ?? null)
      }
    } catch { /* ignore */ }
    finally { setInsightLoading(false) }
  }, [wsId, insightText])

  useEffect(() => {
    if (tab === 'insights') void loadInsights()
  }, [tab, loadInsights])

  const panelEase = [0.4, 0, 0.2, 1] as const
  const panelDuration = 0.22

  return (
    <motion.aside
      initial={{ x: 20, opacity: 0 }}
      animate={{ x: 0, opacity: 1 }}
      exit={{ x: 16, opacity: 0 }}
      transition={{ duration: panelDuration, ease: panelEase }}
      className="flex h-screen w-60 shrink-0 flex-col overflow-hidden border-l border-border bg-card will-change-transform"
      style={{ transform: 'translateZ(0)' }}
    >
      {/* Header tabs */}
      <div className="flex h-[52px] shrink-0 items-center gap-1 border-b border-border bg-card px-3">
        {(['activity', 'insights'] as const).map(t => (
          <button
            key={t}
            type="button"
            onClick={() => setTab(t)}
            className={cn(
              'h-7 flex-1 cursor-pointer rounded-md text-xs font-semibold transition-colors duration-150',
              tab === t
                ? 'bg-white/90 text-foreground shadow-sm ring-1 ring-border/60'
                : 'text-muted-foreground hover:bg-white/50 hover:text-foreground',
            )}
          >
            {t === 'activity' ? 'Activity' : 'Insights'}
          </button>
        ))}
      </div>

      <div className="scrollbar-minimal flex-1 space-y-2 overflow-y-auto px-3 py-3">

        {/* ── Activity tab ── */}
        {tab === 'activity' && (
          <>
            <p className="mb-2 px-1 text-[10px] font-bold uppercase tracking-wider text-muted-foreground">
              Recent Workspace Activity
            </p>
            {feedLoading && (
              <div className="flex items-center justify-center py-8">
                <Loader2 className="h-4 w-4 animate-spin text-muted-foreground" />
              </div>
            )}
            {!feedLoading && feed.length === 0 && (
              <p className="px-1 text-[11px] text-muted-foreground/80">No activity yet.</p>
            )}
            {!feedLoading && feed.map(item => {
              const Icon = KIND_ICON[item.type] ?? KIND_ICON[item.kind] ?? Activity
              const color =
                item.kind === 'extraction'
                  ? '#b45309'
                  : item.type === 'ai-summary'
                    ? '#0f766e'
                    : '#57534e'
              return (
                <div
                  key={item.id}
                  className="flex items-start gap-2.5 rounded-lg px-2 py-2 transition-colors hover:bg-muted/80"
                >
                  <div
                    className="mt-0.5 flex h-7 w-7 shrink-0 items-center justify-center rounded-lg"
                    style={{ backgroundColor: `${color}18` }}
                  >
                    <Icon className="h-3.5 w-3.5" style={{ color }} />
                  </div>
                  <div className="min-w-0 flex-1">
                    <p className="truncate text-[12px] font-semibold text-foreground">{item.label}</p>
                    <p className="truncate text-[10.5px] text-muted-foreground">{item.sub}</p>
                    {item.snippet && (
                      <p className="mt-0.5 truncate text-[10px] text-muted-foreground/80">{item.snippet}</p>
                    )}
                    <p className="mt-0.5 text-[10px] text-muted-foreground/70">{relTime(item.time)}</p>
                  </div>
                </div>
              )
            })}
          </>
        )}

        {/* ── Insights tab ── */}
        {tab === 'insights' && (
          <InsightsSummary
            narrative={insightText}
            stats={insightStats}
            loading={insightLoading}
            compact
          />
        )}
      </div>

      {/* Footer */}
      <div className="shrink-0 border-t border-border px-3 py-3">
        <div className="flex items-center gap-1.5 text-[10.5px] text-muted-foreground">
          <Clock className="h-3 w-3" />
          <span>Workspace: {wsId}</span>
        </div>
      </div>
    </motion.aside>
  )
}
