'use client'

import type { RefObject } from 'react'
import { Trash2, X } from 'lucide-react'
import { InlineChatIcon } from '@/components/ui/inline-chat-icon'
import { SourceCardRow, type ChatSource } from '@/components/shell/SourceCard'
import { extractCitationRefs } from '@/lib/ai/rag/citations'
import WorkspaceChatComposer from '@/components/chat/WorkspaceChatComposer'
import { AssistantMessageContent, UserMessageBubble } from '@/components/chat/ChatMessageParts'

function citedSourcesForMessage(sources: ChatSource[] | undefined, content: string): ChatSource[] {
  if (!sources?.length || !content.trim()) return []
  const refs = extractCitationRefs(content)
  if (refs.size === 0) return []
  return sources.filter(s => refs.has(s.ref))
}

type PanelMessage = {
  role: 'user' | 'assistant'
  content: string
  sources?: ChatSource[]
  error?: boolean
}

interface Props {
  messages: PanelMessage[]
  loading: boolean
  input: string
  setInput: (value: string) => void
  onSend: () => void
  onClose: () => void
  onClear: () => void
  inputRef: RefObject<HTMLInputElement | HTMLTextAreaElement | null>
  bottomRef: RefObject<HTMLDivElement | null>
  wsId: string
  ttsNotice: string | null
}

const STARTERS = [
  'Summarize this recap',
  'What did I capture?',
  'What should I review?',
]

export default function DocumentPanelChat({
  messages,
  loading,
  input,
  setInput,
  onSend,
  onClose,
  onClear,
  inputRef,
  bottomRef,
  wsId,
  ttsNotice,
}: Props) {
  return (
    <div className="flex h-full min-h-0 flex-col overflow-hidden bg-card">
      <header className="flex h-12 shrink-0 items-center justify-between px-4">
        <button
          type="button"
          onClick={onClose}
          className="flex h-8 w-8 cursor-pointer items-center justify-center rounded-md text-muted-foreground transition-colors hover:bg-muted/60 hover:text-foreground"
          aria-label="Close chat"
        >
          <X className="h-4 w-4" />
        </button>
        <div className="flex items-center gap-2">
          <InlineChatIcon size="sm" variant="badge" />
          <span className="text-sm font-semibold text-foreground">Ask Inline</span>
        </div>
        <button
          type="button"
          onClick={onClear}
          className="flex h-8 w-8 cursor-pointer items-center justify-center rounded-md text-muted-foreground transition-colors hover:bg-muted/60 hover:text-foreground"
          aria-label="Clear conversation"
        >
          <Trash2 className="h-4 w-4" />
        </button>
      </header>

      <div className="scrollbar-minimal min-h-0 flex-1 overflow-y-auto px-4 py-2">
        {messages.length === 0 ? (
          <div className="space-y-4 pt-2">
            <p className="text-sm leading-relaxed text-muted-foreground">
              Ask about this document and the captures behind it.
            </p>
            <ul className="space-y-1">
              {STARTERS.map(s => (
                <li key={s}>
                  <button
                    type="button"
                    onClick={() => {
                      setInput(s)
                      setTimeout(() => inputRef.current?.focus(), 50)
                    }}
                    className="w-full cursor-pointer rounded-lg px-1 py-2 text-left text-sm text-foreground transition-colors hover:bg-muted/50"
                  >
                    {s}
                  </button>
                </li>
              ))}
            </ul>
          </div>
        ) : (
          <div className="space-y-6 py-2">
            {messages.map((m, i) => (
              <div
                key={i}
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
                        <SourceCardRow sources={cited} workspaceId={wsId} />
                      ) : null
                    })()}
                  </div>
                )}
              </div>
            ))}
            {loading && messages[messages.length - 1]?.role === 'user' && (
              <AssistantMessageContent content="" thinking />
            )}
          </div>
        )}
        {ttsNotice && (
          <p className="pb-2 text-center text-[10px] text-muted-foreground/80" role="status">
            {ttsNotice}
          </p>
        )}
        <div ref={bottomRef} />
      </div>

      <WorkspaceChatComposer
        input={input}
        setInput={setInput}
        onSend={onSend}
        loading={loading}
        inputRef={inputRef}
        embedded="panel"
        placeholder="Ask Inline"
      />
    </div>
  )
}
