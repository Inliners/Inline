import { useState, useCallback, useEffect } from 'react'
import { PANEL as C, FONT } from '../lib/extensionTheme'
import { PanelShell, Toggle, SectionLabel, PanelSection, panelBodyStyle } from './panelKit'
import { GUEST_AI_LIMIT, getAiAccessState, looksLikeJwt } from '../lib/aiAccess'

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
  const [account, setAccount] = useState({
    signedIn: false,
    hasWorkspace: false,
    name: '',
    email: '',
    avatarUrl: '',
    guestRemaining: GUEST_AI_LIMIT,
  })

  useEffect(() => {
    chrome.storage.local.get(
      [
        'inlineBlockedDomains', 'inlineScreenReader', 'inlineFocusMode',
        'inlineAccessToken', 'inlineActiveWorkspaceId', 'inlineUserId',
        'inlineUserName', 'inlineUserEmail', 'inlineUserAvatarUrl',
      ],
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
        void getAiAccessState().then(access => {
          setAccount({
            signedIn: looksLikeJwt(r.inlineAccessToken),
            hasWorkspace: typeof r.inlineActiveWorkspaceId === 'string' && r.inlineActiveWorkspaceId.length > 0,
            name: typeof r.inlineUserName === 'string' ? r.inlineUserName : '',
            email: typeof r.inlineUserEmail === 'string' ? r.inlineUserEmail : '',
            avatarUrl: typeof r.inlineUserAvatarUrl === 'string' ? r.inlineUserAvatarUrl : '',
            guestRemaining: Number.isFinite(access.remaining) ? access.remaining : GUEST_AI_LIMIT,
          })
        })
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

  const profileLabel = account.name || account.email || 'Connected account'
  const profileInitial = (profileLabel.trim()[0] || 'I').toUpperCase()

  return (
    <PanelShell
      title="Settings"
      subtitle="Global preferences"
      width={340}
      tool="settings"
      onClose={onClose}
      footer={
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '12px 16px' }}>
          <button type="button" onClick={onOpenDashboard} style={{
            display: 'flex', alignItems: 'center', gap: 7,
            border: `1px solid ${C.border}`, background: C.surfaceBubble, cursor: 'pointer',
            fontSize: 12.5, fontWeight: 650, color: C.text, padding: '9px 14px',
            borderRadius: C.radiusPill, fontFamily: FONT, boxShadow: 'none',
          }}>
            All settings <IExtLink />
          </button>
          <button type="button" onClick={() => setPaused(p => !p)} aria-label={paused ? 'Resume Inline' : 'Pause Inline'} style={{
            display: 'inline-flex', alignItems: 'center', justifyContent: 'center',
            width: 40, height: 40, borderRadius: 13, border: `1px solid ${paused ? 'rgba(220,38,38,0.25)' : C.border}`,
            background: paused ? '#FEF2F2' : C.surfaceBubble, cursor: 'pointer',
            color: paused ? '#DC2626' : C.textMuted, boxShadow: 'none',
          }}>
            <IPause />
          </button>
        </div>
      }
    >
      <div style={{ ...panelBodyStyle, fontFamily: FONT }}>
        <div>
          <SectionLabel>Account</SectionLabel>
          <PanelSection>
          <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', gap: 12 }}>
            <span style={{ display: 'flex', alignItems: 'flex-start', gap: 10, minWidth: 0 }}>
              {account.signedIn ? (
                <span style={{
                  width: 32,
                  height: 32,
                  borderRadius: 10,
                  overflow: 'hidden',
                  background: C.accent,
                  color: '#FFFFFF',
                  display: 'inline-flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  fontSize: 13,
                  fontWeight: 800,
                  flexShrink: 0,
                }}>
                  {account.avatarUrl
                    ? <img src={account.avatarUrl} alt="" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                    : profileInitial}
                </span>
              ) : (
                <span style={{
                  width: 9,
                  height: 9,
                  borderRadius: '50%',
                  marginTop: 5,
                  background: '#D97706',
                  boxShadow: '0 0 0 3px rgba(217, 119, 6, 0.13)',
                  flexShrink: 0,
                }} />
              )}
              <span style={{ minWidth: 0 }}>
                <span style={{ display: 'block', fontSize: 13, fontWeight: 700, color: C.text, letterSpacing: '-0.01em' }}>
                  {account.signedIn ? profileLabel : 'Guest mode'}
                </span>
                <span style={{ display: 'block', marginTop: 2, fontSize: 11.5, color: C.textLight, lineHeight: 1.45 }}>
                  {account.signedIn
                    ? account.hasWorkspace
                      ? 'Workspace sync is on. AI is fully unlocked.'
                      : 'Open the dashboard to finish workspace sync.'
                    : `Saved to this browser. ${account.guestRemaining} of ${GUEST_AI_LIMIT} guest AI prompts left.`}
                </span>
              </span>
            </span>
            <button type="button" onClick={onOpenDashboard} style={{
              border: `1px solid ${C.border}`,
              background: account.signedIn ? C.surfaceSunken : C.accent,
              color: account.signedIn ? C.text : '#FFFFFF',
              borderRadius: C.radiusPill,
              padding: '7px 11px',
              fontSize: 11.5,
              fontWeight: 700,
              cursor: 'pointer',
              fontFamily: FONT,
              boxShadow: 'none',
              flexShrink: 0,
            }}>
              {account.signedIn ? 'Dashboard' : 'Sign in'}
            </button>
          </div>
          </PanelSection>
        </div>

        <div>
        <SectionLabel>Accessibility</SectionLabel>
        <PanelSection list>
          <Row label="Screen reader" desc="Announce captured text" right={<Toggle checked={screenReader} onChange={toggleScreenReader} label="screen reader" />} />
          <Row label="High contrast" desc="Boost page contrast" border right={<Toggle checked={highContrast} onChange={toggleHighContrast} label="high contrast" />} />
          <Row label="Immersive reader" desc="Distraction-free reading" border right={<Toggle checked={immersiveReader} onChange={v => {
            setImmersiveReader(v)
            chrome.storage.local.set({ inlineFocusMode: String(v) })
            document.dispatchEvent(new CustomEvent('inline:focusMode', { detail: { enabled: v } }))
          }} label="immersive reader" />} />
        </PanelSection>
        </div>

        <div>
        <SectionLabel>Language</SectionLabel>
        <PanelSection style={{
          display: 'flex', alignItems: 'center', justifyContent: 'space-between',
          padding: '10px 12px',
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
              <option value="es">Espanol</option>
              <option value="fr">Francais</option>
              <option value="de">Deutsch</option>
              <option value="pt">Portugues</option>
            </select>
            <span style={{ position: 'absolute', right: 10, pointerEvents: 'none', color: C.textMuted, display: 'inline-flex' }}><IChevron /></span>
          </div>
        </PanelSection>
        </div>

        <div>
        <SectionLabel>Blocked sites</SectionLabel>
        <PanelSection>
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
        </PanelSection>
        </div>
      </div>
    </PanelShell>
  )
}

function Row({ label, desc, right, border }: { label: string; desc?: string; right: React.ReactNode; border?: boolean }) {
  return (
    <div style={{
      display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 12,
      padding: '10px 12px',
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
