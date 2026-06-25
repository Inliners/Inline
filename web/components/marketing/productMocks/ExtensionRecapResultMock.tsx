import { Check, X } from 'lucide-react'
import { InlineChatIcon } from '@/components/ui/inline-chat-icon'
import { product } from '@/components/marketing/marketingSurfaces'
import { cn } from '@/lib/utils'

type ExtensionAskHeaderMockProps = {
  subtitle?: string
  className?: string
  iconSize?: 'sm' | 'md'
  showClose?: boolean
}

/** Ask panel chrome — navy icon, title, subtitle, close. */
export function ExtensionAskHeaderMock({
  subtitle = 'Page recap update',
  className,
  iconSize = 'md',
  showClose = true,
}: ExtensionAskHeaderMockProps) {
  return (
    <header
      className={cn(
        'flex shrink-0 items-center justify-between',
        iconSize === 'sm' ? 'min-h-10' : 'min-h-11',
        className,
      )}
    >
      <div className="flex min-w-0 items-center gap-2.5">
        <InlineChatIcon size={iconSize} variant="badge" />
        <div className="min-w-0">
          <p className="text-sm font-medium text-foreground">Ask</p>
          <p className="truncate text-xs text-muted-foreground">{subtitle}</p>
        </div>
      </div>
      {showClose && (
        <button
          type="button"
          className="flex h-8 w-8 shrink-0 items-center justify-center rounded-md text-muted-foreground"
          aria-hidden
        >
          <X className="h-4 w-4" />
        </button>
      )}
    </header>
  )
}

type ExtensionRecapResultMockProps = {
  className?: string
  elevated?: boolean
  compact?: boolean
}

export default function ExtensionRecapResultMock({
  className,
  elevated = true,
  compact = false,
}: ExtensionRecapResultMockProps) {
  return (
    <div
      className={cn(
        'flex w-full max-w-[342px] flex-col overflow-hidden rounded-[14px] border border-border bg-card',
        compact && 'h-full',
        className,
      )}
      style={elevated ? { boxShadow: product.panelShadow } : undefined}
    >
      <ExtensionAskHeaderMock
        className={cn('px-4 pl-5', compact ? 'pt-2' : undefined)}
        iconSize={compact ? 'sm' : 'md'}
      />

      {compact ? (
        <div className="flex min-h-0 flex-1 flex-col justify-end px-4 pb-[15%]">
          <div className="space-y-1.5 text-xs">
            <p className="rounded bg-[#FEE2E2] px-2 py-1 text-[#991B1B] line-through">
              Opening summary (outdated)
            </p>
            <p className="rounded bg-[#DCFCE7] px-2 py-1 text-[#166534]">
              Updated recap reflects your latest highlights.
            </p>
          </div>
          <div className="mt-2 flex flex-wrap items-center justify-between gap-2">
            <span className="rounded-full px-2.5 py-1.5 text-xs text-muted-foreground sm:px-3">Back</span>
            <div className="flex flex-wrap gap-2">
              <span className="rounded-full px-3 py-1.5 text-xs text-muted-foreground">Reject</span>
              <span className="flex items-center gap-1 rounded-full bg-[#2f80ed] px-3 py-1.5 text-xs font-medium text-white">
                <Check className="h-3 w-3" aria-hidden />
                Approve
              </span>
            </div>
          </div>
        </div>
      ) : (
        <>
          <div className="flex flex-1 flex-col px-5 py-4">
            <p className="text-sm leading-relaxed text-foreground">
              Updating the overview to reflect your new highlights and sticky notes from this page.
            </p>
            <div className="mt-3 space-y-1.5 text-xs">
              <p className="rounded bg-[#FEE2E2] px-2 py-1 text-[#991B1B] line-through">
                Opening summary (outdated)
              </p>
              <p className="rounded bg-[#DCFCE7] px-2 py-1 text-[#166534]">
                Updated recap reflects your latest highlights.
              </p>
            </div>
          </div>
          <footer className="flex shrink-0 items-center justify-between gap-2 px-4 py-3">
            <span className="rounded-full px-3 py-1.5 text-xs text-muted-foreground">Back</span>
            <div className="flex gap-2">
              <span className="rounded-full px-3 py-1.5 text-xs text-muted-foreground">Reject</span>
              <span className="flex items-center gap-1 rounded-full bg-[#2f80ed] px-3 py-1.5 text-xs font-medium text-white">
                <Check className="h-3 w-3" aria-hidden />
                Approve
              </span>
            </div>
          </footer>
        </>
      )}
    </div>
  )
}
