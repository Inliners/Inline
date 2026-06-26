import { Reveal } from '@/components/marketing/primitives/Reveal'
import { ProductVisualRing } from '@/components/marketing/primitives/ProductVisualRing'
import WorkspaceDashboardHeroAnimated from '@/components/marketing/productMocks/WorkspaceDashboardHeroAnimated'

export default function DashboardShowcaseSection() {
  return (
    <section className="bg-[#FAF5EE] py-16 sm:py-20 md:py-28">
      <div className="mx-auto max-w-6xl px-6 lg:px-10">
        <Reveal className="text-center">
          <h2 className="text-balance text-3xl font-semibold tracking-tight text-[#1C1E26] md:text-[2.75rem] md:leading-[1.1]">
            Turn fifty tabs into one brief you trust
          </h2>
          <p className="mx-auto mt-4 max-w-2xl text-base leading-relaxed text-muted-foreground">
            You already read the pages. Inline pulls your highlights into a source-backed Auto-Recap
            — so research compounds instead of evaporating when you close the window.
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
