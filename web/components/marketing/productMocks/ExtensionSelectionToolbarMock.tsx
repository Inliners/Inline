import { cn } from '@/lib/utils'

const TB = {
  bg: '#FFFFFF',
  border: '#d6d3d1',
  divider: 'rgba(28, 30, 38, 0.09)',
  shadow:
    '0 14px 40px -8px rgba(28, 30, 38, 0.34), 0 6px 18px -4px rgba(28, 30, 38, 0.2)',
  text: '#78716c',
  radius: 10,
  radiusInner: 8,
  highlightSwatch: 'rgba(250, 204, 21, 0.45)',
} as const

function ToolbarSep() {
  return (
    <div
      className="mx-1 h-5 w-px shrink-0"
      style={{ background: TB.divider }}
      aria-hidden
    />
  )
}

function TextPill({ children }: { children: React.ReactNode }) {
  return (
    <span
      className="inline-flex items-center justify-center whitespace-nowrap py-1.5 text-[12.5px] font-medium leading-none tracking-tight"
      style={{
        padding: '6px 11px',
        borderRadius: TB.radiusInner,
        color: TB.text,
        letterSpacing: '-0.01em',
      }}
    >
      {children}
    </span>
  )
}

type ExtensionSelectionToolbarMockProps = {
  className?: string
}

/** Simplified SmartOverlay selection toolbar for marketing. */
export default function ExtensionSelectionToolbarMock({ className }: ExtensionSelectionToolbarMockProps) {
  return (
    <div
      className={cn('inline-flex w-max origin-top scale-[0.66] items-center gap-px min-[420px]:scale-[0.78] sm:scale-100', className)}
      style={{
        background: TB.bg,
        border: `1px solid ${TB.border}`,
        borderRadius: TB.radius,
        padding: '5px 6px',
        boxShadow: TB.shadow,
      }}
    >
      <TextPill>
        <span className="inline-flex items-center gap-[7px]">
          Highlight
          <span
            className="shrink-0 border"
            style={{
              width: 15,
              height: 15,
              borderRadius: 5,
              background: TB.highlightSwatch,
              borderColor: TB.divider,
            }}
          />
          <span className="text-[9px]" style={{ color: TB.text, marginLeft: -2 }}>
            ▾
          </span>
        </span>
      </TextPill>

      <ToolbarSep />

      <TextPill>Summarize</TextPill>
      <TextPill>Rephrase</TextPill>
      <TextPill>Shorten</TextPill>

      <ToolbarSep />

      <TextPill>Note</TextPill>
    </div>
  )
}
