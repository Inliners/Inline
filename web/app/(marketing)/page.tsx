import type { Metadata } from 'next'
import Hero from '@/components/marketing/Hero'
import ProblemSolution from '@/components/marketing/sections/ProblemSolution'
import ExtensionShowcase from '@/components/marketing/sections/ExtensionShowcase'
import WorkspaceShowcase from '@/components/marketing/sections/WorkspaceShowcase'
import RagSection from '@/components/marketing/sections/RagSection'
import FeatureBento from '@/components/marketing/sections/FeatureBento'
import SecuritySection from '@/components/marketing/sections/SecuritySection'
import CredibilitySection from '@/components/marketing/sections/CredibilitySection'
import FaqSection from '@/components/marketing/sections/FaqSection'
import ClosingCta from '@/components/marketing/sections/ClosingCta'

export const metadata: Metadata = {
  title: 'Inline — Your memory layer for the web',
  description:
    'Capture context directly on the web. Turn highlights, notes, drawings, rewrites, and page recaps into a searchable AI workspace.',
}

export default function HomePage() {
  return (
    <>
      <Hero />
      <ProblemSolution />
      <ExtensionShowcase />
      <WorkspaceShowcase />
      <RagSection />
      <FeatureBento />
      <SecuritySection />
      <CredibilitySection />
      <FaqSection />
      <ClosingCta />
    </>
  )
}
