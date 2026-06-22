import { ArrowUp, X } from 'lucide-react'
import { InlineChatIcon } from '@/components/ui/inline-chat-icon'
import { product } from '@/components/marketing/marketingSurfaces'
import { cn } from '@/lib/utils'

const QUICK_ACTIONS = [
  { label: 'Summarize', desc: 'Key points' },
  { label: 'Rephrase', desc: 'Same meaning' },
  { label: 'Shorten', desc: 'Make it tight' },
  { label: 'Action items', desc: 'Checklist' },
] as const

type ExtensionAskPanelMockProps = {
  className?: string
  pageTitle?: string
  domain?: string
  compact?: boolean
  badgeShape?: 'circle' | 'square'
  /** Drop panel shadow when nested inside a marketing card or scene frame. */
  elevated?: boolean
}

export default function ExtensionAskPanelMock({
  className,
  pageTitle = 'Cable-stayed bridge design',
  domain = 'engineering.org',
  compact = false,
  badgeShape = 'circle',
  elevated = true,
}: ExtensionAskPanelMockProps) {
  return (
    <div
      className={cn(
        'flex w-full max-w-[342px] flex-col overflow-hidden rounded-[14px] border border-border bg-card font-sans',
        compact && 'min-h-[360px]',
        className,
      )}
      style={elevated ? { boxShadow: product.panelShadow } : undefined}
    >
      <header className="flex min-h-14 items-center justify-between bg-card px-4 pl-5">
        <div className="flex min-w-0 flex-1 items-center gap-2.5">
          <InlineChatIcon size="md" variant="badge" badgeShape={badgeShape} />
          <div className="min-w-0">
            <p className="truncate text-sm font-medium tracking-tight text-foreground">Ask</p>
            <p className="truncate text-xs text-muted-foreground">Working with this page</p>
          </div>
          <span className="shrink-0 rounded-full bg-muted px-2 py-0.5 text-[10px] font-semibold text-muted-foreground">
            Page
          </span>
        </div>
        <button
          type="button"
          className="flex h-[30px] w-[30px] shrink-0 items-center justify-center rounded-lg text-muted-foreground"
          aria-hidden
        >
          <X className="h-4 w-4" />
        </button>
      </header>

      <div className={cn('flex flex-col gap-4', compact ? 'flex-1 p-4' : 'p-5')}>
        <div className="rounded-[10px] border border-border bg-card p-3">
          <div className="flex items-center gap-2">
            <span className="flex h-7 w-7 shrink-0 items-center justify-center rounded-lg bg-muted text-muted-foreground">
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.7" aria-hidden>
                <circle cx="12" cy="12" r="10" />
                <path d="M2 12h20M12 2a15.3 15.3 0 0 1 4 10 15.3 15.3 0 0 1-4 10 15.3 15.3 0 0 1-4-10 15.3 15.3 0 0 1 4-10z" />
              </svg>
            </span>
            <div className="min-w-0">
              <p className="truncate text-sm font-medium text-foreground">{pageTitle}</p>
              <p className="truncate text-xs text-muted-foreground">{domain}</p>
            </div>
          </div>
        </div>

        <div
          className={cn(
            'overflow-hidden rounded-[10px] border border-[rgba(28,30,38,0.25)] bg-card shadow-[0_0_0_3px_rgba(75,131,196,0.10)]',
            compact && 'mt-auto',
          )}
        >
          <div className={cn('flex flex-col px-3 py-2', compact ? 'min-h-[96px]' : 'min-h-[78px]')}>
            <p className="text-sm text-muted-foreground">Ask about this page…</p>
            <div className="mt-auto flex items-center justify-end gap-2">
              <span className="rounded-md bg-muted px-2 py-1 text-[10px] font-medium text-muted-foreground">
                Smart mode
              </span>
              <span className="flex h-8 w-8 items-center justify-center rounded-full bg-muted text-muted-foreground opacity-35">
                <ArrowUp className="h-3.5 w-3.5" aria-hidden />
              </span>
            </div>
          </div>
        </div>

        {!compact && (
          <>
            <div>
              <p className="mb-2 text-[10px] font-semibold uppercase tracking-wider text-muted-foreground">
                Quick actions
              </p>
              <div className="grid grid-cols-2 gap-2">
                {QUICK_ACTIONS.map(action => (
                  <div
                    key={action.label}
                    className="rounded-[10px] border border-border bg-card p-2.5"
                  >
                    <div className="mb-2 flex h-[30px] w-[30px] items-center justify-center rounded-lg border border-border bg-muted text-muted-foreground">
                      <span className="text-[10px] font-bold">{action.label[0]}</span>
                    </div>
                    <p className="text-xs font-medium text-foreground">{action.label}</p>
                    <p className="text-[10px] text-muted-foreground">{action.desc}</p>
                  </div>
                ))}
              </div>
            </div>
            <div className="flex flex-wrap gap-1.5">
              {['Explain like I\'m 5', 'Pros and cons', 'Key quotes'].map(chip => (
                <span
                  key={chip}
                  className="rounded-full border border-border bg-card px-2.5 py-1 text-[11px] text-muted-foreground"
                >
                  {chip}
                </span>
              ))}
            </div>
          </>
        )}
      </div>
    </div>
  )
}
