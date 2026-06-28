'use client'

import { InlineChatIcon } from '@/components/ui/inline-chat-icon'
import { cn } from '@/lib/utils'
import { motion } from 'framer-motion'

const EASE = [0.22, 1, 0.36, 1] as const

interface Props {
  title: string
  body: string
  stepIndex: number
  totalSteps: number
  suggestedPrompt?: string
  showOpenChat?: boolean
  onNext: () => void
  onBack: () => void
  onSkip: () => void
  onOpenChat?: () => void
  isFirst: boolean
  isLast: boolean
  className?: string
}

export default function InlineGuideCard({
  title,
  body,
  stepIndex,
  totalSteps,
  suggestedPrompt,
  showOpenChat,
  onNext,
  onBack,
  onSkip,
  onOpenChat,
  isFirst,
  isLast,
  className,
}: Props) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: 6 }}
      transition={{ duration: 0.35, ease: EASE }}
      className={cn(
        'w-full max-w-sm rounded-2xl border border-border/80 bg-card/95 p-4 shadow-lg backdrop-blur-md',
        className,
      )}
      role="dialog"
      aria-labelledby="inline-guide-title"
      aria-describedby="inline-guide-body"
    >
      <div className="flex items-center gap-2.5">
        <InlineChatIcon size="sm" variant="badge" />
        <div className="min-w-0 flex-1">
          <p className="text-[11px] font-medium uppercase tracking-wide text-muted-foreground">
            Guide · {stepIndex + 1} of {totalSteps}
          </p>
          <h2 id="inline-guide-title" className="text-sm font-semibold text-foreground">
            {title}
          </h2>
        </div>
      </div>

      <p id="inline-guide-body" className="mt-3 text-sm leading-relaxed text-muted-foreground">
        {body}
      </p>

      {suggestedPrompt && (
        <div className="mt-3 rounded-xl bg-muted/60 px-3 py-2.5">
          <p className="text-[11px] font-medium text-muted-foreground">Try asking</p>
          <p className="mt-1 text-sm text-foreground">&ldquo;{suggestedPrompt}&rdquo;</p>
        </div>
      )}

      <div className="mt-4 flex flex-wrap items-center gap-2">
        {!isFirst && (
          <button
            type="button"
            onClick={onBack}
            className="rounded-full border border-border px-3.5 py-1.5 text-xs font-medium text-foreground transition-colors hover:bg-muted/60 cursor-pointer"
          >
            Back
          </button>
        )}
        <button
          type="button"
          onClick={onNext}
          className="rounded-full bg-primary px-3.5 py-1.5 text-xs font-semibold text-primary-foreground transition-opacity hover:opacity-90 cursor-pointer"
        >
          {isLast ? 'Finish' : 'Next'}
        </button>
        {showOpenChat && onOpenChat && (
          <button
            type="button"
            onClick={onOpenChat}
            className="rounded-full border border-border px-3.5 py-1.5 text-xs font-medium text-foreground transition-colors hover:bg-muted/60 cursor-pointer"
          >
            Open chat
          </button>
        )}
        <button
          type="button"
          onClick={onSkip}
          className="ml-auto text-xs text-muted-foreground transition-colors hover:text-foreground cursor-pointer"
        >
          I&apos;ll explore on my own
        </button>
      </div>

      <div className="mt-3 flex justify-center gap-1">
        {Array.from({ length: totalSteps }).map((_, i) => (
          <span
            key={i}
            className={cn(
              'h-1 rounded-full transition-all',
              i === stepIndex ? 'w-4 bg-primary' : 'w-1 bg-muted-foreground/30',
            )}
            aria-hidden
          />
        ))}
      </div>
    </motion.div>
  )
}
