import {
  Activity,
  BarChart2,
  BookMarked,
  BrainCircuit,
  ChevronRight,
  ChevronDown,
  Clock,
  FileText,
  Flame,
  Home,
  Moon,
  Search,
  Settings,
  Share2,
  Sparkles,
} from 'lucide-react'
import DashboardCapturesMock from '@/components/marketing/productMocks/DashboardCapturesMock'
import LibraryDocumentsMock from '@/components/marketing/productMocks/LibraryDocumentsMock'
import MarketingSidebarFolderList from '@/components/marketing/productMocks/MarketingSidebarFolderList'
import WorkspaceChatMock from '@/components/marketing/productMocks/WorkspaceChatMock'
import { cn } from '@/lib/utils'
import { DEMO_DOMAIN, DEMO_PAGE_TITLE } from '@/components/marketing/productMocks/sampleData'

type WorkspaceDashboardPreviewMockProps = {
  className?: string
}

const NAV = [
  { label: 'Home', icon: Home, active: true },
  { label: 'Captures', icon: Clock, active: false },
  { label: 'Analytics', icon: BarChart2, active: false },
  { label: 'Settings', icon: Settings, active: false },
] as const

const KPIS = [
  { title: 'This week', value: '13', icon: BookMarked, iconColor: 'text-stone-700' },
  { title: 'Total notes', value: '43', icon: BarChart2, iconColor: 'text-teal-800' },
  { title: 'AI queries', value: '26', icon: BrainCircuit, iconColor: 'text-stone-600' },
  { title: 'Streak', value: '3d', icon: Flame, iconColor: 'text-orange-800' },
] as const

const ACTIVITY_FEED = [
  {
    icon: Sparkles,
    label: 'Recap update approved',
    sub: `${DEMO_DOMAIN} · ${DEMO_PAGE_TITLE}`,
    time: '2h ago',
  },
  {
    icon: FileText,
    label: 'Highlight saved',
    sub: `Follow-up reading · ${DEMO_DOMAIN}`,
    time: '5h ago',
  },
  {
    icon: BrainCircuit,
    label: 'Answer cited your captures',
    sub: 'Ask Inline · reading session',
    time: '1d ago',
  },
] as const

export default function WorkspaceDashboardPreviewMock({ className }: WorkspaceDashboardPreviewMockProps) {
  return (
    <div
      className={cn(
        'flex w-full min-h-[480px] overflow-hidden rounded-2xl border border-[#E8DFD4] bg-white sm:h-[600px] md:h-[640px]',
        className,
      )}
      aria-label="Workspace dashboard preview"
    >
      <aside className="hidden w-[200px] shrink-0 flex-col border-r border-border bg-[#FDFBF7] lg:flex">
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

          <MarketingSidebarFolderList
            folders={[{ label: 'Research' }, { label: 'Auto Recaps' }]}
          />
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

        <div className="space-y-4 overflow-hidden px-4 py-4 pb-16 sm:space-y-5 sm:px-6 sm:py-5 sm:pb-20">
          <div className="flex flex-wrap items-center justify-between gap-3">
            <div>
              <h3 className="text-xl font-bold tracking-tight text-foreground sm:text-2xl">Good afternoon</h3>
              <p className="mt-0.5 text-sm text-muted-foreground">
                Here&apos;s what&apos;s happening in your workspace.
              </p>
            </div>
            <span className="inline-flex shrink-0 items-center rounded-lg bg-[#1B1B1B] px-3 py-1.5 text-xs font-medium text-white sm:px-4 sm:py-2 sm:text-sm">
              View all captures
            </span>
          </div>

          <section>
            <h4 className="mb-3 text-sm font-semibold text-[#37352F]">Web Captures</h4>
            <DashboardCapturesMock limit={3} size="compact" />
          </section>

          <section>
            <div className="mb-3 flex items-center justify-between">
              <h4 className="text-sm font-semibold text-foreground">Library Documents</h4>
              <span className="text-xs font-medium text-muted-foreground">+ New</span>
            </div>
            <LibraryDocumentsMock limit={3} />
          </section>

          <section>
            <h4 className="mb-3 text-sm font-semibold text-foreground">Stats &amp; Activity</h4>
            <div className="-mx-1 flex gap-3 overflow-x-auto overflow-y-hidden px-1 pb-1 scrollbar-minimal snap-x snap-mandatory">
              {KPIS.map(kpi => (
                <div
                  key={kpi.title}
                  className="w-[140px] shrink-0 snap-start space-y-2 rounded-xl border border-border bg-card p-3 sm:w-[152px]"
                >
                  <div className="flex items-center justify-between gap-2">
                    <p className="text-[11px] font-medium tracking-wide text-muted-foreground">{kpi.title}</p>
                    <div
                      className={cn(
                        'flex h-7 w-7 shrink-0 items-center justify-center rounded-lg bg-muted',
                        kpi.iconColor,
                      )}
                    >
                      <kpi.icon className="h-3.5 w-3.5" aria-hidden />
                    </div>
                  </div>
                  <p className="text-xl font-bold tracking-tight text-foreground">{kpi.value}</p>
                </div>
              ))}
            </div>
          </section>
        </div>

        <div
          className="pointer-events-none absolute inset-x-0 bottom-0 h-24 bg-gradient-to-t from-background via-background/90 to-transparent"
          aria-hidden
        />

        <div className="absolute inset-x-0 bottom-3 flex justify-center px-4 sm:bottom-4">
          <WorkspaceChatMock variant="pill" elevated />
        </div>
      </div>

      <aside className="hidden w-[220px] shrink-0 flex-col border-l border-border bg-card xl:flex">
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
          {ACTIVITY_FEED.map(item => (
            <div
              key={item.label}
              className="rounded-lg border border-transparent px-2.5 py-2.5"
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
