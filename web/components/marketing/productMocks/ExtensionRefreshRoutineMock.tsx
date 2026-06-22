import { Check, Clock, RefreshCw, User } from 'lucide-react'
import { cn } from '@/lib/utils'

type ExtensionRefreshRoutineMockProps = {
  className?: string
}

export default function ExtensionRefreshRoutineMock({ className }: ExtensionRefreshRoutineMockProps) {
  return (
    <div
      className={cn(
        'w-full max-w-[342px] overflow-hidden rounded-[14px] border border-border bg-card',
        className,
      )}
    >
      <div className="border-b border-border/60 px-4 py-3">
        <p className="text-xs text-muted-foreground">
          Inline found 4 suggested updates ready for review.
        </p>
      </div>
      <div className="space-y-1 p-3">
        <p className="px-2 py-1.5 text-[9px] font-semibold uppercase tracking-wider text-muted-foreground">
          Page recap
        </p>
        <div className="flex items-center gap-2 rounded-lg bg-muted px-3 py-2">
          <Check className="h-3.5 w-3.5 text-foreground" aria-hidden />
          <span className="text-xs font-medium text-foreground">Review 4 changes</span>
        </div>
        <div className="flex items-center gap-2 rounded-lg px-3 py-2 text-muted-foreground">
          <RefreshCw className="h-3.5 w-3.5" aria-hidden />
          <span className="text-xs">Re-sync highlights from page</span>
        </div>
        <div className="flex items-center gap-2 rounded-lg px-3 py-2 text-muted-foreground">
          <Clock className="h-3.5 w-3.5" aria-hidden />
          <span className="text-xs">Change refresh schedule</span>
        </div>
        <p className="mt-2 px-2 py-1.5 text-[9px] font-semibold uppercase tracking-wider text-muted-foreground">
          Recap info
        </p>
        <div className="flex items-center gap-2 px-3 py-1">
          <div className="flex h-6 w-6 items-center justify-center rounded-full bg-muted">
            <User className="h-3 w-3 text-muted-foreground" aria-hidden />
          </div>
          <span className="text-xs text-foreground">You</span>
        </div>
      </div>
    </div>
  )
}
