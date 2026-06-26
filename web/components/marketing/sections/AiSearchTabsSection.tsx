'use client'

import { useState } from 'react'
import { FileSearch } from 'lucide-react'
import { Reveal } from '@/components/marketing/primitives/Reveal'
import WorkspaceChatMock, {
  type WorkspaceChatScenario,
} from '@/components/marketing/productMocks/WorkspaceChatMock'
import { DEMO_BRIDGE_SOURCES, DEMO_DOMAIN } from '@/components/marketing/productMocks/sampleData'
import { ProductVisualRing } from '@/components/marketing/primitives/ProductVisualRing'
import { formatDisplayTitle } from '@/lib/utils'

const SCENARIOS: { id: string; label: string; scenario: WorkspaceChatScenario }[] = [
  {
    id: 'research',
    label: 'Research question',
    scenario: {
      userMessage: 'What did I highlight about the main argument in this article?',
      assistantMessage:
        'You highlighted the core claim in the opening section [1], a supporting example in the middle [2], and a note tying it to another capture [3].',
      sources: DEMO_BRIDGE_SOURCES,
    },
  },
  {
    id: 'recap',
    label: 'Recap lookup',
    scenario: {
      userMessage: `Summarize everything I captured on the ${DEMO_DOMAIN} article.`,
      assistantMessage:
        'The article covers the main argument, supporting examples, and your sticky notes. Your auto-recap was last updated today and links four highlights from the page.',
      sources: DEMO_BRIDGE_SOURCES.slice(0, 2),
    },
  },
  {
    id: 'compare',
    label: 'Cross-page ask',
    scenario: {
      userMessage: `Compare what I saved across two pages on ${DEMO_DOMAIN}.`,
      assistantMessage:
        'One capture focuses on the introduction and definitions. Your other saves emphasize the supporting examples and notes you added in the margins.',
      sources: DEMO_BRIDGE_SOURCES,
      recencyNote: `Searching captures across ${DEMO_DOMAIN} in your workspace.`,
    },
  },
]

export default function AiSearchTabsSection() {
  const [active, setActive] = useState(SCENARIOS[0]!.id)
  const scenario = SCENARIOS.find(s => s.id === active)?.scenario ?? SCENARIOS[0]!.scenario

  return (
    <section id="rag" className="scroll-mt-24 bg-[#FDFBF7] py-16 sm:py-20 md:py-28 lg:py-32">
      <div className="mx-auto max-w-6xl px-6 text-center lg:px-10">
        <Reveal>
          <div className="mx-auto mb-6 flex h-12 w-12 items-center justify-center rounded-2xl border border-border bg-card">
            <FileSearch className="h-5 w-5 text-foreground" aria-hidden />
          </div>
          <h2 className="text-balance text-3xl font-semibold tracking-tight text-[#1C1E26] md:text-[2.75rem] md:leading-[1.1]">
            Answers that cite your captures — not the internet
          </h2>
          <p className="mx-auto mt-4 max-w-2xl text-base leading-relaxed text-muted-foreground">
            Ask in plain language. Every response points back to the highlights and notes that
            grounded it — so you can trust what you read.
          </p>
        </Reveal>

        <Reveal delay={0.06} className="mt-8 flex justify-center -mx-1 px-1">
          <div
            className="scrollbar-minimal inline-flex max-w-full flex-nowrap gap-1 overflow-x-auto rounded-full border border-border bg-muted p-1.5"
            role="tablist"
            aria-label="Search scenarios"
          >
            {SCENARIOS.map(s => (
              <button
                key={s.id}
                type="button"
                role="tab"
                aria-selected={active === s.id}
                onClick={() => setActive(s.id)}
                className={`shrink-0 rounded-full px-3.5 py-1.5 text-sm font-medium transition-colors ${
                  active === s.id
                    ? 'bg-card text-foreground shadow-sm'
                    : 'text-muted-foreground hover:text-foreground'
                }`}
              >
                {formatDisplayTitle(s.label)}
              </button>
            ))}
          </div>
        </Reveal>

        <Reveal delay={0.1} className="mt-10 text-left">
          <ProductVisualRing tone="burntOrange">
            <WorkspaceChatMock
              variant="panel"
              scenario={scenario}
              sessionTitle="Reading session"
              elevated={false}
            />
          </ProductVisualRing>
        </Reveal>
      </div>
    </section>
  )
}
