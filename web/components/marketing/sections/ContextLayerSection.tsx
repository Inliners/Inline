import { Reveal } from '@/components/marketing/primitives/Reveal'
import AskThoughtTrace from '@/components/marketing/AskThoughtTrace'
import { mkt } from '@/components/marketing/marketingSurfaces'
import ExtensionStaticHighlightSceneMock from '@/components/marketing/productMocks/ExtensionStaticHighlightSceneMock'
import {
  ExtensionAskPanelMock,
  ExtensionDockSceneHighlightAnimated,
  WorkspaceChatMock,
} from '@/components/marketing/productMocks'

export default function ContextLayerSection() {
  return (
    <section id="extension" className="scroll-mt-24 border-y border-[#E8DFD4] bg-[#FAF5EE] py-16 sm:py-20 md:py-28 lg:py-32">
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

        <div className="mt-14 grid min-w-0 items-stretch gap-8 lg:grid-cols-2">
          <Reveal delay={0.06} className="flex h-full min-w-0 flex-col">
            <p
              className="mb-4 text-xs font-semibold uppercase tracking-[0.14em]"
              style={{ color: mkt.espresso }}
            >
              Chrome extension
            </p>
            <div className="sm:hidden">
              <ExtensionStaticHighlightSceneMock className="mx-auto w-full" />
            </div>
            <div className="hidden h-full sm:block">
              <ExtensionDockSceneHighlightAnimated className="h-full" />
            </div>
          </Reveal>

          <Reveal delay={0.1} className="flex h-full min-w-0 flex-col">
            <p
              className="mb-4 text-xs font-semibold uppercase tracking-[0.14em]"
              style={{ color: mkt.espresso }}
            >
              Workspace chat
            </p>
            <WorkspaceChatMock
              variant="panel"
              sessionTitle="Reading session"
              elevated={false}
              className="h-full w-full"
            />
          </Reveal>
        </div>

        <Reveal delay={0.14} className="mt-10">
          <div className="overflow-hidden rounded-2xl border border-[#E8DFD4]">
            <div className="flex flex-col lg:flex-row lg:items-stretch">
              <div
                className="flex flex-1 flex-col items-center gap-5 p-4 sm:p-6 md:p-8 lg:flex-row lg:items-center lg:justify-between"
                style={{ backgroundColor: mkt.tan }}
              >
                <ExtensionAskPanelMock
                  compact
                  elevated={false}
                  className="w-full max-w-[342px] shrink-0"
                />
                <AskThoughtTrace className="w-full max-w-sm lg:flex-1 lg:px-6" />
              </div>
              <div
                className="flex items-center justify-center px-6 py-4 lg:w-[12rem] lg:shrink-0 lg:justify-start lg:py-8"
                style={{ backgroundColor: mkt.espressoDark }}
              >
                <p className="text-center text-sm font-medium leading-snug text-[#F5EDE3]/90 lg:text-left">
                  Page-grounded answers
                </p>
              </div>
            </div>
          </div>
        </Reveal>
      </div>
    </section>
  )
}
