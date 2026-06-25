'use client'

import { useState, useRef, useEffect, useLayoutEffect, useCallback } from 'react'
import { usePathname } from 'next/navigation'
import { motion, AnimatePresence } from 'framer-motion'
import {
  Plus,
  Check,
  ArrowUp,
  Loader2,
  User,
  ChevronDown,
  Volume2,
  VolumeX,
  X,
  MoreHorizontal,
  Maximize2,
  Paperclip,
  Globe2,
  Mic2,
  PencilLine,
  PanelRight,
} from 'lucide-react'
import { InlineChatIcon } from '@/components/ui/inline-chat-icon'
import { cn, formatDisplayTitle } from '@/lib/utils'
import { useChatPanel } from '@/lib/chat-panel-context'
import { loadFolderDocuments } from '@/lib/workspace-library'
import { normalizeInlineVoiceId } from '@/lib/inlineVoicePresets'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'
import {
  createChatSession,
  loadChatSessions,
  saveChatSessions,
  touchSession,
  type WorkspaceChatSession,
} from '@/lib/workspace-chat-sessions'
import { SourceCardRow, type ChatSource } from '@/components/shell/SourceCard'

const EASE = [0.22, 1, 0.36, 1] as const
const PANEL_OPEN_DURATION = 0.38
const PANEL_CLOSE_DURATION = 0.44
const PANEL_CLOSE_EASE = [0.4, 0, 0.2, 1] as const
const PILL_DURATION = 0.3
const THINKING_MESSAGE = 'Putting together the best answer — one moment, Inline…'

const panelMotion = {
  initial: { opacity: 0, y: 20, scale: 0.97 },
  animate: {
    opacity: 1,
    y: 0,
    scale: 1,
    transition: { duration: PANEL_OPEN_DURATION, ease: EASE },
  },
  exit: {
    opacity: 0,
    y: 22,
    scale: 0.96,
    transition: { duration: PANEL_CLOSE_DURATION, ease: PANEL_CLOSE_EASE },
  },
}

const pillMotion = {
  initial: { opacity: 0, y: 10, scale: 0.96 },
  animate: {
    opacity: 1,
    y: 0,
    scale: 1,
    transition: { duration: PILL_DURATION, ease: EASE },
  },
  exit: {
    opacity: 0,
    y: 8,
    scale: 0.97,
    transition: { duration: 0.22, ease: EASE },
  },
}

/** Collapse noisy citation clusters like [1, 2, 3, 4, 5] into [1–5]. */
function formatCitations(text: string): string {
  return text.replace(/\[\s*(\d+(?:\s*,\s*\d+)*)\s*\]/g, (_, numsStr: string) => {
    const nums = numsStr
      .split(',')
      .map(s => parseInt(s.trim(), 10))
      .filter(n => !Number.isNaN(n))
    if (nums.length === 0) return ''
    if (nums.length === 1) return `[${nums[0]}]`
    nums.sort((a, b) => a - b)
    const consecutive = nums.every((n, i) => i === 0 || n === nums[i - 1]! + 1)
    if (consecutive || nums.length > 3) {
      return `[${nums[0]}–${nums[nums.length - 1]}]`
    }
    return `[${nums.join(', ')}]`
  })
}

function stripInlineMarkdown(text: string): string {
  return text
    .replace(/\*\*(.+?)\*\*/g, '$1')
    .replace(/__(.+?)__/g, '$1')
    .replace(/(?<!\*)\*(?!\*)(.+?)(?<!\*)\*(?!\*)/g, '$1')
    .replace(/`([^`]+)`/g, '$1')
    .replace(/^#{1,6}\s+/gm, '')
}

function normalizeAssistantText(text: string): string {
  return reflowDomainList(formatCitations(stripInlineMarkdown(text)))
}

/** Turn run-on "site [1,2] site [3,4]" answers into a bullet list. */
function reflowDomainList(text: string): string {
  const host = '(?:localhost|[a-z0-9][\\w.-]*\\.[a-z]{2,})'
  const citation = '\\[(?:\\d+\\s*[,–-]\\s*)*\\d+\\]'
  const runOn = new RegExp(`(${host})\\s*(?:${citation})?`, 'gi')
  const matches = [...text.matchAll(runOn)]
  if (matches.length < 2) return text

  const firstIdx = matches[0]!.index ?? 0
  const intro = text.slice(0, firstIdx).trim()

  const seen = new Set<string>()
  const bullets: string[] = []
  for (const match of matches) {
    const domain = match[1]!.toLowerCase()
    if (seen.has(domain)) continue
    seen.add(domain)
    bullets.push(`- ${match[1]}`)
  }

  if (bullets.length < 2) return text
  return intro ? `${intro}\n\n${bullets.join('\n')}` : bullets.join('\n')
}

const emptyFadeContainer = {
  hidden: {},
  show: { transition: { staggerChildren: 0.14, delayChildren: 0.1 } },
}
const emptyFadeItem = {
  hidden: { opacity: 0, y: 8 },
  show: { opacity: 1, y: 0, transition: { duration: 0.45, ease: EASE } },
}

function AssistantMessageContent({
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
        {THINKING_MESSAGE}
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

type RetrievalMode = 'semantic' | 'recency' | 'none'

interface Message {
  role: 'user' | 'assistant'
  content: string
  sources?: ChatSource[]
  mode?: RetrievalMode
  error?: boolean
}

function UserMessageBubble({ content }: { content: string }) {
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

let currentChatAudio: HTMLAudioElement | null = null
let currentChatUtterance: SpeechSynthesisUtterance | null = null

function speakViaBrowserSynth(text: string, onEnd?: () => void): boolean {
  if (typeof window === 'undefined' || !window.speechSynthesis) return false
  try {
    const utter = new SpeechSynthesisUtterance(text)
    currentChatUtterance = utter
    utter.onend = () => {
      currentChatUtterance = null
      onEnd?.()
    }
    utter.onerror = () => {
      currentChatUtterance = null
      onEnd?.()
    }
    window.speechSynthesis.cancel()
    window.speechSynthesis.speak(utter)
    return true
  } catch {
    return false
  }
}

async function speakViaTts(text: string, onEnd?: () => void, onFallback?: () => void): Promise<void> {
  if (currentChatAudio) {
    currentChatAudio.pause()
    currentChatAudio = null
  }
  if (currentChatUtterance && typeof window !== 'undefined' && window.speechSynthesis) {
    window.speechSynthesis.cancel()
    currentChatUtterance = null
  }

  const trimmed = text.slice(0, 2000)
  if (!trimmed.trim()) {
    onEnd?.()
    return
  }

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
      onFallback?.()
      if (!speakViaBrowserSynth(trimmed, onEnd)) onEnd?.()
      return
    }

    const blob = await res.blob()
    const url = URL.createObjectURL(blob)
    const audio = new Audio(url)
    currentChatAudio = audio
    audio.onended = () => {
      URL.revokeObjectURL(url)
      currentChatAudio = null
      onEnd?.()
    }
    audio.onerror = () => {
      URL.revokeObjectURL(url)
      currentChatAudio = null
      onEnd?.()
    }
    audio.play()
  } catch {
    onFallback?.()
    if (!speakViaBrowserSynth(trimmed, onEnd)) onEnd?.()
  }
}

function stopChatSpeaking() {
  if (currentChatAudio) {
    currentChatAudio.pause()
    currentChatAudio = null
  }
  if (currentChatUtterance && typeof window !== 'undefined' && window.speechSynthesis) {
    window.speechSynthesis.cancel()
    currentChatUtterance = null
  }
}

import { resolveWorkspaceIdFromBrowserPath } from '@/lib/workspace-routes'

function getWsId(pathname: string): string {
  return resolveWorkspaceIdFromBrowserPath(pathname)
}

function useUsesMetaShortcut() {
  const [usesMetaShortcut, setUsesMetaShortcut] = useState(false)
  useEffect(() => {
    setUsesMetaShortcut(typeof navigator !== 'undefined' && /Mac|iPhone|iPad|iPod/i.test(navigator.userAgent))
  }, [])
  return usesMetaShortcut
}

export default function WorkspaceChatPanel() {
  const pathname = usePathname()
  const wsId = getWsId(pathname)
  const { open, setOpen, toggle } = useChatPanel()
  const usesMetaShortcut = useUsesMetaShortcut()
  const isDashboard = /\/dashboard$/.test(pathname)

  const [sessions, setSessions] = useState<WorkspaceChatSession[]>([])
  const [activeSessionId, setActiveSessionId] = useState('')
  const [input, setInput] = useState('')
  const [loading, setLoading] = useState(false)
  const [voiceMode, setVoiceMode] = useState(() =>
    typeof window !== 'undefined' ? localStorage.getItem('inline_voice_chat') === 'true' : false,
  )
  const [speakingIdx, setSpeakingIdx] = useState<number | null>(null)
  const [ttsNotice, setTtsNotice] = useState<string | null>(null)
  const bottomRef = useRef<HTMLDivElement>(null)
  const inputRef = useRef<HTMLInputElement>(null)

  const activeSession = sessions.find(s => s.id === activeSessionId) ?? null
  const messages = (activeSession?.messages ?? []) as Message[]
  const sessionTitle = formatDisplayTitle(activeSession?.title ?? 'New AI chat')

  const patchActiveMessages = useCallback((
    updater: Message[] | ((prev: Message[]) => Message[]),
  ) => {
    setSessions(prev => {
      const next = prev.map(session => {
        if (session.id !== activeSessionId) return session
        const nextMessages = typeof updater === 'function'
          ? updater(session.messages as Message[])
          : updater
        return touchSession(session, nextMessages as WorkspaceChatSession['messages'])
      })
      saveChatSessions(wsId, next)
      return next
    })
  }, [activeSessionId, wsId])

  const startNewChat = useCallback(() => {
    const fresh = createChatSession(wsId)
    setSessions(prev => {
      const next = [fresh, ...prev].slice(0, 20)
      saveChatSessions(wsId, next)
      return next
    })
    setActiveSessionId(fresh.id)
    setInput('')
    stopChatSpeaking()
    setSpeakingIdx(null)
  }, [wsId])

  const switchSession = useCallback((sessionId: string) => {
    setActiveSessionId(sessionId)
    setInput('')
    stopChatSpeaking()
    setSpeakingIdx(null)
  }, [])

  useEffect(() => {
    const loaded = loadChatSessions(wsId)
    if (loaded.length === 0) {
      const fresh = createChatSession(wsId)
      setSessions([fresh])
      setActiveSessionId(fresh.id)
      saveChatSessions(wsId, [fresh])
      return
    }
    setSessions(loaded)
    setActiveSessionId(loaded[0]!.id)
  }, [wsId])

  const toggleVoiceMode = useCallback(() => {
    setVoiceMode(prev => {
      const next = !prev
      localStorage.setItem('inline_voice_chat', String(next))
      if (!next) {
        stopChatSpeaking()
        setSpeakingIdx(null)
      }
      return next
    })
  }, [])

  function handleSpeakMessage(idx: number, content: string) {
    if (speakingIdx === idx) {
      stopChatSpeaking()
      setSpeakingIdx(null)
      return
    }
    stopChatSpeaking()
    setSpeakingIdx(idx)
    setTtsNotice(null)
    void speakViaTts(
      content,
      () => setSpeakingIdx(null),
      () => setTtsNotice('Cloud voice unavailable - using the browser voice.'),
    )
  }

  useEffect(() => {
    if (open) setTimeout(() => inputRef.current?.focus(), 100)
  }, [open])

  // Backfill workspace embeddings in the background so RAG can use semantic search.
  useEffect(() => {
    if (!wsId) return
    let cancelled = false

    async function backfill() {
      let remaining = 1
      while (!cancelled && remaining > 0) {
        try {
          const res = await fetch('/api/ai/index', {
            method: 'PUT',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ workspaceId: wsId, batchSize: 30 }),
          })
          if (!res.ok) break
          const data = (await res.json()) as { remaining?: number }
          remaining = typeof data.remaining === 'number' ? data.remaining : 0
        } catch {
          break
        }
      }
    }

    void backfill()
    return () => { cancelled = true }
  }, [wsId])

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

    patchActiveMessages(prev => [...prev, { role: 'user', content: text }])
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
        } catch {
          // Ignore non-JSON error bodies.
        }
        patchActiveMessages(prev => [
          ...prev,
          { role: 'assistant', content: detail, error: true },
        ])
        return
      }

      const reader = res.body.getReader()
      const decoder = new TextDecoder()
      let buffer = ''
      let headerParsed = false
      let sources: ChatSource[] = []
      let mode: RetrievalMode = 'none'
      let accumulated = ''
      patchActiveMessages(prev => [...prev, { role: 'assistant', content: '' }])

      const applyUpdate = () => {
        patchActiveMessages(prev => {
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
          () => setTtsNotice('Cloud voice unavailable - using the browser voice.'),
        )
      }
    } catch {
      patchActiveMessages(prev => [
        ...prev,
        { role: 'assistant', content: 'Network error - check your connection and try again.', error: true },
      ])
    } finally {
      setLoading(false)
    }
  }, [input, loading, wsId, voiceMode, messages.length, patchActiveMessages])

  function handleKey(e: React.KeyboardEvent) {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault()
      void send()
    }
  }

  const hour = new Date().getHours()
  const greeting = hour < 12 ? 'Morning' : hour < 17 ? 'Afternoon' : 'Evening'
  const pillLabel = isDashboard ? `${greeting}. Ask Inline` : 'Ask Inline'
  const quickPrompts = [
    'What needs my attention today?',
    'How do I use Inline?',
    'Summarize recent captures',
  ]

  return (
    <div
      data-chat-panel
      className="fixed bottom-0 left-1/2 z-50 flex -translate-x-1/2 flex-col items-center gap-0 pb-5"
    >
      <AnimatePresence mode="wait" initial={false}>
        {open ? (
          <motion.div
            key="chat-panel"
            {...panelMotion}
            className="flex w-[min(760px,calc(100vw-48px))] flex-col overflow-hidden rounded-xl border border-border bg-card shadow-[0_22px_70px_-42px_rgba(28,30,38,0.38)]"
            style={{
              height: 'min(720px, calc(100vh - 96px))',
              willChange: 'transform, opacity',
              transformOrigin: 'bottom center',
            }}
          >
            <div className="flex h-14 items-center justify-between bg-card px-5">
              <DropdownMenu>
                <DropdownMenuTrigger
                  className="flex min-w-0 max-w-[min(280px,42vw)] cursor-pointer items-center gap-2 rounded-md px-1.5 py-1 text-sm font-medium text-foreground transition-colors hover:bg-muted/70 outline-none"
                  aria-label="Chat sessions"
                >
                  <InlineChatIcon size="md" variant="badge" />
                  <span className="min-w-0 truncate">{sessionTitle}</span>
                  <ChevronDown className="h-3.5 w-3.5 shrink-0 text-muted-foreground" />
                </DropdownMenuTrigger>
                <DropdownMenuContent align="start" className="w-72 bg-card border border-border rounded-lg">
                  <DropdownMenuItem
                    className="cursor-pointer"
                    onClick={startNewChat}
                  >
                    <Plus className="h-4 w-4 text-muted-foreground" />
                    <span>New chat</span>
                  </DropdownMenuItem>
                  {sessions.length > 0 && <DropdownMenuSeparator />}
                  {sessions.map(session => (
                    <DropdownMenuItem
                      key={session.id}
                      className="cursor-pointer"
                      onClick={() => switchSession(session.id)}
                    >
                      <span className="min-w-0 flex-1 truncate">{formatDisplayTitle(session.title)}</span>
                      {session.id === activeSessionId && (
                        <Check className="h-4 w-4 shrink-0 text-primary" />
                      )}
                    </DropdownMenuItem>
                  ))}
                </DropdownMenuContent>
              </DropdownMenu>

              <div className="flex items-center gap-3">
                <button
                  type="button"
                  className="flex cursor-pointer items-center gap-2 rounded-md px-2 py-1 text-xs font-medium text-foreground transition-colors hover:bg-muted/70"
                  aria-label="Personalization enabled"
                >
                  <span>Personalize</span>
                  <span className="relative h-5 w-9 rounded-full bg-[#2f80ed]">
                    <span className="absolute right-0.5 top-0.5 h-4 w-4 rounded-full bg-white shadow-[0_1px_3px_rgba(15,23,42,0.18)]" />
                  </span>
                </button>
                <span className="h-5 w-px bg-border" />
                <div className="flex items-center gap-1">
                  <button
                    type="button"
                    onClick={toggleVoiceMode}
                    className={cn(
                      'flex h-8 w-8 cursor-pointer items-center justify-center rounded-md transition-colors',
                      voiceMode
                        ? 'bg-primary/10 text-primary'
                        : 'text-muted-foreground hover:bg-muted/70 hover:text-foreground',
                    )}
                    aria-label={voiceMode ? 'Disable voice replies' : 'Enable voice replies'}
                    title={voiceMode ? 'Voice replies on' : 'Voice replies off'}
                  >
                    {voiceMode ? <Volume2 className="h-3.5 w-3.5" /> : <VolumeX className="h-3.5 w-3.5" />}
                  </button>
                  <button
                    type="button"
                    className="flex h-8 w-8 cursor-pointer items-center justify-center rounded-md text-muted-foreground transition-colors hover:bg-muted/70 hover:text-foreground"
                    aria-label="Edit chat"
                  >
                    <PencilLine className="h-3.5 w-3.5" />
                  </button>
                  <button
                    type="button"
                    className="flex h-8 w-8 cursor-pointer items-center justify-center rounded-md text-muted-foreground transition-colors hover:bg-muted/70 hover:text-foreground"
                    aria-label="Focus chat"
                  >
                    <Maximize2 className="h-3.5 w-3.5" />
                  </button>
                  <button
                    type="button"
                    className="flex h-8 w-8 cursor-pointer items-center justify-center rounded-md text-muted-foreground transition-colors hover:bg-muted/70 hover:text-foreground"
                    aria-label="Toggle side context"
                  >
                    <PanelRight className="h-3.5 w-3.5" />
                  </button>
                  <button
                    type="button"
                    className="flex h-8 w-8 cursor-pointer items-center justify-center rounded-md text-muted-foreground transition-colors hover:bg-muted/70 hover:text-foreground"
                    aria-label="More chat options"
                  >
                    <MoreHorizontal className="h-3.5 w-3.5" />
                  </button>
                  {messages.length > 0 && (
                    <button
                      type="button"
                      onClick={() => {
                        patchActiveMessages([])
                        stopChatSpeaking()
                        setSpeakingIdx(null)
                      }}
                      className="hidden cursor-pointer rounded-sm px-2 py-1 text-[11px] text-muted-foreground transition-colors hover:bg-muted/70 hover:text-foreground sm:block"
                    >
                      Clear
                    </button>
                  )}
                  <button
                    type="button"
                    onClick={() => setOpen(false)}
                    className="flex h-8 w-8 cursor-pointer items-center justify-center rounded-md bg-muted/80 text-muted-foreground transition-colors hover:bg-muted hover:text-foreground"
                    aria-label="Close chat"
                  >
                    <X className="h-3.5 w-3.5" />
                  </button>
                </div>
              </div>
            </div>

            <div className="scrollbar-minimal min-w-0 flex-1 overflow-x-hidden overflow-y-auto px-8 py-6">
              {messages.length === 0 && (
                <motion.div
                  className="max-w-[560px]"
                  variants={emptyFadeContainer}
                  initial="hidden"
                  animate="show"
                >
                  <motion.div variants={emptyFadeItem} className="space-y-3">
                    <p className="text-sm text-muted-foreground">
                      Ready to help across this workspace.
                    </p>
                    <div>
                      <div className="flex flex-wrap items-center gap-2">
                        <p className="text-sm font-semibold text-foreground">
                          Start with a clear next step
                        </p>
                        <span className="rounded-sm bg-muted px-1.5 py-0.5 text-[10px] text-muted-foreground">
                          now
                        </span>
                      </div>
                      <p className="mt-3 text-sm leading-6 text-muted-foreground">
                        Ask about saved captures, open documents, recent activity, or anything
                        you want summarized into a useful answer.
                      </p>
                    </div>
                  </motion.div>

                  <motion.div
                    variants={emptyFadeItem}
                    className="mt-8 border-t border-border pt-5"
                  >
                    <div className="mb-2 flex items-center justify-between text-[10px] text-muted-foreground">
                      <span>Use arrows to browse</span>
                      <span>Esc to close</span>
                    </div>
                    <ul className="space-y-0.5">
                      {quickPrompts.map(s => (
                        <li key={s}>
                          <button
                            type="button"
                            onClick={() => {
                              setInput(s)
                              setTimeout(() => inputRef.current?.focus(), 50)
                            }}
                            className="flex w-full cursor-pointer items-baseline gap-2.5 rounded-md px-2 py-2 text-left text-sm text-foreground transition-colors hover:bg-muted/50"
                          >
                            <span className="shrink-0 text-muted-foreground" aria-hidden>→</span>
                            <span>{s}</span>
                          </button>
                        </li>
                      ))}
                    </ul>
                  </motion.div>
                </motion.div>
              )}

              {messages.length > 0 && (
                <div className="min-w-0 space-y-5">
              {messages.map((m, i) => (
                <div
                  key={i}
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
                    {m.role === 'assistant' && !loading && m.sources && m.sources.length > 0 && (
                      <SourceCardRow sources={m.sources} workspaceId={wsId} />
                    )}
                    {m.role === 'assistant' && m.content && !loading && (
                      <button
                        type="button"
                        onClick={() => handleSpeakMessage(i, m.content)}
                        className={cn(
                          'mt-2 flex h-6 w-6 cursor-pointer items-center justify-center rounded-md border border-border bg-card text-muted-foreground opacity-0 transition-opacity group-hover/msg:opacity-100',
                          speakingIdx === i && 'opacity-100 text-primary',
                        )}
                        title={speakingIdx === i ? 'Stop speaking' : 'Read aloud'}
                        aria-label={speakingIdx === i ? 'Stop speaking' : 'Read aloud'}
                      >
                        {speakingIdx === i
                          ? <VolumeX className="h-2.5 w-2.5" />
                          : <Volume2 className="h-2.5 w-2.5" />}
                      </button>
                    )}
                  </div>
                </div>
              ))}

              {loading && messages[messages.length - 1]?.role === 'user' && (
                <div className="max-w-[92%]">
                  <AssistantMessageContent content="" thinking />
                </div>
              )}
                </div>
              )}

              {ttsNotice && (
                <p className="text-center text-[9px] text-muted-foreground/80" role="status">
                  {ttsNotice}
                </p>
              )}
              <div ref={bottomRef} />
            </div>

            <div className="bg-card/95 p-4">
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
                    placeholder="Ask about your captures, documents, or recent activity…"
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
                      onClick={() => void send()}
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
            </div>
          </motion.div>
        ) : (
          <motion.button
            type="button"
            key="chat-pill"
            {...pillMotion}
            style={{ transformOrigin: 'bottom center' }}
            onClick={() => setOpen(true)}
            title={usesMetaShortcut ? 'Open Inline (Cmd+Shift+L)' : 'Open Inline (Ctrl+Shift+L)'}
            className="flex h-11 w-[210px] cursor-pointer items-center justify-start overflow-hidden rounded-full border border-border bg-card/95 px-3 text-left shadow-[0_14px_40px_-8px_rgba(28,30,38,0.34),0_6px_18px_-4px_rgba(28,30,38,0.2)] backdrop-blur-md"
            aria-label="Open Inline chat"
          >
            <InlineChatIcon variant="badge" />
            <span className="ml-2 whitespace-nowrap text-xs font-medium text-foreground">
              {pillLabel}
            </span>
          </motion.button>
        )}
      </AnimatePresence>
    </div>
  )
}
