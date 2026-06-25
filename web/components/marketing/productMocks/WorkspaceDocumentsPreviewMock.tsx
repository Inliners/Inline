import {
  BarChart2,
  ChevronDown,
  ChevronRight,
  Clock,
  ExternalLink,
  Home,
  ListTree,
  Moon,
  Search,
  Settings,
  Share2,
  Sparkles,
  Star,
} from 'lucide-react'
import LibraryDocumentsMock from '@/components/marketing/productMocks/LibraryDocumentsMock'
import MarketingSidebarFolderList from '@/components/marketing/productMocks/MarketingSidebarFolderList'
import {
  DEMO_DOMAIN,
  DEMO_PAGE_TITLE,
  DEMO_PAGE_TITLE_RECAP,
  DEMO_RECAP_CAPTURE_ENTRIES,
  DEMO_RECAP_OVERVIEW,
  DEMO_RECAP_TAKEAWAYS,
} from '@/components/marketing/productMocks/sampleData'
import '@/components/documents/editor-content.css'
import { cn } from '@/lib/utils'

type WorkspaceDocumentsPreviewMockProps = {
  className?: string
}

const NAV = [
  { label: 'Home', icon: Home, active: false },
  { label: 'Captures', icon: Clock, active: false },
  { label: 'Analytics', icon: BarChart2, active: false },
  { label: 'Settings', icon: Settings, active: false },
] as const

const FOLDERS = [
  { label: 'Research', active: false },
  { label: 'Auto Recaps', active: true },
] as const

const CAPTURE_TAGS = ['highlight', 'sticky'] as const

const DOC_PAD = 'px-6 sm:px-10 lg:px-12'

export default function WorkspaceDocumentsPreviewMock({
  className,
}: WorkspaceDocumentsPreviewMockProps) {
  return (
    <div
      className={cn(
        'flex w-full min-h-[480px] overflow-hidden rounded-2xl border border-[#E8DFD4] bg-white sm:h-[600px] md:h-[640px]',
        className,
      )}
      aria-label="Workspace recap documents preview"
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

          <MarketingSidebarFolderList folders={FOLDERS} />
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

      <div className="relative flex min-w-0 flex-1 flex-col bg-background">
        <nav
          aria-label="Breadcrumb"
          className="flex shrink-0 min-w-0 flex-wrap items-center gap-1.5 border-b border-border bg-card px-4 py-3 text-xs text-muted-foreground sm:px-6"
        >
          <span>Marketing Team</span>
          <ChevronRight className="h-3 w-3 shrink-0 opacity-50" aria-hidden />
          <span>Auto Recaps</span>
          <ChevronRight className="h-3 w-3 shrink-0 opacity-50" aria-hidden />
          <span className="truncate font-medium text-foreground">{DEMO_PAGE_TITLE_RECAP}</span>
        </nav>

        <div className="flex min-h-0 flex-1 overflow-hidden">
          <div className="min-h-0 flex-1 overflow-y-auto scrollbar-minimal">
            <header className={cn('border-b border-border/60 bg-card py-5 sm:py-6', DOC_PAD)}>
              <div className="flex flex-wrap items-center gap-2">
                <span className="inline-flex items-center gap-1.5 rounded-full border border-amber-200 bg-amber-50 px-2.5 py-1 text-[11px] font-medium text-amber-800">
                  <Sparkles className="h-3 w-3" aria-hidden />
                  Auto-recap
                </span>
                <span className="text-xs text-muted-foreground sm:ml-auto">Updated 2h ago</span>
              </div>

              <div className="mt-2.5 flex flex-wrap items-center gap-2">
                {CAPTURE_TAGS.map(tag => (
                  <span
                    key={tag}
                    className="inline-flex rounded-full border border-border bg-muted/50 px-2.5 py-1 text-[11px] font-medium capitalize text-muted-foreground"
                  >
                    {tag}
                  </span>
                ))}
                <span className="inline-flex items-center gap-1.5 text-xs font-medium text-primary">
                  <ExternalLink className="h-3 w-3" aria-hidden />
                  Open source page
                </span>
              </div>

              <h1 className="mt-5 text-2xl font-semibold tracking-tight text-foreground sm:text-3xl">
                {DEMO_PAGE_TITLE_RECAP}
              </h1>
              <p className="mt-2 max-w-xl text-sm leading-relaxed text-muted-foreground">
                A detailed log of what you captured on the source page. Editable like any document —
                new captures still append on refresh.
              </p>
            </header>

            <div className={cn('py-6 sm:py-8', DOC_PAD)}>
              <section className="mb-6 lg:hidden">
                <div className="mb-3 flex items-center justify-between">
                  <h4 className="text-sm font-semibold text-foreground">Library Documents</h4>
                  <span className="text-xs font-medium text-muted-foreground">Auto Recaps</span>
                </div>
                <LibraryDocumentsMock limit={3} />
              </section>

              <article
                className="folder-document-editor auto-recap-document workspace-recap-preview mx-auto max-w-2xl"
                aria-label="Recap document content"
              >
                <div className="ProseMirror">
                  <section className="mb-8">
                    <h2>
                      Overview{' '}
                      <span className="recap-overview-range">{DEMO_RECAP_OVERVIEW.range}</span>
                    </h2>
                    <p>
                      {DEMO_RECAP_OVERVIEW.captureCount} captures from{' '}
                      <strong>{DEMO_PAGE_TITLE}</strong> ({DEMO_DOMAIN}).
                    </p>
                    <p>{DEMO_RECAP_OVERVIEW.summary}</p>
                  </section>

                  <section className="mb-8">
                    <h3>Key takeaways</h3>
                    <ul className="recap-bullets">
                      {DEMO_RECAP_TAKEAWAYS.map(item => (
                        <li key={item}>
                          <p>{item}</p>
                        </li>
                      ))}
                    </ul>
                  </section>

                  <section>
                    <h3>Capture log</h3>
                    <div className="mt-3 space-y-5">
                      {DEMO_RECAP_CAPTURE_ENTRIES.map(entry => (
                        <div key={entry.time} className="recap-entry">
                          <p>
                            <em>
                              {entry.time} — {entry.type}
                            </em>
                          </p>
                          {'quote' in entry ? (
                            <blockquote className="recap-quote">
                              <p>{entry.quote}</p>
                            </blockquote>
                          ) : (
                            <p>{entry.body}</p>
                          )}
                        </div>
                      ))}
                    </div>
                  </section>
                </div>
              </article>

              <div className="mx-auto mt-8 flex max-w-2xl flex-wrap items-center gap-3 border-t border-border pt-5 text-sm text-muted-foreground">
                <span className="inline-flex items-center gap-1.5 rounded-lg border border-border px-3 py-1.5">
                  <ExternalLink className="h-3.5 w-3.5" aria-hidden />
                  {DEMO_DOMAIN}
                </span>
                <span className="text-xs">Regenerate when the source page changes</span>
              </div>
            </div>
          </div>

          <aside className="hidden w-[220px] shrink-0 flex-col border-l border-border bg-card xl:flex">
            <div className="flex border-b border-border">
              <div className="flex flex-1 items-center justify-center gap-1.5 border-b-2 border-foreground px-3 py-3 text-xs font-medium text-foreground">
                <ListTree className="h-3.5 w-3.5" aria-hidden />
                On this page
              </div>
            </div>
            <div className="flex-1 space-y-2 overflow-hidden p-3">
              {DEMO_RECAP_CAPTURE_ENTRIES.map(entry => (
                <div
                  key={entry.time}
                  className="rounded-md bg-[#F7F6F3] px-2.5 py-2"
                >
                  <p className="text-[10px] font-semibold capitalize tracking-wide text-muted-foreground">
                    {entry.type}
                  </p>
                  <p className="mt-1 line-clamp-2 text-xs leading-relaxed text-foreground">
                    {'quote' in entry ? entry.quote : entry.body}
                  </p>
                </div>
              ))}
              <div className="rounded-lg bg-amber-50/80 px-2.5 py-2">
                <p className="flex items-center gap-1 text-[10px] font-medium text-amber-800">
                  <Star className="h-3 w-3" aria-hidden />
                  Recap synced with workspace
                </p>
              </div>
            </div>
          </aside>
        </div>

        <div
          className="pointer-events-none absolute inset-x-0 bottom-0 h-16 bg-gradient-to-t from-background via-background/90 to-transparent xl:hidden"
          aria-hidden
        />
      </div>
    </div>
  )
}
