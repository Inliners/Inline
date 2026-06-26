import {
  ExtensionActionTile,
  ExtensionChipMock,
  ExtensionComposerMock,
  ExtensionPanelShellMock,
  ExtensionSectionLabel,
  ExtensionSegmentedMock,
} from '@/components/marketing/productMocks/ExtensionPanelShellMock'
import { IconRewrite } from '@/components/marketing/extensionToolIcons'
import { cn } from '@/lib/utils'

const REWRITE_ACTIONS = [
  { label: 'Rephrase', desc: 'Reword while keeping the meaning', icon: <IconRewrite size={16} /> },
  { label: 'Shorten', desc: 'Trim it down without losing the point', icon: <IconRewrite size={16} /> },
  { label: 'Summarize', desc: 'Condense to the essentials', icon: <IconRewrite size={16} /> },
] as const

const COMPACT_REWRITE_ACTIONS = REWRITE_ACTIONS.slice(0, 2)

const PROMPT_CHIPS = ['Explain like I\'m 5', 'Pros and cons', 'Key quotes', 'Action items'] as const

type ExtensionRewritePanelMockProps = {
  className?: string
  compact?: boolean
}

export default function ExtensionRewritePanelMock({
  className,
  compact = false,
}: ExtensionRewritePanelMockProps) {
  const actions = compact ? COMPACT_REWRITE_ACTIONS : REWRITE_ACTIONS

  return (
    <ExtensionPanelShellMock
      title="Rewrite"
      subtitle="Reword your selection with AI"
      tool="rewrite"
      className={cn(compact ? undefined : 'min-h-[360px]', className)}
      footer={
        <div className={cn(compact ? 'p-3' : 'p-3.5')}>
          <ExtensionComposerMock placeholder="Describe how to rewrite it..." modeLabel="Casual" />
        </div>
      }
    >
      <div className={cn('flex flex-col', compact ? 'gap-3 p-4' : 'gap-4 p-5')}>
        <div>
          <ExtensionSectionLabel>Tone</ExtensionSectionLabel>
          <ExtensionSegmentedMock
            options={[
              { value: 'formal', label: 'Formal' },
              { value: 'casual', label: 'Casual' },
              { value: 'concise', label: 'Concise' },
            ]}
            value="casual"
          />
        </div>

        <div>
          <ExtensionSectionLabel>Rewrite as</ExtensionSectionLabel>
          <div className={cn(compact ? 'space-y-1.5' : 'space-y-2')}>
            {actions.map(action => (
              <ExtensionActionTile
                key={action.label}
                icon={action.icon}
                label={action.label}
                desc={compact ? undefined : action.desc}
                className={compact ? 'py-2' : undefined}
              />
            ))}
          </div>
        </div>

        {!compact && (
          <div>
            <ExtensionSectionLabel>Quick prompts</ExtensionSectionLabel>
            <div className="flex flex-wrap gap-1.5">
              {PROMPT_CHIPS.map(chip => (
                <ExtensionChipMock key={chip} label={chip} />
              ))}
            </div>
          </div>
        )}
      </div>
    </ExtensionPanelShellMock>
  )
}
