'use client'

import { useCallback, useEffect, useMemo, useState } from 'react'
import Link from 'next/link'
import type { Note } from '@/lib/types'
import { Star, Globe } from 'lucide-react'
import { cn } from '@/lib/utils'
import {
  getPinnedNoteIds,
  togglePinnedNote,
  isPinnedNote,
} from '@/lib/dashboard-favorites'
import { prettyNotePreviewTruncated } from '@/lib/note-preview'

const PASTEL_BGS = [
  'bg-card dark:bg-[#15285C]',
  'bg-card dark:bg-[#17296B]',
  'bg-card dark:bg-[#1B326D]',
  'bg-card dark:bg-[#1E3878]',
]

function relativeTime(iso: string) {
  const diff = Date.now() - new Date(iso).getTime()
  const minutes = Math.floor(diff / 60000)
  if (minutes < 60) return `${minutes}m ago`
  const hours = Math.floor(minutes / 60)
  if (hours < 24) return `${hours}h ago`
  const days = Math.floor(hours / 24)
  if (days < 30) return `${days}d ago`
  const months = Math.floor(days / 30)
  return `${months}mo ago`
}

function NoteCaptureCard({
  note,
  workspaceId,
  pinned,
  onTogglePin,
  index,
}: {
  note: Note
  workspaceId: string
  pinned: boolean
  onTogglePin: () => void
  index: number
}) {
  const time = relativeTime(note.updatedAt)
  const bg = PASTEL_BGS[index % PASTEL_BGS.length]

  return (
    <div className={cn(
      'relative shrink-0 w-[240px] sm:w-[260px] rounded-2xl p-5 flex flex-col justify-between h-40 snap-start',
      'cursor-pointer border border-border transition-colors hover:border-stone-400/50',
      bg,
    )}>
      <button
        type="button"
        title={pinned ? 'Remove from favorites' : 'Add to favorites'}
        onClick={e => {
          e.preventDefault()
          e.stopPropagation()
          onTogglePin()
        }}
        className="absolute right-3 top-3 z-20 cursor-pointer text-muted-foreground/50 transition-colors hover:text-amber-600"
      >
        <Star className={cn('w-4 h-4', pinned && 'fill-amber-400 text-amber-400')} />
      </button>

      <Link
        href={`/app/${workspaceId}/history/${note.id}`}
        className="flex flex-col justify-between flex-1 min-h-0"
      >
        <div>
          <p className="line-clamp-1 pr-6 text-base font-semibold tracking-tight text-foreground">
            {note.pageTitle || note.domain}
          </p>
          <p className="mt-1 line-clamp-2 text-xs text-muted-foreground">
            {prettyNotePreviewTruncated(note, 120) || note.domain}
          </p>
        </div>

        <div className="flex items-center justify-between gap-2 mt-4">
          <span className="inline-flex min-w-0 items-center gap-1 text-[10px] text-slate-500 dark:text-[#9BBCE5]">
            <Globe className="w-3 h-3 shrink-0" aria-hidden />
            <span className="truncate">{note.domain}</span>
          </span>
          <span className="shrink-0 text-[10px] text-slate-400 dark:text-[#9BBCE5]">{time}</span>
        </div>
      </Link>
    </div>
  )
}

export default function PinnedCapturesRow({
  workspaceId,
  initialNotes,
}: {
  workspaceId: string
  initialNotes: Note[]
}) {
  const [pinVersion, setPinVersion] = useState(0)

  const refreshPins = useCallback(() => setPinVersion(v => v + 1), [])

  useEffect(() => {
    window.addEventListener('inline-dashboard-pins-changed', refreshPins)
    return () => window.removeEventListener('inline-dashboard-pins-changed', refreshPins)
  }, [refreshPins])

  const pinnedIds = useMemo(() => {
    void pinVersion
    return new Set(getPinnedNoteIds(workspaceId))
  }, [workspaceId, pinVersion])

  const displayNotes = useMemo(() => {
    const withPin = initialNotes.map(n => ({
      ...n,
      _effectivePin: pinnedIds.has(n.id) || !!n.is_pinned,
    }))
    const pinned = withPin.filter(n => n._effectivePin)
    const unpinned = withPin.filter(n => !n._effectivePin)
    const ordered = [...pinned, ...unpinned]
    const seen = new Set<string>()
    const deduped: Note[] = []
    for (const n of ordered) {
      if (seen.has(n.id)) continue
      seen.add(n.id)
      const { _effectivePin: _ignored, ...clean } = n as Note & { _effectivePin?: boolean }
      deduped.push(clean)
    }
    return deduped
  }, [initialNotes, pinnedIds])

  if (!displayNotes.length) {
    return (
      <div className="rounded-2xl border-2 border-dashed border-border p-8 text-center">
        <p className="text-sm text-muted-foreground">
          No web captures yet. Use the browser extension to save pages, then star your favorites here.
        </p>
      </div>
    )
  }

  return (
    <div className="overflow-x-auto overflow-y-hidden pb-2 scrollbar-minimal">
      <div className="flex w-max min-w-full snap-x snap-mandatory gap-4 pr-4">
        {displayNotes.map((note, i) => (
          <NoteCaptureCard
            key={note.id}
            note={note}
            workspaceId={workspaceId}
            pinned={isPinnedNote(workspaceId, note.id, note.is_pinned)}
            onTogglePin={() => {
              togglePinnedNote(workspaceId, note.id)
              refreshPins()
            }}
            index={i}
          />
        ))}
      </div>
    </div>
  )
}
