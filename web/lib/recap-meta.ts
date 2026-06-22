import type { Note } from './types'
import type { FolderDocument } from './workspace-library'
import {
  actionLabelFor,
  captureTypeSlug,
  formatRecapMinute,
  recapEntryAnchorId,
} from './auto-recap'

export interface RecapOutlineItem {
  noteId: string
  anchorId: string
  label: string
  action: string
  timestamp: string
  captureType: string
}

export interface RecapStats {
  wordCount: number
  captureCount: number
  typeCount: number
  typeBreakdown: Record<string, number>
}

export type RecapInsightKind = 'stale' | 'new-captures' | 'ai-summary' | 'duplicate-context' | 'thin'

export interface RecapInsight {
  id: string
  kind: RecapInsightKind
  title: string
  body: string
}

export function notesForPage(notes: Note[], pageUrl: string): Note[] {
  return notes.filter(n => n.pageUrl === pageUrl)
}

export function sortNotesChronologically(notes: Note[]): Note[] {
  return [...notes].sort(
    (a, b) => new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime(),
  )
}

export function buildRecapOutline(notes: Note[]): RecapOutlineItem[] {
  return sortNotesChronologically(notes).map(note => {
    const ts = formatRecapMinute(note.updatedAt ?? note.createdAt)
    const action = actionLabelFor(note)
    return {
      noteId: note.id,
      anchorId: recapEntryAnchorId(note.id),
      label: `${ts} — ${action}`,
      action,
      timestamp: ts,
      captureType: captureTypeSlug(note),
    }
  })
}

export function buildRecapHeaderTags(pageUrl: string | undefined, notes: Note[]): string[] {
  if (!pageUrl) return []
  const pageNotes = notesForPage(notes, pageUrl)
  const tags: string[] = []
  try {
    tags.push(new URL(pageUrl).hostname)
  } catch {
    /* ignore */
  }

  const counts: Record<string, number> = {}
  for (const n of pageNotes) {
    const slug = captureTypeSlug(n)
    counts[slug] = (counts[slug] ?? 0) + 1
  }
  const topTypes = Object.entries(counts)
    .sort((a, b) => b[1] - a[1])
    .slice(0, 3)
    .map(([slug]) => slug.replace(/_/g, ' '))

  return [...tags, ...topTypes]
}

function stripHtmlText(html: string): string {
  return html.replace(/<[^>]+>/g, ' ').replace(/\s+/g, ' ').trim()
}

export function buildRecapStats(contentHtml: string, notes: Note[]): RecapStats {
  const text = stripHtmlText(contentHtml)
  const wordCount = text ? text.split(/\s+/).filter(Boolean).length : 0
  const typeBreakdown: Record<string, number> = {}
  for (const n of notes) {
    const slug = captureTypeSlug(n)
    typeBreakdown[slug] = (typeBreakdown[slug] ?? 0) + 1
  }
  return {
    wordCount,
    captureCount: notes.length,
    typeCount: Object.keys(typeBreakdown).length,
    typeBreakdown,
  }
}

export function buildRecapInsights(doc: FolderDocument, notes: Note[]): RecapInsight[] {
  const insights: RecapInsight[] = []
  if (notes.length === 0) return insights

  const newestNoteMs = notes.reduce((acc, n) => {
    const ts = new Date(n.updatedAt ?? n.createdAt).getTime()
    return ts > acc ? ts : acc
  }, 0)

  if (doc.recapStale) {
    insights.push({
      id: 'stale',
      kind: 'stale',
      title: 'Recap edited manually',
      body: 'Your edits are preserved. Regenerate to merge in new captures from the source page.',
    })
    if (newestNoteMs > doc.updatedAt) {
      insights.push({
        id: 'new-captures',
        kind: 'new-captures',
        title: 'New captures available',
        body: 'There are captures on the source page that are not reflected in this recap.',
      })
    }
  }

  const aiNote = [...notes]
    .filter(n => n.type === 'ai-summary' || captureTypeSlug(n) === 'ai')
    .sort((a, b) => new Date(b.updatedAt ?? b.createdAt).getTime() - new Date(a.updatedAt ?? a.createdAt).getTime())[0]

  if (aiNote) {
    const snippet = (aiNote.content ?? '').replace(/<[^>]+>/g, ' ').trim().slice(0, 160)
    insights.push({
      id: 'ai-summary',
      kind: 'ai-summary',
      title: 'Page summary',
      body: snippet ? `${snippet}${snippet.length >= 160 ? '…' : ''}` : 'An AI summary exists for this page.',
    })
  }

  const contextGroups = new Map<string, Note[]>()
  for (const n of notes) {
    const ctx = (n.pageContext ?? '').trim().toLowerCase()
    if (!ctx || ctx.length < 12) continue
    const group = contextGroups.get(ctx) ?? []
    group.push(n)
    contextGroups.set(ctx, group)
  }
  const dupes = [...contextGroups.values()].filter(g => g.length > 1)
  if (dupes.length > 0) {
    insights.push({
      id: 'duplicate-context',
      kind: 'duplicate-context',
      title: 'Overlapping highlights',
      body: `${dupes.length} passage${dupes.length === 1 ? '' : 's'} appear in multiple captures.`,
    })
  }

  if (notes.length <= 2) {
    insights.push({
      id: 'thin',
      kind: 'thin',
      title: 'Light capture history',
      body: 'Only a few items on this page so far. More extension activity will enrich this recap.',
    })
  }

  return insights
}

export function buildRecapTimeline(doc: FolderDocument, notes: Note[]): { label: string; time: string }[] {
  const sorted = sortNotesChronologically(notes)
  const rows: { label: string; time: string }[] = []
  if (sorted[0]) {
    rows.push({
      label: 'First capture',
      time: formatRecapMinute(sorted[0].createdAt),
    })
  }
  const last = sorted[sorted.length - 1]
  if (last && sorted.length > 1) {
    rows.push({
      label: 'Latest capture',
      time: formatRecapMinute(last.updatedAt ?? last.createdAt),
    })
  }
  rows.push({
    label: doc.recapStale ? 'Last edited' : 'Last updated',
    time: formatRecapMinute(new Date(doc.updatedAt).toISOString()),
  })
  if (doc.recapStale) {
    rows.push({
      label: 'Auto-sync paused',
      time: 'Until you regenerate',
    })
  }
  return rows
}

export function formatRelativeUpdated(ms: number): string {
  const diff = Date.now() - ms
  if (diff < 60_000) return 'just now'
  if (diff < 3_600_000) return `${Math.floor(diff / 60_000)}m ago`
  if (diff < 86_400_000) return `${Math.floor(diff / 3_600_000)}h ago`
  if (diff < 604_800_000) return `${Math.floor(diff / 86_400_000)}d ago`
  return new Date(ms).toLocaleDateString()
}

export function scrollToRecapEntry(noteId: string) {
  if (typeof document === 'undefined') return
  const el =
    document.getElementById(recapEntryAnchorId(noteId)) ??
    document.querySelector(`[data-note-id="${noteId}"]`)
  el?.scrollIntoView({ behavior: 'smooth', block: 'center' })
}
