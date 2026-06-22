import { Reveal } from '@/components/marketing/primitives/Reveal'
import AskThoughtTrace from '@/components/marketing/AskThoughtTrace'
import {
  ExtensionAskPanelMock,
  ExtensionDockSceneMock,
  WorkspaceChatMock,
} from '@/components/marketing/productMocks'

export default function ContextLayerSection() {
  return (
    <section id="extension" className="scroll-mt-24 border-y border-[#E8DFD4] bg-[#FAF5EE] py-24 md:py-32">
      <div className="mx-auto max-w-6xl px-6 lg:px-10">
        <Reveal>
          <h2 className="max-w-2xl text-3xl font-semibold tracking-tight text-[#1C1E26] md:text-[2.75rem] md:leading-[1.1]">
            The same tools on every page — extension and workspace
          </h2>
          <p className="mt-4 max-w-2xl text-base leading-relaxed text-muted-foreground">
            Annotate in the browser with the Chrome extension. Ask AI in your workspace with the same
            panel chrome, message bubbles, and source citations.
          </p>
        </Reveal>

        <div className="mt-14 grid items-stretch gap-8 lg:grid-cols-2">
          <Reveal delay={0.06} className="flex h-full flex-col">
            <p className="mb-4 text-xs font-semibold uppercase tracking-[0.14em] text-[#4B83C4]">
              Chrome extension
            </p>
            <ExtensionDockSceneMock badgeShape="square" className="h-full" />
          </Reveal>

          <Reveal delay={0.1} className="flex h-full flex-col">
            <p className="mb-4 text-xs font-semibold uppercase tracking-[0.14em] text-[#4B83C4]">
              Workspace chat
            </p>
            <WorkspaceChatMock
              variant="panel"
              sessionTitle="Bridge research"
              badgeShape="square"
              elevated={false}
              className="h-full w-full"
            />
          </Reveal>
        </div>

        <Reveal delay={0.14} className="mt-10">
          <div className="w-full overflow-hidden rounded-2xl border border-[#E8DFD4] bg-[#F5EDE3] p-6 md:p-8">
            <div className="flex flex-col items-center gap-5 sm:flex-row sm:items-center sm:justify-between">
              <ExtensionAskPanelMock
                compact
                elevated={false}
                className="w-full max-w-[342px] shrink-0"
                badgeShape="square"
              />
              <AskThoughtTrace className="w-full max-w-sm sm:flex-1 sm:px-6" />
              <p className="text-center text-sm text-muted-foreground sm:max-w-[12rem] sm:shrink-0 sm:text-left">
                Same Ask panel on the page
              </p>
            </div>
          </div>
        </Reveal>
      </div>
    </section>
  )
}
