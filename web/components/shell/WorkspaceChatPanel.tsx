'use client'

import { useState, useRef, useEffect, useCallback } from 'react'
import { usePathname } from 'next/navigation'
import { motion, AnimatePresence } from 'framer-motion'
import { Sparkles, Send, Loader2, Bot, User, ChevronDown, Volume2, VolumeX, Clock } from 'lucide-react'
import { cn } from '@/lib/utils'
import { useChatPanel } from '@/lib/chat-panel-context'
import { loadFolderDocuments } from '@/lib/workspace-library'
import { normalizeInlineVoiceId } from '@/lib/inlineVoicePresets'
import { SourceCardRow, type ChatSource } from '@/components/shell/SourceCard'

const EASE = [0.22, 1, 0.36, 1] as const
const PANEL_DURATION = 0.32

type RetrievalMode = 'semantic' | 'recency' | 'none'

interface Message {
  role: 'user' | 'assistant'
  content: string
  /** Server-retrieved sources only — never derived from model output. */
  sources?: ChatSource[]
  mode?: RetrievalMode
  error?: boolean
}

let currentChatAudio: HTMLAudioElement | null = null
let currentChatUtterance: SpeechSynthesisUtterance | null = null

/** Fallback: browser speech synthesis. Always available, no keys, no quota. */
function speakViaBrowserSynth(text: string, onEnd?: () => void): boolean {
  if (typeof window === 'undefined' || !window.speechSynthesis) return false
  try {
    const utter = new SpeechSynthesisUtterance(text)
    currentChatUtterance = utter
    utter.onend = () => { currentChatUtterance = null; onEnd?.() }
    utter.onerror = () => { currentChatUtterance = null; onEnd?.() }
    window.speechSynthesis.cancel()
    window.speechSynthesis.speak(utter)
    return true
  } catch {
    return false
  }
}

/**
 * Chat read-aloud resolution order:
 *
 *   1. `/api/tts` proxy — authenticated via the dashboard session cookie;
 *      the ElevenLabs key lives only in the server env.
 *   2. `window.speechSynthesis` (browser built-in voice) when the proxy
 *      fails or cloud TTS is unavailable.
 */
async function speakViaTts(text: string, onEnd?: () => void, onFallback?: () => void): Promise<void> {
  if (currentChatAudio) { currentChatAudio.pause(); currentChatAudio = null }
  if (currentChatUtterance && typeof window !== 'undefined' && window.speechSynthesis) {
    window.speechSynthesis.cancel()
    currentChatUtterance = null
  }

  const trimmed = text.slice(0, 2000)
  if (!trimmed.trim()) { onEnd?.(); return }

  const voiceId =
    typeof window !== 'undefined'
      ? normalizeInlineVoiceId(localStorage.getItem('inline_voice_id'))
      : normalizeInlineVoiceId(null)
  const stability = typeof window !== 'undefined'
    ? parseFloat(localStorage.getItem('inline_voice_stability') || '0.5')
    : 0.5
  const similarityBoost = typeof window !== 'undefined'
    ? parseFloat(localStorage.getItem('inline_voice_similarity') || '0.75')
    : 0.75

  try {
    const res = await fetch('/api/tts', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        text: trimmed,
        voiceId,
        stability: Number.isFinite(stability) ? stability : 0.5,
        similarityBoost: Number.isFinite(similarityBoost) ? similarityBoost : 0.75,
      }),
    })

    if (!res.ok) {
      // Cloud voice unavailable — fall back to the browser's built-in
      // voice so the user still gets audio, and let the UI say so.
      onFallback?.()
      if (!speakViaBrowserSynth(trimmed, onEnd)) onEnd?.()
      return
    }

    const blob = await res.blob()
    const url = URL.createObjectURL(blob)
    const audio = new Audio(url)
    currentChatAudio = audio
    audio.onended = () => { URL.revokeObjectURL(url); currentChatAudio = null; onEnd?.() }
    audio.onerror = () => { URL.revokeObjectURL(url); currentChatAudio = null; onEnd?.() }
    audio.play()
  } catch {
    onFallback?.()
    if (!speakViaBrowserSynth(trimmed, onEnd)) onEnd?.()
  }
}

function stopChatSpeaking() {
  if (currentChatAudio) { currentChatAudio.pause(); currentChatAudio = null }
  if (currentChatUtterance && typeof window !== 'undefined' && window.speechSynthesis) {
    window.speechSynthesis.cancel()
    currentChatUtterance = null
  }
}

function getWsId(pathname: string): string {
  const m = pathname.match(/\/app\/(ws-[^/]+)/)
  return m ? m[1] : 'ws-1'
}

function useIsApplePlatform() {
  const [apple, setApple] = useState(false)
  useEffect(() => {
    setApple(typeof navigator !== 'undefined' && /Mac|iPhone|iPad|iPod/i.test(navigator.userAgent))
  }, [])
  return apple
}

export default function WorkspaceChatPanel() {
  const pathname = usePathname()
  const wsId = getWsId(pathname)
  const { open, setOpen, toggle } = useChatPanel()
  const isApple = useIsApplePlatform()

  const [messages, setMessages] = useState<Message[]>([])
  const [input, setInput] = useState('')
  const [loading, setLoading] = useState(false)
  const [voiceMode, setVoiceMode] = useState(() =>
    typeof window !== 'undefined' ? localStorage.getItem('inline_voice_chat') === 'true' : false,
  )
  const [speakingIdx, setSpeakingIdx] = useState<number | null>(null)
  const [ttsNotice, setTtsNotice] = useState<string | null>(null)
  const bottomRef = useRef<HTMLDivElement>(null)
  const inputRef = useRef<HTMLInputElement>(null)

  const toggleVoiceMode = useCallback(() => {
    setVoiceMode(prev => {
      const next = !prev
      localStorage.setItem('inline_voice_chat', String(next))
      if (!next) { stopChatSpeaking(); setSpeakingIdx(null) }
      return next
    })
  }, [])

  function handleSpeakMessage(idx: number, content: string) {
    if (speakingIdx === idx) { stopChatSpeaking(); setSpeakingIdx(null); return }
    stopChatSpeaking()
    setSpeakingIdx(idx)
    setTtsNotice(null)
    void speakViaTts(
      content,
      () => setSpeakingIdx(null),
      () => setTtsNotice('Cloud voice unavailable — using the browser voice.'),
    )
  }

  useEffect(() => {
    if (open) setTimeout(() => inputRef.current?.focus(), 100)
  }, [open])

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [messages, loading])

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && open) {
        const t = e.target as HTMLElement
        if (t.closest('[data-radix-dialog-content], [role="alertdialog"]')) return
        if (t.closest('[data-chat-panel]')) {
          e.preventDefault()
          setOpen(false)
        }
      }
      const isMod = e.metaKey || e.ctrlKey
      if (!isMod || !e.shiftKey || e.key.toLowerCase() !== 'l') return
      const t = e.target as HTMLElement
      if (t.closest('input, textarea, [contenteditable="true"]') && !t.closest('[data-chat-panel]')) {
        return
      }
      e.preventDefault()
      toggle()
    }
    document.addEventListener('keydown', onKey)
    return () => document.removeEventListener('keydown', onKey)
  }, [open, setOpen, toggle])

  const send = useCallback(async () => {
    const text = input.trim()
    if (!text || loading) return

    setMessages(prev => [...prev, { role: 'user', content: text }])
    setInput('')
    setLoading(true)

    try {
      const docs = loadFolderDocuments().map(d => ({ title: d.title, content: d.content }))
      const res = await fetch('/api/ai/rag', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ message: text, workspaceId: wsId, libraryDocs: docs }),
      })

      if (!res.ok || !res.body) {
        let detail = 'The AI service may be temporarily unavailable.'
        try {
          const j = (await res.json()) as { error?: string }
          if (j?.error) detail = j.error
        } catch { /* non-JSON error body */ }
        setMessages(prev => [
          ...prev,
          { role: 'assistant', content: detail, error: true },
        ])
        return
      }

      // The stream starts with one JSON metadata line:
      //   { "sources": [...], "mode": "semantic" | "recency" | "none" }\n
      // followed by the plain-text answer. Sources rendered in the UI come
      // exclusively from this server-built header.
      const reader = res.body.getReader()
      const decoder = new TextDecoder()
      let buffer = ''
      let headerParsed = false
      let sources: ChatSource[] = []
      let mode: RetrievalMode = 'none'
      let accumulated = ''
      setMessages(prev => [...prev, { role: 'assistant', content: '' }])

      const applyUpdate = () => {
        setMessages(prev => {
          const next = [...prev]
          next[next.length - 1] = { role: 'assistant', content: accumulated, sources, mode }
          return next
        })
      }

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
            const meta = JSON.parse(headerLine) as { sources?: ChatSource[]; mode?: RetrievalMode }
            sources = Array.isArray(meta.sources) ? meta.sources : []
            mode = meta.mode ?? 'none'
          } catch {
            // Header missing (older server) — treat the line as answer text.
            buffer = headerLine + '\n' + buffer
          }
          headerParsed = true
        }

        if (buffer) {
          accumulated += buffer
          buffer = ''
          applyUpdate()
        }
      }
      if (buffer) {
        accumulated += buffer
        applyUpdate()
      }

      if (voiceMode && accumulated) {
        const msgIdx = messages.length + 1
        setSpeakingIdx(msgIdx)
        setTtsNotice(null)
        void speakViaTts(
          accumulated,
          () => setSpeakingIdx(null),
          () => setTtsNotice('Cloud voice unavailable — using the browser voice.'),
        )
      }
    } catch {
      setMessages(prev => [
        ...prev,
        { role: 'assistant', content: 'Network error — check your connection and try again.', error: true },
      ])
    } finally {
      setLoading(false)
    }
  }, [input, loading, wsId, voiceMode, messages.length])

  function handleKey(e: React.KeyboardEvent) {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault()
      void send()
    }
  }

  return (
    <div
      data-chat-panel
      className="fixed bottom-0 left-1/2 z-50 flex -translate-x-1/2 flex-col items-center gap-0 pb-4"
      style={{ width: 'min(680px, calc(100vw - 48px))' }}
    >
      <AnimatePresence initial={false}>
        {open && (
          <motion.div
            key="chat-panel"
            initial={{ opacity: 0, y: 14, scale: 0.985 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 10, scale: 0.985 }}
            transition={{ duration: PANEL_DURATION, ease: EASE }}
            className="w-full overflow-hidden rounded-2xl border border-border bg-card shadow-[0_18px_48px_-18px_rgba(28,30,38,0.28)]"
            style={{ maxHeight: 420, willChange: 'transform, opacity' }}
          >
            <div className="flex items-center justify-between border-b border-border bg-card px-4 py-2.5">
              <div className="flex min-w-0 items-center gap-2">
                <div className="flex h-7 w-7 shrink-0 items-center justify-center rounded-lg bg-[#1C1E26]/10">
                  <Bot className="h-3.5 w-3.5 text-[#1C1E26]" />
                </div>
                <span className="truncate text-xs font-semibold tracking-tight text-foreground">
                  Ask Inline
                </span>
                <span className="shrink-0 rounded-md bg-white/80 px-1.5 py-0.5 font-mono text-[10px] font-medium text-muted-foreground ring-1 ring-border/60">
                  {wsId}
                </span>
              </div>
              <div className="flex shrink-0 items-center gap-1">
                <button
                  type="button"
                  onClick={toggleVoiceMode}
                  className={cn(
                    'flex h-7 w-7 cursor-pointer items-center justify-center rounded-lg transition-colors',
                    voiceMode
                      ? 'bg-primary/10 text-primary'
                      : 'text-muted-foreground hover:bg-white/80 hover:text-foreground',
                  )}
                  aria-label={voiceMode ? 'Disable voice replies' : 'Enable voice replies'}
                  title={voiceMode ? 'Voice replies on' : 'Voice replies off'}
                >
                  {voiceMode ? <Volume2 className="h-3.5 w-3.5" /> : <VolumeX className="h-3.5 w-3.5" />}
                </button>
                {messages.length > 0 && (
                  <button
                    type="button"
                    onClick={() => { setMessages([]); stopChatSpeaking(); setSpeakingIdx(null) }}
                    className="cursor-pointer rounded-md px-2 py-0.5 text-[10px] text-muted-foreground transition-colors hover:bg-white/80 hover:text-foreground"
                  >
                    Clear
                  </button>
                )}
                <button
                  type="button"
                  onClick={() => setOpen(false)}
                  className="flex h-7 w-7 cursor-pointer items-center justify-center rounded-lg text-muted-foreground transition-colors hover:bg-white/80 hover:text-foreground"
                  aria-label="Minimize chat"
                >
                  <ChevronDown className="h-3.5 w-3.5" />
                </button>
              </div>
            </div>

            <div
              className="scrollbar-minimal space-y-3 overflow-y-auto px-4 py-3"
              style={{ maxHeight: 300 }}
            >
              {messages.length === 0 && (
                <div className="flex flex-col items-center gap-2 py-6 text-center">
                  <Sparkles className="h-6 w-6 text-muted-foreground/40" />
                  <p className="text-xs text-muted-foreground">
                    Ask about your captures, highlights, and documents. Answers use the workspace context you saved.
                  </p>
                  {[
                    'What did I clip or highlight this week?',
                    'Summarize themes across my recent captures',
                    'Which sites have the most of my annotations?',
                  ].map(s => (
                    <button
                      key={s}
                      type="button"
                      onClick={() => {
                        setInput(s)
                        setTimeout(() => inputRef.current?.focus(), 50)
                      }}
                      className="cursor-pointer text-[11px] text-[#57534e] underline decoration-border underline-offset-2 transition-colors hover:text-foreground"
                    >
                      {s}
                    </button>
                  ))}
                </div>
              )}
              {messages.map((m, i) => (
                <div
                  key={i}
                  className={cn(
                    'flex items-start gap-2',
                    m.role === 'user' ? 'flex-row-reverse' : 'flex-row',
                  )}
                >
                  <div
                    className={cn(
                      'mt-0.5 flex h-5 w-5 shrink-0 items-center justify-center rounded-md',
                      m.role === 'user' ? 'bg-secondary' : 'bg-muted',
                    )}
                  >
                    {m.role === 'user' ? (
                      <User className="h-2.5 w-2.5 text-foreground" />
                    ) : (
                      <Bot className="h-2.5 w-2.5 text-muted-foreground" />
                    )}
                  </div>
                  <div className="group/msg relative min-w-0 flex-1">
                    <div
                      className={cn(
                        'max-w-[82%] rounded-xl px-3 py-2 text-xs leading-relaxed',
                        m.role === 'user'
                          ? 'ml-auto w-fit rounded-tr-sm bg-primary text-primary-foreground'
                          : m.error
                            ? 'rounded-tl-sm border border-destructive/30 bg-destructive/5 text-foreground'
                            : 'rounded-tl-sm border border-border bg-muted/60 text-foreground',
                      )}
                    >
                      {m.content ||
                        (loading && i === messages.length - 1 ? (
                          <span className="animate-pulse opacity-60">…</span>
                        ) : (
                          '…'
                        ))}
                    </div>
                    {m.role === 'assistant' && m.mode === 'recency' && m.content && (
                      <p className="mt-1 flex items-center gap-1 text-[9px] text-muted-foreground/80">
                        <Clock className="h-2.5 w-2.5" />
                        Workspace not indexed yet — answering from recent captures only.
                      </p>
                    )}
                    {m.role === 'assistant' && !loading && m.sources && m.sources.length > 0 && (
                      <SourceCardRow sources={m.sources} workspaceId={wsId} />
                    )}
                    {m.role === 'assistant' && m.content && !loading && (
                      <button
                        type="button"
                        onClick={() => handleSpeakMessage(i, m.content)}
                        className={cn(
                          'absolute -bottom-1 -right-1 flex h-5 w-5 cursor-pointer items-center justify-center rounded-full border border-border bg-card text-muted-foreground opacity-0 shadow-sm transition-opacity group-hover/msg:opacity-100',
                          speakingIdx === i && 'opacity-100 text-primary',
                        )}
                        title={speakingIdx === i ? 'Stop speaking' : 'Read aloud'}
                      >
                        {speakingIdx === i
                          ? <VolumeX className="h-2.5 w-2.5" />
                          : <Volume2 className="h-2.5 w-2.5" />}
                      </button>
                    )}
                  </div>
                </div>
              ))}
              {loading && messages[messages.length - 1]?.role !== 'assistant' && (
                <div className="flex items-center gap-2">
                  <div className="flex h-5 w-5 items-center justify-center rounded-md bg-muted">
                    <Bot className="h-2.5 w-2.5 text-muted-foreground" />
                  </div>
                  <Loader2 className="h-3 w-3 animate-spin text-muted-foreground" />
                </div>
              )}
              {ttsNotice && (
                <p className="text-center text-[9px] text-muted-foreground/80" role="status">
                  {ttsNotice}
                </p>
              )}
              <div ref={bottomRef} />
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      <div
        className={cn(
          'flex w-full items-center gap-2 rounded-2xl border border-border bg-card/95 px-4 py-2.5 shadow-[0_12px_36px_-20px_rgba(28,30,38,0.32)] backdrop-blur-md transition-[border-radius,border-color] duration-300 ease-[cubic-bezier(0.22,1,0.36,1)]',
          open && 'rounded-t-none border-t-0',
        )}
      >
        <Sparkles className="h-4 w-4 shrink-0 text-[#78716c]" />
        <input
          ref={inputRef}
          value={input}
          onChange={e => setInput(e.target.value)}
          onKeyDown={handleKey}
          onFocus={() => !open && setOpen(true)}
          placeholder="Ask anything across this workspace..."
          className="flex-1 border-none bg-transparent text-sm text-foreground outline-none placeholder:text-muted-foreground/70"
          disabled={loading}
          aria-label="Message Inline assistant"
        />
        <div className="flex shrink-0 items-center gap-1.5">
          {open && input.trim() && (
            <button
              type="button"
              onClick={() => void send()}
              disabled={loading}
              className="flex h-8 w-8 cursor-pointer items-center justify-center rounded-lg bg-primary text-primary-foreground transition-opacity hover:opacity-90 disabled:opacity-40"
            >
              {loading ? (
                <Loader2 className="h-3.5 w-3.5 animate-spin" />
              ) : (
                <Send className="h-3.5 w-3.5" />
              )}
            </button>
          )}
          {!open && (
            <span
              className="hidden items-center gap-0.5 text-[10px] text-muted-foreground sm:inline-flex"
              title={isApple ? 'Open Inline (⌘⇧L)' : 'Open Inline (Ctrl+Shift+L)'}
            >
              <kbd className="rounded border border-border bg-muted/80 px-1 py-px font-mono text-[10px] text-muted-foreground">
                {isApple ? '⌘' : 'Ctrl'}
              </kbd>
              <kbd className="rounded border border-border bg-muted/80 px-1 py-px font-mono text-[10px] text-muted-foreground">
                ⇧
              </kbd>
              <kbd className="rounded border border-border bg-muted/80 px-1 py-px font-mono text-[10px] text-muted-foreground">
                L
              </kbd>
            </span>
          )}
        </div>
      </div>
    </div>
  )
}
