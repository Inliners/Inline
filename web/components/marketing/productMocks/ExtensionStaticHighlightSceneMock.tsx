import ExtensionAskPanelMock from '@/components/marketing/productMocks/ExtensionAskPanelMock'
import ExtensionDockMock from '@/components/marketing/productMocks/ExtensionDockMock'
import ExtensionSelectionToolbarMock from '@/components/marketing/productMocks/ExtensionSelectionToolbarMock'
import { DEMO_DOMAIN } from '@/components/marketing/productMocks/sampleData'
import { cn } from '@/lib/utils'

const PAGE_LINES = [
  'The introduction sets up the main argument.',
  'Key terms are defined in the opening paragraphs.',
  'The author states the central point in section two.',
  'A supporting example appears midway through the page.',
] as const

type ExtensionStaticHighlightSceneMockProps = {
  className?: string
  badgeShape?: 'circle' | 'square'
}

function HighlightLine() {
  return (
    <p className="text-[11px] leading-[18px] text-foreground/40">
      The author states the{' '}
      <span className="rounded-[3px] bg-[#FEF08A] px-0.5 text-foreground/85">
        central point
      </span>{' '}
      in section two.
    </p>
  )
}

export default function ExtensionStaticHighlightSceneMock({
  className,
  badgeShape = 'circle',
}: ExtensionStaticHighlightSceneMockProps) {
  return (
    <div
      className={cn(
        'relative flex flex-col rounded-2xl border border-[#E8DFD4] bg-[#F5EDE3] p-4',
        className,
      )}
      aria-label="Extension preview: highlighting selected text"
    >
      <div className="rounded-xl border border-border/50 bg-card/70 px-3 py-2.5 shadow-sm">
        <p className="truncate text-[10px] text-muted-foreground">{DEMO_DOMAIN}</p>
        <div className="mt-1.5 space-y-1">
          {PAGE_LINES.map((line, index) => (
            index === 2 ? (
              <HighlightLine key={line} />
            ) : (
              <p key={line} className="text-[11px] leading-[18px] text-foreground/40">
                {line}
              </p>
            )
          ))}
        </div>
        <div className="mt-3 flex justify-center">
          <ExtensionSelectionToolbarMock />
        </div>
      </div>

      <div className="mt-4 flex flex-col items-center gap-3">
        <ExtensionAskPanelMock
          compact
          elevated={false}
          className="w-full max-w-[342px]"
          badgeShape={badgeShape}
        />
        <ExtensionDockMock
          activeIndex={2}
          orientation="horizontal"
          showNotebook={false}
          className="shrink-0"
        />
      </div>
    </div>
  )
}
