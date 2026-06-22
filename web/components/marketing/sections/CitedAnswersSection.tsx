import { ChevronRight, Lock } from 'lucide-react'
import { Reveal } from '@/components/marketing/primitives/Reveal'
import { SectionLink } from '@/components/marketing/SectionLink'
import { SourceCardRow } from '@/components/shell/SourceCard'
import WorkspaceChatMock from '@/components/marketing/productMocks/WorkspaceChatMock'
import { DEMO_BRIDGE_SOURCES, DEMO_WORKSPACE_ID } from '@/components/marketing/productMocks/sampleData'

const DOMAINS = [
  'en.wikipedia.org',
  'engineering.org',
  'medium.com',
  'arxiv.org',
  'stackoverflow.com',
  'notion.so',
  'docs.google.com',
  'reddit.com',
] as const

export default function CitedAnswersSection() {
  return (
    <section className="bg-[#FDFBF7] py-24 md:py-32">
      <div className="mx-auto max-w-6xl px-6 lg:px-10">
        <Reveal className="text-center">
          <h2 className="text-balance text-3xl font-semibold tracking-tight text-[#1C1E26] md:text-[2.75rem] md:leading-[1.1]">
            Your captures, cited the same way in the workspace chat.
          </h2>
        </Reveal>

        <Reveal delay={0.06} className="mt-8 flex justify-center">
          <SectionLink
            href="/#rag"
            className="inline-flex items-center gap-1 rounded-full border border-[#1C1E26] px-5 py-2 text-sm font-medium text-[#1C1E26] transition-colors hover:bg-[#1C1E26] hover:text-white"
          >
            Explore AI search
            <ChevronRight className="h-4 w-4" aria-hidden />
          </SectionLink>
        </Reveal>

        <Reveal delay={0.08} className="mt-8">
          <div className="flex flex-wrap items-center justify-center gap-2">
            {DOMAINS.map(domain => (
              <span
                key={domain}
                className="rounded-lg border border-border bg-card px-3 py-1.5 text-xs font-medium text-muted-foreground"
              >
                {domain}
              </span>
            ))}
          </div>
        </Reveal>

        <div className="mt-10 grid items-stretch gap-5 lg:grid-cols-3">
          <Reveal delay={0.1} className="lg:col-span-2">
            <article className="flex h-full flex-col rounded-[1.5rem] border border-[#E8DFD4] bg-[#F5EDE3] p-6">
              <h3 className="text-lg font-semibold text-[#1C1E26]">Real source cards from retrieval</h3>
              <p className="mt-2 text-sm leading-relaxed text-muted-foreground">
                Citations are built server-side from retrieved chunks — the same{' '}
                <code className="text-xs">SourceCard</code> component used in the workspace chat.
              </p>
              <div className="mt-5 flex-1 rounded-xl border border-border bg-card p-4">
                <WorkspaceChatMock
                  variant="conversation"
                  scenario={{
                    userMessage: 'What did I save about bridge loads?',
                    assistantMessage:
                      'Cable-stayed towers carry deck loads directly through stay cables rather than anchorages [1]. Your recap notes shorter construction time [2].',
                    sources: DEMO_BRIDGE_SOURCES.slice(0, 2),
                  }}
                />
              </div>
            </article>
          </Reveal>

          <Reveal delay={0.14}>
            <article className="flex h-full flex-col rounded-[1.5rem] border border-[#E8DFD4] bg-[#F5EDE3] p-6">
              <h3 className="text-lg font-semibold text-[#1C1E26]">Workspace-scoped</h3>
              <p className="mt-2 text-sm leading-relaxed text-muted-foreground">
                Semantic search runs as you, filtered to your workspace only.
              </p>
              <div className="mt-5 rounded-xl border border-border bg-card p-4">
                <p className="text-[10px] font-semibold uppercase tracking-wider text-muted-foreground">
                  Retrieval scope
                </p>
                <div className="mt-3 space-y-2 text-xs">
                  <div className="flex items-center justify-between">
                    <span className="text-foreground">Your workspace</span>
                    <span className="text-[#22C55E]">Full access</span>
                  </div>
                  <div className="flex items-center justify-between text-muted-foreground">
                    <span>Other workspaces</span>
                    <span className="flex items-center gap-1">
                      <Lock className="h-3 w-3" aria-hidden />
                      No access
                    </span>
                  </div>
                </div>
              </div>
              <div className="mt-4 rounded-xl border border-border bg-card p-4">
                <SourceCardRow sources={[DEMO_BRIDGE_SOURCES[0]!]} workspaceId={DEMO_WORKSPACE_ID} />
              </div>
            </article>
          </Reveal>
        </div>
      </div>
    </section>
  )
}
