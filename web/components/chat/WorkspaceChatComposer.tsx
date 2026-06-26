'use client'

import { ArrowUp, Globe2, Loader2, Mic2, Paperclip, X } from 'lucide-react'
import { InlineChatIcon } from '@/components/ui/inline-chat-icon'
import { cn } from '@/lib/utils'

interface Props {
  input: string
  setInput: (value: string) => void
  onSend: () => void
  loading?: boolean
  inputRef?: React.RefObject<HTMLInputElement | null>
  placeholder?: string
  /** Flat embed — no panel footer padding wrapper */
  embedded?: boolean
  className?: string
}

export default function WorkspaceChatComposer({
  input,
  setInput,
  onSend,
  loading,
  inputRef,
  placeholder = 'Ask about your captures, documents, or recent activity…',
  embedded,
  className,
}: Props) {
  function handleKey(e: React.KeyboardEvent) {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault()
      onSend()
    }
  }

  const inner = (
    <div className="overflow-hidden rounded-lg border border-primary/25 bg-background shadow-[0_0_0_3px_rgba(75,131,196,0.10)]">
      {input.trim() && (
        <div className="flex items-center justify-between border-b border-primary/10 bg-primary/5 px-4 py-2 text-xs text-primary">
          <span className="truncate">{input.trim()}</span>
          <button
            type="button"
            onClick={() => setInput('')}
            className="ml-3 flex h-5 w-5 shrink-0 cursor-pointer items-center justify-center rounded-md transition-colors hover:bg-primary/10"
            aria-label="Clear current prompt"
          >
            <X className="h-3 w-3" />
          </button>
        </div>
      )}
      <div className="flex min-h-[78px] flex-col px-4 py-3">
        <input
          ref={inputRef}
          value={input}
          onChange={e => setInput(e.target.value)}
          onKeyDown={handleKey}
          placeholder={placeholder}
          className="min-w-0 w-full border-none bg-transparent pt-0 pb-2 text-sm text-foreground outline-none placeholder:text-muted-foreground/70"
          disabled={loading}
          aria-label="Message Inline"
        />
        <div className="mt-auto flex shrink-0 items-center justify-end gap-1.5">
          <button
            type="button"
            className="flex h-8 w-8 cursor-pointer items-center justify-center rounded-md text-muted-foreground transition-colors hover:bg-muted hover:text-foreground"
            aria-label="Attach context"
          >
            <Paperclip className="h-4 w-4" />
          </button>
          <button
            type="button"
            className="hidden cursor-pointer items-center gap-1 rounded-md bg-muted px-2.5 py-1.5 text-xs font-medium text-foreground transition-colors hover:bg-muted/80 sm:flex"
          >
            <InlineChatIcon size="sm" iconClassName="text-primary" />
            Smart mode
          </button>
          <button
            type="button"
            className="flex h-8 w-8 cursor-pointer items-center justify-center rounded-md text-muted-foreground transition-colors hover:bg-muted hover:text-foreground"
            aria-label="Browse web context"
          >
            <Globe2 className="h-4 w-4" />
          </button>
          <button
            type="button"
            className="flex h-8 w-8 cursor-pointer items-center justify-center rounded-md text-muted-foreground transition-colors hover:bg-muted hover:text-foreground"
            aria-label="Voice input"
          >
            <Mic2 className="h-4 w-4" />
          </button>
          <button
            type="button"
            onClick={onSend}
            disabled={loading || !input.trim()}
            className="flex h-8 w-8 cursor-pointer items-center justify-center rounded-full bg-[#2f80ed] text-white transition-opacity hover:opacity-90 disabled:cursor-not-allowed disabled:opacity-35"
            aria-label="Send message"
          >
            {loading ? (
              <Loader2 className="h-3.5 w-3.5 animate-spin" />
            ) : (
              <ArrowUp className="h-3.5 w-3.5" />
            )}
          </button>
        </div>
      </div>
    </div>
  )

  if (embedded) {
    return <div className={cn('w-full', className)}>{inner}</div>
  }

  return (
    <div className={cn('bg-card/95 p-4', className)}>
      {inner}
    </div>
  )
}
