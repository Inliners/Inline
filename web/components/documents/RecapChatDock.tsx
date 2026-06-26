'use client'

import { useEffect } from 'react'
import { RefreshCw } from 'lucide-react'
import { cn } from '@/lib/utils'
import { useChatPanel } from '@/lib/chat-panel-context'

interface Props {
  onRegenerate: () => void
  regenerating?: boolean
  recapStale?: boolean
}

const DOCK_PILL =
  'flex h-11 shrink-0 items-center gap-2 rounded-full border border-border bg-card/95 px-2 shadow-[0_14px_40px_-8px_rgba(28,30,38,0.34),0_6px_18px_-4px_rgba(28,30,38,0.2)] backdrop-blur-md'

export default function RecapChatDock({ onRegenerate, regenerating, recapStale }: Props) {
  const { setDockLeading, setDocumentChatMode } = useChatPanel()

  useEffect(() => {
    setDocumentChatMode(true)
    return () => setDocumentChatMode(false)
  }, [setDocumentChatMode])

  useEffect(() => {
    setDockLeading(
      <div className={cn(DOCK_PILL, recapStale && 'max-w-[min(360px,52vw)]')}>
        <button
          type="button"
          onClick={onRegenerate}
          disabled={regenerating}
          className="inline-flex h-8 shrink-0 items-center gap-1.5 rounded-full bg-primary px-3.5 text-xs font-medium text-primary-foreground transition-opacity hover:opacity-90 cursor-pointer disabled:opacity-50"
        >
          <RefreshCw
            className={regenerating ? 'h-3.5 w-3.5 animate-spin' : 'h-3.5 w-3.5'}
            aria-hidden
          />
          {regenerating ? 'Regenerating…' : 'Regenerate'}
        </button>
        {recapStale && (
          <span
            className="truncate pr-1 text-[11px] text-amber-700 dark:text-amber-400"
            title="Your edits are kept. Regenerate to pull in new captures from the source page."
          >
            Won&apos;t sync new captures
          </span>
        )}
      </div>,
    )
    return () => setDockLeading(null)
  }, [onRegenerate, recapStale, regenerating, setDockLeading])

  return null
}
