'use client'

import Link from 'next/link'
import { ChevronRight } from 'lucide-react'
import { Reveal } from '@/components/marketing/primitives/Reveal'
import { WorkspaceDashboardPreviewMock } from '@/components/marketing/productMocks'
import { mktBtnSecondary } from '@/components/marketing/marketingSurfaces'

export default function ReviewLoopSection() {
  return (
    <section id="workspace" className="scroll-mt-24 overflow-hidden bg-[#FAF5EE] py-24 md:py-32">
      <div className="mx-auto max-w-6xl px-6 lg:px-10">
        <div className="grid items-start gap-10 lg:grid-cols-2 lg:gap-16">
          <Reveal>
            <h2 className="text-3xl font-semibold tracking-tight text-[#1C1E26] md:text-[2.75rem] md:leading-[1.1]">
              You always stay in the loop
            </h2>
          </Reveal>
          <Reveal delay={0.06}>
            <p className="text-base leading-relaxed text-muted-foreground">
              Inline drafts recap updates in the extension. You approve in the same Ask panel — then
              captures and recaps show up on your dashboard.
            </p>
            <Link href="/app/ws-1/dashboard" className={`mt-6 inline-flex items-center gap-1 ${mktBtnSecondary}`}>
              Open workspace
              <ChevronRight className="h-4 w-4" aria-hidden />
            </Link>
          </Reveal>
        </div>

        <Reveal delay={0.08} className="mt-14 w-full">
          <WorkspaceDashboardPreviewMock />
        </Reveal>
      </div>
    </section>
  )
}
