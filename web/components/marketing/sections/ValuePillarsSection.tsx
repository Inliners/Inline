'use client'

import { ChevronRight, Sparkles } from 'lucide-react'
import { Reveal } from '@/components/marketing/primitives/Reveal'
import { SectionLink } from '@/components/marketing/SectionLink'
import {
  DashboardCapturesMock,
  ExtensionRecapResultMock,
  WorkspaceChatMock,
} from '@/components/marketing/productMocks'
import { DEMO_BRIDGE_SOURCES } from '@/components/marketing/productMocks/sampleData'

const PILLARS = [
  {
    label: 'Capture context',
    labelColor: 'text-[#B45309]',
    title: 'Single source of truth for what you read',
    cta: 'Explore captures',
    href: '/#extension',
    mock: (
      <div className="mx-auto w-[108%] max-w-none overflow-hidden rounded-t-2xl border border-b-0 border-border bg-background px-3 pt-3">
        <p className="mb-2 px-1 text-sm font-semibold text-[#37352F]">Web Captures</p>
        <DashboardCapturesMock limit={2} size="compact" />
      </div>
    ),
  },
  {
    label: 'Keep connected',
    labelColor: 'text-[#C2410C]',
    title: 'Web memory goes stale. Yours doesn\u2019t.',
    cta: 'See auto-recaps',
    href: '/#workspace',
    mock: (
      <div className="mx-auto w-full max-w-[300px] translate-y-1">
        <ExtensionRecapResultMock elevated={false} compact className="w-full max-w-none" />
      </div>
    ),
  },
  {
    label: 'Find answers',
    labelColor: 'text-[#2563EB]',
    title: 'Ask AI across your saved web memory',
    cta: 'See it search',
    href: '/#rag',
    mock: (
      <div className="mx-auto w-[108%] overflow-hidden rounded-t-2xl border border-b-0 border-border bg-card p-4">
        <WorkspaceChatMock
          variant="conversation"
          dense
          scenario={{
            userMessage: 'What did I highlight about cable-stayed vs suspension bridges?',
            assistantMessage:
              'Cable-stayed towers take deck loads directly through stay cables [1], while suspension designs hang the deck from main cables [2].',
            sources: DEMO_BRIDGE_SOURCES.slice(0, 2),
          }}
        />
      </div>
    ),
  },
] as const

export default function ValuePillarsSection() {
  return (
    <section id="product" className="scroll-mt-24 bg-[#FDFBF7] py-24 md:py-32">
      <div className="mx-auto max-w-6xl px-6 lg:px-10">
        <Reveal className="text-center">
          <h2 className="text-balance text-3xl font-semibold tracking-tight text-[#1C1E26] md:text-[2.75rem] md:leading-[1.1]">
            Finally, a web memory layer that does its job
          </h2>
        </Reveal>

        <div className="mt-14 grid gap-5 md:grid-cols-3">
          {PILLARS.map((pillar, i) => (
            <Reveal key={pillar.label} delay={i * 0.08}>
              <article className="flex min-h-[420px] w-full flex-col overflow-hidden rounded-[1.75rem] border border-[#E8DFD4] bg-[#F5EDE3] md:aspect-2/3 md:min-h-0">
                <div className="flex shrink-0 flex-col items-center px-6 pb-4 pt-8 text-center md:px-7 md:pt-9">
                  <p className={`text-sm font-semibold ${pillar.labelColor}`}>{pillar.label}</p>
                  <h3 className="mt-3 max-w-[16rem] text-balance text-xl font-semibold leading-snug tracking-tight text-[#1C1E26]">
                    {pillar.title}
                  </h3>
                  <SectionLink
                    href={pillar.href}
                    className="mt-5 inline-flex items-center gap-1 rounded-full border border-[#1C1E26] px-4 py-1.5 text-sm font-medium text-[#1C1E26] transition-colors hover:bg-[#1C1E26] hover:text-white"
                  >
                    {pillar.cta}
                    <ChevronRight className="h-3.5 w-3.5" aria-hidden />
                  </SectionLink>
                </div>

                <div className="relative mt-auto min-h-[40%] overflow-hidden">
                  <div className="absolute inset-x-0 bottom-0 flex justify-center">{pillar.mock}</div>
                </div>
              </article>
            </Reveal>
          ))}
        </div>

        <Reveal delay={0.15} className="mt-10 flex justify-center">
          <p className="flex items-center gap-2 rounded-full border border-border bg-card px-5 py-2 text-sm text-muted-foreground">
            <Sparkles className="h-3.5 w-3.5 text-[#4B83C4]" aria-hidden />
            Capture on the page. Search in the workspace.
          </p>
        </Reveal>
      </div>
    </section>
  )
}
