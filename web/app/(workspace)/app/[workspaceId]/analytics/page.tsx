import type { Metadata } from 'next'
import { Suspense } from 'react'
import PageHeader from '@/components/shell/PageHeader'
import { getWorkspaceName } from '@/lib/workspaces'
import { fetchDashboardStats, fetchCaptureTimeSeries } from '@/lib/data'
import AnalyticsCharts from '@/components/analytics/AnalyticsCharts'
import { Skeleton } from '@/components/ui/skeleton'

export const metadata: Metadata = { title: 'Analytics' }

async function AnalyticsData({ workspaceId }: { workspaceId: string }) {
  const [stats, timeSeries30, timeSeries7] = await Promise.all([
    fetchDashboardStats(workspaceId),
    fetchCaptureTimeSeries(workspaceId, 30),
    fetchCaptureTimeSeries(workspaceId, 7),
  ])

  return (
    <AnalyticsCharts
      stats={stats}
      timeSeries30={timeSeries30}
      timeSeries7={timeSeries7}
      workspaceId={workspaceId}
    />
  )
}

export default async function AnalyticsPage({
  params,
}: {
  params: Promise<{ workspaceId: string }>
}) {
  const { workspaceId } = await params
  const workspaceName   = getWorkspaceName(workspaceId)

  return (
    <div className="min-h-full bg-white dark:bg-[#0A1430]">
      <PageHeader
        crumbs={[
          { label: workspaceName, href: `/app/${workspaceId}/dashboard` },
          { label: 'Analytics' },
        ]}
      />
      <div className="w-full min-w-0 p-6">
        <Suspense fallback={
          <div className="space-y-4">
            <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
              {[...Array(4)].map((_, i) => <Skeleton key={i} className="h-28 rounded-xl" />)}
            </div>
            <Skeleton className="h-72 rounded-xl" />
            <div className="grid lg:grid-cols-2 gap-4">
              <Skeleton className="h-64 rounded-xl" />
              <Skeleton className="h-64 rounded-xl" />
            </div>
          </div>
        }>
          <AnalyticsData workspaceId={workspaceId} />
        </Suspense>
      </div>
    </div>
  )
}
