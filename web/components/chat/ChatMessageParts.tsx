'use client'

import { useLayoutEffect, useRef, useState } from 'react'
import { cn } from '@/lib/utils'
import { CHAT_THINKING_MESSAGE, normalizeAssistantText } from '@/lib/chat-format'

export function AssistantMessageContent({
  content,
  thinking,
  error,
}: {
  content: string
  thinking?: boolean
  error?: boolean
}) {
  if (thinking && !content.trim()) {
    return (
      <p className="text-sm italic text-muted-foreground" role="status">
        {CHAT_THINKING_MESSAGE}
      </p>
    )
  }

  if (!content.trim()) return null

  const plain = normalizeAssistantText(content)
  const blocks = plain.split(/\n\n+/)

  return (
    <div className={cn('space-y-3', error && 'text-destructive')}>
      {blocks.map((block, i) => {
        const trimmed = block.trim()
        if (!trimmed) return null

        const lines = trimmed.split('\n').map(l => l.trim()).filter(Boolean)
        const bulletLines = lines.filter(l => /^[-*•]\s/.test(l))
        const proseLines = lines.filter(l => !/^[-*•]\s/.test(l) && !/^\d+[.)]\s/.test(l))

        if (bulletLines.length > 0 && proseLines.length > 0) {
          return (
            <div key={i} className="space-y-2">
              <p className="text-sm leading-relaxed text-foreground">{proseLines.join(' ')}</p>
              <ul className="list-disc space-y-1.5 pl-4 text-sm leading-relaxed text-foreground">
                {bulletLines.map((l, j) => (
                  <li key={j}>{l.replace(/^[-*•]\s+/, '')}</li>
                ))}
              </ul>
            </div>
          )
        }

        if (lines.every(l => /^[-*•]\s/.test(l))) {
          return (
            <ul key={i} className="list-disc space-y-1.5 pl-4 text-sm leading-relaxed text-foreground">
              {lines.map((l, j) => (
                <li key={j}>{l.replace(/^[-*•]\s+/, '')}</li>
              ))}
            </ul>
          )
        }

        if (lines.every(l => /^\d+[.)]\s/.test(l))) {
          return (
            <ol key={i} className="list-decimal space-y-1.5 pl-4 text-sm leading-relaxed text-foreground">
              {lines.map((l, j) => (
                <li key={j}>{l.replace(/^\d+[.)]\s+/, '')}</li>
              ))}
            </ol>
          )
        }

        if (lines.every(l => l.startsWith('>'))) {
          return (
            <blockquote
              key={i}
              className="border-l-2 border-border pl-3 text-sm leading-relaxed text-muted-foreground"
            >
              {lines.map(l => l.replace(/^>\s?/, '')).join(' ')}
            </blockquote>
          )
        }

        return (
          <p key={i} className="text-sm leading-relaxed text-foreground">
            {trimmed.replace(/\n/g, ' ')}
          </p>
        )
      })}
    </div>
  )
}

export function UserMessageBubble({ content }: { content: string }) {
  const ref = useRef<HTMLDivElement>(null)
  const [multiline, setMultiline] = useState(() => /\n/.test(content))

  useLayoutEffect(() => {
    const el = ref.current
    if (!el) return

    const measure = () => {
      if (/\n/.test(content)) {
        setMultiline(true)
        return
      }
      const style = window.getComputedStyle(el)
      const lineHeight = parseFloat(style.lineHeight) || 20
      const paddingY = parseFloat(style.paddingTop) + parseFloat(style.paddingBottom)
      setMultiline(el.scrollHeight > lineHeight + paddingY + 2)
    }

    measure()
    const observer = new ResizeObserver(measure)
    observer.observe(el)
    return () => observer.disconnect()
  }, [content])

  return (
    <div
      ref={ref}
      className={cn(
        'ml-auto inline-block max-w-[82%] bg-primary px-4 py-2.5 text-sm leading-relaxed text-primary-foreground wrap-anywhere',
        multiline ? 'rounded-2xl' : 'rounded-full',
      )}
    >
      {content}
    </div>
  )
}
