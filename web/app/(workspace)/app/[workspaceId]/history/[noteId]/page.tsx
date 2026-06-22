import Link from 'next/link'
import { fetchNoteById, fetchExtractionsForNote } from '@/lib/data'
import { ArrowLeft, Globe, Calendar, Tag, MapPin, FileText } from 'lucide-react'
import CreateDocFromNoteCTA from './CreateDocFromNoteCTA'
import { prettyNotePreview } from '@/lib/note-preview'
import { truncateDisplayUrl } from '@/lib/utils'

export default async function NoteDetailPage({
  params,
}: {
  params: Promise<{ workspaceId: string; noteId: string }>
}) {
  const { workspaceId, noteId } = await params
  const [note, extractions] = await Promise.all([
    fetchNoteById(noteId, workspaceId),
    fetchExtractionsForNote(noteId),
  ])

  if (!note) {
    return (
      <div className="min-h-full bg-background">
        <div className="max-w-3xl mx-auto px-6 py-8 space-y-4">
          <Link
            href={`/app/${workspaceId}/history`}
            className="inline-flex items-center gap-1.5 text-sm text-muted-foreground hover:text-foreground transition-colors"
          >
            <ArrowLeft className="w-4 h-4" />
            Back to History
          </Link>
          <h1 className="text-xl font-semibold text-foreground">Capture not found</h1>
          <p className="text-sm text-muted-foreground">
            This note may have been deleted or is no longer available in this workspace.
          </p>
        </div>
      </div>
    )
  }

  const fmtDate = (iso: string) =>
    new Date(iso).toLocaleString('en-US', {
      month: 'short', day: 'numeric', year: 'numeric',
      hour: '2-digit', minute: '2-digit',
    })

  return (
    <div className="min-h-full bg-background">
      <div className="max-w-3xl mx-auto px-6 py-8 space-y-8">

        {/* Back nav */}
        <Link
          href={`/app/${workspaceId}/history`}
          className="inline-flex items-center gap-1.5 text-sm text-muted-foreground hover:text-foreground transition-colors"
        >
          <ArrowLeft className="w-4 h-4" />
          Back to History
        </Link>

        {/* Title */}
        <div>
          <h1 className="text-2xl font-bold text-foreground tracking-tight">
            {note.pageTitle || 'Untitled note'}
          </h1>
          {note.pageUrl && (
            <a
              href={note.pageUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="mt-1 block max-w-full truncate text-sm text-muted-foreground transition-colors hover:text-foreground"
              title={note.pageUrl}
            >
              {truncateDisplayUrl(note.pageUrl)}
            </a>
          )}
        </div>

        {/* Metadata grid */}
        <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
          <MetaCard icon={Globe} label="Domain" value={note.domain || '—'} />
          <MetaCard icon={Tag} label="Type" value={note.type} />
          <MetaCard icon={Calendar} label="Captured" value={fmtDate(note.createdAt)} />
          {note.lat && note.lng && (
            <MetaCard icon={MapPin} label="Location" value={`${note.lat.toFixed(4)}, ${note.lng.toFixed(4)}`} />
          )}
          {note.tags?.length > 0 && (
            <MetaCard icon={Tag} label="Tags" value={note.tags.join(', ')} />
          )}
        </div>

        {/* Original text */}
        <section>
          <h2 className="text-sm font-semibold text-muted-foreground uppercase tracking-wider mb-3">
            Original Text
          </h2>
          <div className="rounded-xl border border-border bg-slate-50 p-4">
            <p className="text-sm text-foreground whitespace-pre-wrap leading-relaxed">
              {prettyNotePreview(note) || '(no content)'}
            </p>
          </div>
        </section>

        {/* AI output / extractions */}
        {extractions.length > 0 && (
          <section>
            <h2 className="text-sm font-semibold text-muted-foreground uppercase tracking-wider mb-3">
              AI Output
            </h2>
            <div className="space-y-3">
              {extractions.map(ext => (
                <div key={ext.id} className="rounded-xl border border-border bg-white p-4">
                  <div className="flex items-center gap-2 mb-2">
                    <FileText className="w-3.5 h-3.5 text-muted-foreground" />
                    <span className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">
                      {ext.schemaType}
                    </span>
                    <span className="ml-auto text-[10px] text-muted-foreground/60">
                      {fmtDate(ext.createdAt)}
                    </span>
                  </div>
                  <div className="text-sm text-foreground">
                    <ReadableExtraction data={ext.data} />
                  </div>
                </div>
              ))}
            </div>
          </section>
        )}

        {/* CTA */}
        <div className="border-t border-dashed border-slate-200 pt-8">
          <CreateDocFromNoteCTA
            workspaceId={workspaceId}
            noteContent={note.content}
            noteTitle={note.pageTitle || 'Note from ' + note.domain}
            note={note}
          />
        </div>
      </div>
    </div>
  )
}

function MetaCard({ icon: Icon, label, value }: { icon: React.ElementType; label: string; value: string }) {
  return (
    <div className="rounded-lg border border-border bg-card p-3">
      <div className="flex items-center gap-1.5 mb-1">
        <Icon className="w-3.5 h-3.5 text-muted-foreground" />
        <span className="text-[10px] font-semibold uppercase tracking-wider text-muted-foreground">{label}</span>
      </div>
      <p className="text-sm font-medium text-foreground truncate">{value}</p>
    </div>
  )
}

function humanizeKey(key: string) {
  return key
    .replace(/[_-]+/g, ' ')
    .replace(/([a-z])([A-Z])/g, '$1 $2')
    .replace(/\b\w/g, c => c.toUpperCase())
}

function formatValue(value: unknown): string {
  if (value == null) return 'Not provided'
  if (typeof value === 'string') return value
  if (typeof value === 'number' || typeof value === 'boolean') return String(value)
  if (Array.isArray(value)) return value.map(formatValue).join(', ')
  if (typeof value === 'object') {
    return Object.entries(value as Record<string, unknown>)
      .map(([key, nested]) => `${humanizeKey(key)}: ${formatValue(nested)}`)
      .join(' | ')
  }
  return String(value)
}

function ReadableExtraction({ data }: { data: unknown }) {
  if (typeof data === 'string') {
    return <p className="whitespace-pre-wrap leading-relaxed">{data}</p>
  }

  if (Array.isArray(data)) {
    return (
      <ul className="list-disc space-y-1 pl-5">
        {data.map((item, index) => (
          <li key={index}>{formatValue(item)}</li>
        ))}
      </ul>
    )
  }

  if (data && typeof data === 'object') {
    return (
      <dl className="grid gap-2">
        {Object.entries(data as Record<string, unknown>).map(([key, value]) => (
          <div key={key} className="grid gap-1 sm:grid-cols-[9rem_1fr] sm:gap-3">
            <dt className="text-xs font-medium text-muted-foreground">{humanizeKey(key)}</dt>
            <dd className="leading-relaxed">{formatValue(value)}</dd>
          </div>
        ))}
      </dl>
    )
  }

  return <p>{formatValue(data)}</p>
}
