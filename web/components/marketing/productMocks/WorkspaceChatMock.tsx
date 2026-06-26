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
  /** On lg+ screens, render the assistant reply as two explicit lines. */
  assistantMessageLgLines?: [string, string]
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
  /** Panel header + dense conversation body — no personalize row or input footer. */
  compactPanel?: boolean
  hideSourceScrollbar?: boolean
  /** User bubble alignment in dense conversation layout. */
  userAlign?: 'start' | 'end'
  /** Extra right inset for dense end-aligned user bubbles (nudges bubble left). */
  userEndInset?: string
}

const DEFAULT_SCENARIO: WorkspaceChatScenario = {
  userMessage: 'What did I highlight in the opening section?',
  assistantMessage:
    'You highlighted the main claim in paragraph two [1], a supporting example later on [2], and a sticky note comparing it to another article [3].',
  sources: DEMO_BRIDGE_SOURCES,
}

function UserBubble({ content, dense }: { content: string; dense?: boolean }) {
  const multiline = dense || content.includes('\n') || content.length > 48
  return (
    <div
      className={cn(
        'inline-block bg-[#1B1B1B] text-white',
        dense
          ? 'max-w-[85%] rounded-lg px-2.5 py-1 text-[12px] leading-snug'
          : cn(
              'ml-auto max-w-[82%] bg-primary px-4 py-2.5 text-sm leading-relaxed text-primary-foreground',
              multiline ? 'rounded-2xl' : 'rounded-2xl sm:rounded-full',
            ),
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
  sessionTitle = 'Reading session',
  badgeShape = 'circle',
  elevated = true,
  dense = false,
  compactPanel = false,
  hideSourceScrollbar = false,
  userAlign = 'end',
  userEndInset = 'pr-0.5',
}: WorkspaceChatMockProps) {
  if (variant === 'pill') {
    return (
      <div
        className={cn(
          'flex h-11 w-[210px] items-center rounded-full border border-border bg-card px-3',
          className,
        )}
        style={elevated ? { boxShadow: product.chatPillShadow } : undefined}
      >
        <InlineChatIcon variant="badge" badgeShape={badgeShape} />
        <span className="ml-2 text-xs font-medium text-foreground">Ask Inline</span>
      </div>
    )
  }

  if (variant === 'panel') {
    const bodyDense = dense || compactPanel

    return (
      <div
        className={cn(
          'flex w-full flex-col overflow-hidden rounded-xl border border-border bg-card',
          compactPanel && 'min-h-[300px] sm:min-h-[340px]',
          className,
        )}
        style={elevated ? { boxShadow: product.panelShadow } : undefined}
      >
        <div
          className={cn(
            'flex shrink-0 items-center justify-between gap-2 px-4 py-2.5 sm:px-5',
            !compactPanel && 'border-b border-border/60',
            compactPanel ? 'min-h-11' : 'min-h-12 flex-wrap py-2 sm:h-14 sm:flex-nowrap',
          )}
        >
          <div className="flex min-w-0 items-center gap-2 text-sm font-medium text-foreground">
            <InlineChatIcon size="md" variant="badge" badgeShape={badgeShape} />
            <span className="min-w-0 truncate">{sessionTitle}</span>
            <ChevronDown className="h-3.5 w-3.5 shrink-0 text-muted-foreground" aria-hidden />
          </div>
          <div className="flex items-center gap-2">
            {!compactPanel && (
              <span className="hidden items-center gap-2 text-xs font-medium text-foreground sm:flex">
                Personalize
                <span className="relative h-5 w-9 rounded-full bg-[#2f80ed]">
                  <span className="absolute right-0.5 top-0.5 h-4 w-4 rounded-full bg-white" />
                </span>
              </span>
            )}
            <button type="button" className="flex h-8 w-8 items-center justify-center rounded-md bg-muted/80 text-muted-foreground" aria-hidden>
              <X className="h-3.5 w-3.5" />
            </button>
          </div>
        </div>
        {bodyDense ? (
          <div className="flex min-h-0 flex-1 flex-col gap-1.5 px-3 py-3 sm:px-4 sm:py-3.5">
            <div className={cn('flex w-full shrink-0', cn('justify-end', userEndInset))}>
              <UserBubble content={scenario.userMessage} dense />
            </div>
            <div className="flex min-h-0 flex-1 flex-col gap-2">
              <p className="text-[11px] leading-relaxed text-muted-foreground/70">
                Searching your captures and recaps…
              </p>
              <p className="text-[12px] leading-snug text-foreground/90">
                {scenario.assistantMessage}
              </p>
              {scenario.sources && scenario.sources.length > 0 && (
                <SourceCardRow
                  sources={scenario.sources}
                  workspaceId={DEMO_WORKSPACE_ID}
                  hideScrollbar={hideSourceScrollbar}
                />
              )}
            </div>
          </div>
        ) : (
          <>
            <div className="flex min-h-[260px] flex-1 flex-col space-y-4 px-4 py-4 sm:min-h-[400px] sm:space-y-5 sm:px-8 sm:py-6">
              <div className="flex flex-row-reverse items-start gap-2">
                <div className="mt-0.5 flex h-6 w-6 shrink-0 items-center justify-center rounded-md bg-secondary">
                  <User className="h-3 w-3 text-foreground" aria-hidden />
                </div>
                <UserBubble content={scenario.userMessage} />
              </div>
              <div className="max-w-[92%]">
                <p className="text-sm leading-relaxed text-foreground">{scenario.assistantMessage}</p>
                {scenario.sources && scenario.sources.length > 0 && (
                  <SourceCardRow
                    sources={scenario.sources}
                    workspaceId={DEMO_WORKSPACE_ID}
                    hideScrollbar={hideSourceScrollbar}
                  />
                )}
              </div>
            </div>
            <div className="bg-card p-3 sm:p-4">
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
          </>
        )}
      </div>
    )
  }

  return (
    <div className={cn(dense ? 'flex min-h-0 flex-1 flex-col gap-1.5' : 'space-y-4', className)}>
      <div
        className={cn(
          dense
            ? cn(
                'flex w-full shrink-0',
                userAlign === 'start' ? 'justify-start' : cn('justify-end', userEndInset),
              )
            : 'flex flex-row-reverse items-start gap-2',
        )}
      >
        {!dense && (
          <div className="mt-0.5 flex h-6 w-6 shrink-0 items-center justify-center rounded-md bg-secondary">
            <User className="h-3 w-3 text-foreground" aria-hidden />
          </div>
        )}
        <UserBubble content={scenario.userMessage} dense={dense} />
      </div>
      <div className={cn('max-w-full', dense && 'flex min-h-0 flex-1 flex-col gap-1.5')}>
        {dense && (
          <p className="text-[11px] leading-relaxed text-muted-foreground/70">
            Searching your captures and recaps…
          </p>
        )}
        <p
          className={cn(
            'text-sm leading-relaxed text-foreground',
            dense && !scenario.assistantMessageLgLines && 'line-clamp-2 text-[12px] leading-snug text-foreground/90',
            dense && scenario.assistantMessageLgLines && 'text-[12px] leading-snug text-foreground/90',
          )}
        >
          {scenario.assistantMessageLgLines ? (
            <>
              <span className="lg:hidden">{scenario.assistantMessage}</span>
              <span className="hidden lg:block">
                {scenario.assistantMessageLgLines[0]}
                <br />
                {scenario.assistantMessageLgLines[1]}
              </span>
            </>
          ) : (
            scenario.assistantMessage
          )}
        </p>
        {scenario.recencyNote && (
          <p className="mt-2 text-[9px] text-muted-foreground/80">{scenario.recencyNote}</p>
        )}
        {scenario.sources && scenario.sources.length > 0 && !dense && (
            <SourceCardRow
              sources={scenario.sources}
              workspaceId={DEMO_WORKSPACE_ID}
              hideScrollbar={hideSourceScrollbar}
            />
        )}
      </div>
    </div>
  )
}
