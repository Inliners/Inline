'use client'

import { useRouter } from 'next/navigation'
import { useState } from 'react'
import { Plus, Loader2 } from 'lucide-react'
import { createFolderDocument, loadFolderDocuments } from '@/lib/workspace-library'
import { loadWorkspaceFolders, getRootFolders } from '@/lib/workspace-folders'
import { prettyNotePreview } from '@/lib/note-preview'
import type { Note } from '@/lib/types'
import { workspacePath } from '@/lib/workspace-routes'

interface Props {
  workspaceId: string
  noteTitle:   string
  noteContent: string
  note?: Pick<Note, 'content' | 'type' | 'tags' | 'domain'>
}

export default function CreateDocFromNoteCTA({ workspaceId, noteTitle, noteContent, note }: Props) {
  const router   = useRouter()
  const [loading, setLoading] = useState(false)

  function handleCreate() {
    setLoading(true)
    try {
      const folders = getRootFolders(loadWorkspaceFolders(), workspaceId)
      const folderId = folders[0]?.id ?? `folder-default-${workspaceId}`
      const doc = createFolderDocument(workspaceId, folderId, noteTitle)
      // pre-fill content
      const all = loadFolderDocuments()
      const idx = all.findIndex(d => d.id === doc.id)
      if (idx >= 0) {
        const readable = note ? prettyNotePreview(note) : noteContent
        all[idx].content = `<p>${readable.replace(/\n/g, '</p><p>')}</p>`
        localStorage.setItem('inline-folder-documents', JSON.stringify(all))
      }
      router.push(workspacePath(workspaceId, 'doc', doc.id))
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="workspace-surface rounded-2xl border-2 border-dashed p-6 flex flex-col sm:flex-row items-start sm:items-center gap-4">
      <div className="flex-1">
        <h3 className="text-sm font-semibold text-foreground">Create a document from this note</h3>
        <p className="text-xs text-muted-foreground mt-1">
          Open a rich-text editor pre-filled with the captured content from this note.
        </p>
      </div>
      <button
        onClick={handleCreate}
        disabled={loading}
        className="inline-flex items-center gap-2 rounded-lg bg-primary px-5 py-2.5 text-sm font-medium text-primary-foreground transition-opacity hover:opacity-90 disabled:opacity-60 cursor-pointer shrink-0"
      >
        {loading ? <Loader2 className="w-4 h-4 animate-spin" /> : <Plus className="w-4 h-4" />}
        Create document
      </button>
    </div>
  )
}
