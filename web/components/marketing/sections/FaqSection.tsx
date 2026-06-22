import { Reveal, SectionHeading } from '@/components/marketing/primitives/Reveal'
import { mktCardSolid } from '@/components/marketing/marketingSurfaces'

/**
 * #faq — native <details>/<summary> accordion: keyboard accessible, no JS,
 * works with reduced motion by default.
 */

const FAQS: { q: string; a: string }[] = [
  {
    q: 'What is Inline?',
    a: 'Inline is a browser-native AI memory layer: a Chrome extension that lets you highlight, write, draw, rewrite, and ask AI on any webpage, paired with a web workspace that organizes every capture into searchable history, documents, analytics, a map, and a knowledge graph.',
  },
  {
    q: 'Does it work on any webpage?',
    a: 'The extension runs on standard web pages over http and https. It renders inside an isolated Shadow DOM so it doesn\u2019t collide with page styles. Browser-internal pages (like chrome:// pages and the Web Store) don\u2019t allow extensions to run. You can also disable Inline on specific sites.',
  },
  {
    q: 'How does AI search work?',
    a: 'When you save captures and documents, Inline indexes that content inside your account. When you ask a question, it finds the most relevant saved context in your workspace and answers only from those sources. Answers include source cards, and the panel clearly says when it is answering from recent captures only.',
  },
  {
    q: 'Where are my annotations stored?',
    a: 'Annotations are saved per page to a Postgres database via Supabase, protected by row-level security so only your account can read or write them. They are mirrored into your workspace history and restored when you revisit the page.',
  },
  {
    q: 'Is the ElevenLabs (read aloud) integration secure?',
    a: 'Yes. The ElevenLabs API key lives only on the server. Read-aloud requests go through an authenticated server-side proxy with rate limiting and a voice whitelist — the key is never present in the extension, your browser, or any client storage.',
  },
  {
    q: 'What happens if AI or text-to-speech fails?',
    a: 'Features degrade visibly, not silently. If the AI service is unavailable you get a clear error message in the chat or panel. If cloud text-to-speech fails, Inline automatically falls back to your browser\u2019s built-in voice and tells you it did.',
  },
  {
    q: 'Can I use the dashboard without the extension?',
    a: 'Yes. The workspace works on its own — you can write library documents, organize folders, search, and chat with the AI over anything already captured. The extension is what feeds new captures in from the pages you read.',
  },
]

export default function FaqSection() {
  return (
    <section id="faq" className="scroll-mt-24 bg-[#EFE8DC] py-24 md:py-32">
      <div className="mx-auto max-w-3xl px-6 lg:px-10">
        <SectionHeading eyebrow="FAQ" title="Questions, answered plainly" />
        <Reveal className="mt-12" delay={0.08}>
          <div className={`divide-y divide-[#d6d3d1] ${mktCardSolid}`}>
            {FAQS.map(f => (
              <details key={f.q} className="group px-6 py-4 open:bg-[#F4F4F2]/60">
                <summary className="flex cursor-pointer list-none items-center justify-between gap-4 text-sm font-semibold text-[#1C1E26] [&::-webkit-details-marker]:hidden">
                  {f.q}
                  <span
                    className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full border border-[#d6d3d1] text-[#78716c] transition-transform group-open:rotate-45"
                    aria-hidden
                  >
                    +
                  </span>
                </summary>
                <p className="mt-3 pr-10 text-sm leading-relaxed text-stone-600">{f.a}</p>
              </details>
            ))}
          </div>
        </Reveal>
      </div>
    </section>
  )
}
