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
import { mktBtnPrimary, mktPanelMock, product } from '@/components/marketing/marketingSurfaces'

const TOOLS = [
  { icon: Highlighter, label: 'Highlight' },
  { icon: StickyNote, label: 'Note' },
  { icon: PenTool, label: 'Draw' },
  { icon: MessageCircle, label: 'Ask' },
  { icon: PenLine, label: 'Rewrite' },
  { icon: FileText, label: 'Recap' },
  { icon: Volume2, label: 'Speak' },
  { icon: Paperclip, label: 'Save' },
]

function CollapsedPillMock() {
  return (
    <div
      className="flex w-fit items-center gap-2 rounded-full border border-[#d6d3d1] bg-white px-3 py-2"
      style={{ boxShadow: product.chatPillShadow }}
    >
      <InlineChatIcon size="md" variant="badge" />
      <span className="text-xs font-medium text-[#78716c]">Inline</span>
      <kbd className="rounded border border-[#d6d3d1] bg-[#F4F4F2] px-1.5 py-px font-mono text-[9px] text-[#78716c]">
        ⌘⇧K
      </kbd>
    </div>
  )
}

function CommandBarMock() {
  return (
    <div
      className="flex w-fit items-center gap-1 rounded-[10px] border border-[#d6d3d1] bg-white p-1.5"
      style={{ boxShadow: product.toolbarShadow }}
    >
      {TOOLS.map((t, i) => (
        <span
          key={t.label}
          className={`flex h-8 w-8 items-center justify-center rounded-lg ${
            i === 3 ? 'bg-[#12203f] text-white' : 'text-[#78716c]'
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
    <div className={`w-full max-w-sm ${mktPanelMock}`}>
      <div className="flex items-center justify-between border-b border-[#d6d3d1]/60 px-4 py-2.5">
        <div className="flex items-center gap-2">
          <InlineChatIcon size="sm" variant="badge" />
          <span className="text-xs font-semibold text-[#1C1E26]">Ask Inline</span>
        </div>
        <span className="rounded-full bg-[#F4F4F2] px-2 py-0.5 text-[9px] font-medium text-[#78716c]">
          Context: selection
        </span>
      </div>
      <div className="space-y-2.5 px-4 py-3">
        <p className="ml-auto w-fit max-w-[85%] rounded-full bg-[#1C1E26] px-3 py-1.5 text-[11px] text-white">
          What does this paragraph claim?
        </p>
        <p className="text-[11px] leading-relaxed text-[#78716c]">
          The selection states the author&apos;s main point and backs it with a supporting example…
        </p>
        <div className="flex items-center gap-2 border-t border-[#d6d3d1]/50 pt-2">
          <span className="rounded-full border border-[#d6d3d1] px-2.5 py-1 text-[9px] font-medium text-[#78716c]">
            Copy
          </span>
          <span className="rounded-full border border-[#d6d3d1] px-2.5 py-1 text-[9px] font-medium text-[#78716c]">
            Read aloud
          </span>
          <span className="rounded-full bg-[#1C1E26] px-2.5 py-1 text-[9px] font-medium text-white">
            Save to workspace
          </span>
        </div>
      </div>
    </div>
  )
}

export default function ExtensionShowcase() {
  return (
    <section id="extension" className="scroll-mt-24 border-y border-[#E8DFD4] bg-[#F5EDE3] py-24 md:py-32">
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
                    <p className="text-sm leading-relaxed text-[#78716c]">
                      <span className="font-semibold text-[#1C1E26]">{title}.</span> {detail}
                    </p>
                  </li>
                ))}
              </ul>
            </Reveal>
            <Reveal delay={0.15}>
              <Link href="/install" className={`mt-8 ${mktBtnPrimary}`}>
                Install the extension
              </Link>
            </Reveal>
          </div>

          <Reveal delay={0.1}>
            <div
              className="relative rounded-xl border border-[#d6d3d1] bg-[#F7F7F5] p-6 md:p-8"
              style={{ boxShadow: product.panelShadow }}
            >
              <div className="absolute inset-x-8 top-6 space-y-2 opacity-40" aria-hidden>
                <div className="h-2 w-3/4 rounded bg-[#d6d3d1]/80" />
                <div className="h-2 w-full rounded bg-[#d6d3d1]/80" />
                <div className="h-2 w-5/6 rounded bg-[#d6d3d1]/60" />
              </div>
              <div className="relative space-y-6 pt-16">
                <div>
                  <p className="mb-2 text-[10px] font-semibold uppercase tracking-wider text-[#78716c]">
                    1 · Collapsed
                  </p>
                  <CollapsedPillMock />
                </div>
                <div>
                  <p className="mb-2 text-[10px] font-semibold uppercase tracking-wider text-[#78716c]">
                    2 · Command bar
                  </p>
                  <CommandBarMock />
                </div>
                <div>
                  <p className="mb-2 text-[10px] font-semibold uppercase tracking-wider text-[#78716c]">
                    3 · Expanded panel
                  </p>
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
