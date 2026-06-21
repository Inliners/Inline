import { useState, useCallback, useEffect } from 'react'
import { PANEL as C, FONT } from '../lib/extensionTheme'
import { PanelShell, Toggle, SectionLabel } from './panelKit'

const IExtLink = () => (
  <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <path d="M18 13v6a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h6" /><polyline points="15 3 21 3 21 9" /><line x1="10" y1="14" x2="21" y2="3" />
  </svg>
)
const IPause = () => (
  <svg width="15" height="15" viewBox="0 0 24 24" fill="currentColor"><rect x="6" y="5" width="4" height="14" rx="1.4" /><rect x="14" y="5" width="4" height="14" rx="1.4" /></svg>
)
const IChevron = () => (
  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><polyline points="6 9 12 15 18 9" /></svg>
)

interface SettingsProps {
  onClose: () => void
  onOpenDashboard: () => void
}

export default function Settings({ onClose, onOpenDashboard }: SettingsProps) {
  const [screenReader, setScreenReader] = useState(false)
  const [highContrast, setHighContrast] = useState(false)
  const [immersiveReader, setImmersiveReader] = useState(false)
  const [language, setLanguage] = useState('en-US')
  const [paused, setPaused] = useState(false)
  const [blockedDomains, setBlockedDomains] = useState<string[]>([])
  const [newDomain, setNewDomain] = useState('')

  useEffect(() => {
    chrome.storage.local.get(
      ['inlineBlockedDomains', 'inlineScreenReader', 'inlineFocusMode'],
      (r) => {
        try {
          const raw = r.inlineBlockedDomains
          if (typeof raw === 'string') {
            const parsed = JSON.parse(raw)
            if (Array.isArray(parsed)) setBlockedDomains(parsed)
          }
        } catch { /* keep default */ }
        setScreenReader(r.inlineScreenReader === 'true' || r.inlineScreenReader === true)
        setImmersiveReader(r.inlineFocusMode === 'true' || r.inlineFocusMode === true)
      },
    )
  }, [])

  const toggleScreenReader = useCallback((v: boolean) => {
    setScreenReader(v)
    chrome.storage.local.set({ inlineScreenReader: String(v) })
    document.dispatchEvent(new CustomEvent('inline:screenReader', { detail: { enabled: v } }))
  }, [])

  const persistBlocked = useCallback((domains: string[]) => {
    setBlockedDomains(domains)
    chrome.storage.local.set({ inlineBlockedDomains: JSON.stringify(domains) })
  }, [])

  const addDomain = useCallback(() => {
    const d = newDomain.trim().toLowerCase().replace(/^https?:\/\//, '').replace(/\/.*$/, '')
    if (!d || blockedDomains.includes(d)) return
    persistBlocked([...blockedDomains, d])
    setNewDomain('')
  }, [newDomain, blockedDomains, persistBlocked])

  const removeDomain = useCallback((domain: string) => {
    persistBlocked(blockedDomains.filter(d => d !== domain))
  }, [blockedDomains, persistBlocked])

  const toggleHighContrast = useCallback((v: boolean) => {
    setHighContrast(v)
    try {
      const body = document.body ?? document.documentElement
      body.style.filter = v ? 'contrast(150%)' : ''
    } catch { /* sandboxed */ }
  }, [])

  return (
    <PanelShell
      title="Settings"
      subtitle="Global preferences"
      width={340}
      onClose={onClose}
      footer={
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '12px 16px' }}>
          <button type="button" onClick={onOpenDashboard} style={{
            display: 'flex', alignItems: 'center', gap: 7,
            border: `1px solid ${C.border}`, background: C.surfaceBubble, cursor: 'pointer',
            fontSize: 12.5, fontWeight: 650, color: C.text, padding: '9px 14px',
            borderRadius: C.radiusPill, fontFamily: FONT, boxShadow: C.shadowSoft,
          }}>
            All settings <IExtLink />
          </button>
          <button type="button" onClick={() => setPaused(p => !p)} aria-label={paused ? 'Resume Inline' : 'Pause Inline'} style={{
            display: 'inline-flex', alignItems: 'center', justifyContent: 'center',
            width: 40, height: 40, borderRadius: 13, border: `1px solid ${paused ? 'rgba(220,38,38,0.25)' : C.border}`,
            background: paused ? '#FEF2F2' : C.surfaceBubble, cursor: 'pointer',
            color: paused ? '#DC2626' : C.textMuted, boxShadow: C.shadowSoft,
          }}>
            <IPause />
          </button>
        </div>
      }
    >
      <div style={{ padding: '16px 18px 18px', fontFamily: FONT }}>
        {/* Accessibility */}
        <SectionLabel>Accessibility</SectionLabel>
        <div style={{
          border: `1px solid ${C.border}`, borderRadius: 18, overflow: 'hidden',
          marginBottom: 18, background: C.surfaceBubble, boxShadow: C.shadowCard,
        }}>
          <Row label="Screen reader" desc="Announce captured text" right={<Toggle checked={screenReader} onChange={toggleScreenReader} label="screen reader" />} />
          <Row label="High contrast" desc="Boost page contrast" border right={<Toggle checked={highContrast} onChange={toggleHighContrast} label="high contrast" />} />
          <Row label="Immersive reader" desc="Distraction-free reading" border right={<Toggle checked={immersiveReader} onChange={v => {
            setImmersiveReader(v)
            chrome.storage.local.set({ inlineFocusMode: String(v) })
            document.dispatchEvent(new CustomEvent('inline:focusMode', { detail: { enabled: v } }))
          }} label="immersive reader" />} />
        </div>

        {/* Language */}
        <SectionLabel>Language</SectionLabel>
        <div style={{
          display: 'flex', alignItems: 'center', justifyContent: 'space-between',
          padding: '12px 14px', border: `1px solid ${C.border}`, borderRadius: 18,
          background: C.surfaceBubble, boxShadow: C.shadowCard, marginBottom: 18,
        }}>
          <span style={{ fontSize: 13, fontWeight: 650, color: C.text }}>Interface language</span>
          <div style={{ position: 'relative', display: 'inline-flex', alignItems: 'center' }}>
            <select
              value={language}
              onChange={e => setLanguage(e.target.value)}
              aria-label="Interface language"
              style={{
                appearance: 'none', WebkitAppearance: 'none', MozAppearance: 'none',
                padding: '8px 30px 8px 14px', border: `1px solid ${C.border}`, borderRadius: C.radiusPill,
                fontSize: 12, color: C.text, background: C.surfaceSunken, cursor: 'pointer',
                outline: 'none', fontFamily: FONT, fontWeight: 600,
              }}
            >
              <option value="en-US">English (US)</option>
              <option value="en-GB">English (UK)</option>
              <option value="es">Español</option>
              <option value="fr">Français</option>
              <option value="de">Deutsch</option>
              <option value="pt">Português</option>
            </select>
            <span style={{ position: 'absolute', right: 10, pointerEvents: 'none', color: C.textMuted, display: 'inline-flex' }}><IChevron /></span>
          </div>
        </div>

        {/* Blocked sites */}
        <SectionLabel>Blocked sites</SectionLabel>
        <div style={{
          border: `1px solid ${C.border}`, borderRadius: 18,
          background: C.surfaceBubble, boxShadow: C.shadowCard, padding: 14,
        }}>
          {blockedDomains.length > 0 && (
            <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6, marginBottom: 11 }}>
              {blockedDomains.map(d => (
                <span key={d} style={{
                  display: 'inline-flex', alignItems: 'center', gap: 5,
                  padding: '5px 6px 5px 11px', borderRadius: C.radiusPill,
                  border: `1px solid ${C.border}`, background: C.surfaceSunken,
                  fontSize: 11.5, fontWeight: 600, color: C.text, fontFamily: FONT,
                }}>
                  {d}
                  <button type="button" onClick={() => removeDomain(d)} aria-label={`Unblock ${d}`} style={{
                    display: 'inline-flex', alignItems: 'center', justifyContent: 'center',
                    width: 16, height: 16, border: 'none', background: C.hoverBg, cursor: 'pointer',
                    padding: 0, lineHeight: 1, fontSize: 12, color: C.textMuted, fontWeight: 700, borderRadius: '50%',
                  }}>×</button>
                </span>
              ))}
            </div>
          )}
          <div style={{ display: 'flex', gap: 8 }}>
            <input
              value={newDomain}
              onChange={e => setNewDomain(e.target.value)}
              onKeyDown={e => { if (e.key === 'Enter') addDomain() }}
              placeholder="example.com"
              aria-label="Domain to block"
              style={{
                flex: 1, padding: '9px 14px', border: `1px solid ${C.border}`,
                borderRadius: C.radiusPill, fontSize: 12.5, outline: 'none',
                color: C.text, background: C.surfaceSunken, fontFamily: FONT,
              }}
            />
            <button type="button" onClick={addDomain} aria-label="Block domain" style={{
              padding: '9px 16px', borderRadius: C.radiusPill, border: 'none',
              background: C.accent, color: '#fff', fontSize: 12.5, fontWeight: 700, cursor: 'pointer',
              fontFamily: FONT, boxShadow: 'none',
            }}>Add</button>
          </div>
        </div>
      </div>
    </PanelShell>
  )
}

function Row({ label, desc, right, border }: { label: string; desc?: string; right: React.ReactNode; border?: boolean }) {
  return (
    <div style={{
      display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 12,
      padding: '13px 14px',
      ...(border ? { borderTop: `1px solid ${C.divider}` } : {}),
    }}>
      <span style={{ minWidth: 0 }}>
        <span style={{ display: 'block', fontSize: 13, fontWeight: 650, color: C.text, letterSpacing: '-0.01em' }}>{label}</span>
        {desc && <span style={{ display: 'block', fontSize: 11, color: C.textLight }}>{desc}</span>}
      </span>
      {right}
    </div>
  )
}
