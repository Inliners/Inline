import { InlineChatIcon } from '@/components/ui/inline-chat-icon'
import { Database, SearchCheck, Quote, FileStack } from 'lucide-react'
import { Reveal, SectionHeading } from '@/components/marketing/primitives/Reveal'
import { mktPanelMock } from '@/components/marketing/marketingSurfaces'

/**
 * #rag — explains the real retrieval pipeline that ships in the product:
 * captures and recaps are chunked + embedded into pgvector, questions run
 * semantic search scoped to your workspace, and answers cite their sources.
 */

const PIPELINE = [
  {
    icon: FileStack,
    title: 'Your captures become the corpus',
    body: 'Notes, highlights, clips, page recaps, and library documents are chunked and embedded as you save them.',
  },
  {
    icon: Database,
    title: 'Stored in your space only',
    body: 'Embeddings live in Postgres with pgvector, row-level secured to your account and workspace.',
  },
  {
    icon: SearchCheck,
    title: 'Semantic retrieval per question',
    body: 'Each question is embedded and matched against your workspace by meaning, not keywords.',
  },
  {
    icon: Quote,
    title: 'Answers point back to the source',
    body: 'The model can only cite retrieved sources. The UI shows source cards you can open — and says so honestly when nothing matches.',
  },
]

function ChatMock() {
  return (
    <div className={`relative w-full ${mktPanelMock}`}>
      <div className="flex items-center gap-2 border-b border-[#d6d3d1]/60 px-4 py-2.5">
        <InlineChatIcon size="sm" variant="badge" />
        <span className="text-xs font-semibold text-[#1C1E26]">Ask Inline</span>
        <span className="ml-auto rounded-full bg-[#F4F4F2] px-2 py-0.5 font-mono text-[9px] text-[#78716c]">
          ws-research
        </span>
      </div>
      <div className="space-y-3 px-4 py-4">
        <p className="ml-auto w-fit max-w-[80%] rounded-full bg-[#1C1E26] px-3 py-1.5 text-[11px] text-white">
          What did I save about bridge load distribution?
        </p>
        <div className="max-w-[88%]">
          <p className="text-[11px] leading-relaxed text-[#78716c]">
            You highlighted that suspension decks hang from main cables anchored at both ends [1], and
            your recap of the engineering article notes cable-stayed towers take the load directly
            [2].
          </p>
          <p className="mb-1 mt-2 text-[8px] font-semibold uppercase tracking-wider text-[#78716c]">
            Sources
          </p>
          <div className="flex gap-2">
            {[
              { ref: 1, type: 'Capture', title: 'Bridge — Wikipedia', domain: 'en.wikipedia.org' },
              { ref: 2, type: 'Recap', title: 'Cable-stayed design', domain: 'engineering.org' },
            ].map(s => (
              <div
                key={s.ref}
                className="w-40 rounded-lg border border-[#d6d3d1] bg-[#F4F4F2] px-2.5 py-2"
              >
                <div className="flex items-center gap-1.5">
                  <span className="rounded-full border border-[#d6d3d1] px-1.5 font-mono text-[8px] text-[#78716c]">
                    {s.ref}
                  </span>
                  <span className="truncate text-[10px] font-medium text-[#1C1E26]">{s.title}</span>
                </div>
                <div className="mt-1.5 flex items-center gap-1.5 text-[8px] text-[#78716c]">
                  <span className="rounded-full bg-white px-1.5 py-px">{s.type}</span>
                  <span className="truncate">{s.domain}</span>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  )
}

export default function RagSection() {
  return (
    <section id="rag" className="relative scroll-mt-24 overflow-hidden bg-[#EBF1F7] py-24 md:py-32">
      <div className="relative mx-auto max-w-6xl px-6 lg:px-10">
        <div className="grid items-center gap-14 lg:grid-cols-2">
          <div>
            <SectionHeading
              align="left"
              eyebrow="AI search"
              title="Ask AI across your saved web memory"
              lede="Ask a question in plain language. Inline searches your saved captures by meaning and grounds every answer in the sources it found."
            />
            <div className="mt-10 space-y-7">
              {PIPELINE.map((step, i) => (
                <Reveal key={step.title} delay={i * 0.06}>
                  <div className="flex items-start gap-4">
                    <div className="mt-0.5 flex h-9 w-9 shrink-0 items-center justify-center rounded-lg border border-[#d6d3d1] bg-white text-[#4B83C4]">
                      <step.icon className="h-4 w-4" aria-hidden />
                    </div>
                    <div>
                      <h3 className="text-sm font-semibold text-[#1C1E26]">{step.title}</h3>
                      <p className="mt-1.5 text-sm leading-relaxed text-stone-600">{step.body}</p>
                    </div>
                  </div>
                </Reveal>
              ))}
            </div>
          </div>

          <Reveal delay={0.12}>
            <ChatMock />
          </Reveal>
        </div>
      </div>
    </section>
  )
}
