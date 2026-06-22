import type { Metadata } from 'next'
import Hero from '@/components/marketing/Hero'
import DashboardShowcaseSection from '@/components/marketing/sections/DashboardShowcaseSection'
import ValuePillarsSection from '@/components/marketing/sections/ValuePillarsSection'
import ContextLayerSection from '@/components/marketing/sections/ContextLayerSection'
import MaintainingPairSection from '@/components/marketing/sections/MaintainingPairSection'
import StaleResearchSection from '@/components/marketing/sections/StaleResearchSection'
import ReviewLoopSection from '@/components/marketing/sections/ReviewLoopSection'
import AiSearchTabsSection from '@/components/marketing/sections/AiSearchTabsSection'
import CitedAnswersSection from '@/components/marketing/sections/CitedAnswersSection'
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
      <DashboardShowcaseSection />
      <ValuePillarsSection />
      <ContextLayerSection />
      <MaintainingPairSection />
      <StaleResearchSection />
      <ReviewLoopSection />
      <AiSearchTabsSection />
      <CitedAnswersSection />
      <FaqSection />
      <ClosingCta />
    </>
  )
}
