'use client'

import { useCallback, useEffect, useRef, useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { BarChart3, Clock, Sparkles, User } from 'lucide-react'
import { cn } from '@/lib/utils'
import { SourceCardRow, type ChatSource } from '@/components/shell/SourceCard'
import { extractCitationRefs } from '@/lib/ai/rag/citations'
import AiFeedbackBar from '@/components/ai/AiFeedbackBar'
import InsightsSummary, { type InsightsStats } from '@/components/insights/InsightsSummary'
import InsightsLoadingStatus from '@/components/insights/InsightsLoadingStatus'
import { loadFolderDocuments } from '@/lib/workspace-library'
import { getChatGreeting } from '@/lib/chat-format'
import { AssistantMessageContent, UserMessageBubble } from '@/components/chat/ChatMessageParts'
import WorkspaceChatComposer from '@/components/chat/WorkspaceChatComposer'
import { chatMessageMotion, insightsRevealMotion } from '@/components/chat/chat-motion'

type Message = {
  role: 'user' | 'assistant'
  content: string
  sources?: ChatSource[]
  error?: boolean
}

function citedSourcesForMessage(sources: ChatSource[] | undefined, content: string): ChatSource[] {
  if (!sources?.length || !content.trim()) return []
  const refs = extractCitationRefs(content)
  if (refs.size === 0) return []
  return sources.filter(s => refs.has(s.ref))
}

interface Props {
  workspaceId: string
  contextLabel?: string
  topDomain?: string
  narrative?: string | null
  stats?: InsightsStats | null
  insightsLoading?: boolean
  insightsFooter?: React.ReactNode
  className?: string
}

function buildQuickPrompts(topDomain?: string): { label: string; prompt: string; icon: React.ReactNode }[] {
  return [
    {
      label: 'Summarize this week',
      prompt: 'Summarize what I captured this week and what stands out.',
      icon: <BarChart3 className="h-3.5 w-3.5 text-[#2f80ed]" />,
    },
    {
      label: topDomain ? `Deep dive: ${topDomain}` : 'Prep my next brief',
      prompt: topDomain
        ? `Generate a consolidated analysis of everything I've captured about ${topDomain} this week.`
        : 'What should I focus on next based on my recent captures?',
      icon: <Sparkles className="h-3.5 w-3.5 text-violet-500" />,
    },
  ]
}

export default function EmbeddedInsightsChat({
  workspaceId,
  contextLabel,
  topDomain,
  narrative,
  stats,
  insightsLoading,
  insightsFooter,
  className,
}: Props) {
  const [messages, setMessages] = useState<Message[]>([])
  const [input, setInput] = useState('')
  const [loading, setLoading] = useState(false)
  const scrollRef = useRef<HTMLDivElement>(null)
  const bottomRef = useRef<HTMLDivElement>(null)
  const inputRef = useRef<HTMLInputElement>(null)

  const greeting = getChatGreeting()
  const quickPrompts = buildQuickPrompts(topDomain)
  const hasMessages = messages.length > 0
  const showInsightsContent = !insightsLoading && Boolean(narrative || stats)

  useEffect(() => {
    const scroller = scrollRef.current
    if (!scroller) return
    scroller.scrollTo({ top: scroller.scrollHeight, behavior: 'smooth' })
  }, [messages, loading, insightsLoading, showInsightsContent])

  const send = useCallback(async (text: string) => {
    const trimmed = text.trim()
    if (!trimmed || loading) return

    setMessages(prev => [...prev, { role: 'user', content: trimmed }])
    setInput('')
    setLoading(true)

    try {
      const docs = loadFolderDocuments().map(d => ({ title: d.title, content: d.content }))
      const res = await fetch('/api/ai/rag', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ message: trimmed, workspaceId, libraryDocs: docs }),
      })

      if (!res.ok || !res.body) {
        let detail = 'The AI service may be temporarily unavailable.'
        try {
          const j = (await res.json()) as { error?: string }
          if (j?.error) detail = j.error
        } catch { /* ignore */ }
        setMessages(prev => [...prev, { role: 'assistant', content: detail, error: true }])
        return
      }

      const reader = res.body.getReader()
      const decoder = new TextDecoder()
      let buffer = ''
      let headerParsed = false
      let sources: ChatSource[] = []
      let accumulated = ''
      setMessages(prev => [...prev, { role: 'assistant', content: '' }])

      while (true) {
        const { done, value } = await reader.read()
        if (done) break
        buffer += decoder.decode(value, { stream: true })

        if (!headerParsed) {
          const newlineIdx = buffer.indexOf('\n')
          if (newlineIdx === -1) continue
          const headerLine = buffer.slice(0, newlineIdx)
          buffer = buffer.slice(newlineIdx + 1)
          try {
            const meta = JSON.parse(headerLine) as { sources?: ChatSource[] }
            sources = Array.isArray(meta.sources) ? meta.sources : []
          } catch {
            buffer = headerLine + '\n' + buffer
          }
          headerParsed = true
        }

        if (buffer) {
          accumulated += buffer
          buffer = ''
          setMessages(prev => {
            const next = [...prev]
            next[next.length - 1] = { role: 'assistant', content: accumulated, sources }
            return next
          })
        }
      }

      if (buffer) {
        accumulated += buffer
        setMessages(prev => {
          const next = [...prev]
          next[next.length - 1] = { role: 'assistant', content: accumulated, sources }
          return next
        })
      }
    } catch {
      setMessages(prev => [
        ...prev,
        { role: 'assistant', content: 'Network error — check your connection and try again.', error: true },
      ])
    } finally {
      setLoading(false)
    }
  }, [loading, workspaceId])

  function applyQuickPrompt(prompt: string) {
    setInput(prompt)
    setTimeout(() => inputRef.current?.focus(), 50)
  }

  return (
    <div
      className={cn(
        'flex min-h-0 flex-1 flex-col',
        hasMessages && 'relative h-full overflow-hidden',
        className,
      )}
    >
      <div className="shrink-0 pb-4">
        <h2
          className={cn(
            'font-semibold tracking-tight text-foreground',
            hasMessages ? 'text-xl' : 'text-2xl sm:text-3xl',
          )}
        >
          {greeting}! What&apos;s on today?
        </h2>
        {contextLabel && (
          <p className="mt-2 flex items-center gap-2 text-sm text-muted-foreground">
            <Clock className="h-3.5 w-3.5 shrink-0" aria-hidden />
            <span>{contextLabel}</span>
          </p>
        )}
      </div>

      <div className={cn('relative min-h-0 flex-1', hasMessages && 'min-h-0')}>
        <div
          ref={scrollRef}
          className={cn(
            'scrollbar-minimal h-full min-h-0 space-y-5 overflow-y-auto pr-1',
            hasMessages && 'overscroll-contain pb-32',
          )}
        >
        <div className="mt-6">
        <AnimatePresence mode="wait">
          {insightsLoading ? (
            <motion.div
              key="insights-loading"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="max-w-[92%] py-1"
            >
              <InsightsLoadingStatus />
            </motion.div>
          ) : showInsightsContent ? (
            <motion.div
              key="insights-content"
              {...insightsRevealMotion}
              className="max-w-[92%]"
            >
              <InsightsSummary
                variant="inline"
                animateIn
                narrative={narrative ?? null}
                stats={stats ?? null}
                footer={insightsFooter}
              />
            </motion.div>
          ) : null}
        </AnimatePresence>
        </div>

        {hasMessages && (
          <AnimatePresence initial={false}>
            {messages.map((m, i) => (
              <motion.div
                key={`${i}-${m.role}-${m.content.slice(0, 24)}`}
                {...chatMessageMotion}
                className={cn(
                  'flex min-w-0 items-start gap-2',
                  m.role === 'user' ? 'flex-row-reverse' : 'flex-row',
                )}
              >
                {m.role === 'user' && (
                  <div className="mt-0.5 flex h-6 w-6 shrink-0 items-center justify-center rounded-md bg-secondary">
                    <User className="h-3 w-3 text-foreground" />
                  </div>
                )}
                <div
                  className={cn(
                    'group/msg relative min-w-0',
                    m.role === 'user' ? 'flex flex-1 flex-col items-end' : 'max-w-[92%] flex-1',
                  )}
                >
                  {m.role === 'user' ? (
                    <UserMessageBubble content={m.content} />
                  ) : (
                    <AssistantMessageContent
                      content={m.content}
                      thinking={loading && i === messages.length - 1 && !m.content.trim()}
                      error={m.error}
                    />
                  )}
                  {m.role === 'assistant' && !loading && (() => {
                    const cited = citedSourcesForMessage(m.sources, m.content)
                    return cited.length > 0 ? (
                      <SourceCardRow sources={cited} workspaceId={workspaceId} />
                    ) : null
                  })()}
                  {m.role === 'assistant' && m.content && !loading && !(loading && i === messages.length - 1) && (
                    <AiFeedbackBar
                      workspaceId={workspaceId}
                      surface="chat"
                      targetId={`insights-chat-${i}`}
                      className="mt-2"
                    />
                  )}
                </div>
              </motion.div>
            ))}
          </AnimatePresence>
        )}

        {hasMessages && loading && messages[messages.length - 1]?.role === 'user' && (
          <motion.div {...chatMessageMotion} className="max-w-[92%]">
            <AssistantMessageContent content="" thinking />
          </motion.div>
        )}
        <div ref={bottomRef} className="h-1 shrink-0" aria-hidden />
        </div>

        {hasMessages && (
          <div
            className="pointer-events-none absolute inset-x-0 bottom-0 z-[1] h-14 bg-gradient-to-t from-background from-40% via-background/55 to-transparent"
            aria-hidden
          />
        )}
      </div>

      <div
        className={cn(
          hasMessages
            ? 'absolute bottom-5 left-0 right-0 z-10 shadow-[0_-6px_20px_-6px_rgba(0,0,0,0.10)]'
            : 'shrink-0 bg-background pb-6 pt-4',
        )}
      >
        <WorkspaceChatComposer
          embedded
          input={input}
          setInput={setInput}
          onSend={() => void send(input)}
          loading={loading}
          inputRef={inputRef}
          placeholder="Ask anything…"
        />

        {!hasMessages && (
          <div className="mt-4 flex flex-wrap items-center justify-center gap-2">
            {quickPrompts.map(item => (
              <button
                key={item.label}
                type="button"
                onClick={() => applyQuickPrompt(item.prompt)}
                className="inline-flex cursor-pointer items-center gap-2 rounded-full border border-border bg-card px-4 py-2 text-sm font-medium text-foreground transition-colors hover:bg-muted/60"
              >
                {item.icon}
                {item.label}
              </button>
            ))}
          </div>
        )}
      </div>
    </div>
  )
}
