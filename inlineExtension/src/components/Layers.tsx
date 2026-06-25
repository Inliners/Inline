import { useState, useEffect, useCallback } from 'react'
import { PANEL as C, FONT } from '../lib/extensionTheme'
import { PanelShell, Toggle, PanelSection, panelBodyStyle } from './panelKit'
import { loadLayers, saveLayers, type LayerVisibility } from '../lib/layerState'

const IHighlights = () => (<svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"><path d="M9 11l-6 6v3h9l3-3" /><path d="M22 12l-4.6 4.6a2 2 0 0 1-2.8 0l-5.2-5.2a2 2 0 0 1 0-2.8L14 4" /></svg>)
const IDrawings = () => (<svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"><path d="M12 19l7-7 3 3-7 7-3-3z" /><path d="M18 13l-1.5-7.5L2 2l3.5 14.5L13 18l5-5z" /><path d="M2 2l7.586 7.586" /><circle cx="11" cy="11" r="2" /></svg>)
const IStickies = () => (<svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"><path d="M15.5 3H5a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h9l7-7V5a2 2 0 0 0-2-2z" /><path d="M15 21v-5a1 1 0 0 1 1-1h5" /></svg>)
const IStamps = () => (<svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"><polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2" /></svg>)

const LAYER_ROWS: { key: keyof LayerVisibility; label: string; desc: string; icon: React.ReactNode }[] = [
  { key: 'highlights', label: 'Highlights', desc: 'Coloured text marks', icon: <IHighlights /> },
  { key: 'drawings', label: 'Drawings', desc: 'Pen, shapes & arrows', icon: <IDrawings /> },
  { key: 'stickies', label: 'Stickies', desc: 'Sticky & paper notes', icon: <IStickies /> },
  { key: 'stamps', label: 'Stamps', desc: 'Symbol stamps', icon: <IStamps /> },
]

interface LayersProps {
  onClose: () => void
}

export default function Layers({ onClose }: LayersProps) {
  const [layers, setLayers] = useState<LayerVisibility>({
    highlights: true, drawings: true, stickies: true, stamps: true,
  })

  useEffect(() => {
    loadLayers().then(setLayers)
  }, [])

  const handleToggle = useCallback((key: keyof LayerVisibility, value: boolean) => {
    setLayers(prev => {
      const next = { ...prev, [key]: value }
      saveLayers(next)
      document.dispatchEvent(new CustomEvent('inline:layerToggle', { detail: next }))
      return next
    })
  }, [])

  return (
    <PanelShell title="Layers" subtitle="Show or hide annotation types" width={308} tool="layers" onClose={onClose}>
      <div style={{ ...panelBodyStyle, fontFamily: FONT }}>
        <PanelSection list>
          {LAYER_ROWS.map((row, i) => (
            <div key={row.key} style={{
              display: 'flex', alignItems: 'center', gap: 12, padding: '10px 12px',
              ...(i > 0 ? { borderTop: `1px solid ${C.divider}` } : {}),
            }}>
              <span style={{
                display: 'inline-flex', alignItems: 'center', justifyContent: 'center',
                width: 32, height: 32, borderRadius: 10, flexShrink: 0,
                background: layers[row.key] ? C.surfaceMuted : C.surfaceSunken,
                color: layers[row.key] ? C.accent : C.textLight,
                transition: 'color 0.15s',
              }}>{row.icon}</span>
              <span style={{ flex: 1, minWidth: 0 }}>
                <span style={{ display: 'block', fontSize: 13, fontWeight: 650, color: C.text, letterSpacing: '-0.01em' }}>{row.label}</span>
                <span style={{ display: 'block', fontSize: 11, color: C.textLight }}>{row.desc}</span>
              </span>
              <Toggle checked={layers[row.key]} onChange={v => handleToggle(row.key, v)} label={row.label} />
            </div>
          ))}
        </PanelSection>
      </div>
    </PanelShell>
  )
}
