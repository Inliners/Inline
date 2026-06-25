import type { Metadata } from 'next'
import { Suspense } from 'react'
import NotesTable from '@/components/history/NotesTable'
import PageActivityGroupsClient from '@/components/history/PageActivityGroupsClient'
import PageHeader from '@/components/shell/PageHeader'
import ExportButton from '@/components/shell/ExportButton'
import { Skeleton } from '@/components/ui/skeleton'
import { fetchNotes, fetchRecapsByPageUrl } from '@/lib/data'
import { getWorkspaceName } from '@/lib/workspaces'
import { resolveWorkspaceId, workspacePath } from '@/lib/workspace-routes'

export const metadata: Metadata = { title: 'History' }

function TableSkeleton() {
  return (
    <div className="space-y-2">
      {[...Array(8)].map((_, i) => (
        <Skeleton key={i} className="h-12 w-full rounded-lg" />
      ))}
    </div>
  )
}

async function HistorySection({
  workspaceId,
  workspaceName,
  highlightNoteId,
}: {
  workspaceId: string
  workspaceName: string
  highlightNoteId?: string
}) {
  const [notes, recapByPageUrl] = await Promise.all([
    fetchNotes(workspaceId),
    fetchRecapsByPageUrl(workspaceId),
  ])
  return (
    <>
      <PageActivityGroupsClient
        notes={notes}
        workspaceId={workspaceId}
        workspaceName={workspaceName}
        serverRecapByPageUrl={recapByPageUrl}
      />
      <NotesTable notes={notes} workspaceId={workspaceId} highlightNoteId={highlightNoteId} />
    </>
  )
}

export default async function WorkspaceHistoryPage({
  params,
  searchParams,
}: {
  params: Promise<{ workspaceId: string }>
  searchParams: Promise<{ q?: string }>
}) {
  const { workspaceId: routeSegment } = await params
  const q = (await searchParams)?.q
  const workspaceId = resolveWorkspaceId(routeSegment)
  const workspaceName = getWorkspaceName(workspaceId)

  return (
    <div className="min-h-full bg-background">
      <PageHeader
        crumbs={[
          { label: workspaceName, href: workspacePath(workspaceId, 'dashboard') },
          { label: 'History' },
        ]}
        action={
          <ExportButton
            workspaceId={workspaceId}
            className="h-8 px-3 rounded-lg border border-border bg-card text-sm text-foreground hover:bg-accent/40 transition-colors"
          />
        }
      />
      <div className="w-full min-w-0 p-6">
        <Suspense fallback={<TableSkeleton />}>
          <HistorySection workspaceId={workspaceId} workspaceName={workspaceName} highlightNoteId={q} />
        </Suspense>
      </div>
    </div>
  )
}
