'use client'

import type { CSSProperties } from 'react'
import Link from 'next/link'
import { FileText, Globe, NotebookPen, Sparkles } from 'lucide-react'
import { cn, formatDisplayTitle } from '@/lib/utils'

/**
 * Citation card for RAG answers. Rendered ONLY from the server-provided
 * sources list — never from model output — so a card always corresponds to a
 * real retrieved chunk.
 */

export type ChatSource = {
  ref: number
  sourceType: string
  sourceId: string
  pageUrl: string | null
  pageTitle: string | null
  domain: string | null
  snippet: string
  similarity: number | null
}

import { workspacePath } from '@/lib/workspace-routes'

function sourceHref(source: ChatSource, workspaceId: string): string | null {
  if (source.sourceId.startsWith('local-doc-')) return null
  if (source.sourceType === 'note') {
    return workspacePath(workspaceId, 'history', source.sourceId)
  }
  if (source.sourceType === 'document' || source.sourceType === 'recap') {
    return workspacePath(workspaceId, 'library', source.sourceId)
  }
  return null
}

function SourceIcon({ type }: { type: string }) {
  const cls = 'h-3 w-3'
  if (type === 'recap') return <Sparkles className={cls} />
  if (type === 'document') return <FileText className={cls} />
  if (type === 'note') return <NotebookPen className={cls} />
  return <Globe className={cls} />
}

const TYPE_LABELS: Record<string, string> = {
  note: 'Capture',
  document: 'Document',
  recap: 'Recap',
  page: 'Page',
  annotation: 'Annotation',
}

export function SourceCard({ source, workspaceId }: { source: ChatSource; workspaceId: string }) {
  const href = sourceHref(source, workspaceId)
  const title = formatDisplayTitle(source.pageTitle?.trim() || source.domain || 'Untitled capture')

  const body = (
    <>
      <div className="flex items-center gap-1.5">
        <span className="flex h-4 w-4 shrink-0 items-center justify-center rounded-[5px] bg-muted text-muted-foreground">
          <SourceIcon type={source.sourceType} />
        </span>
        <span className="rounded-full border border-border bg-card px-1.5 py-px font-mono text-[9px] font-medium text-muted-foreground">
          {source.ref}
        </span>
        <span className="truncate text-[11px] font-medium text-foreground">{title}</span>
      </div>
      <p className="mt-1 line-clamp-2 text-[10px] leading-relaxed text-muted-foreground">
        {source.snippet}
      </p>
      <div className="mt-1 flex items-center gap-1.5 text-[9px] text-muted-foreground/80">
        <span className="rounded-full bg-muted px-1.5 py-px">{TYPE_LABELS[source.sourceType] ?? source.sourceType}</span>
        {source.domain && <span className="truncate">{source.domain}</span>}
      </div>
    </>
  )

  const cardClass = cn(
    'block w-56 shrink-0 rounded-xl border border-border bg-card px-2.5 py-2 text-left transition-colors',
    href && 'cursor-pointer hover:border-ring/50 hover:bg-muted/40 focus-visible:outline-2 focus-visible:outline-ring',
  )

  if (href) {
    return (
      <Link href={href} className={cardClass} aria-label={`Open source ${source.ref}: ${title}`}>
        {body}
      </Link>
    )
  }
  return <div className={cardClass}>{body}</div>
}

export function SourceCardRow({
  sources,
  workspaceId,
  hideScrollbar = false,
}: {
  sources: ChatSource[]
  workspaceId: string
  hideScrollbar?: boolean
}) {
  if (sources.length === 0) return null
  const scrollStyle: CSSProperties | undefined = hideScrollbar ? { scrollbarWidth: 'none' } : undefined

  return (
    <div className="mt-2">
      <p className="mb-1 text-[9px] font-medium uppercase tracking-wide text-muted-foreground/70">
        Sources
      </p>
      <div
        className="scrollbar-minimal flex gap-2 overflow-x-auto overflow-y-hidden pb-1"
        style={scrollStyle}
      >
        {sources.map(s => (
          <SourceCard key={`${s.sourceType}:${s.sourceId}`} source={s} workspaceId={workspaceId} />
        ))}
      </div>
    </div>
  )
}
