'use client'

import { useState } from 'react'
import { ThumbsDown, ThumbsUp } from 'lucide-react'
import { cn } from '@/lib/utils'

const DOWN_OPTIONS = [
  'Too long',
  'Hallucinated',
  'Missed the point',
] as const

export type FeedbackSurface = 'chat' | 'insights' | 'roi' | 'knowledge-cards'

interface Props {
  workspaceId: string
  surface: FeedbackSurface
  targetId: string
  className?: string
}

export default function AiFeedbackBar({ workspaceId, surface, targetId, className }: Props) {
  const [rating, setRating] = useState<-1 | 1 | null>(null)
  const [showDown, setShowDown] = useState(false)
  const [comment, setComment] = useState('')
  const [sending, setSending] = useState(false)
  const [done, setDone] = useState(false)

  async function submit(nextRating: -1 | 1, nextComment?: string) {
    if (sending || done) return
    setSending(true)
    try {
      const res = await fetch('/api/feedback', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          workspaceId,
          surface,
          targetId,
          rating: nextRating,
          comment: nextComment,
        }),
      })
      if (res.ok) {
        setRating(nextRating)
        setDone(true)
        setShowDown(false)
      }
    } catch { /* ignore */ }
    finally { setSending(false) }
  }

  function handleUp() {
    void submit(1)
  }

  function handleDown() {
    if (done) return
    setShowDown(v => !v)
  }

  function handleDownOption(option: string) {
    setComment(option)
    void submit(-1, option)
  }

  if (done) {
    return (
      <p className={cn('text-[11px] text-muted-foreground', className)}>
        Thanks for the feedback.
      </p>
    )
  }

  return (
    <div className={cn('space-y-2', className)}>
      <div className="flex items-center gap-1">
        <span className="text-[11px] text-muted-foreground mr-1">Helpful?</span>
        <button
          type="button"
          onClick={handleUp}
          disabled={sending}
          aria-label="Thumbs up"
          className={cn(
            'flex h-7 w-7 items-center justify-center rounded-md transition-colors cursor-pointer',
            rating === 1
              ? 'bg-emerald-100 text-emerald-700'
              : 'text-muted-foreground hover:bg-muted hover:text-foreground',
          )}
        >
          <ThumbsUp className="h-3.5 w-3.5" />
        </button>
        <button
          type="button"
          onClick={handleDown}
          disabled={sending}
          aria-label="Thumbs down"
          className={cn(
            'flex h-7 w-7 items-center justify-center rounded-md transition-colors cursor-pointer',
            rating === -1 || showDown
              ? 'bg-red-100 text-red-700'
              : 'text-muted-foreground hover:bg-muted hover:text-foreground',
          )}
        >
          <ThumbsDown className="h-3.5 w-3.5" />
        </button>
      </div>

      {showDown && !done && (
        <div className="space-y-2 rounded-lg border border-border bg-muted/40 p-2">
          <div className="flex flex-wrap gap-1.5">
            {DOWN_OPTIONS.map(opt => (
              <button
                key={opt}
                type="button"
                onClick={() => handleDownOption(opt)}
                disabled={sending}
                className={cn(
                  'rounded-full border border-border px-2.5 py-1 text-[11px] transition-colors cursor-pointer',
                  comment === opt
                    ? 'bg-card text-foreground'
                    : 'text-muted-foreground hover:bg-card hover:text-foreground',
                )}
              >
                {opt}
              </button>
            ))}
          </div>
          <textarea
            value={comment}
            onChange={e => setComment(e.target.value)}
            placeholder="Anything else? (optional)"
            rows={2}
            className="w-full resize-none rounded-md border border-border bg-background px-2 py-1.5 text-[11px] outline-none focus:ring-1 focus:ring-primary/30"
          />
          <button
            type="button"
            onClick={() => void submit(-1, comment || undefined)}
            disabled={sending}
            className="text-[11px] font-medium text-primary hover:underline cursor-pointer disabled:opacity-50"
          >
            Send feedback
          </button>
        </div>
      )}
    </div>
  )
}
