'use client'

import { useState } from 'react'
import { motion } from 'framer-motion'
import { ChevronLeft, ChevronRight, Loader2, RotateCcw } from 'lucide-react'
import { cn } from '@/lib/utils'
import AiFeedbackBar from '@/components/ai/AiFeedbackBar'

export type KnowledgeTopic = 'interview' | 'concepts' | 'connections' | 'gaps'

export type KnowledgeCard = {
  front: string
  back: string
  topic: string
}

const TOPIC_LABELS: Record<KnowledgeTopic, string> = {
  interview: 'Interview',
  concepts: 'Concepts',
  connections: 'Connections',
  gaps: 'Gaps',
}

interface Props {
  workspaceId: string
  docId: string
  recapText: string
  notesText: string
}

export default function KnowledgeCardDeck({ workspaceId, docId, recapText, notesText }: Props) {
  const [topic, setTopic] = useState<KnowledgeTopic>('interview')
  const [cards, setCards] = useState<KnowledgeCard[]>([])
  const [index, setIndex] = useState(0)
  const [flipped, setFlipped] = useState(false)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [generationId, setGenerationId] = useState('')

  async function generate() {
    setLoading(true)
    setError(null)
    setFlipped(false)
    setIndex(0)
    try {
      const res = await fetch('/api/ai/knowledge-cards', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ recapText, notes: notesText, topic }),
      })
      const json = await res.json() as { cards?: KnowledgeCard[]; error?: string }
      if (!res.ok || !json.cards?.length) {
        setError(json.error ?? 'Could not generate cards')
        return
      }
      setCards(json.cards)
      setGenerationId(`${docId}-${topic}-${Date.now()}`)
    } catch {
      setError('Network error — try again.')
    } finally {
      setLoading(false)
    }
  }

  const current = cards[index]

  return (
    <div className="mt-10 rounded-2xl border border-border bg-card p-5">
      <div className="mb-4 flex flex-wrap items-center justify-between gap-3">
        <div>
          <p className="text-sm font-semibold text-foreground">Test my knowledge</p>
          <p className="text-xs text-muted-foreground mt-0.5">
            Active recall from your captures — pick a focus, flip three cards.
          </p>
        </div>
        <div
          className="inline-flex rounded-full border border-border bg-muted p-0.5"
          role="tablist"
          aria-label="Card topic"
        >
          {(Object.keys(TOPIC_LABELS) as KnowledgeTopic[]).map(t => (
            <button
              key={t}
              type="button"
              role="tab"
              aria-selected={topic === t}
              onClick={() => setTopic(t)}
              className={cn(
                'rounded-full px-3 py-1 text-xs font-medium transition-colors cursor-pointer',
                topic === t
                  ? 'bg-card text-foreground shadow-sm'
                  : 'text-muted-foreground hover:text-foreground',
              )}
            >
              {TOPIC_LABELS[t]}
            </button>
          ))}
        </div>
      </div>

      <button
        type="button"
        onClick={() => void generate()}
        disabled={loading}
        className="inline-flex items-center gap-2 rounded-lg bg-primary px-4 py-2 text-sm font-medium text-primary-foreground hover:opacity-90 transition-opacity cursor-pointer disabled:opacity-50"
      >
        {loading ? (
          <>
            <Loader2 className="h-4 w-4 animate-spin" />
            Generating…
          </>
        ) : (
          'Test my knowledge'
        )}
      </button>

      {error && (
        <p className="mt-3 text-sm text-destructive">{error}</p>
      )}

      {current && (
        <div className="mt-6 space-y-4">
          <div
            className="relative mx-auto h-48 max-w-md cursor-pointer perspective-[1000px]"
            onClick={() => setFlipped(f => !f)}
            onKeyDown={e => { if (e.key === ' ' || e.key === 'Enter') { e.preventDefault(); setFlipped(f => !f) } }}
            role="button"
            tabIndex={0}
            aria-label={flipped ? 'Show question' : 'Show answer'}
          >
            <motion.div
              className="relative h-full w-full"
              animate={{ rotateY: flipped ? 180 : 0 }}
              transition={{ duration: 0.45, ease: [0.22, 1, 0.36, 1] }}
              style={{ transformStyle: 'preserve-3d' }}
            >
              <div
                className="absolute inset-0 flex items-center justify-center rounded-xl border border-border bg-muted/50 p-6 text-center"
                style={{ backfaceVisibility: 'hidden' }}
              >
                <p className="text-sm font-medium text-foreground leading-relaxed">{current.front}</p>
              </div>
              <div
                className="absolute inset-0 flex items-center justify-center rounded-xl border border-primary/30 bg-primary/5 p-6 text-center"
                style={{ backfaceVisibility: 'hidden', transform: 'rotateY(180deg)' }}
              >
                <p className="text-sm text-foreground leading-relaxed">{current.back}</p>
              </div>
            </motion.div>
          </div>

          <p className="text-center text-[11px] text-muted-foreground">
            Tap or press Space to flip · {index + 1} of {cards.length}
          </p>

          <div className="flex items-center justify-center gap-2">
            <button
              type="button"
              onClick={() => { setIndex(i => Math.max(0, i - 1)); setFlipped(false) }}
              disabled={index === 0}
              className="flex h-8 w-8 items-center justify-center rounded-lg border border-border text-muted-foreground hover:bg-muted disabled:opacity-40 cursor-pointer"
              aria-label="Previous card"
            >
              <ChevronLeft className="h-4 w-4" />
            </button>
            <button
              type="button"
              onClick={() => setFlipped(f => !f)}
              className="flex h-8 items-center gap-1.5 rounded-lg border border-border px-3 text-xs font-medium text-muted-foreground hover:bg-muted cursor-pointer"
            >
              <RotateCcw className="h-3.5 w-3.5" />
              Flip
            </button>
            <button
              type="button"
              onClick={() => { setIndex(i => Math.min(cards.length - 1, i + 1)); setFlipped(false) }}
              disabled={index >= cards.length - 1}
              className="flex h-8 w-8 items-center justify-center rounded-lg border border-border text-muted-foreground hover:bg-muted disabled:opacity-40 cursor-pointer"
              aria-label="Next card"
            >
              <ChevronRight className="h-4 w-4" />
            </button>
          </div>

          {generationId && (
            <AiFeedbackBar
              workspaceId={workspaceId}
              surface="knowledge-cards"
              targetId={generationId}
              className="justify-center flex flex-col items-center"
            />
          )}
        </div>
      )}
    </div>
  )
}
