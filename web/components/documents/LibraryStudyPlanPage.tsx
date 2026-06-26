'use client'

import { useEffect, useMemo, useState } from 'react'
import { useParams, usePathname, useRouter, useSearchParams } from 'next/navigation'
import { Loader2 } from 'lucide-react'
import { loadServerDocument } from '@/lib/library-api'
import { loadWorkspaceFolders } from '@/lib/workspace-folders'
import { getWorkspaceName } from '@/lib/workspaces'
import { useRecapNotes } from '@/lib/use-recap-notes'
import { resolveWorkspaceIdFromBrowserPath, workspacePath } from '@/lib/workspace-routes'
import { docPathForStudy } from '@/lib/study-plan-routes'
import StudyPlanHeader from '@/components/documents/StudyPlanHeader'
import KnowledgeCardDeck, { type KnowledgeTopic } from '@/components/documents/KnowledgeCardDeck'

const VALID_TOPICS = new Set<KnowledgeTopic>(['interview', 'concepts', 'connections', 'gaps'])

function stripHtml(html: string): string {
  return html.replace(/<[^>]+>/g, ' ').replace(/\s+/g, ' ').trim()
}

function parseTopic(raw: string | null): KnowledgeTopic {
  if (raw && VALID_TOPICS.has(raw as KnowledgeTopic)) return raw as KnowledgeTopic
  return 'interview'
}

export default function LibraryStudyPlanPage() {
  const { docId } = useParams<{ workspaceId: string; docId: string }>()
  const pathname = usePathname()
  const router = useRouter()
  const searchParams = useSearchParams()
  const workspaceId = resolveWorkspaceIdFromBrowserPath(pathname)

  const [loading, setLoading] = useState(true)
  const [title, setTitle] = useState('')
  const [folderId, setFolderId] = useState('')
  const [folderName, setFolderName] = useState('Folder')
  const [recapHtml, setRecapHtml] = useState('')
  const [pageUrl, setPageUrl] = useState<string | undefined>()

  const initialTopic = parseTopic(searchParams.get('topic'))
  const workspaceName = getWorkspaceName(workspaceId)

  const { notes: pageNotes, loading: notesLoading } = useRecapNotes(workspaceId, pageUrl)

  useEffect(() => {
    let cancelled = false
    async function load() {
      const d = await loadServerDocument(docId)
      if (cancelled) return
      if (!d) {
        router.replace(workspacePath(workspaceId, 'dashboard'))
        return
      }
      setTitle(d.title)
      setFolderId(d.folderId)
      setPageUrl(d.pageUrl ?? undefined)
      setRecapHtml(d.content)
      const folders = loadWorkspaceFolders()
      const folder = folders.find(f => f.id === d.folderId)
      if (folder) setFolderName(folder.name)
      setLoading(false)
    }
    void load()
    return () => { cancelled = true }
  }, [docId, router, workspaceId])

  const notesText = useMemo(
    () => pageNotes.map(n => `${n.content}${n.pageContext ? `\n${n.pageContext}` : ''}`).join('\n\n'),
    [pageNotes],
  )
  const recapText = useMemo(() => stripHtml(recapHtml), [recapHtml])

  const docHref = docPathForStudy(workspaceId, docId, 'library')

  if (loading || notesLoading) {
    return (
      <div className="flex h-40 items-center justify-center">
        <Loader2 className="h-5 w-5 animate-spin text-muted-foreground" />
      </div>
    )
  }

  if (!pageNotes.length) {
    return (
      <div className="mx-auto max-w-3xl px-8 py-10">
        <StudyPlanHeader
          workspaceId={workspaceId}
          workspaceName={workspaceName}
          folderId={folderId}
          folderName={folderName}
          docTitle={title}
          docHref={docHref}
        />
        <p className="text-sm text-muted-foreground">
          No captures found for this recap yet. Add notes on the source page, then try again.
        </p>
      </div>
    )
  }

  return (
    <div className="min-h-0 flex-1 overflow-y-auto scrollbar-minimal">
      <div className="mx-auto max-w-3xl px-8 py-10 pb-24">
        <StudyPlanHeader
          workspaceId={workspaceId}
          workspaceName={workspaceName}
          folderId={folderId}
          folderName={folderName}
          docTitle={title}
          docHref={docHref}
        />
        <KnowledgeCardDeck
          workspaceId={workspaceId}
          docId={docId}
          recapText={recapText}
          notesText={notesText}
          initialTopic={initialTopic}
          autoStart
        />
      </div>
    </div>
  )
}
