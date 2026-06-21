import { ServerCog, ShieldCheck, KeyRound, UserCheck, Quote } from 'lucide-react'
import { Reveal, SectionHeading } from '@/components/marketing/primitives/Reveal'

/**
 * #security — concrete, implementation-level claims only. Each point maps to
 * real behavior in the codebase (server-side proxies, Supabase RLS,
 * user-scoped retrieval, server-built citations).
 */

const POINTS = [
  {
    icon: ServerCog,
    title: 'Server-side AI and voice',
    body: 'Every Gemini and ElevenLabs call runs through authenticated server routes. Your browser and the extension never talk to AI providers directly.',
  },
  {
    icon: KeyRound,
    title: 'No keys in your browser',
    body: 'Provider API keys exist only in the server environment. Nothing is shipped in the extension bundle, stored in localStorage, or sent through extension messages.',
  },
  {
    icon: ShieldCheck,
    title: 'Row-level security on workspace data',
    body: 'Notes, documents, annotations, and embeddings are protected by Supabase row-level security policies tied to your account.',
  },
  {
    icon: UserCheck,
    title: 'User-scoped retrieval',
    body: 'Semantic search runs as you, filtered to your workspace. One user\u2019s captures can never surface in another\u2019s answers.',
  },
  {
    icon: Quote,
    title: 'Source-grounded answers',
    body: 'Citations are built server-side from what was actually retrieved. The UI never renders a source the server didn\u2019t return.',
  },
]

export default function SecuritySection() {
  return (
    <section id="security" className="scroll-mt-24 bg-white py-24 md:py-32">
      <div className="mx-auto max-w-6xl px-6 lg:px-10">
        <SectionHeading
          eyebrow="Security & privacy"
          title="Built to keep your research yours"
          lede="No vague promises — here is exactly how Inline handles your data and credentials."
        />
        <div className="mt-12 grid gap-4 md:grid-cols-2 lg:grid-cols-3">
          {POINTS.map((p, i) => (
            <Reveal key={p.title} delay={i * 0.05} className={i === 0 ? 'md:col-span-2 lg:col-span-1' : ''}>
              <div className="h-full rounded-2xl border border-stone-200/80 bg-white p-6">
                <div className="mb-4 flex h-9 w-9 items-center justify-center rounded-xl bg-[#0B1735] text-[#B5CDEF]">
                  <p.icon className="h-4.5 w-4.5" aria-hidden />
                </div>
                <h3 className="text-sm font-semibold text-[#1C1E26]">{p.title}</h3>
                <p className="mt-2 text-sm leading-relaxed text-stone-600">{p.body}</p>
              </div>
            </Reveal>
          ))}
        </div>
      </div>
    </section>
  )
}
