'use client'

import Link from 'next/link'
import { ChevronRight } from 'lucide-react'
import { Reveal } from '@/components/marketing/primitives/Reveal'
import { ProductVisualRing } from '@/components/marketing/primitives/ProductVisualRing'
import { WorkspaceDocumentsPreviewMock } from '@/components/marketing/productMocks'
import { mktBtnSecondary } from '@/components/marketing/marketingSurfaces'
import { DEFAULT_WORKSPACES } from '@/lib/workspaces'
import { workspacePath } from '@/lib/workspace-routes'

const WORKSPACE_HOME = workspacePath(DEFAULT_WORKSPACES[0]!, 'dashboard')

export default function ReviewLoopSection() {
  return (
    <section id="workspace" className="scroll-mt-24 overflow-hidden bg-[#FAF5EE] py-16 sm:py-20 md:py-28 lg:py-32">
      <div className="mx-auto max-w-6xl px-6 lg:px-10">
        <Reveal className="max-w-2xl lg:max-w-none">
          <h2 className="text-3xl font-semibold tracking-tight text-[#1C1E26] md:text-[2.75rem] md:leading-[1.1]">
            Nothing saves without your say-so
          </h2>
          <p className="mt-5 text-base leading-relaxed text-muted-foreground lg:mt-0">
            Inline drafts recap updates as you read. You approve in the extension — then captures and
            briefs show up as library documents you can search and build on.
          </p>
          <Link href={WORKSPACE_HOME} className={`mt-6 inline-flex items-center gap-1 ${mktBtnSecondary}`}>
            Open workspace
            <ChevronRight className="h-4 w-4" aria-hidden />
          </Link>
        </Reveal>

        <Reveal delay={0.08} className="mt-10 w-full md:mt-14">
          <ProductVisualRing innerRadius="2xl" tone="burntRed">
            <WorkspaceDocumentsPreviewMock />
          </ProductVisualRing>
        </Reveal>
      </div>
    </section>
  )
}
