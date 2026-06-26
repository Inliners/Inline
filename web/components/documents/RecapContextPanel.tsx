'use client'

import { useCallback, useEffect, useMemo, useState } from 'react'
import {
  AlertTriangle, ChevronDown, ChevronRight,
  Clock, Hash, ListTree, RefreshCw, Sparkles, X,
} from 'lucide-react'
import type { FolderDocument } from '@/lib/workspace-library'
import type { Note } from '@/lib/types'
import {
  buildRecapInsights,
  buildRecapStats,
  buildRecapTimeline,
  type RecapInsight,
} from '@/lib/recap-meta'
import {
  parseDocumentOutline,
  parseDocumentSymbols,
  scrollToHeadingIndex,
  scrollToSymbol,
  countDocumentWords,
  extractHeadingsFromHtml,
  type OutlineNode,
} from '@/lib/document-outline'
import DocumentSideRail from './DocumentSideRail'
import { cn } from '@/lib/utils'
import { useChatPanel } from '@/lib/chat-panel-context'

type Tab = 'outline' | 'symbols' | 'history'

interface Props {
  doc: FolderDocument
  notes: Note[]
  contentHtml: string
  loadingNotes?: boolean
  onRegenerate: () => void
  regenerating?: boolean
  collapsed?: boolean
  onCollapsedChange?: (collapsed: boolean) => void
}

const DISMISS_KEY = (docId: string) => `inline-recap-dismissed-${docId}`
const PANEL_KEY = 'inline-doc-panel-collapsed'

function loadDismissed(docId: string): Set<string> {
  if (typeof window === 'undefined') return new Set()
  try {
    const raw = localStorage.getItem(DISMISS_KEY(docId))
    return raw ? new Set(JSON.parse(raw) as string[]) : new Set()
  } catch {
    return new Set()
  }
}

function saveDismissed(docId: string, ids: Set<string>) {
  localStorage.setItem(DISMISS_KEY(docId), JSON.stringify([...ids]))
}

function insightIcon(kind: RecapInsight['kind']) {
  switch (kind) {
    case 'ai-summary': return Sparkles
    case 'stale':
    case 'new-captures': return RefreshCw
    case 'duplicate-context': return Hash
    default: return AlertTriangle
  }
}

function OutlineTree({
  nodes,
  numbering,
}: {
  nodes: OutlineNode[]
  numbering: number[]
}) {
  const [collapsed, setCollapsed] = useState<Record<string, boolean>>({})

  if (nodes.length === 0) {
    return (
      <p className="px-1 py-6 text-center text-xs text-muted-foreground">
        Add headings in the document to build an outline.
      </p>
    )
  }

  return (
    <ul className="space-y-0.5">
      {nodes.map((node, i) => {
        const nums = [...numbering, i + 1]
        const label = nums.join('.')
        const key = `${node.index}-${label}`
        const hasKids = node.children.length > 0
        const isCollapsed = collapsed[key]

        return (
          <li key={key}>
            <div
              className={cn(
                'flex items-start gap-1 rounded-lg transition-colors',
                hasKids && 'pl-0',
              )}
            >
              {hasKids ? (
                <button
                  type="button"
                  onClick={() => setCollapsed(c => ({ ...c, [key]: !c[key] }))}
                  className="mt-2 shrink-0 rounded p-0.5 text-muted-foreground hover:bg-muted/60 hover:text-foreground cursor-pointer"
                  aria-label={isCollapsed ? 'Expand section' : 'Collapse section'}
                >
                  {isCollapsed
                    ? <ChevronRight className="h-3.5 w-3.5" />
                    : <ChevronDown className="h-3.5 w-3.5" />}
                </button>
              ) : (
                <span className="w-4 shrink-0" />
              )}
              <button
                type="button"
                onClick={() => scrollToHeadingIndex(node.index)}
                className="group flex min-w-0 flex-1 items-center justify-between gap-2 rounded-lg px-2 py-2 text-left hover:bg-muted/60 transition-colors cursor-pointer"
              >
                <span className="min-w-0 flex items-baseline gap-2">
                  <span className="shrink-0 text-[11px] font-medium tabular-nums text-muted-foreground">
                    {label}
                  </span>
                  <span className="truncate text-xs font-medium text-foreground group-hover:text-primary">
                    {node.text}
                  </span>
                </span>
                <span className="shrink-0 rounded-full bg-muted/60 px-2 py-0.5 text-[10px] tabular-nums text-muted-foreground">
                  {node.blockCount} {node.blockCount === 1 ? 'block' : 'blocks'}
                </span>
              </button>
            </div>
            {hasKids && !isCollapsed && (
              <div className="ml-4 mt-0.5 pl-2">
                <OutlineTree nodes={node.children} numbering={nums} />
              </div>
            )}
          </li>
        )
      })}
    </ul>
  )
}

export default function RecapContextPanel({
  doc,
  notes,
  contentHtml,
  loadingNotes,
  onRegenerate,
  regenerating,
  collapsed: controlledCollapsed,
  onCollapsedChange,
}: Props) {
  const [tab, setTab] = useState<Tab>('outline')
  const [dismissed, setDismissed] = useState<Set<string>>(() => loadDismissed(doc.id))
  const [internalCollapsed, setInternalCollapsed] = useState(false)
  const { open: chatOpen, documentChatMode, registerChatHost } = useChatPanel()
  const embeddedChat = documentChatMode && chatOpen

  const collapsed = controlledCollapsed ?? internalCollapsed
  const setCollapsed = onCollapsedChange ?? setInternalCollapsed

  const persistCollapsed = useCallback((next: boolean) => {
    setCollapsed(next)
    try { localStorage.setItem(PANEL_KEY, next ? '1' : '0') } catch { /* ignore */ }
  }, [setCollapsed])

  useEffect(() => {
    if (embeddedChat) persistCollapsed(false)
  }, [embeddedChat, persistCollapsed])

  useEffect(() => {
    try {
      const stored = localStorage.getItem(PANEL_KEY)
      if (stored === '1') setCollapsed(true)
    } catch { /* ignore */ }
  }, [setCollapsed])

  const outline = useMemo(() => parseDocumentOutline(contentHtml), [contentHtml])
  const headingCount = useMemo(() => extractHeadingsFromHtml(contentHtml).length, [contentHtml])
  const symbols = useMemo(() => parseDocumentSymbols(contentHtml), [contentHtml])
  const stats = useMemo(() => buildRecapStats(contentHtml, notes), [contentHtml, notes])
  const insights = useMemo(() => buildRecapInsights(doc, notes), [doc, notes])
  const timeline = useMemo(() => buildRecapTimeline(doc, notes), [doc, notes])
  const visibleInsights = insights.filter(i => !dismissed.has(i.id))
  const wordCount = useMemo(() => countDocumentWords(contentHtml), [contentHtml])

  function dismissInsight(id: string) {
    const next = new Set(dismissed)
    next.add(id)
    setDismissed(next)
    saveDismissed(doc.id, next)
  }

  const tabs = [
    { id: 'outline' as const, label: 'Outline', icon: ListTree },
    { id: 'symbols' as const, label: 'Symbols', icon: Hash },
    { id: 'history' as const, label: 'History', icon: Clock },
  ]

  const footer = (
    <>
      <div className="grid grid-cols-3 gap-2 px-3 py-2.5">
        {[
          { label: 'Words', value: wordCount },
          { label: 'Captures', value: stats.captureCount },
          { label: 'Headings', value: headingCount },
        ].map(stat => (
          <div key={stat.label} className="text-center">
            <p className="text-[10px] text-muted-foreground">{stat.label}</p>
            <p className="text-sm font-semibold tabular-nums text-foreground">{stat.value}</p>
          </div>
        ))}
      </div>

      {visibleInsights.length > 0 && (
        <div className="max-h-[min(40vh,280px)] overflow-y-auto scrollbar-minimal space-y-2 px-3 pb-3 pt-1">
          <p className="px-0.5 text-[10px] font-bold uppercase tracking-wider text-muted-foreground">
            AI insight
          </p>
          {visibleInsights.map(insight => {
            const Icon = insightIcon(insight.kind)
            return (
              <div
                key={insight.id}
                className="rounded-lg bg-background/80 p-2.5"
              >
                <div className="flex items-start gap-2">
                  <Icon className="mt-0.5 h-3.5 w-3.5 shrink-0 text-muted-foreground" aria-hidden />
                  <div className="min-w-0 flex-1">
                    <p className="text-xs font-semibold text-foreground">{insight.title}</p>
                    <p className="mt-0.5 text-[11px] leading-relaxed text-muted-foreground line-clamp-4">
                      {insight.body}
                    </p>
                  </div>
                  <button
                    type="button"
                    onClick={() => dismissInsight(insight.id)}
                    className="shrink-0 rounded p-0.5 text-muted-foreground hover:bg-muted hover:text-foreground cursor-pointer"
                    aria-label="Dismiss insight"
                  >
                    <X className="h-3 w-3" />
                  </button>
                </div>
              </div>
            )
          })}
          {(visibleInsights.some(i => i.kind === 'stale' || i.kind === 'new-captures')) && (
            <button
              type="button"
              onClick={onRegenerate}
              disabled={regenerating}
              className="w-full rounded-lg bg-primary px-3 py-2 text-xs font-semibold text-primary-foreground transition-opacity hover:opacity-90 cursor-pointer disabled:opacity-50"
            >
              {regenerating ? 'Regenerating…' : 'Regenerate from captures'}
            </button>
          )}
        </div>
      )}
    </>
  )

  return (
    embeddedChat ? (
      <aside
        className="flex h-full w-[min(100vw-2rem,400px)] shrink-0 flex-col border-l border-border/40 bg-card"
        aria-label="Ask Inline"
      >
        <div
          ref={registerChatHost}
          className="flex min-h-0 flex-1 flex-col"
        />
      </aside>
    ) : (
    <DocumentSideRail
      collapsed={collapsed}
      onToggleCollapse={() => persistCollapsed(!collapsed)}
      title="Document panel"
      collapsedLabel="Outline"
      tabs={tabs}
      activeTab={tab}
      onTabChange={id => setTab(id as Tab)}
      footer={footer}
    >
      {tab === 'outline' && (
        <div>
          <p className="mb-2 px-0.5 text-[10px] font-bold uppercase tracking-wider text-muted-foreground">
            Structure
          </p>
          <OutlineTree nodes={outline} numbering={[]} />
        </div>
      )}

      {tab === 'symbols' && (
        <div className="space-y-1">
          {symbols.length === 0 && (
            <p className="rounded-lg px-3 py-6 text-center text-xs text-muted-foreground">
              No lists, code blocks, or other symbols yet.
            </p>
          )}
          {symbols.map(sym => (
            <button
              key={sym.id}
              type="button"
              onClick={() => scrollToSymbol(sym.selector)}
              className="flex w-full items-center justify-between rounded-lg px-2.5 py-2 text-left text-xs hover:bg-muted/60 transition-colors cursor-pointer"
            >
              <span className="font-medium text-foreground">{sym.label}</span>
              <span className="rounded-full bg-muted/60 px-2 py-0.5 tabular-nums text-muted-foreground">
                {sym.count}
              </span>
            </button>
          ))}
        </div>
      )}

      {tab === 'history' && (
        <div>
          <p className="mb-2 px-0.5 text-[10px] font-bold uppercase tracking-wider text-muted-foreground">
            Timeline
          </p>
          <ul className="space-y-2">
            {loadingNotes && (
              <li className="py-4 text-center text-xs text-muted-foreground">Loading…</li>
            )}
            {timeline.map(row => (
              <li
                key={row.label}
                className="flex items-start justify-between gap-3 rounded-lg bg-background/70 px-2.5 py-2 text-xs"
              >
                <span className="text-muted-foreground">{row.label}</span>
                <span className="text-right font-medium text-foreground">{row.time}</span>
              </li>
            ))}
          </ul>
        </div>
      )}
    </DocumentSideRail>
    )
  )
}
