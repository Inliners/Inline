import { Check, X } from 'lucide-react'
import { InlineChatIcon } from '@/components/ui/inline-chat-icon'
import { product } from '@/components/marketing/marketingSurfaces'
import { cn } from '@/lib/utils'

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
        className,
      )}
      style={elevated ? { boxShadow: product.panelShadow } : undefined}
    >
      <header
        className={cn(
          'flex items-center justify-between border-b border-border/60 px-4 pl-5',
          compact ? 'min-h-12' : 'min-h-14',
        )}
      >
        <div className="flex items-center gap-2.5">
          <InlineChatIcon size={compact ? 'sm' : 'md'} variant="badge" />
          <div>
            <p className="text-sm font-medium text-foreground">Ask</p>
            <p className="text-xs text-muted-foreground">Page recap update</p>
          </div>
        </div>
        <button type="button" className="text-muted-foreground" aria-hidden>
          <X className="h-4 w-4" />
        </button>
      </header>
      <div className={cn('border-b border-border/60', compact ? 'px-4 py-3' : 'px-5 py-4')}>
        {!compact && (
          <p className="text-sm leading-relaxed text-foreground">
            Updating the overview to reflect your new highlights on cable-stayed load paths and tower
            geometry.
          </p>
        )}
        <div className={cn('space-y-1.5 text-xs', !compact && 'mt-3')}>
          <p className="rounded bg-[#FEE2E2] px-2 py-1 text-[#991B1B] line-through">
            How loads transfer (outdated summary)
          </p>
          <p className="rounded bg-[#DCFCE7] px-2 py-1 text-[#166534]">
            Towers carry deck loads directly through stay cables.
          </p>
        </div>
      </div>
      <footer
        className={cn(
          'flex items-center justify-between gap-2 px-4',
          compact ? 'py-2.5' : 'py-3',
        )}
      >
        <span className="rounded-full px-3 py-1.5 text-xs text-muted-foreground">Back</span>
        <div className="flex gap-2">
          <span className="rounded-full px-3 py-1.5 text-xs text-muted-foreground">Reject</span>
          <span className="flex items-center gap-1 rounded-full bg-[#2f80ed] px-3 py-1.5 text-xs font-medium text-white">
            <Check className="h-3 w-3" aria-hidden />
            Approve
          </span>
        </div>
      </footer>
    </div>
  )
}
