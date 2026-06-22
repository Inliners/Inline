'use client'

import { useState } from 'react'
import { FileSearch } from 'lucide-react'
import { Reveal } from '@/components/marketing/primitives/Reveal'
import WorkspaceChatMock, {
  type WorkspaceChatScenario,
} from '@/components/marketing/productMocks/WorkspaceChatMock'
import { DEMO_BRIDGE_SOURCES } from '@/components/marketing/productMocks/sampleData'

const SCENARIOS: { id: string; label: string; scenario: WorkspaceChatScenario }[] = [
  {
    id: 'research',
    label: 'Research question',
    scenario: {
      userMessage:
        'What did I highlight about cable-stayed vs suspension bridge load distribution?',
      assistantMessage:
        'You highlighted that cable-stayed towers take deck loads directly through stay cables [1], while suspension designs hang the deck from main cables anchored at both ends [2]. Your recap adds that cable-stayed construction is typically faster [3].',
      sources: DEMO_BRIDGE_SOURCES,
    },
  },
  {
    id: 'recap',
    label: 'Recap lookup',
    scenario: {
      userMessage: 'Summarize everything I captured on the bridge engineering article.',
      assistantMessage:
        'The article covers load paths, tower geometry, and construction trade-offs. Your auto-recap was last updated today and links four highlights and two sticky notes from the page.',
      sources: DEMO_BRIDGE_SOURCES.slice(0, 2),
    },
  },
  {
    id: 'compare',
    label: 'Cross-page ask',
    scenario: {
      userMessage:
        'Compare what I saved about bridges across Wikipedia and the engineering article.',
      assistantMessage:
        'Wikipedia captures focus on suspension mechanics — decks hanging from anchored cables. Your engineering article highlights emphasize cable-stayed towers carrying loads directly, with a shorter construction timeline.',
      sources: DEMO_BRIDGE_SOURCES,
      recencyNote: 'Searching captures across 2 domains in your workspace.',
    },
  },
]

export default function AiSearchTabsSection() {
  const [active, setActive] = useState(SCENARIOS[0]!.id)
  const scenario = SCENARIOS.find(s => s.id === active)?.scenario ?? SCENARIOS[0]!.scenario

  return (
    <section id="rag" className="scroll-mt-24 bg-[#FDFBF7] py-24 md:py-32">
      <div className="mx-auto max-w-6xl px-6 text-center lg:px-10">
        <Reveal>
          <div className="mx-auto mb-6 flex h-12 w-12 items-center justify-center rounded-2xl border border-border bg-card">
            <FileSearch className="h-5 w-5 text-foreground" aria-hidden />
          </div>
          <h2 className="text-balance text-3xl font-semibold tracking-tight text-[#1C1E26] md:text-[2.75rem] md:leading-[1.1]">
            The real workspace chat — grounded in your captures
          </h2>
          <p className="mx-auto mt-4 max-w-2xl text-base leading-relaxed text-muted-foreground">
            Same panel, bubbles, and source cards you get in the app. Every answer cites what was
            actually retrieved from your workspace.
          </p>
        </Reveal>

        <Reveal delay={0.06} className="mt-8">
          <div
            className="inline-flex max-w-full flex-wrap justify-center gap-1 rounded-full border border-border bg-muted p-1"
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
                className={`rounded-full px-4 py-1.5 text-sm font-medium transition-colors ${
                  active === s.id
                    ? 'bg-card text-foreground'
                    : 'text-muted-foreground hover:text-foreground'
                }`}
              >
                {s.label}
              </button>
            ))}
          </div>
        </Reveal>

        <Reveal delay={0.1} className="mt-10 text-left">
          <WorkspaceChatMock
            variant="panel"
            scenario={scenario}
            sessionTitle="Bridge research"
            elevated={false}
          />
        </Reveal>
      </div>
    </section>
  )
}
