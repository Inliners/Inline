'use client'

import { useCallback, useEffect, useMemo, useState } from 'react'
import Link from 'next/link'
import { FileText, Star, Sparkles } from 'lucide-react'
import { documentHref } from '@/lib/doc-routes'
import { cn, formatDisplayTitle, previewText } from '@/lib/utils'
import { loadFolderDocuments, type FolderDocument } from '@/lib/workspace-library'
import { loadWorkspaceFolders, findFolder, type WorkspaceFolder } from '@/lib/workspace-folders'
import {
  getPinnedDocumentIds,
  togglePinnedDocument,
  isPinnedDocument,
} from '@/lib/dashboard-favorites'

const PASTEL_BGS = [
  'bg-card',
  'bg-card dark:bg-secondary',
  'bg-card dark:bg-muted',
  'bg-card dark:bg-accent',
]

function relativeTime(ts: number) {
  const diff = Date.now() - ts
  const minutes = Math.floor(diff / 60000)
  if (minutes < 60) return `${minutes}m ago`
  const hours = Math.floor(minutes / 60)
  if (hours < 24) return `${hours}h ago`
  const days = Math.floor(hours / 24)
  if (days < 30) return `${days}d ago`
  return new Date(ts).toLocaleDateString()
}

export default function LibraryDocumentsSection({ workspaceId }: { workspaceId: string }) {
  const [tick, setTick] = useState(0)
  const [hasHydrated, setHasHydrated] = useState(false)

  const refresh = useCallback(() => setTick(t => t + 1), [])

  useEffect(() => {
    setHasHydrated(true)
  }, [])

  useEffect(() => {
    const onDocs = () => refresh()
    const onPins = () => refresh()
    const onStorage = (e: StorageEvent) => {
      if (e.key === 'inline-folder-documents' || e.key === 'inline-folders') refresh()
    }
    window.addEventListener('inline-folder-docs-changed', onDocs)
    window.addEventListener('storage', onStorage)
    window.addEventListener('inline-dashboard-pins-changed', onPins)
    return () => {
      window.removeEventListener('inline-folder-docs-changed', onDocs)
      window.removeEventListener('storage', onStorage)
      window.removeEventListener('inline-dashboard-pins-changed', onPins)
    }
  }, [refresh])

  const { docs, folders } = useMemo(() => {
    void tick
    if (!hasHydrated) {
      return { docs: [] as FolderDocument[], folders: [] as WorkspaceFolder[] }
    }
    const allDocs = loadFolderDocuments().filter(d => d.workspaceId === workspaceId)
    const foldersList = loadWorkspaceFolders()
    const sorted = [...allDocs].sort((a, b) => b.updatedAt - a.updatedAt)
    return { docs: sorted, folders: foldersList }
  }, [workspaceId, tick, hasHydrated])

  const pinnedIds = useMemo(() => {
    void tick
    if (!hasHydrated) return new Set<string>()
    return new Set(getPinnedDocumentIds(workspaceId))
  }, [workspaceId, tick, hasHydrated])

  const orderedDocs = useMemo(() => {
    const pinned = docs.filter(d => pinnedIds.has(d.id))
    const rest = docs.filter(d => !pinnedIds.has(d.id))
    return [...pinned, ...rest]
  }, [docs, pinnedIds])

  function folderLabel(folderId: string) {
    return findFolder(folders, workspaceId, folderId)?.name ?? 'Folder'
  }

  if (!docs.length) {
    return (
      <div className="rounded-2xl border-2 border-dashed border-border p-8 text-center">
        <div className="mx-auto w-12 h-12 rounded-xl bg-[#EBF1F7] flex items-center justify-center mb-3">
          <FileText className="h-6 w-6 text-stone-600 dark:text-muted-foreground" />
        </div>
        <p className="text-sm font-medium text-foreground">No documents yet</p>
        <p className="mx-auto mt-1 max-w-md text-xs text-muted-foreground">
          Create a folder from the sidebar, add a document, and it will appear here automatically.
        </p>
      </div>
    )
  }

  return (
    <div className="overflow-x-auto overflow-y-hidden pb-2 scrollbar-minimal">
      <div className="flex w-max min-w-full snap-x snap-mandatory gap-4 pr-4">
        {orderedDocs.map((doc, i) => (
          <DocLibraryCard
            key={doc.id}
            doc={doc}
            workspaceId={workspaceId}
            folderName={folderLabel(doc.folderId)}
            pinned={isPinnedDocument(workspaceId, doc.id)}
            onTogglePin={() => {
              togglePinnedDocument(workspaceId, doc.id)
              refresh()
            }}
            index={i}
          />
        ))}
      </div>
    </div>
  )
}

function DocLibraryCard({
  doc,
  workspaceId,
  folderName,
  pinned,
  onTogglePin,
  index,
}: {
  doc: FolderDocument
  workspaceId: string
  folderName: string
  pinned: boolean
  onTogglePin: () => void
  index: number
}) {
  const href = documentHref(workspaceId, doc.id)
  const bg = PASTEL_BGS[index % PASTEL_BGS.length]
  const preview = previewText(doc.content) || 'Empty document'

  return (
    <Link
      href={href}
      className={cn(
        'relative flex h-40 w-[240px] shrink-0 snap-start flex-col justify-between rounded-2xl p-5',
        'border border-border transition-colors hover:border-stone-400/50 dark:border-sidebar-border',
        bg,
      )}
    >
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

      <div>
        <p className="line-clamp-1 w-full truncate pr-6 text-base font-semibold tracking-tight text-foreground">
          {formatDisplayTitle(doc.title)}
        </p>
        <p className="mt-1 line-clamp-2 text-xs leading-5 text-slate-500 dark:text-muted-foreground">
          {preview}
        </p>
      </div>

      <div className="mt-4 flex items-center justify-between gap-2">
        {doc.autoGenerated ? (
          <span className="inline-flex shrink-0 items-center gap-1 rounded-full bg-amber-500/10 px-2 py-0.5 text-[10px] font-medium text-amber-700 dark:text-amber-400">
            <Sparkles className="w-2.5 h-2.5" aria-hidden /> Auto-recap
          </span>
        ) : (
          <span className="inline-flex shrink-0 items-center gap-1 text-[10px] text-muted-foreground">
            <FileText className="w-3 h-3" aria-hidden /> Document
          </span>
        )}
        <span className="truncate text-[10px] text-muted-foreground">{folderName} &middot; {relativeTime(doc.updatedAt)}</span>
      </div>
    </Link>
  )
}
