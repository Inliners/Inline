'use client'

import { ArrowUp, ChevronDown, User, X } from 'lucide-react'
import { InlineChatIcon } from '@/components/ui/inline-chat-icon'
import { SourceCardRow, type ChatSource } from '@/components/shell/SourceCard'
import { product } from '@/components/marketing/marketingSurfaces'
import { DEMO_BRIDGE_SOURCES, DEMO_WORKSPACE_ID } from '@/components/marketing/productMocks/sampleData'
import { cn } from '@/lib/utils'

export type WorkspaceChatScenario = {
  userMessage: string
  assistantMessage: string
  sources?: ChatSource[]
  recencyNote?: string
}

type WorkspaceChatMockProps = {
  className?: string
  scenario?: WorkspaceChatScenario
  variant?: 'conversation' | 'panel' | 'pill'
  sessionTitle?: string
  badgeShape?: 'circle' | 'square'
  elevated?: boolean
  /** Tighter layout for marketing pillar cards. */
  dense?: boolean
}

const DEFAULT_SCENARIO: WorkspaceChatScenario = {
  userMessage: 'What did I highlight about cable-stayed vs suspension bridge load distribution?',
  assistantMessage:
    'You highlighted that cable-stayed towers take deck loads directly through stay cables [1], while suspension designs hang the deck from main cables anchored at both ends [2]. Your recap adds that cable-stayed construction is typically faster [3].',
  sources: DEMO_BRIDGE_SOURCES,
}

function UserBubble({ content }: { content: string }) {
  const multiline = content.includes('\n') || content.length > 72
  return (
    <div
      className={cn(
        'ml-auto inline-block max-w-[82%] bg-primary px-4 py-2.5 text-sm leading-relaxed text-primary-foreground',
        multiline ? 'rounded-2xl' : 'rounded-full',
      )}
    >
      {content}
    </div>
  )
}

export default function WorkspaceChatMock({
  className,
  scenario = DEFAULT_SCENARIO,
  variant = 'conversation',
  sessionTitle = 'Bridge research',
  badgeShape = 'circle',
  elevated = true,
  dense = false,
}: WorkspaceChatMockProps) {
  if (variant === 'pill') {
    return (
      <div
        className={cn(
          'flex h-11 w-[210px] items-center rounded-full border border-border bg-card px-3',
          className,
        )}
        style={elevated ? { boxShadow: product.toolbarShadow } : undefined}
      >
        <InlineChatIcon variant="badge" badgeShape={badgeShape} />
        <span className="ml-2 text-xs font-medium text-foreground">Ask Inline</span>
      </div>
    )
  }

  if (variant === 'panel') {
    return (
      <div
        className={cn(
          'flex w-full flex-col overflow-hidden rounded-xl border border-border bg-card',
          className,
        )}
        style={elevated ? { boxShadow: product.panelShadow } : undefined}
      >
        <div className="flex h-14 items-center justify-between px-5">
          <div className="flex items-center gap-2 text-sm font-medium text-foreground">
            <InlineChatIcon size="md" variant="badge" badgeShape={badgeShape} />
            <span>{sessionTitle}</span>
            <ChevronDown className="h-3.5 w-3.5 text-muted-foreground" aria-hidden />
          </div>
          <div className="flex items-center gap-2">
            <span className="flex items-center gap-2 text-xs font-medium text-foreground">
              Personalize
              <span className="relative h-5 w-9 rounded-full bg-[#2f80ed]">
                <span className="absolute right-0.5 top-0.5 h-4 w-4 rounded-full bg-white" />
              </span>
            </span>
            <button type="button" className="flex h-8 w-8 items-center justify-center rounded-md bg-muted/80 text-muted-foreground" aria-hidden>
              <X className="h-3.5 w-3.5" />
            </button>
          </div>
        </div>
        <div className="flex min-h-[400px] flex-1 flex-col space-y-5 px-8 py-6">
          <div className="flex flex-row-reverse items-start gap-2">
            <div className="mt-0.5 flex h-6 w-6 shrink-0 items-center justify-center rounded-md bg-secondary">
              <User className="h-3 w-3 text-foreground" aria-hidden />
            </div>
            <UserBubble content={scenario.userMessage} />
          </div>
          <div className="max-w-[92%]">
            <p className="text-sm leading-relaxed text-foreground">{scenario.assistantMessage}</p>
            {scenario.sources && scenario.sources.length > 0 && (
              <SourceCardRow sources={scenario.sources} workspaceId={DEMO_WORKSPACE_ID} />
            )}
          </div>
        </div>
        <div className="bg-card p-4">
          <div className="overflow-hidden rounded-lg border border-primary/25 bg-background shadow-[0_0_0_3px_rgba(75,131,196,0.10)]">
            <div className="flex min-h-[78px] flex-col px-4 py-3">
              <p className="text-sm text-muted-foreground">
                Ask about your captures, documents, or recent activity…
              </p>
              <div className="mt-auto flex justify-end">
                <span className="flex h-8 w-8 items-center justify-center rounded-full bg-[#2f80ed] text-white opacity-35">
                  <ArrowUp className="h-3.5 w-3.5" aria-hidden />
                </span>
              </div>
            </div>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className={cn(dense ? 'space-y-3' : 'space-y-4', className)}>
      <div className="flex flex-row-reverse items-start gap-2">
        <div className="mt-0.5 flex h-6 w-6 shrink-0 items-center justify-center rounded-md bg-secondary">
          <User className="h-3 w-3 text-foreground" aria-hidden />
        </div>
        <UserBubble content={scenario.userMessage} />
      </div>
      <div className="max-w-full">
        <p
          className={cn(
            'text-sm leading-relaxed text-foreground',
            dense && 'line-clamp-3',
          )}
        >
          {scenario.assistantMessage}
        </p>
        {scenario.recencyNote && (
          <p className="mt-2 text-[9px] text-muted-foreground/80">{scenario.recencyNote}</p>
        )}
        {scenario.sources && scenario.sources.length > 0 && (
          <SourceCardRow
            sources={dense ? scenario.sources.slice(0, 1) : scenario.sources}
            workspaceId={DEMO_WORKSPACE_ID}
          />
        )}
      </div>
    </div>
  )
}
