import {
  Activity,
  BarChart2,
  BookMarked,
  BrainCircuit,
  ChevronDown,
  ChevronRight,
  Clock,
  FileText,
  Flame,
  Globe,
  Home,
  Moon,
  Search,
  Settings,
  Share2,
  Sparkles,
  TrendingUp,
} from 'lucide-react'
import DashboardCapturesMock from '@/components/marketing/productMocks/DashboardCapturesMock'
import LibraryDocumentsMock from '@/components/marketing/productMocks/LibraryDocumentsMock'
import WorkspaceChatMock from '@/components/marketing/productMocks/WorkspaceChatMock'
import {
  MockActivityHeatmap,
  MockCaptureVolumeChart,
  MockTopDomainsChart,
} from '@/components/marketing/productMocks/DashboardChartMocks'
import { cn } from '@/lib/utils'

const NAV = [
  { label: 'Home', icon: Home, active: true },
  { label: 'Captures', icon: Clock, active: false },
  { label: 'Analytics', icon: BarChart2, active: false },
  { label: 'Settings', icon: Settings, active: false },
] as const

const KPIS = [
  {
    title: 'This week',
    value: '13',
    delta: '+18%',
    deltaLabel: 'vs last week',
    icon: BookMarked,
    iconColor: 'text-stone-700',
  },
  {
    title: 'Total notes',
    value: '43',
    description: 'All time',
    icon: BarChart2,
    iconColor: 'text-teal-800',
  },
  {
    title: 'Domains',
    value: '8',
    description: 'Unique websites',
    icon: Globe,
    iconColor: 'text-amber-800',
  },
  {
    title: 'AI queries',
    value: '26',
    description: 'Summaries made',
    icon: BrainCircuit,
    iconColor: 'text-stone-600',
  },
  {
    title: 'Streak',
    value: '3d',
    description: 'Active days',
    icon: Flame,
    iconColor: 'text-orange-800',
  },
] as const

const ACTIVITY_FEED = [
  {
    icon: FileText,
    label: 'Highlight saved',
    sub: 'engineering.org · Cable-stayed bridge design',
    time: '2h ago',
  },
  {
    icon: Sparkles,
    label: 'Auto-recap updated',
    sub: 'Library · Bridge load distribution',
    time: '5h ago',
  },
  {
    icon: BrainCircuit,
    label: 'AI answer cited 3 sources',
    sub: 'Ask Inline · workspace chat',
    time: '1d ago',
  },
  {
    icon: TrendingUp,
    label: 'Capture streak continued',
    sub: '3 active days in a row',
    time: '1d ago',
  },
] as const

type WorkspaceDashboardHeroMockProps = {
  className?: string
  /** Shorter layout for the marketing showcase band. */
  compact?: boolean
}

export default function WorkspaceDashboardHeroMock({
  className,
  compact = false,
}: WorkspaceDashboardHeroMockProps) {
  return (
    <div
      className={cn(
        'flex w-full bg-white',
        compact ? 'h-[580px] overflow-hidden md:h-[660px]' : 'min-h-[680px] lg:min-h-[760px]',
        className,
      )}
    >
      <aside className="hidden w-[220px] shrink-0 flex-col border-r border-border bg-[#FDFBF7] md:flex">
        <div className="border-b border-border p-3">
          <div className="flex items-center justify-between gap-1 rounded-md px-2 py-1.5 text-xs font-medium text-foreground">
            <span className="truncate">Marketing Team</span>
            <ChevronDown className="h-3.5 w-3.5 shrink-0 text-muted-foreground" aria-hidden />
          </div>
          <div className="mt-2 flex items-center gap-2 rounded-md border border-border bg-background px-2.5 py-1.5 text-muted-foreground">
            <Search className="h-3.5 w-3.5 shrink-0" aria-hidden />
            <span className="text-xs">Search workspace</span>
          </div>
        </div>

        <nav className="flex-1 space-y-0.5 p-2">
          {NAV.map(item => (
            <div
              key={item.label}
              className={cn(
                'flex items-center gap-2 rounded-md px-2.5 py-2 text-xs',
                item.active
                  ? 'bg-[#F1F1EF] font-semibold text-[#37352F]'
                  : 'text-muted-foreground',
              )}
            >
              <item.icon className="h-3.5 w-3.5 shrink-0" aria-hidden />
              {item.label}
            </div>
          ))}

          <p className="mb-1 mt-4 px-2.5 text-[10px] font-semibold uppercase tracking-wider text-muted-foreground">
            Folders
          </p>
          {['Research', 'Auto Recaps', 'me'].map(folder => (
            <div key={folder} className="rounded-md px-2.5 py-2 text-xs text-muted-foreground">
              {folder}
            </div>
          ))}
        </nav>

        <div className="space-y-2 border-t border-border p-3">
          <div className="flex items-center gap-2 rounded-md px-2 py-1.5 text-xs text-muted-foreground">
            <Share2 className="h-3.5 w-3.5" aria-hidden />
            Share Inline
          </div>
          <div className="flex items-center justify-between gap-2">
            <div className="flex min-w-0 items-center gap-2">
                <span className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-primary text-[10px] font-semibold text-primary-foreground">
                  Y
                </span>
                <span className="truncate text-xs font-medium text-foreground">You</span>
            </div>
            <Moon className="h-3.5 w-3.5 shrink-0 text-muted-foreground" aria-hidden />
          </div>
        </div>
      </aside>

      <div className="relative min-w-0 flex-1 bg-background">
        <div className="border-b border-border bg-card px-4 py-3 sm:px-6">
          <nav className="flex items-center gap-1.5 text-xs text-muted-foreground">
            <span>Marketing Team</span>
            <ChevronRight className="h-3 w-3" aria-hidden />
            <span className="font-medium text-foreground">Dashboard</span>
          </nav>
        </div>

        <div className={cn('px-4 sm:px-6 lg:pr-8', compact ? 'space-y-5 py-4 pb-20' : 'space-y-8 py-6 pb-28')}>
          <div className="flex flex-wrap items-center justify-between gap-3">
            <div>
              <h3
                className={cn(
                  'font-bold tracking-tight text-foreground',
                  compact ? 'text-xl' : 'text-2xl',
                )}
              >
                Good afternoon
              </h3>
              <p className="mt-0.5 text-sm text-muted-foreground">
                Here&apos;s what&apos;s happening in your workspace.
              </p>
            </div>
            <span
              className={cn(
                'inline-flex items-center rounded-lg bg-primary font-medium text-primary-foreground',
                compact ? 'px-3 py-1.5 text-xs' : 'px-4 py-2 text-sm',
              )}
            >
              View all captures
            </span>
          </div>

          <section>
            <h4 className="mb-3 text-sm font-semibold text-[#37352F]">Web Captures</h4>
            <DashboardCapturesMock limit={compact ? 3 : 4} size={compact ? 'compact' : 'default'} />
          </section>

          <section>
            <div className="mb-3 flex items-center justify-between">
              <h4 className="text-sm font-semibold text-foreground">Library Documents</h4>
              <span className="text-xs font-medium text-muted-foreground">+ New</span>
            </div>
            <LibraryDocumentsMock limit={compact ? 3 : 4} />
          </section>

          <section className="space-y-3">
            <h4 className="text-sm font-semibold text-foreground">Stats &amp; Activity</h4>
            <div
              className={cn(
                compact
                  ? '-mx-1 flex gap-3 overflow-x-auto overflow-y-hidden px-1 pb-2 snap-x snap-mandatory scrollbar-minimal'
                  : 'grid grid-cols-2 gap-3 xl:grid-cols-5',
              )}
            >
              {KPIS.map(kpi => (
                <div
                  key={kpi.title}
                  className={cn(
                    'space-y-2 rounded-xl border border-border bg-card',
                    compact ? 'w-[152px] shrink-0 snap-start p-3' : 'space-y-3 p-4',
                  )}
                >
                  <div className="flex items-center justify-between">
                    <p className="text-xs font-medium tracking-wide text-muted-foreground">{kpi.title}</p>
                    <div
                      className={cn(
                        'flex items-center justify-center rounded-lg bg-muted',
                        compact ? 'h-7 w-7' : 'h-8 w-8',
                        kpi.iconColor,
                      )}
                    >
                      <kpi.icon className={cn(compact ? 'h-3.5 w-3.5' : 'h-4 w-4')} aria-hidden />
                    </div>
                  </div>
                  <div>
                    <p
                      className={cn(
                        'font-bold tracking-tight text-foreground',
                        compact ? 'text-xl' : 'text-2xl',
                      )}
                    >
                      {kpi.value}
                    </p>
                    {'delta' in kpi ? (
                      <p className="mt-0.5 text-xs text-emerald-700">
                        {kpi.delta} <span className="text-muted-foreground">{kpi.deltaLabel}</span>
                      </p>
                    ) : (
                      <p className="mt-0.5 text-xs text-muted-foreground">{kpi.description}</p>
                    )}
                  </div>
                </div>
              ))}
            </div>

            {!compact && (
              <>
                <div className="grid gap-4 lg:grid-cols-2">
                  <MockCaptureVolumeChart />
                  <MockTopDomainsChart />
                </div>
                <MockActivityHeatmap />
              </>
            )}
          </section>
        </div>

        <div className={cn('absolute inset-x-0 flex justify-center px-4', compact ? 'bottom-3' : 'bottom-5')}>
          <WorkspaceChatMock variant="pill" elevated />
        </div>
      </div>

      <aside className={cn('hidden shrink-0 flex-col border-l border-border bg-card xl:flex', compact ? 'w-[220px]' : 'w-[260px]')}>
        <div className="flex border-b border-border">
          <div className="flex flex-1 items-center justify-center gap-1.5 border-b-2 border-foreground px-3 py-3 text-xs font-medium text-foreground">
            <Activity className="h-3.5 w-3.5" aria-hidden />
            Activity
          </div>
          <div className="flex flex-1 items-center justify-center gap-1.5 px-3 py-3 text-xs text-muted-foreground">
            <Sparkles className="h-3.5 w-3.5" aria-hidden />
            Insights
          </div>
        </div>
        <div className="flex-1 space-y-1 overflow-hidden p-3">
          {ACTIVITY_FEED.slice(0, compact ? 3 : 4).map(item => (
            <div
              key={item.label}
              className="rounded-lg border border-transparent px-2.5 py-2.5 transition-colors hover:border-border hover:bg-muted/40"
            >
              <div className="flex items-start gap-2.5">
                <div className="mt-0.5 flex h-7 w-7 shrink-0 items-center justify-center rounded-md bg-muted text-muted-foreground">
                  <item.icon className="h-3.5 w-3.5" aria-hidden />
                </div>
                <div className="min-w-0 flex-1">
                  <p className="text-xs font-medium text-foreground">{item.label}</p>
                  <p className="mt-0.5 line-clamp-2 text-[10px] leading-relaxed text-muted-foreground">
                    {item.sub}
                  </p>
                  <p className="mt-1 text-[10px] text-muted-foreground/80">{item.time}</p>
                </div>
              </div>
            </div>
          ))}
        </div>
      </aside>
    </div>
  )
}
