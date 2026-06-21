import { Award, Presentation, GraduationCap } from 'lucide-react'
import { Reveal, SectionHeading } from '@/components/marketing/primitives/Reveal'

/**
 * Project credibility. Wording is deliberately precise: Inline was built in a
 * program, won a named award, and was demoed to industry representatives —
 * none of these organizations are customers, sponsors, or endorsers.
 */

const MILESTONES = [
  {
    icon: GraduationCap,
    title: 'Built through the INIT FIU Build Program',
    body: 'Inline was developed end-to-end — extension, workspace, and AI pipeline — as part of INIT\u2019s build program at Florida International University.',
  },
  {
    icon: Award,
    title: 'Recognized as a unique project',
    body: 'Inline received a judged showcase award for its extension, workspace, and retrieval experience.',
  },
  {
    icon: Presentation,
    title: 'Demoed live to industry representatives',
    body: 'The working prototype was presented live to a panel of industry guests and technical reviewers.',
  },
]

export default function CredibilitySection() {
  return (
    <section className="bg-white py-24 md:py-28 border-y border-stone-200/60">
      <div className="mx-auto max-w-6xl px-6 lg:px-10">
        <SectionHeading
          eyebrow="The project"
          title="A prototype that earned its demo"
        />
        <div className="mt-12 grid gap-4 md:grid-cols-3">
          {MILESTONES.map((m, i) => (
            <Reveal key={m.title} delay={i * 0.06}>
              <div className="h-full rounded-2xl border border-stone-200/80 bg-white p-6 text-center">
                <div className="mx-auto mb-4 flex h-10 w-10 items-center justify-center rounded-full border border-[#C9DAF0] bg-[#EBF1F7] text-[#4B83C4]">
                  <m.icon className="h-4.5 w-4.5" aria-hidden />
                </div>
                <h3 className="text-sm font-semibold text-[#1C1E26]">{m.title}</h3>
                <p className="mt-2 text-sm leading-relaxed text-stone-600">{m.body}</p>
              </div>
            </Reveal>
          ))}
        </div>
        <Reveal delay={0.15}>
          <p className="mt-6 text-center text-xs text-stone-400">
            Program guests and reviewers are not customers, sponsors, or users of Inline.
          </p>
        </Reveal>
      </div>
    </section>
  )
}
