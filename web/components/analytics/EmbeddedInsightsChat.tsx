'use client'

import { useCallback, useEffect, useRef, useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { Clock } from 'lucide-react'
import { cn } from '@/lib/utils'
import { SourceCardRow, type ChatSource } from '@/components/shell/SourceCard'
import { extractCitationRefs } from '@/lib/ai/rag/citations'
import AiFeedbackBar from '@/components/ai/AiFeedbackBar'
import InsightsSummary, { type InsightsStats } from '@/components/insights/InsightsSummary'
import InsightsLoadingStatus from '@/components/insights/InsightsLoadingStatus'
import { loadFolderDocuments } from '@/lib/workspace-library'
import {
  loadInsightsChatMessages,
  saveInsightsChatMessages,
  type WorkspaceInsightsChatMessage,
} from '@/lib/workspace-insights-chat'
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

function hydrateMessages(stored: WorkspaceInsightsChatMessage[]): Message[] {
  return stored.map(m => ({
    role: m.role,
    content: m.content,
    error: m.error,
    sources: Array.isArray(m.sources) ? (m.sources as ChatSource[]) : undefined,
  }))
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
  insightsSkipReveal?: boolean
  insightsFooter?: React.ReactNode
  className?: string
}

function buildQuickPrompts(topDomain?: string): string[] {
  return [
    'Summarize what I captured this week',
    topDomain
      ? `What stands out about ${topDomain}?`
      : 'What should I focus on next?',
  ]
}

export default function EmbeddedInsightsChat({
  workspaceId,
  contextLabel,
  topDomain,
  narrative,
  stats,
  insightsLoading,
  insightsSkipReveal,
  insightsFooter,
  className,
}: Props) {
  const [messages, setMessages] = useState<Message[]>([])
  const [input, setInput] = useState('')
  const [loading, setLoading] = useState(false)
  const scrollRef = useRef<HTMLDivElement>(null)
  const bottomRef = useRef<HTMLDivElement>(null)
  const inputRef = useRef<HTMLInputElement | HTMLTextAreaElement>(null)

  const patchMessages = useCallback((
    updater: Message[] | ((prev: Message[]) => Message[]),
  ) => {
    setMessages(prev => {
      const next = typeof updater === 'function' ? updater(prev) : updater
      saveInsightsChatMessages(workspaceId, next as WorkspaceInsightsChatMessage[])
      return next
    })
  }, [workspaceId])

  useEffect(() => {
    setMessages(hydrateMessages(loadInsightsChatMessages(workspaceId)))
    setInput('')
    setLoading(false)
  }, [workspaceId])

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

    patchMessages(prev => [...prev, { role: 'user', content: trimmed }])
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
        patchMessages(prev => [...prev, { role: 'assistant', content: detail, error: true }])
        return
      }

      const reader = res.body.getReader()
      const decoder = new TextDecoder()
      let buffer = ''
      let headerParsed = false
      let sources: ChatSource[] = []
      let accumulated = ''
      patchMessages(prev => [...prev, { role: 'assistant', content: '' }])

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
          patchMessages(prev => {
            const next = [...prev]
            next[next.length - 1] = { role: 'assistant', content: accumulated, sources }
            return next
          })
        }
      }

      if (buffer) {
        accumulated += buffer
        patchMessages(prev => {
          const next = [...prev]
          next[next.length - 1] = { role: 'assistant', content: accumulated, sources }
          return next
        })
      }
    } catch {
      patchMessages(prev => [
        ...prev,
        { role: 'assistant', content: 'Network error — check your connection and try again.', error: true },
      ])
    } finally {
      setLoading(false)
    }
  }, [loading, patchMessages, workspaceId])

  function applyQuickPrompt(prompt: string) {
    setInput(prompt)
    setTimeout(() => inputRef.current?.focus(), 50)
  }

  return (
    <div className={cn('flex h-full min-h-0 flex-1 flex-col', className)}>
      <header className="shrink-0 pb-4">
        <h2 className="text-2xl font-semibold tracking-tight text-foreground sm:text-[1.65rem]">
          {greeting}! What&apos;s on today?
        </h2>
        {contextLabel && (
          <p className="mt-2 flex items-center gap-2 text-sm text-muted-foreground">
            <Clock className="h-3.5 w-3.5 shrink-0" aria-hidden />
            <span>{contextLabel}</span>
          </p>
        )}
      </header>

      <div
        ref={scrollRef}
        className="scrollbar-minimal min-h-0 flex-1 overflow-y-auto"
      >
        <div className="space-y-6 pb-4">
          <AnimatePresence mode="wait">
            {insightsLoading ? (
              <motion.div
                key="insights-loading"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                className="py-1"
              >
                <InsightsLoadingStatus />
              </motion.div>
            ) : showInsightsContent ? (
              insightsSkipReveal ? (
                <div key="insights-content">
                  <InsightsSummary
                    variant="inline"
                    narrative={narrative ?? null}
                    stats={stats ?? null}
                    footer={insightsFooter}
                  />
                </div>
              ) : (
                <motion.div key="insights-content" {...insightsRevealMotion}>
                  <InsightsSummary
                    variant="inline"
                    animateIn
                    narrative={narrative ?? null}
                    stats={stats ?? null}
                    footer={insightsFooter}
                  />
                </motion.div>
              )
            ) : null}
          </AnimatePresence>

          {hasMessages && (
            <AnimatePresence initial={false}>
              {messages.map((m, i) => (
                <motion.div
                  key={`${i}-${m.role}-${m.content.slice(0, 24)}`}
                  {...chatMessageMotion}
                  className={m.role === 'user' ? 'flex justify-end' : 'flex justify-start'}
                >
                  {m.role === 'user' ? (
                    <UserMessageBubble content={m.content} variant="sidePanel" />
                  ) : (
                    <div className="min-w-0 max-w-full space-y-2">
                      <AssistantMessageContent
                        content={m.content}
                        thinking={loading && i === messages.length - 1 && !m.content.trim()}
                        error={m.error}
                      />
                      {!loading && (() => {
                        const cited = citedSourcesForMessage(m.sources, m.content)
                        return cited.length > 0 ? (
                          <SourceCardRow sources={cited} workspaceId={workspaceId} />
                        ) : null
                      })()}
                      {m.content && !loading && !(loading && i === messages.length - 1) && (
                        <AiFeedbackBar
                          workspaceId={workspaceId}
                          surface="chat"
                          targetId={`insights-chat-${i}`}
                          className="mt-1"
                        />
                      )}
                    </div>
                  )}
                </motion.div>
              ))}
            </AnimatePresence>
          )}

          {hasMessages && loading && messages[messages.length - 1]?.role === 'user' && (
            <motion.div {...chatMessageMotion}>
              <AssistantMessageContent content="" thinking />
            </motion.div>
          )}
        </div>
        <div ref={bottomRef} className="h-1 shrink-0" aria-hidden />
      </div>

      <div className="shrink-0 pt-2">
        <WorkspaceChatComposer
          embedded="panel"
          input={input}
          setInput={setInput}
          onSend={() => void send(input)}
          loading={loading}
          inputRef={inputRef}
          placeholder="Ask anything…"
          className="!px-0 pb-2"
        />

        {!hasMessages && (
          <ul className="mt-3 space-y-1">
            {quickPrompts.map(prompt => (
              <li key={prompt}>
                <button
                  type="button"
                  onClick={() => applyQuickPrompt(prompt)}
                  className="w-full cursor-pointer rounded-lg py-2 text-left text-sm text-foreground transition-colors hover:bg-muted/50"
                >
                  {prompt}
                </button>
              </li>
            ))}
          </ul>
        )}
      </div>
    </div>
  )
}
