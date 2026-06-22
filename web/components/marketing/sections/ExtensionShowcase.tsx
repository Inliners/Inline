import Link from 'next/link'
import { InlineChatIcon } from '@/components/ui/inline-chat-icon'
import {
  Highlighter,
  StickyNote,
  PenTool,
  MessageCircle,
  PenLine,
  FileText,
  Volume2,
  Paperclip,
} from 'lucide-react'
import { Reveal, SectionHeading } from '@/components/marketing/primitives/Reveal'

/**
 * #extension — the floating tool, shown as a designed mockup of the three
 * real states: collapsed pill, command bar, expanded Ask AI panel. Every tool
 * pictured ships in the extension today.
 */

const TOOLS = [
  { icon: Highlighter, label: 'Highlight' },
  { icon: StickyNote,  label: 'Note' },
  { icon: PenTool,     label: 'Draw' },
  { icon: MessageCircle, label: 'Ask' },
  { icon: PenLine,     label: 'Rewrite' },
  { icon: FileText,    label: 'Recap' },
  { icon: Volume2,     label: 'Speak' },
  { icon: Paperclip,   label: 'Save' },
]

function CollapsedPillMock() {
  return (
    <div className="flex items-center gap-2 rounded-full border border-stone-200 bg-white px-3 py-2 shadow-sm w-fit">
      <InlineChatIcon size="md" variant="badge" />
      <span className="text-xs font-medium text-stone-600">Inline</span>
      <kbd className="rounded border border-stone-200 bg-stone-50 px-1.5 py-px font-mono text-[9px] text-stone-400">⌘⇧K</kbd>
    </div>
  )
}

function CommandBarMock() {
  return (
    <div className="flex items-center gap-1 rounded-2xl border border-stone-200 bg-white p-1.5 shadow-sm w-fit">
      {TOOLS.map((t, i) => (
        <span
          key={t.label}
          className={`flex h-8 w-8 items-center justify-center rounded-xl ${
            i === 3 ? 'bg-[#0B1735] text-white' : 'text-stone-500'
          }`}
          title={t.label}
          aria-label={t.label}
        >
          <t.icon className="h-3.5 w-3.5" aria-hidden />
        </span>
      ))}
    </div>
  )
}

function ExpandedPanelMock() {
  return (
    <div className="w-full max-w-sm rounded-2xl border border-stone-200 bg-white shadow-sm overflow-hidden">
      <div className="flex items-center justify-between border-b border-stone-100 px-4 py-2.5">
        <div className="flex items-center gap-2">
          <InlineChatIcon size="sm" variant="badge" className="rounded-md" />
          <span className="text-xs font-semibold text-[#1C1E26]">Ask Inline</span>
        </div>
        <span className="rounded-full bg-[#EBF1F7] px-2 py-0.5 text-[9px] font-medium text-[#4B83C4]">
          Context: selection
        </span>
      </div>
      <div className="space-y-2.5 px-4 py-3">
        <p className="rounded-xl bg-stone-50 px-3 py-2 text-[11px] text-stone-700">
          What does this paragraph claim about cable-stayed bridges?
        </p>
        <p className="rounded-xl border border-stone-100 px-3 py-2 text-[11px] leading-relaxed text-stone-600">
          The selection argues cable-stayed designs carry deck loads through
          towers rather than anchorages, which shortens construction time…
        </p>
        <div className="flex items-center gap-2 pt-1">
          <span className="rounded-full border border-stone-200 px-2.5 py-1 text-[9px] font-medium text-stone-500">Copy</span>
          <span className="rounded-full border border-stone-200 px-2.5 py-1 text-[9px] font-medium text-stone-500">Read aloud</span>
          <span className="rounded-full bg-[#0B1735] px-2.5 py-1 text-[9px] font-medium text-white">Save to workspace</span>
        </div>
      </div>
    </div>
  )
}

export default function ExtensionShowcase() {
  return (
    <section id="extension" className="scroll-mt-24 bg-white py-24 md:py-32 border-y border-stone-200/60">
      <div className="mx-auto max-w-6xl px-6 lg:px-10">
        <div className="grid items-center gap-14 lg:grid-cols-2">
          <div>
            <SectionHeading
              align="left"
              eyebrow="The extension"
              title="A floating studio on every page"
              lede="One calm surface that expands as you need it: a collapsed pill, a command bar of tools, and a full panel for AI work — all isolated from the page's own styles."
            />
            <Reveal delay={0.1}>
              <ul className="mt-8 space-y-3">
                {[
                  ['Annotation tools', 'Highlights, sticky notes, drawings, handwriting, and stamps that restore on revisit.'],
                  ['Ask, rewrite, summarize', 'Selection-aware AI actions that run through Inline\u2019s server — never your own keys.'],
                  ['Page recap', 'Trigger a structured recap document of everything you captured on the page.'],
                  ['Read aloud', 'Cloud voice with automatic browser-voice fallback.'],
                  ['Save clip', 'Send a selection plus its highlights straight to your workspace.'],
                ].map(([title, detail]) => (
                  <li key={title} className="flex items-start gap-3">
                    <span className="mt-[7px] h-1.5 w-1.5 shrink-0 rounded-full bg-[#4B83C4]" aria-hidden />
                    <p className="text-sm leading-relaxed text-stone-600">
                      <span className="font-semibold text-[#1C1E26]">{title}.</span> {detail}
                    </p>
                  </li>
                ))}
              </ul>
            </Reveal>
            <Reveal delay={0.15}>
              <Link
                href="/install"
                className="mt-8 inline-flex items-center justify-center rounded-full bg-[#1C1E26] px-6 py-2.5 text-sm font-medium text-white transition-colors hover:bg-stone-800 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#4B83C4]"
              >
                Install the extension
              </Link>
            </Reveal>
          </div>

          {/* Three-state mockup column on a soft page backdrop */}
          <Reveal delay={0.1}>
            <div className="relative rounded-3xl border border-stone-200/80 bg-[#F7F7F5] p-6 md:p-8">
              <div className="absolute inset-x-8 top-6 space-y-2 opacity-50" aria-hidden>
                <div className="h-2 rounded bg-stone-200/80 w-3/4" />
                <div className="h-2 rounded bg-stone-200/80 w-full" />
                <div className="h-2 rounded bg-stone-200/60 w-5/6" />
              </div>
              <div className="relative space-y-6 pt-16">
                <div>
                  <p className="mb-2 text-[10px] font-semibold uppercase tracking-wider text-stone-400">1 · Collapsed</p>
                  <CollapsedPillMock />
                </div>
                <div>
                  <p className="mb-2 text-[10px] font-semibold uppercase tracking-wider text-stone-400">2 · Command bar</p>
                  <CommandBarMock />
                </div>
                <div>
                  <p className="mb-2 text-[10px] font-semibold uppercase tracking-wider text-stone-400">3 · Expanded panel</p>
                  <ExpandedPanelMock />
                </div>
              </div>
            </div>
          </Reveal>
        </div>
      </div>
    </section>
  )
}
