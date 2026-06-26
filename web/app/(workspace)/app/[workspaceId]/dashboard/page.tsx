import type { Metadata } from 'next'
import { Suspense } from 'react'
import Link from 'next/link'
import {
  BarChart2, BookMarked, Globe, BrainCircuit, Flame,
} from 'lucide-react'
import DashboardTopBar from '@/components/dashboard/DashboardTopBar'
import NewDocumentButton from '@/components/dashboard/NewDocumentButton'
import KpiCard from '@/components/dashboard/KpiCard'
import CaptureChart from '@/components/dashboard/CaptureChart'
import TopDomainsChart from '@/components/dashboard/TopDomainsChart'
import ActivityHeatmap from '@/components/dashboard/ActivityHeatmap'
import PinnedCapturesRow from '@/components/dashboard/PinnedCapturesRow'
import LibraryDocumentsSection from '@/components/dashboard/LibraryDocumentsSection'
import { KpiSkeleton, ChartSkeleton, HeatmapSkeleton } from '@/components/dashboard/DashboardSkeleton'
import { fetchDashboardStats, fetchNotes } from '@/lib/data'
import { getWorkspaceName } from '@/lib/workspaces'
import { resolveWorkspaceId, workspacePath } from '@/lib/workspace-routes'

export const metadata: Metadata = { title: 'Dashboard' }

function Greeting() {
  const hour = new Date().getHours()
  if (hour < 12) return 'Good morning'
  if (hour < 17) return 'Good afternoon'
  return 'Good evening'
}

async function StatsSection({ workspaceId }: { workspaceId: string }) {
  const stats = await fetchDashboardStats(workspaceId)
  const analyticsBase = workspacePath(workspaceId, 'analytics')

  const kpis = [
    { title: 'This week',     value: stats.notesThisWeek,               delta: stats.notesThisWeekDelta, deltaLabel: 'vs last week', icon: BookMarked,   iconColor: 'text-stone-700', href: analyticsBase },
    { title: 'Total notes',   value: stats.totalNotes.toLocaleString(), description: 'All time',         icon: BarChart2,    iconColor: 'text-teal-800', href: analyticsBase },
    { title: 'Domains',       value: stats.totalDomains,                description: 'Unique websites',  icon: Globe,        iconColor: 'text-amber-800', href: analyticsBase },
    { title: 'AI queries',    value: stats.aiQueriesRun,                description: 'Summaries made',   icon: BrainCircuit, iconColor: 'text-stone-600', href: analyticsBase },
    { title: 'Streak',        value: `${stats.streakDays}d`,            description: 'Active days',      icon: Flame,        iconColor: 'text-orange-800', href: analyticsBase },
  ]

  return (
    <div className="space-y-4">
      <div className="grid grid-cols-2 lg:grid-cols-5 gap-3">
        {kpis.map(kpi => <KpiCard key={kpi.title} {...kpi} />)}
      </div>
      <div className="grid lg:grid-cols-2 gap-4">
        <CaptureChart data={stats.captureHistory} />
        <TopDomainsChart data={stats.topDomains} />
      </div>
      <ActivityHeatmap
        data={stats.captureHistory}
        linkHref={workspacePath(workspaceId, 'analytics') + '#activity'}
      />
    </div>
  )
}

async function CapturesSection({ workspaceId }: { workspaceId: string }) {
  const notes = await fetchNotes(workspaceId)
  return <PinnedCapturesRow workspaceId={workspaceId} initialNotes={notes} />
}

export default async function WorkspaceDashboardPage({
  params,
}: {
  params: Promise<{ workspaceId: string }>
}) {
  const { workspaceId: routeSegment } = await params
  const workspaceId = resolveWorkspaceId(routeSegment)
  const workspaceName = getWorkspaceName(routeSegment)

  return (
    <div className="min-h-full bg-background">
      <DashboardTopBar workspaceName={workspaceName} />

      {/* ── Main content — generous bottom padding so chat bar never overlaps ── */}
      <div className="w-full min-w-0 px-8 py-8 pb-32 space-y-12">

        {/* ── Greeting + actions ── */}
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold tracking-tight text-foreground">
              <Greeting />
            </h1>
            <p className="mt-0.5 text-sm text-muted-foreground">Here&apos;s what&apos;s happening in your workspace.</p>
          </div>
          <div className="flex items-center gap-2">
            <Link
              href={workspacePath(workspaceId, 'history')}
              className="inline-flex items-center gap-1.5 rounded-lg bg-primary px-4 py-2 text-sm font-medium text-primary-foreground transition-opacity hover:opacity-90"
            >
              View all captures
            </Link>
          </div>
        </div>

        {/* ── Web Captures ── */}
        <section>
          <h2 className="text-sm font-semibold text-[#37352F] mb-4">Web Captures</h2>
          <Suspense fallback={
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
              {[...Array(4)].map((_, i) => (
                <div key={i} className="h-40 animate-pulse rounded-2xl bg-muted" />
              ))}
            </div>
          }>
            <CapturesSection workspaceId={workspaceId} />
          </Suspense>
        </section>

        {/* ── Library Documents ── */}
        <section>
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-sm font-semibold text-foreground">Library Documents</h2>
            <NewDocumentButton workspaceId={workspaceId} />
          </div>
          <Suspense fallback={
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
              {[...Array(4)].map((_, i) => (
                <div key={i} className="h-40 animate-pulse rounded-2xl bg-muted" />
              ))}
            </div>
          }>
            <LibraryDocumentsSection workspaceId={workspaceId} />
          </Suspense>
        </section>

        {/* ── Stats & Activity ── */}
        <section>
          <h2 className="mb-4 text-sm font-semibold text-foreground">Stats &amp; Activity</h2>
          <Suspense fallback={
            <div className="space-y-4">
              <div className="grid grid-cols-2 lg:grid-cols-5 gap-3">
                {[...Array(5)].map((_, i) => <KpiSkeleton key={i} />)}
              </div>
              <div className="grid lg:grid-cols-2 gap-4">
                <ChartSkeleton /><ChartSkeleton />
              </div>
              <HeatmapSkeleton />
            </div>
          }>
            <StatsSection workspaceId={workspaceId} />
          </Suspense>
        </section>

      </div>
    </div>
  )
}
