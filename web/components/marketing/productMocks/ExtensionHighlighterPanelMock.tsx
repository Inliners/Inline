import {
  ExtensionPanelShellMock,
  ExtensionSectionLabel,
} from '@/components/marketing/productMocks/ExtensionPanelShellMock'
import { cn } from '@/lib/utils'

const SWATCHES = [
  '#FDE68A',
  '#A7F3D0',
  '#BFDBFE',
  '#FBCFE8',
  '#FDBA74',
  '#C4B5FD',
  '#99F6E4',
  '#FCA5A5',
  '#D9F99D',
  '#E9D5FF',
] as const

type ExtensionHighlighterPanelMockProps = {
  className?: string
}

export default function ExtensionHighlighterPanelMock({ className }: ExtensionHighlighterPanelMockProps) {
  return (
    <ExtensionPanelShellMock
      title="Highlight"
      subtitle="Select text, then pick a colour"
      chip="Yellow"
      tool="highlighter"
      width={296}
      className={cn('min-h-[360px]', className)}
    >
      <div className="p-[18px] pb-5">
        <ExtensionSectionLabel>Highlight colour</ExtensionSectionLabel>
        <div className="grid grid-cols-5 gap-3">
          {SWATCHES.map((color, index) => (
            <div
              key={color}
              className="h-11 rounded-[14px]"
              style={{
                background: color,
                border: index === 0 ? '2.5px solid #1C1E26' : '1px solid rgba(17,19,33,0.08)',
              }}
            />
          ))}
        </div>
        <p className="mt-4 flex items-center gap-1.5 text-[11.5px] leading-relaxed text-muted-foreground">
          <span className="h-1.5 w-1.5 shrink-0 rounded-full bg-[#5BE49B]" aria-hidden />
          Highlight mode is on — drag across any text to colour it.
        </p>
      </div>
    </ExtensionPanelShellMock>
  )
}
