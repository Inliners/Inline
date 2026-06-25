import { useState, useCallback } from 'react'
import { PANEL as C, FONT } from '../lib/extensionTheme'
import { PanelShell, SectionLabel, PanelSection, panelBodyStyle } from './panelKit'

const STAMP_SYMBOLS = ['✓', '✗', '?', '!', '★', '♥', '+', '−', '→', '•']

interface StampsProps {
  onClose: () => void
}

export default function Stamps({ onClose }: StampsProps) {
  const [placing, setPlacing] = useState<string | null>(null)

  const handleStampClick = useCallback((symbol: string) => {
    setPlacing(symbol)
    document.dispatchEvent(new CustomEvent('inline:stampPlace', { detail: { emoji: symbol } }))
    const onPlaced = () => {
      setPlacing(null)
      document.removeEventListener('inline:stampPlaced', onPlaced)
    }
    document.addEventListener('inline:stampPlaced', onPlaced)
  }, [])

  const cancelPlacing = useCallback(() => setPlacing(null), [])

  return (
    <PanelShell title="Stamp" subtitle="Pick a stamp, then click the page" width={306} tool="stamps" onClose={onClose}>
      {placing && (
        <div style={{
          display: 'flex', alignItems: 'center', justifyContent: 'space-between',
          margin: '14px 18px 0', padding: '10px 14px', borderRadius: C.radius,
          background: C.accent, color: '#fff', fontFamily: FONT,
          boxShadow: 'none',
        }}>
          <span style={{ display: 'inline-flex', alignItems: 'center', gap: 8, fontSize: 12.5, fontWeight: 600 }}>
            <span style={{ width: 6, height: 6, borderRadius: '50%', background: '#5BE49B' }} />
            Click anywhere to place {placing}
          </span>
          <button type="button" onClick={cancelPlacing} aria-label="Cancel placing" style={{
            border: 'none', background: 'rgba(255,255,255,0.16)', cursor: 'pointer',
            fontSize: 11, fontWeight: 700, color: '#fff', fontFamily: FONT,
            padding: '5px 11px', borderRadius: C.radiusPill,
          }}>Cancel</button>
        </div>
      )}

      <div style={{ ...panelBodyStyle, fontFamily: FONT }}>
        <div>
          <SectionLabel>Symbols</SectionLabel>
          <PanelSection style={{ padding: 12 }}>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(5, 1fr)', gap: 10 }}>
          {STAMP_SYMBOLS.map(sym => {
            const on = placing === sym
            return (
              <button
                key={sym}
                type="button"
                onClick={() => handleStampClick(sym)}
                aria-label={`Stamp ${sym}`}
                aria-pressed={on}
                style={{
                  aspectRatio: '1', display: 'flex', alignItems: 'center', justifyContent: 'center',
                  fontSize: 20, fontWeight: 600,
                  border: `1px solid ${on ? C.accent : C.border}`,
                  borderRadius: C.radius,
                  background: on ? C.accent : C.surfaceBubble,
                  color: on ? '#fff' : C.text,
                  cursor: 'pointer', padding: 0, fontFamily: FONT,
                  boxShadow: 'none',
                  transition: 'background 0.14s, border-color 0.14s, color 0.14s',
                }}
              >{sym}</button>
            )
          })}
            </div>
          </PanelSection>
        </div>
      </div>
    </PanelShell>
  )
}
