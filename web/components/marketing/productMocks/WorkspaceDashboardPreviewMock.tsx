import {
  BarChart2,
  BookMarked,
  BrainCircuit,
  ChevronRight,
  ChevronDown,
  Flame,
  Clock,
  Home,
  Moon,
  Search,
  Settings,
  Share2,
} from 'lucide-react'
import DashboardCapturesMock from '@/components/marketing/productMocks/DashboardCapturesMock'
import LibraryDocumentsMock from '@/components/marketing/productMocks/LibraryDocumentsMock'
import WorkspaceChatMock from '@/components/marketing/productMocks/WorkspaceChatMock'
import { cn } from '@/lib/utils'

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
  { title: 'AI queries', value: '0', icon: BrainCircuit, iconColor: 'text-stone-600' },
  { title: 'Streak', value: '3d', icon: Flame, iconColor: 'text-orange-800' },
] as const

export default function WorkspaceDashboardPreviewMock({ className }: WorkspaceDashboardPreviewMockProps) {
  return (
    <div className={cn('w-full overflow-hidden rounded-2xl border border-[#E8DFD4] bg-white', className)}>
      <div className="flex min-h-[560px]">
        <aside className="hidden w-[200px] shrink-0 flex-col border-r border-border bg-[#FDFBF7] sm:flex">
          <div className="border-b border-border p-3">
            <div className="flex items-center justify-between gap-1 rounded-md px-2 py-1.5 text-xs font-medium text-foreground">
              <span className="truncate">Marketing Team</span>
              <ChevronDown className="h-3.5 w-3.5 shrink-0 text-muted-foreground" aria-hidden />
            </div>
            <div className="mt-2 flex items-center gap-2 rounded-md border border-border bg-background px-2.5 py-1.5 text-muted-foreground">
              <Search className="h-3.5 w-3.5 shrink-0" aria-hidden />
              <span className="text-xs">Search</span>
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
            {['me', 'Auto Recaps'].map(folder => (
              <div
                key={folder}
                className="rounded-md px-2.5 py-2 text-xs text-muted-foreground"
              >
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
                  N
                </span>
                <span className="truncate text-xs font-medium text-foreground">Ryan Lyncee</span>
              </div>
              <Moon className="h-3.5 w-3.5 shrink-0 text-muted-foreground" aria-hidden />
            </div>
          </div>
        </aside>

        <div className="relative min-w-0 flex-1 bg-background">
          <div className="border-b border-border bg-card px-6 py-3">
            <nav className="flex items-center gap-1.5 text-xs text-muted-foreground">
              <span>Marketing Team</span>
              <ChevronRight className="h-3 w-3" aria-hidden />
              <span className="font-medium text-foreground">Dashboard</span>
            </nav>
          </div>

          <div className="space-y-8 px-6 py-6 pb-28">
            <div className="flex flex-wrap items-center justify-between gap-4">
              <div>
                <h3 className="text-2xl font-bold tracking-tight text-foreground">Good afternoon</h3>
                <p className="mt-0.5 text-sm text-muted-foreground">
                  Here&apos;s what&apos;s happening in your workspace.
                </p>
              </div>
              <span className="inline-flex items-center rounded-lg bg-primary px-4 py-2 text-sm font-medium text-primary-foreground">
                View all captures
              </span>
            </div>

            <section>
              <h4 className="mb-4 text-sm font-semibold text-[#37352F]">Web Captures</h4>
              <DashboardCapturesMock limit={4} />
            </section>

            <section>
              <div className="mb-4 flex items-center justify-between">
                <h4 className="text-sm font-semibold text-foreground">Library Documents</h4>
                <span className="text-xs font-medium text-muted-foreground">+ New</span>
              </div>
              <LibraryDocumentsMock limit={4} />
            </section>

            <section>
              <h4 className="mb-4 text-sm font-semibold text-foreground">Stats &amp; Activity</h4>
              <div className="grid grid-cols-2 gap-3 lg:grid-cols-4">
                {KPIS.map(kpi => (
                  <div
                    key={kpi.title}
                    className="space-y-3 rounded-xl border border-border bg-card p-4"
                  >
                    <div className="flex items-center justify-between">
                      <p className="text-xs font-medium tracking-wide text-muted-foreground">
                        {kpi.title}
                      </p>
                      <div
                        className={cn(
                          'flex h-8 w-8 items-center justify-center rounded-lg bg-muted',
                          kpi.iconColor,
                        )}
                      >
                        <kpi.icon className="h-4 w-4" aria-hidden />
                      </div>
                    </div>
                    <p className="text-2xl font-bold tracking-tight text-foreground">{kpi.value}</p>
                  </div>
                ))}
              </div>
            </section>
          </div>

          <div className="absolute inset-x-0 bottom-5 flex justify-center px-4">
            <WorkspaceChatMock variant="pill" elevated={false} />
          </div>
        </div>
      </div>
    </div>
  )
}
