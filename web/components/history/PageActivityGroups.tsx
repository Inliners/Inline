import Link from 'next/link'
import type { Note, NoteType } from '@/lib/types'
import { ExternalLink, FileText, Globe } from 'lucide-react'
import { formatDistanceToNow } from 'date-fns'

interface PageActivityGroupsProps {
  notes: Note[]
  workspaceId: string
  /** Optional documents keyed by pageUrl so we can deep-link to the recap doc. */
  recapByPageUrl?: Record<string, { id: string; title: string; updatedAt: string; href?: string }>
}

const TYPE_LABEL: Partial<Record<NoteType, string>> = {
  sticky: 'sticky',
  anchor: 'anchor',
  drawing: 'drawing',
  handwriting: 'handwriting',
  highlight: 'highlight',
  clip: 'clip',
  stamp: 'stamp',
  'paper-note': 'paper note',
  'ai-summary': 'AI summary',
  text: 'note',
  canvas: 'canvas',
}

function domainOf(url: string): string {
  try { return new URL(url).hostname } catch { return url.slice(0, 60) }
}

function titleOf(notes: Note[], pageUrl: string): string {
  const withTitle = notes.find(n => n.pageTitle && n.pageTitle.trim())
  return withTitle?.pageTitle?.trim() || domainOf(pageUrl)
}

function mostRecent(notes: Note[]): string {
  return notes.reduce((acc, n) => {
    const ts = n.updatedAt ?? n.createdAt
    return ts > acc ? ts : acc
  }, notes[0].updatedAt ?? notes[0].createdAt)
}

export default function PageActivityGroups({
  notes,
  workspaceId,
  recapByPageUrl = {},
}: PageActivityGroupsProps) {
  const grouped = notes.reduce<Record<string, Note[]>>((acc, n) => {
    const key = n.pageUrl || '(no page)'
    ;(acc[key] = acc[key] ?? []).push(n)
    return acc
  }, {})

  const entries = Object.entries(grouped)
    .map(([pageUrl, items]) => ({ pageUrl, items, last: mostRecent(items) }))
    .sort((a, b) => b.last.localeCompare(a.last))

  if (entries.length === 0) return null

  return (
    <section className="mb-8">
      <div className="mb-3 flex items-baseline justify-between">
        <h2 className="text-sm font-semibold text-foreground">Activity by page</h2>
        <span className="text-xs text-muted-foreground">{entries.length} pages</span>
      </div>

      <div className="grid gap-3 grid-cols-1 md:grid-cols-2 xl:grid-cols-3">
        {entries.map(({ pageUrl, items, last }) => {
          const title = titleOf(items, pageUrl)
          const counts = items.reduce<Record<string, number>>((acc, n) => {
            acc[n.type] = (acc[n.type] ?? 0) + 1
            return acc
          }, {})
          const recap = recapByPageUrl[pageUrl]

          return (
            <div
              key={pageUrl}
              className="rounded-xl border border-border bg-card p-4 flex flex-col gap-3"
            >
              <div className="flex items-start gap-2 min-w-0">
                <Globe className="w-4 h-4 mt-0.5 shrink-0 text-muted-foreground" />
                <div className="min-w-0 flex-1">
                  <p className="text-sm font-semibold text-foreground truncate" title={title}>
                    {title}
                  </p>
                  <p className="text-xs text-muted-foreground truncate">{domainOf(pageUrl)}</p>
                </div>
                {pageUrl.startsWith('http') && (
                  <Link
                    href={pageUrl}
                    target="_blank"
                    rel="noreferrer"
                    className="text-muted-foreground hover:text-foreground transition-colors"
                    aria-label="Open page in new tab"
                  >
                    <ExternalLink className="w-3.5 h-3.5" />
                  </Link>
                )}
              </div>

              <div className="flex flex-wrap gap-1.5">
                {Object.entries(counts)
                  .sort((a, b) => b[1] - a[1])
                  .map(([type, count]) => (
                    <span
                      key={type}
                      className="px-2 py-0.5 rounded-full bg-accent/40 border border-border text-[11px] text-foreground/80"
                    >
                      {count} {TYPE_LABEL[type as NoteType] ?? type}
                      {count > 1 ? 's' : ''}
                    </span>
                  ))}
              </div>

              <div className="flex items-center justify-between pt-2 border-t border-border mt-auto">
                <span className="text-[11px] text-muted-foreground">
                  Last activity {formatDistanceToNow(new Date(last), { addSuffix: true })}
                </span>
                {recap ? (
                  <Link
                    href={recap.href ?? `/app/${workspaceId}/library/${recap.id}`}
                    className="inline-flex items-center gap-1.5 text-xs font-medium text-primary hover:underline"
                  >
                    <FileText className="w-3.5 h-3.5" />
                    View recap document
                  </Link>
                ) : (
                  <span className="text-[11px] text-muted-foreground italic">
                    Recap generating…
                  </span>
                )}
              </div>
            </div>
          )
        })}
      </div>
    </section>
  )
}
