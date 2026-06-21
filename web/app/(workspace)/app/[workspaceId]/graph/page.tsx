import type { Metadata } from 'next'
import { Suspense } from 'react'
import KnowledgeGraph from '@/components/graph/KnowledgeGraph'
import { Skeleton } from '@/components/ui/skeleton'
import { fetchGraphData } from '@/lib/data'

export const metadata: Metadata = { title: 'Knowledge Graph' }

async function GraphData({ workspaceId }: { workspaceId: string }) {
  const data = await fetchGraphData(workspaceId)
  return <KnowledgeGraph data={data} />
}

export default async function WorkspaceGraphPage({
  params,
}: {
  params: Promise<{ workspaceId: string }>
}) {
  const { workspaceId } = await params

  return (
    <div className="relative h-screen w-full overflow-hidden">
      <Suspense fallback={<Skeleton className="h-full w-full rounded-none" />}>
        <GraphData workspaceId={workspaceId} />
      </Suspense>
    </div>
  )
}
