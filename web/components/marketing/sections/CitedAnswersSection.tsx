import type { ReactNode } from 'react'
import { ChevronRight, Lock } from 'lucide-react'
import { Reveal } from '@/components/marketing/primitives/Reveal'
import { SectionLink } from '@/components/marketing/SectionLink'
import { SourceCardRow } from '@/components/shell/SourceCard'
import WorkspaceChatMock from '@/components/marketing/productMocks/WorkspaceChatMock'
import { ExtensionAskHeaderMock } from '@/components/marketing/productMocks/ExtensionRecapResultMock'
import {
  DEMO_BRIDGE_SOURCES,
  DEMO_DOMAIN,
  DEMO_TOP_DOMAINS,
  DEMO_WORKSPACE_ID,
} from '@/components/marketing/productMocks/sampleData'
import { cn } from '@/lib/utils'
import { mktBtnGhost } from '@/components/marketing/marketingSurfaces'

const DOMAINS = DEMO_TOP_DOMAINS

const SOURCE_CARD_WIDTH =
  '[--source-card-mobile-width:min(11rem,calc(100vw-6rem))] [&_.scrollbar-minimal>*]:w-[var(--source-card-mobile-width)] md:[&_.scrollbar-minimal>*]:w-40'

/** White product mock — inset to match tan frame padding on every card. */
const MOCK_SHELL_INNER =
  'flex w-full max-h-full flex-col overflow-x-hidden overflow-y-auto rounded-t-2xl border border-b-0 border-border bg-card px-2.5 pt-5 pb-3 sm:px-3 sm:pt-6 sm:pb-3.5'

const CARD_HEIGHT = {
  short: 'min-h-[190px] sm:min-h-[210px]',
  medium: 'min-h-[250px] sm:min-h-[270px]',
  tall: 'min-h-[300px] sm:min-h-[320px]',
} as const

type CardHeight = keyof typeof CARD_HEIGHT

/** White mock anchored to the bottom of the tan frame with a tiered height. */
function mockInsetShell(height: CardHeight, children: ReactNode) {
  return (
    <div className="flex w-full shrink-0 flex-col px-3">
      <div className={cn(MOCK_SHELL_INNER, CARD_HEIGHT[height])}>{children}</div>
    </div>
  )
}

/** Tan outer frame — same height for every card in the row. */
const ARTICLE_SHELL = 'flex h-full min-h-[420px] w-full flex-col overflow-hidden rounded-[1.75rem] border border-[#E8DFD4] bg-[#F5EDE3] sm:min-h-[460px]'

const CARDS: {
  label: string
  labelColor: string
  title: string
  cta: string
  href: '/#rag'
  height: CardHeight
  mock: ReactNode
}[] = [
  {
    label: 'Source citations',
    labelColor: 'text-[#2563EB]',
    title: 'Citations from your captures — not the open web',
    cta: 'See citations',
    href: '/#rag',
    height: 'medium',
    mock: mockInsetShell(
      'medium',
      <>
        <WorkspaceChatMock
          dense
          variant="conversation"
          className="shrink-0"
          scenario={{
            userMessage: 'What did I save about the main argument?',
            assistantMessage:
              'Your highlights cover the core claim [1]. Your recap adds context from a sticky note [2].',
            sources: DEMO_BRIDGE_SOURCES.slice(0, 2),
          }}
        />
        <div className={cn('mt-1.5 min-w-0 shrink-0', SOURCE_CARD_WIDTH)}>
          <SourceCardRow
            sources={DEMO_BRIDGE_SOURCES.slice(0, 2)}
            workspaceId={DEMO_WORKSPACE_ID}
          />
        </div>
      </>,
    ),
  },
  {
    label: 'Cross-page',
    labelColor: 'text-[#C2410C]',
    title: 'Answers across every capture on a site',
    cta: 'Try cross-page ask',
    href: '/#rag',
    height: 'tall',
    mock: mockInsetShell(
      'tall',
      <>
        <ExtensionAskHeaderMock
          subtitle="Across this site"
          iconSize="sm"
          showClose={false}
          className="-mx-2.5 -mt-5 mb-2 px-2.5 pb-2.5 pt-4 sm:-mx-3 sm:-mt-6 sm:px-3"
        />
        <WorkspaceChatMock
          dense
          variant="conversation"
          className="shrink-0"
          scenario={{
            userMessage: `Compare what I saved on ${DEMO_DOMAIN}.`,
            assistantMessage:
              'One capture covers the introduction and definitions [1]. A second save emphasizes supporting examples [2].',
            sources: DEMO_BRIDGE_SOURCES.slice(0, 2),
            recencyNote: `Searching captures across ${DEMO_DOMAIN} in your workspace.`,
          }}
        />
        <div className={cn('mt-1.5 min-w-0 shrink-0', SOURCE_CARD_WIDTH)}>
          <SourceCardRow
            sources={DEMO_BRIDGE_SOURCES.slice(0, 2)}
            workspaceId={DEMO_WORKSPACE_ID}
          />
        </div>
      </>,
    ),
  },
  {
    label: 'Workspace only',
    labelColor: 'text-[#B45309]',
    title: 'Semantic search scoped to you',
    cta: 'How scope works',
    href: '/#rag',
    height: 'short',
    mock: mockInsetShell(
      'short',
      <>
        <p className="text-[10px] font-semibold uppercase tracking-wider text-muted-foreground">
          Retrieval scope
        </p>
        <div className="mt-1.5 w-full space-y-1.5 text-xs">
          <div className="flex items-center justify-between gap-3">
            <span className="text-foreground">Your workspace</span>
            <span className="shrink-0 text-[#22C55E]">Full access</span>
          </div>
          <div className="flex items-center justify-between gap-3 text-muted-foreground">
            <span>Other workspaces</span>
            <span className="flex shrink-0 items-center gap-1">
              <Lock className="h-3 w-3" aria-hidden />
              No access
            </span>
          </div>
        </div>
        <div className={cn('mt-2 min-w-0 shrink-0', SOURCE_CARD_WIDTH)}>
          <SourceCardRow sources={[DEMO_BRIDGE_SOURCES[0]!]} workspaceId={DEMO_WORKSPACE_ID} />
        </div>
      </>,
    ),
  },
]

export default function CitedAnswersSection() {
  return (
    <section className="bg-[#FDFBF7] py-16 sm:py-20 md:py-28 lg:py-32">
      <div className="mx-auto max-w-6xl px-6 lg:px-10">
        <Reveal className="text-center">
          <h2 className="text-balance text-3xl font-semibold tracking-tight text-[#1C1E26] md:text-[2.75rem] md:leading-[1.1]">
            Every answer points back to a source you saved
          </h2>
        </Reveal>

        <Reveal delay={0.06} className="mt-8 flex justify-center">
          <SectionLink
            href="/#rag"
            className={cn('gap-1', mktBtnGhost)}
          >
            Explore AI search
            <ChevronRight className="h-4 w-4" aria-hidden />
          </SectionLink>
        </Reveal>

        <Reveal delay={0.08} className="mt-8">
          <div className="flex flex-wrap items-center justify-center gap-1.5 sm:gap-2">
            {DOMAINS.map(domain => (
              <span
                key={domain}
                className="rounded-lg border border-border bg-card px-2 py-1 text-[10px] font-medium text-muted-foreground sm:px-3 sm:py-1.5 sm:text-xs"
              >
                {domain}
              </span>
            ))}
          </div>
        </Reveal>

        <div className="mt-14 grid min-w-0 gap-5 xl:grid-cols-3 xl:items-stretch">
          {CARDS.map((card, i) => (
            <Reveal key={card.label} delay={0.1 + i * 0.04} className="flex min-h-0 min-w-0 h-full">
              <article className={ARTICLE_SHELL}>
                <div className="flex shrink-0 flex-col items-center px-6 pb-4 pt-8 text-center md:px-7 md:pt-9">
                  <p className={cn('text-sm font-semibold', card.labelColor)}>{card.label}</p>
                  <h3 className="mt-3 max-w-[16rem] text-balance text-lg font-semibold leading-snug tracking-tight text-[#1C1E26] sm:text-xl">
                    {card.title}
                  </h3>
                  <SectionLink
                    href={card.href}
                    className={cn('mt-5 gap-1', mktBtnGhost)}
                  >
                    {card.cta}
                    <ChevronRight className="h-3.5 w-3.5" aria-hidden />
                  </SectionLink>
                </div>

                <div className="mt-auto flex w-full shrink-0 flex-col justify-end overflow-hidden">
                  {card.mock}
                </div>
              </article>
            </Reveal>
          ))}
        </div>
      </div>
    </section>
  )
}
