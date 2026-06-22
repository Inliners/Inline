import {
  Layers,
  Highlighter,
  StickyNote,
  BrainCircuit,
  PanelsTopLeft,
  Sparkles,
  FileText,
  PenLine,
  Volume2,
  MessageCircle,
} from 'lucide-react'
import { Reveal, SectionHeading } from '@/components/marketing/primitives/Reveal'
import { mktCard } from '@/components/marketing/marketingSurfaces'

/**
 * Problem → Solution narrative. Anchored as #product (the "Product" nav link).
 */

const PROBLEMS = [
  {
    icon: PanelsTopLeft,
    title: 'Research scatters across tabs',
    body: 'Twenty tabs of reading never becomes knowledge. Close the window and the thread is gone.',
  },
  {
    icon: Highlighter,
    title: 'Highlights disappear',
    body: 'Most highlights die where you made them — unfindable a week later, detached from why they mattered.',
  },
  {
    icon: StickyNote,
    title: 'Notes lose their context',
    body: 'A note in another app forgets the page, the paragraph, and the moment it came from.',
  },
  {
    icon: BrainCircuit,
    title: 'AI tools forget the page',
    body: 'Chat assistants answer in a vacuum. They never saw what you read, marked, or saved.',
  },
]

const SOLUTIONS = [
  { icon: Highlighter,       label: 'Capture directly on the web',     detail: 'Highlights, sticky notes, drawings, and clips live on the page itself — and restore when you return.' },
  { icon: Layers,            label: 'Everything lands in a workspace', detail: 'Every capture syncs into a searchable workspace with history, analytics, a map, and a knowledge graph.' },
  { icon: MessageCircle, label: 'Ask AI over your own captures',   detail: 'Semantic retrieval finds the right notes and documents, and every answer points back to its sources.' },
  { icon: FileText,          label: 'Recaps write themselves',         detail: 'Inline composes a living recap document per page as you annotate — no manual summarizing.' },
  { icon: PenLine,           label: 'Rewrite and summarize in place',  detail: 'Select text on any page to rewrite, shorten, or summarize it without leaving the tab.' },
  { icon: Volume2,           label: 'Read aloud, securely',            detail: 'Natural cloud voices through a server-side proxy — no API keys in your browser, with a built-in fallback voice.' },
]

export default function ProblemSolution() {
  return (
    <section id="product" className="scroll-mt-24 bg-[#FAF5EE] py-24 md:py-32">
      <div className="mx-auto max-w-6xl px-6 lg:px-10">
        <SectionHeading
          eyebrow="The problem"
          title="Browser tabs don't become knowledge"
          lede="You read, you mark, you mean to come back. But the web has no memory — and neither do the tools sitting on top of it."
        />

        <div className="mt-12 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          {PROBLEMS.map((p, i) => (
            <Reveal key={p.title} delay={i * 0.06}>
              <div className={`h-full ${mktCard}`}>
                <div className="mb-4 flex h-9 w-9 items-center justify-center rounded-lg border border-[#d6d3d1] bg-[#F4F4F2] text-[#1C1E26]">
                  <p.icon className="h-4.5 w-4.5" aria-hidden />
                </div>
                <h3 className="text-sm font-semibold text-[#1C1E26]">{p.title}</h3>
                <p className="mt-2 text-sm leading-relaxed text-stone-600">{p.body}</p>
              </div>
            </Reveal>
          ))}
        </div>

        <div className="mt-24 md:mt-32">
          <SectionHeading
            eyebrow="The solution"
            title="Capture context where it happens"
            lede="Inline is a browser-native memory layer: annotate any page, keep every capture attached to its source, and ask AI across all of it."
          />

          <div className="mt-12 grid gap-x-10 gap-y-8 md:grid-cols-2 lg:grid-cols-3">
            {SOLUTIONS.map((s, i) => (
              <Reveal key={s.label} delay={i * 0.05}>
                <div className="flex items-start gap-4">
                  <div className="mt-0.5 flex h-9 w-9 shrink-0 items-center justify-center rounded-lg border border-[#d6d3d1] bg-white text-[#4B83C4]">
                    <s.icon className="h-4 w-4" aria-hidden />
                  </div>
                  <div>
                    <h3 className="text-sm font-semibold text-[#1C1E26]">{s.label}</h3>
                    <p className="mt-1.5 text-sm leading-relaxed text-stone-600">{s.detail}</p>
                  </div>
                </div>
              </Reveal>
            ))}
          </div>
        </div>

        <Reveal className="mt-16 flex justify-center" delay={0.1}>
          <p className="flex items-center gap-2 rounded-full border border-[#d6d3d1] bg-white px-5 py-2 text-sm text-[#78716c]">
            <Sparkles className="h-3.5 w-3.5 text-[#4B83C4]" aria-hidden />
            Turn scattered tabs into a searchable workspace.
          </p>
        </Reveal>
      </div>
    </section>
  )
}
