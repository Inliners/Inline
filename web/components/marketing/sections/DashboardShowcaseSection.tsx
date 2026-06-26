import { Reveal } from '@/components/marketing/primitives/Reveal'
import { ProductVisualRing } from '@/components/marketing/primitives/ProductVisualRing'
import WorkspaceDashboardHeroAnimated from '@/components/marketing/productMocks/WorkspaceDashboardHeroAnimated'

export default function DashboardShowcaseSection() {
  return (
    <section className="bg-[#FAF5EE] py-16 sm:py-20 md:py-28">
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
          <ProductVisualRing innerRadius="2xl" tone="navy">
            <div
              className="overflow-hidden rounded-2xl border border-border bg-white"
              aria-label="Inline workspace dashboard preview"
            >
              <WorkspaceDashboardHeroAnimated />
            </div>
          </ProductVisualRing>
        </Reveal>
      </div>
    </section>
  )
}
