'use client'

import { ChevronRight } from 'lucide-react'
import { Reveal } from '@/components/marketing/primitives/Reveal'
import { SectionLink } from '@/components/marketing/SectionLink'
import { InlineChatIcon } from '@/components/ui/inline-chat-icon'
import ExtensionDockSceneMock from '@/components/marketing/productMocks/ExtensionDockSceneMock'
import { mktBtnSecondary } from '@/components/marketing/marketingSurfaces'

const SITES = [
  { name: 'Wikipedia', letter: 'W' },
  { name: 'GitHub', letter: 'G' },
  { name: 'Medium', letter: 'M' },
  { name: 'arXiv', letter: 'A' },
  { name: 'Stack Overflow', letter: 'S' },
  { name: 'Notion', letter: 'N' },
  { name: 'Google Docs', letter: 'D' },
  { name: 'Reddit', letter: 'R' },
] as const

export default function StaleResearchSection() {
  return (
    <section className="relative overflow-hidden border-y border-[#E8DFD4] bg-[#FAF5EE] py-24 md:py-32">
      <div className="pointer-events-none absolute left-0 right-0 top-1/2 h-px -translate-y-1/2 bg-[#FDBA74]" aria-hidden />

      <div className="relative mx-auto max-w-6xl px-6 lg:px-10">
        <div className="grid items-center gap-12 lg:grid-cols-2">
          <Reveal className="text-center lg:text-left">
            <div className="mx-auto mb-6 flex h-12 w-12 items-center justify-center rounded-2xl bg-primary lg:mx-0">
              <InlineChatIcon size="md" variant="badge" className="text-white" />
            </div>
            <h2 className="text-balance text-3xl font-semibold tracking-tight text-[#1C1E26] md:text-[2.75rem] md:leading-[1.1]">
              Inline detects when your research goes stale
            </h2>
            <p className="mx-auto mt-5 max-w-xl text-base leading-relaxed text-muted-foreground lg:mx-0">
              The extension watches pages you annotate. When a source changes, it drafts an updated
              recap in the same Ask panel you already use — then routes it back for approval.
            </p>
            <SectionLink href="/#workspace" className={`mt-8 inline-flex items-center gap-1 ${mktBtnSecondary}`}>
              See how it works
              <ChevronRight className="h-4 w-4" aria-hidden />
            </SectionLink>

            <div className="mt-10 hidden flex-wrap gap-2 lg:flex">
              {SITES.map(site => (
                <span
                  key={site.name}
                  className="flex h-9 w-9 items-center justify-center rounded-xl border border-border bg-card text-xs font-bold text-foreground"
                  title={site.name}
                >
                  {site.letter}
                </span>
              ))}
            </div>
          </Reveal>

          <Reveal delay={0.08}>
            <ExtensionDockSceneMock showToolbar={false} className="mx-auto w-full max-w-lg lg:mx-0 lg:max-w-none" />
          </Reveal>
        </div>
      </div>
    </section>
  )
}
