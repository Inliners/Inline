'use client'

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
import type { ReactNode } from 'react'
import { AnimatePresence, motion, useReducedMotion } from 'framer-motion'
import DashboardCapturesMock from '@/components/marketing/productMocks/DashboardCapturesMock'
import LibraryDocumentsMock from '@/components/marketing/productMocks/LibraryDocumentsMock'
import MarketingSidebarFolderList from '@/components/marketing/productMocks/MarketingSidebarFolderList'
import WorkspaceChatMock from '@/components/marketing/productMocks/WorkspaceChatMock'
import {
  MockActivityHeatmap,
  MockCaptureVolumeChart,
  MockTopDomainsChart,
} from '@/components/marketing/productMocks/DashboardChartMocks'
import { cn } from '@/lib/utils'
import { DEMO_DOMAIN, DEMO_PAGE_TITLE } from '@/components/marketing/productMocks/sampleData'

const NAV = [
  { label: 'Home', icon: Home },
  { label: 'Captures', icon: Clock },
  { label: 'Analytics', icon: BarChart2 },
  { label: 'Settings', icon: Settings },
] as const

export type DashboardHeroPage = 'home' | 'captures' | 'analytics'

const PAGE_BREADCRUMB: Record<DashboardHeroPage, string> = {
  home: 'Dashboard',
  captures: 'Captures',
  analytics: 'Analytics',
}

const PAGE_HEADER: Record<DashboardHeroPage, { title: string; subtitle: string }> = {
  home: {
    title: 'Good afternoon',
    subtitle: "Here's what's happening in your workspace.",
  },
  captures: {
    title: 'Web Captures',
    subtitle: 'Pinned pages and recent saves from the extension.',
  },
  analytics: {
    title: 'Analytics',
    subtitle: 'Capture volume and top domains in your workspace.',
  },
}

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
    sub: `${DEMO_DOMAIN} · ${DEMO_PAGE_TITLE}`,
    time: '2h ago',
  },
  {
    icon: Sparkles,
    label: 'Auto-recap updated',
    sub: 'Library · Follow-up reading',
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

const EASE: [number, number, number, number] = [0.25, 0.46, 0.45, 0.94]

type WorkspaceDashboardHeroMockProps = {
  className?: string
  /** Shorter layout for the marketing showcase band. */
  compact?: boolean
  activeNavIndex?: number
  page?: DashboardHeroPage
  /** Cross-fade main content when the page changes. */
  animateTransitions?: boolean
  /** Override the floating Ask Inline dock (e.g. animated pill / panel). */
  chatFooter?: ReactNode
  mainContent?: ReactNode
}

export default function WorkspaceDashboardHeroMock({
  className,
  compact = false,
  activeNavIndex = 0,
  page = 'home',
  animateTransitions = false,
  chatFooter,
  mainContent,
}: WorkspaceDashboardHeroMockProps) {
  const reduceMotion = useReducedMotion()
  const header = PAGE_HEADER[page]
  const breadcrumb = PAGE_BREADCRUMB[page]

  const defaultMain = (
    <>
      {page === 'home' && (
        <>
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
        </>
      )}

      {page === 'captures' && (
        <>
          <section>
            <DashboardCapturesMock limit={compact ? 4 : 5} size={compact ? 'compact' : 'default'} />
          </section>

          <section>
            <h4 className="mb-3 text-sm font-semibold text-foreground">Recently saved</h4>
            <DashboardCapturesMock
              limit={compact ? 3 : 4}
              offset={1}
              size={compact ? 'compact' : 'default'}
            />
          </section>

          <section>
            <div className="mb-3 flex items-center justify-between">
              <h4 className="text-sm font-semibold text-foreground">Linked recaps</h4>
              <span className="text-xs font-medium text-muted-foreground">Auto Recaps</span>
            </div>
            <LibraryDocumentsMock limit={compact ? 2 : 3} />
          </section>
        </>
      )}

      {(page === 'home' || page === 'analytics') && (
        <section className="space-y-3">
          {page === 'analytics' && (
            <h4 className="text-sm font-semibold text-foreground">Overview</h4>
          )}
          {page === 'home' && (
            <h4 className="text-sm font-semibold text-foreground">Stats &amp; Activity</h4>
          )}
          <div
            className={cn(
              compact || page === 'analytics'
                ? '-mx-1 flex gap-3 overflow-x-auto overflow-y-hidden px-1 pb-2 snap-x snap-mandatory scrollbar-minimal'
                : 'grid grid-cols-2 gap-3 xl:grid-cols-5',
            )}
          >
            {KPIS.map(kpi => (
              <div
                key={kpi.title}
                className={cn(
                  'space-y-2 rounded-xl border border-border bg-card',
                  compact || page === 'analytics'
                    ? 'w-[152px] shrink-0 snap-start p-3'
                    : 'space-y-3 p-4',
                )}
              >
                <div className="flex items-center justify-between">
                  <p className="text-xs font-medium tracking-wide text-muted-foreground">{kpi.title}</p>
                  <div
                    className={cn(
                      'flex items-center justify-center rounded-lg bg-muted',
                      compact || page === 'analytics' ? 'h-7 w-7' : 'h-8 w-8',
                      kpi.iconColor,
                    )}
                  >
                    <kpi.icon
                      className={cn(compact || page === 'analytics' ? 'h-3.5 w-3.5' : 'h-4 w-4')}
                      aria-hidden
                    />
                  </div>
                </div>
                <div>
                  <p
                    className={cn(
                      'font-bold tracking-tight text-foreground',
                      compact || page === 'analytics' ? 'text-xl' : 'text-2xl',
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

          {page === 'analytics' && (
            <div className="grid gap-3 sm:grid-cols-2">
              <MockCaptureVolumeChart className="p-4" />
              <MockTopDomainsChart className="p-4" />
            </div>
          )}

          {!compact && page === 'home' && (
            <>
              <div className="grid gap-4 lg:grid-cols-2">
                <MockCaptureVolumeChart />
                <MockTopDomainsChart />
              </div>
              <MockActivityHeatmap />
            </>
          )}
        </section>
      )}
    </>
  )

  const renderedMain = mainContent ?? defaultMain
  const mainSlot =
    animateTransitions && !mainContent ? (
      <AnimatePresence mode="wait" initial={false}>
        <motion.div
          key={page}
          initial={reduceMotion ? false : { opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          exit={reduceMotion ? undefined : { opacity: 0, y: -8 }}
          transition={{ duration: reduceMotion ? 0 : 0.38, ease: EASE }}
        >
          {defaultMain}
        </motion.div>
      </AnimatePresence>
    ) : (
      renderedMain
    )

  return (
    <div
      className={cn(
        'flex w-full bg-white',
        compact ? 'min-h-[440px] overflow-hidden sm:h-[640px] md:h-[720px]' : 'min-h-[680px] lg:min-h-[760px]',
        className,
      )}
    >
      <aside className="hidden w-[220px] shrink-0 flex-col border-r border-border bg-[#FDFBF7] lg:flex">
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
          {NAV.map((item, index) => (
            <div
              key={item.label}
              className={cn(
                'flex items-center gap-2 rounded-md px-2.5 py-2 text-xs transition-colors duration-300',
                index === activeNavIndex
                  ? 'bg-[#F1F1EF] font-semibold text-[#37352F]'
                  : 'text-muted-foreground',
              )}
            >
              <item.icon className="h-3.5 w-3.5 shrink-0" aria-hidden />
              {item.label}
            </div>
          ))}

          <MarketingSidebarFolderList
            folders={[
              { label: 'Research' },
              { label: 'Auto Recaps' },
              { label: 'me' },
            ]}
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

      <div className="relative flex min-h-0 min-w-0 flex-1 flex-col bg-background">
        <div
          className={cn(
            'pointer-events-none absolute inset-x-0 bottom-0 z-10 bg-gradient-to-t from-white via-white/92 to-transparent',
            compact ? 'h-28 sm:h-36' : 'h-32 sm:h-40',
          )}
          aria-hidden
        />

        <div className="shrink-0 border-b border-border bg-card px-4 py-3 sm:px-6">
          <nav className="flex items-center gap-1.5 text-xs text-muted-foreground">
            <span>Marketing Team</span>
            <ChevronRight className="h-3 w-3" aria-hidden />
            <span className="font-medium text-foreground">{breadcrumb}</span>
          </nav>
        </div>

        <div
          className={cn(
            'min-h-0 flex-1 overflow-y-auto scrollbar-minimal px-3 sm:px-6 lg:pr-8',
            compact ? 'space-y-4 py-4 pb-16 sm:space-y-5 sm:pb-20' : 'space-y-8 py-6 pb-28',
          )}
        >
          <div className="flex flex-wrap items-center justify-between gap-3">
            <div>
              <h3
                className={cn(
                  'font-bold tracking-tight text-foreground',
                  compact ? 'text-xl' : 'text-2xl',
                )}
              >
                {header.title}
              </h3>
              <p className="mt-0.5 text-sm text-muted-foreground">{header.subtitle}</p>
            </div>
            {page === 'home' && (
              <span
                className={cn(
                  'inline-flex items-center rounded-lg bg-primary font-medium text-primary-foreground',
                  compact ? 'px-3 py-1.5 text-xs' : 'px-4 py-2 text-sm',
                )}
              >
                View all captures
              </span>
            )}
          </div>

          {mainSlot}
        </div>

        {chatFooter ?? (
          <div className={cn('absolute inset-x-0 z-20 flex justify-center px-3 sm:px-4', compact ? 'bottom-3' : 'bottom-5')}>
            <WorkspaceChatMock variant="pill" elevated />
          </div>
        )}
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
