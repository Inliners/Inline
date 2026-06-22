import type { ReactNode } from 'react'
import { Check } from 'lucide-react'
import { Reveal } from '@/components/marketing/primitives/Reveal'
import ExtensionRefreshRoutineMock from '@/components/marketing/productMocks/ExtensionRefreshRoutineMock'

function PairCard({
  title,
  description,
  children,
}: {
  title: string
  description: string
  children: ReactNode
}) {
  return (
    <article className="flex h-full flex-col rounded-[1.75rem] border border-[#E8DFD4] bg-[#FAF5EE] p-6 md:p-8">
      <div className="shrink-0">
        <h3 className="text-2xl font-semibold tracking-tight text-[#1C1E26] md:text-[1.75rem]">
          {title}
        </h3>
        <p className="mt-3 max-w-md text-sm leading-relaxed text-muted-foreground">{description}</p>
      </div>
      <div className="mt-8 flex flex-1 flex-col items-center justify-between gap-5 w-full">{children}</div>
    </article>
  )
}

function RecapStatusCard() {
  return (
    <div className="w-full max-w-[342px] rounded-[10px] border border-border bg-card p-4">
      <span className="inline-flex items-center gap-1.5 rounded-full bg-muted px-2.5 py-1 text-[10px] font-medium text-foreground">
        <Check className="h-3 w-3 text-[#22C55E]" aria-hidden />
        Self-updating recap
      </span>
      <p className="mt-3 text-sm leading-relaxed text-foreground">
        Towers carry deck loads directly through stay cables. Your highlights note shorter construction
        time vs suspension designs.
      </p>
      <p className="mt-2 text-xs text-muted-foreground">Last updated today</p>
    </div>
  )
}

export default function MaintainingPairSection() {
  return (
    <section className="bg-[#FDFBF7] py-24 md:py-32">
      <div className="mx-auto max-w-6xl px-6 lg:px-10">
        <div className="grid items-stretch gap-5 lg:grid-cols-2">
          <Reveal className="h-full">
            <PairCard
              title="Recaps that maintain themselves"
              description="Every page recap uses the same extension panel — updated as you add highlights and notes."
            >
              <RecapStatusCard />
            </PairCard>
          </Reveal>

          <Reveal delay={0.08} className="h-full">
            <PairCard
              title="Run refresh routines on your captures"
              description="Review suggested recap changes in the extension before anything saves to your workspace."
            >
              <ExtensionRefreshRoutineMock className="w-full max-w-[342px]" />
            </PairCard>
          </Reveal>
        </div>
      </div>
    </section>
  )
}
