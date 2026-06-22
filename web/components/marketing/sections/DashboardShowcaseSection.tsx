import { Reveal } from '@/components/marketing/primitives/Reveal'
import WorkspaceDashboardHeroMock from '@/components/marketing/productMocks/WorkspaceDashboardHeroMock'

export default function DashboardShowcaseSection() {
  return (
    <section className="bg-[#FAF5EE] py-20 md:py-28">
      <div className="mx-auto max-w-6xl px-6 lg:px-10">
        <Reveal className="text-center">
          <h2 className="text-balance text-3xl font-semibold tracking-tight text-[#1C1E26] md:text-[2.75rem] md:leading-[1.1]">
            One workspace for everything you capture on the web
          </h2>
          <p className="mx-auto mt-4 max-w-2xl text-base leading-relaxed text-muted-foreground">
            Pinned captures, auto-recap library docs, analytics, and Ask Inline — the same dashboard
            chrome, navigation, and activity feed you get in the app.
          </p>
        </Reveal>

        <Reveal delay={0.08} className="mt-12 md:mt-14">
          <div
            className="overflow-hidden rounded-2xl border border-[#E8DFD4] bg-white"
            aria-label="Inline workspace dashboard preview"
          >
            <WorkspaceDashboardHeroMock compact />
          </div>
        </Reveal>
      </div>
    </section>
  )
}
