'use client'

import { ChevronRight } from 'lucide-react'
import { Reveal } from '@/components/marketing/primitives/Reveal'
import { SectionLink } from '@/components/marketing/SectionLink'
import { InlineChatIcon } from '@/components/ui/inline-chat-icon'
import ExtensionDockSceneAnimated from '@/components/marketing/productMocks/ExtensionDockSceneAnimated'
import { mktBtnSecondary } from '@/components/marketing/marketingSurfaces'

export default function StaleResearchSection() {
  return (
    <section className="relative overflow-hidden border-y border-[#E8DFD4] bg-[#FAF5EE] py-16 sm:py-20 md:py-28 lg:py-32">

      <div className="relative mx-auto max-w-6xl px-6 lg:px-10">
        <div className="grid items-center gap-12 lg:grid-cols-2">
          <Reveal className="text-center lg:text-left">
            <InlineChatIcon
              size="lg"
              variant="badge"
              className="mx-auto mb-6 h-12 w-12 rounded-2xl lg:mx-0 [&_svg]:h-5 [&_svg]:w-5"
            />
            <h2 className="text-balance text-3xl font-semibold tracking-tight text-[#1C1E26] md:text-[2.75rem] md:leading-[1.1]">
              Research goes stale the moment you stop reading
            </h2>
            <p className="mx-auto mt-5 max-w-xl text-base leading-relaxed text-muted-foreground lg:mx-0">
              You meant to come back. Inline watches pages you annotate and drafts an updated brief
              when the source changes — so your notes reflect reality, not a snapshot from last week.
            </p>
            <SectionLink href="/#workspace" className={`mt-8 inline-flex items-center gap-1 ${mktBtnSecondary}`}>
              See how it works
              <ChevronRight className="h-4 w-4" aria-hidden />
            </SectionLink>
          </Reveal>

          <Reveal delay={0.08}>
            <ExtensionDockSceneAnimated className="mx-auto w-full lg:mx-0" />
          </Reveal>
        </div>
      </div>
    </section>
  )
}
