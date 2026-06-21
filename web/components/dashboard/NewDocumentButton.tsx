'use client'

import { useRouter } from 'next/navigation'
import { Plus } from 'lucide-react'
import { createFolderDocument } from '@/lib/workspace-library'
import { loadWorkspaceFolders, saveWorkspaceFolders, getRootFolders } from '@/lib/workspace-folders'

/**
 * Creates a new document in the workspace's first root folder (creating a
 * default "Library" folder if none exist) and navigates to its editor.
 */
export default function NewDocumentButton({ workspaceId }: { workspaceId: string }) {
  const router = useRouter()

  function handleCreate() {
    const folders = loadWorkspaceFolders()
    let target = getRootFolders(folders, workspaceId)[0]
    if (!target) {
      target = {
        id: `folder-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`,
        workspaceId,
        name: 'Library',
        parentId: null,
      }
      saveWorkspaceFolders([...folders, target])
    }
    const doc = createFolderDocument(workspaceId, target.id, 'Untitled document')
    router.push(`/app/${workspaceId}/folder/${target.id}/doc/${doc.id}`)
  }

  return (
    <button
      type="button"
      onClick={handleCreate}
      className="inline-flex cursor-pointer items-center gap-1 text-xs font-medium text-muted-foreground transition-colors hover:text-foreground"
    >
      <Plus className="w-3.5 h-3.5" aria-hidden />
      New
    </button>
  )
}
