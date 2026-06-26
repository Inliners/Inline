'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { cn } from '@/lib/utils'
import type { KnowledgeTopic } from './KnowledgeCardDeck'

const TOPIC_LABELS: Record<KnowledgeTopic, string> = {
  interview: 'Interview',
  concepts: 'Concepts',
  connections: 'Connections',
  gaps: 'Gaps',
}

interface Props {
  studyPlanHref: (topic: KnowledgeTopic) => string
}

export default function TestKnowledgePromo({ studyPlanHref }: Props) {
  const router = useRouter()
  const [topic, setTopic] = useState<KnowledgeTopic>('interview')

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
        onClick={() => router.push(studyPlanHref(topic))}
        className="inline-flex items-center gap-2 rounded-lg bg-primary px-4 py-2 text-sm font-medium text-primary-foreground hover:opacity-90 transition-opacity cursor-pointer"
      >
        Test my knowledge
      </button>
    </div>
  )
}
