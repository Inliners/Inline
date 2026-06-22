'use client'

import { ExternalLink, RefreshCw } from 'lucide-react'

interface Props {
  pageUrl?: string
  onRegenerate: () => void
  regenerating?: boolean
  recapStale?: boolean
}

export default function RecapFooterActions({
  pageUrl,
  onRegenerate,
  regenerating,
  recapStale,
}: Props) {
  return (
    <div className="sticky bottom-6 z-20 mx-auto mt-8 flex max-w-3xl items-center justify-between gap-3 rounded-xl border border-border bg-card/95 px-4 py-2.5 shadow-sm backdrop-blur-sm">
      <div className="flex items-center gap-2 min-w-0">
        <button
          type="button"
          onClick={onRegenerate}
          disabled={regenerating}
          className="inline-flex items-center gap-1.5 rounded-lg bg-primary px-3 py-1.5 text-xs font-medium text-primary-foreground hover:opacity-90 transition-opacity cursor-pointer disabled:opacity-50 shrink-0"
        >
          <RefreshCw className={regenerating ? 'h-3.5 w-3.5 animate-spin' : 'h-3.5 w-3.5'} aria-hidden />
          {regenerating ? 'Regenerating…' : 'Regenerate'}
        </button>
        {recapStale && (
          <span className="text-[11px] text-amber-700 dark:text-amber-400 truncate">
            Edited — auto-sync paused
          </span>
        )}
      </div>

      {pageUrl && (
        <a
          href={pageUrl}
          target="_blank"
          rel="noreferrer"
          className="inline-flex items-center gap-1.5 text-xs font-medium text-muted-foreground hover:text-foreground transition-colors shrink-0"
        >
          <ExternalLink className="h-3.5 w-3.5" aria-hidden />
          Source page
        </a>
      )}
    </div>
  )
}
