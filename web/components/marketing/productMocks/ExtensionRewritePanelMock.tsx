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

const PROMPT_CHIPS = ['Explain like I\'m 5', 'Pros and cons', 'Key quotes', 'Action items'] as const

type ExtensionRewritePanelMockProps = {
  className?: string
}

export default function ExtensionRewritePanelMock({ className }: ExtensionRewritePanelMockProps) {
  return (
    <ExtensionPanelShellMock
      title="Rewrite"
      subtitle="Reword your selection with AI"
      tool="rewrite"
      className={cn('min-h-[360px]', className)}
      footer={
        <div className="p-3.5">
          <ExtensionComposerMock placeholder="Describe how to rewrite it..." modeLabel="Casual" />
        </div>
      }
    >
      <div className="flex flex-col gap-4 p-5">
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
          <div className="space-y-2">
            {REWRITE_ACTIONS.map(action => (
              <ExtensionActionTile
                key={action.label}
                icon={action.icon}
                label={action.label}
                desc={action.desc}
              />
            ))}
          </div>
        </div>

        <div>
          <ExtensionSectionLabel>Quick prompts</ExtensionSectionLabel>
          <div className="flex flex-wrap gap-1.5">
            {PROMPT_CHIPS.map(chip => (
              <ExtensionChipMock key={chip} label={chip} />
            ))}
          </div>
        </div>
      </div>
    </ExtensionPanelShellMock>
  )
}
