import type { ReactNode } from 'react'
import { Reveal } from '@/components/marketing/primitives/Reveal'
import RecapStatusCardAnimated from '@/components/marketing/productMocks/RecapStatusCardAnimated'
import ExtensionRefreshRoutineMockAnimated from '@/components/marketing/productMocks/ExtensionRefreshRoutineMockAnimated'
import { mkt } from '@/components/marketing/marketingSurfaces'
import { cn } from '@/lib/utils'

function PairCard({
  title,
  description,
  children,
  visualClassName,
  visualContainerClassName,
  bottomColor = mkt.espresso,
}: {
  title?: string
  description?: string
  children: ReactNode
  visualClassName?: string
  visualContainerClassName?: string
  bottomColor?: string
}) {
  return (
    <article className="relative flex h-full min-h-[480px] flex-col rounded-[1.75rem] border border-[#E8DFD4] sm:min-h-[520px]">
      <div
        className="pointer-events-none absolute inset-0 overflow-hidden rounded-[1.75rem]"
        aria-hidden
      >
        <div className="h-[75%]" style={{ backgroundColor: mkt.tan }} />
        <div className="h-[25%]" style={{ backgroundColor: bottomColor }} />
      </div>

      <div className="relative flex min-h-0 flex-[3] flex-col p-5 sm:p-6 md:p-8">
        {title && (
          <h3 className="text-xl font-semibold tracking-tight text-[#1C1E26] sm:text-2xl md:text-[1.75rem]">
            {title}
          </h3>
        )}
        {description && (
          <p className="mt-3 max-w-md text-sm leading-relaxed text-muted-foreground">{description}</p>
        )}
      </div>

      <div
        className={cn(
          'relative z-10 flex min-h-0 flex-1 flex-col items-center justify-end px-5 pb-5 sm:px-6 sm:pb-6 md:px-8 md:pb-8',
          visualContainerClassName,
        )}
      >
        <div className={cn('w-full max-w-[342px]', visualClassName)}>{children}</div>
      </div>
    </article>
  )
}

export default function MaintainingPairSection() {
  return (
    <section className="bg-[#FDFBF7] py-16 sm:py-20 md:py-28 lg:py-32">
      <div className="mx-auto max-w-6xl px-6 lg:px-10">
        <Reveal className="text-center">
          <h2 className="text-balance text-3xl font-semibold tracking-tight text-[#1C1E26] md:text-[2.75rem] md:leading-[1.1]">
            Briefs that update themselves as you read
          </h2>
          <p className="mx-auto mt-4 max-w-2xl text-base leading-relaxed text-muted-foreground">
            Every highlight feeds back into your page recap — so synthesis happens while you research,
            not after you&apos;ve forgotten why you cared.
          </p>
        </Reveal>

        <div className="mt-14 grid items-stretch gap-5 lg:grid-cols-2">
          <Reveal className="h-full">
            <PairCard
              title="Self-updating recap"
              description="New highlights and notes flow into your brief automatically — the summary always reflects what you actually captured."
              bottomColor={mkt.burntRed}
              visualContainerClassName="pt-5 sm:pt-6"
              visualClassName="translate-y-1 sm:translate-y-2"
            >
              <RecapStatusCardAnimated className="w-full shrink-0" />
            </PairCard>
          </Reveal>

          <Reveal delay={0.08} className="h-full">
            <PairCard
              title="You approve what saves"
              description="Review suggested recap changes before they land in your workspace — you stay in control of what compounds."
              visualClassName="translate-y-0 sm:translate-y-1"
            >
              <ExtensionRefreshRoutineMockAnimated className="w-full" />
            </PairCard>
          </Reveal>
        </div>
      </div>
    </section>
  )
}
