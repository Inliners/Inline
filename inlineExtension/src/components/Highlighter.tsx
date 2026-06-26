import { useState, useCallback } from 'react'
import { PANEL as C, FONT } from '../lib/extensionTheme'
import { PanelShell, SectionLabel } from './panelKit'
import { wrapSelectionWithHighlight } from '../content/highlightWrap'

const SWATCHES: { value: string; name: string }[] = [
  { value: '#FDE68A', name: 'Yellow' }, { value: '#A7F3D0', name: 'Mint' },
  { value: '#BFDBFE', name: 'Sky' }, { value: '#FBCFE8', name: 'Pink' },
  { value: '#FDBA74', name: 'Orange' }, { value: '#C4B5FD', name: 'Violet' },
  { value: '#99F6E4', name: 'Teal' }, { value: '#FCA5A5', name: 'Coral' },
  { value: '#D9F99D', name: 'Lime' }, { value: '#E9D5FF', name: 'Lilac' },
]

interface HighlighterProps {
  onClose: () => void
}

export default function Highlighter({ onClose }: HighlighterProps) {
  const [active, setActive] = useState<string>(SWATCHES[0].value)

  const applyHighlight = useCallback((color: string) => {
    setActive(color)
    wrapSelectionWithHighlight('color', color)
  }, [])

  const activeName = SWATCHES.find(s => s.value === active)?.name ?? 'Yellow'

  return (
    <PanelShell title="Highlight" subtitle="Select text, then pick a colour" chip={activeName} width={296} tool="highlighter" onClose={onClose}>
      <div style={{ padding: '18px 18px 20px', fontFamily: FONT }}>
        <SectionLabel>Highlight colour</SectionLabel>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(5, 1fr)', gap: 12 }}>
          {SWATCHES.map(({ value, name }) => {
            const on = active === value
            return (
              <button
                key={value} type="button"
                onClick={() => applyHighlight(value)}
                aria-label={`Highlight ${name}`}
                aria-pressed={on}
                style={{
                  height: 44, borderRadius: C.radius, background: value, cursor: 'pointer',
                  border: on ? `2.5px solid ${C.accent}` : `1px solid rgba(17,19,33,0.08)`,
                  boxShadow: 'none',
                  transform: 'none',
                  transition: 'border-color 0.15s',
                  padding: 0,
                }}
              />
            )
          })}
        </div>
        <p style={{
          margin: '16px 2px 0', fontSize: 11.5, color: C.textLight, lineHeight: 1.5,
          display: 'flex', alignItems: 'center', gap: 7,
        }}>
          <span style={{ width: 6, height: 6, borderRadius: '50%', background: '#5BE49B', flexShrink: 0 }} />
          Highlight mode is on — drag across any text to colour it.
        </p>
      </div>
    </PanelShell>
  )
}
