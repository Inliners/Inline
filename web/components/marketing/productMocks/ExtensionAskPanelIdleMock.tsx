import {
  ExtensionActionTile,
  ExtensionComposerMock,
  ExtensionPanelShellMock,
  ExtensionSectionLabel,
} from '@/components/marketing/productMocks/ExtensionPanelShellMock'
import { cn } from '@/lib/utils'

const QUICK_ACTIONS = [
  { label: 'Summarize', desc: 'Key points' },
  { label: 'Rephrase', desc: 'Same meaning' },
  { label: 'Shorten', desc: 'Make it tight' },
  { label: 'Action items', desc: 'Checklist' },
] as const

type ExtensionAskPanelIdleMockProps = {
  className?: string
}

/** Idle Ask panel — mirrors inlineExtension AI.tsx structure. */
export default function ExtensionAskPanelIdleMock({ className }: ExtensionAskPanelIdleMockProps) {
  return (
    <ExtensionPanelShellMock
      title="Ask"
      subtitle="Working with this page"
      chip="Page"
      useChatBrand
      className={cn('min-h-[360px]', className)}
    >
      <div className="flex flex-col gap-4 p-5">
        <div className="rounded-[10px] border border-border bg-card p-3">
          <div className="flex items-center gap-2">
            <span className="flex h-7 w-7 shrink-0 items-center justify-center rounded-lg bg-muted text-muted-foreground">
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.7" aria-hidden>
                <circle cx="12" cy="12" r="10" />
                <path d="M2 12h20M12 2a15.3 15.3 0 0 1 4 10 15.3 15.3 0 0 1-4 10 15.3 15.3 0 0 1-4-10 15.3 15.3 0 0 1 4-10z" />
              </svg>
            </span>
            <div className="min-w-0">
              <p className="truncate text-sm font-medium text-foreground">Cable-stayed bridge design</p>
              <p className="truncate text-xs text-muted-foreground">engineering.org</p>
            </div>
          </div>
        </div>

        <ExtensionComposerMock placeholder="Ask about this page…" />

        <div>
          <ExtensionSectionLabel>Quick actions</ExtensionSectionLabel>
          <div className="grid grid-cols-2 gap-2">
            {QUICK_ACTIONS.map(action => (
              <ExtensionActionTile key={action.label} label={action.label} desc={action.desc} />
            ))}
          </div>
        </div>
      </div>
    </ExtensionPanelShellMock>
  )
}

/** Page recap flow from AI.tsx — ActionTile + success message. */
export function ExtensionPageRecapPanelMock({ className }: { className?: string }) {
  return (
    <ExtensionPanelShellMock
      title="Ask"
      subtitle="Working with this page"
      chip="Page"
      useChatBrand
      className={cn('min-h-[360px]', className)}
    >
      <div className="flex flex-col gap-4 p-5">
        <div className="rounded-[10px] border border-border bg-card p-3">
          <div className="flex items-center gap-2">
            <span className="flex h-7 w-7 shrink-0 items-center justify-center rounded-lg bg-muted text-muted-foreground">
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.7" aria-hidden>
                <circle cx="12" cy="12" r="10" />
                <path d="M2 12h20M12 2a15.3 15.3 0 0 1 4 10 15.3 15.3 0 0 1-4 10 15.3 15.3 0 0 1-4-10 15.3 15.3 0 0 1 4-10z" />
              </svg>
            </span>
            <div className="min-w-0">
              <p className="truncate text-sm font-medium text-foreground">Cable-stayed bridge design</p>
              <p className="truncate text-xs text-muted-foreground">engineering.org</p>
            </div>
          </div>
        </div>

        <div>
          <ExtensionSectionLabel>Page tools</ExtensionSectionLabel>
          <ExtensionActionTile
            label="Page recap"
            desc="Save a clean summary to your library"
            icon={
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.7" aria-hidden>
                <circle cx="12" cy="12" r="10" />
                <path d="M2 12h20M12 2a15.3 15.3 0 0 1 4 10 15.3 15.3 0 0 1-4 10 15.3 15.3 0 0 1-4-10 15.3 15.3 0 0 1 4-10z" />
              </svg>
            }
          />
          <p className="mt-2 px-0.5 text-[11.5px] text-[#0f766e]">
            Recap saved to your workspace library.
          </p>
        </div>
      </div>
    </ExtensionPanelShellMock>
  )
}
