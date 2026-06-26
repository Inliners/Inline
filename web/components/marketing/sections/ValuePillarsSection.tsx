'use client'

import { ChevronRight } from 'lucide-react'
import { Reveal, SectionHeading } from '@/components/marketing/primitives/Reveal'
import { SectionLink } from '@/components/marketing/SectionLink'
import {
  DashboardCapturesMock,
  ExtensionRecapResultMock,
  WorkspaceChatMock,
} from '@/components/marketing/productMocks'
import { DEMO_BRIDGE_SOURCES } from '@/components/marketing/productMocks/sampleData'
import { cn } from '@/lib/utils'
import { mktBtnGhost } from '@/components/marketing/marketingSurfaces'

const PILLARS = [
  {
    label: 'Stop hoarding',
    labelColor: 'text-[#B45309]',
    title: 'Captures that stay attached to where you found them',
    cta: 'Explore captures',
    href: '/#extension',
    mockSlot: 'min-h-[200px] md:min-h-[220px]',
    mock: (
      <div className="ml-auto mr-0 w-full max-w-none translate-x-[10px] overflow-hidden rounded-t-2xl border border-b-0 border-border bg-background px-3 pt-3 pr-4 sm:translate-x-3 xl:w-[104%]">
        <p className="mb-2 px-1 text-sm font-semibold text-[#37352F]">Web Captures</p>
        <DashboardCapturesMock limit={2} size="compact" />
      </div>
    ),
  },
  {
    label: 'Start synthesizing',
    labelColor: 'text-[#C2410C]',
    title: 'Scattered reading becomes a brief you can actually use',
    cta: 'See auto-recaps',
    href: '/#workspace',
    mockSlot: 'min-h-[300px] flex-1 md:min-h-[340px]',
    mock: (
      <div className="flex h-full w-full flex-col px-3">
        <ExtensionRecapResultMock
          elevated={false}
          compact
          className="h-full min-h-[300px] w-full max-w-none rounded-b-none border-b-0 md:min-h-[340px]"
        />
      </div>
    ),
  },
  {
    label: 'Get answers',
    labelColor: 'text-[#2563EB]',
    title: 'Ask questions grounded in what you saved — not what the model guessed',
    cta: 'See it search',
    href: '/#rag',
    mockSlot: 'min-h-[280px] md:min-h-[300px]',
    // Card position: anchored right with a fixed nudge — change only when requested
    mock: (
      <div className="ml-auto mr-0 flex min-h-[240px] w-full max-w-none translate-x-[10px] flex-col overflow-hidden rounded-t-2xl border border-b-0 border-border bg-card py-4 pl-3 pr-5 sm:min-h-[280px] sm:translate-x-3 md:min-h-[300px] xl:w-[104%]">
        <WorkspaceChatMock
          variant="conversation"
          dense
          userEndInset="pr-3"
          className="flex min-h-0 flex-1 flex-col"
          scenario={{
            userMessage: 'How do these two articles compare?',
            assistantMessage:
              'Your highlights on the pricing page [1] and the product blog [2] point to the same tension — here\u2019s how they differ.',
            assistantMessageLgLines: [
              'Your highlights emphasize the core claim in',
              'paragraph two [1].',
            ],
            sources: DEMO_BRIDGE_SOURCES.slice(0, 1),
          }}
        />
      </div>
    ),
  },
] as const

export default function ValuePillarsSection() {
  return (
    <section id="product" className="scroll-mt-24 bg-[#FDFBF7] py-16 sm:py-20 md:py-28 lg:py-32">
      <div className="mx-auto max-w-6xl px-6 lg:px-10">
        <SectionHeading
          eyebrow="The quiet problem"
          title="More tabs isn\u2019t more progress"
        />

        <div className="mt-14 grid min-w-0 gap-5 xl:grid-cols-3">
          {PILLARS.map((pillar, i) => (
            <Reveal key={pillar.label} delay={i * 0.08} className="min-w-0">
              <article className="flex min-h-0 min-w-0 w-full flex-col overflow-hidden rounded-[1.75rem] border border-[#E8DFD4] bg-[#F5EDE3] sm:min-h-[380px] xl:aspect-2/3">
                <div className="flex shrink-0 flex-col items-center px-6 pb-4 pt-8 text-center md:px-7 md:pt-9">
                  <p className={`text-sm font-semibold ${pillar.labelColor}`}>{pillar.label}</p>
                  <h3 className="mt-3 max-w-[16rem] text-balance text-lg font-semibold leading-snug tracking-tight text-[#1C1E26] sm:text-xl">
                    {pillar.title}
                  </h3>
                  <SectionLink
                    href={pillar.href}
                    className={cn('mt-5 gap-1', mktBtnGhost)}
                  >
                    {pillar.cta}
                    <ChevronRight className="h-3.5 w-3.5" aria-hidden />
                  </SectionLink>
                </div>

                <div
                  className={cn(
                    'mt-auto flex w-full flex-col justify-end',
                    pillar.mockSlot,
                  )}
                >
                  {pillar.mock}
                </div>
              </article>
            </Reveal>
          ))}
        </div>
      </div>
    </section>
  )
}
