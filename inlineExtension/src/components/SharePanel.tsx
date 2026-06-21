import { useState, useCallback } from 'react'
import { PANEL as C, FONT } from '../lib/extensionTheme'
import { PanelShell, Spinner, SectionLabel, Checkbox } from './panelKit'

const ICopy = () => (
  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <rect x="9" y="9" width="13" height="13" rx="2" /><path d="M5 15H4a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h9a2 2 0 0 1 2 2v1" />
  </svg>
)
const ICheck = () => (
  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.4" strokeLinecap="round" strokeLinejoin="round">
    <path d="M20 6L9 17l-5-5" />
  </svg>
)

const LAYER_OPTIONS = [
  { key: 'highlights', label: 'Highlights' },
  { key: 'drawPaths', label: 'Drawings' },
  { key: 'stickies', label: 'Sticky notes' },
  { key: 'stamps', label: 'Stamps' },
  { key: 'handwriting', label: 'Handwriting' },
] as const

interface SharePanelProps {
  onClose: () => void
}

export default function SharePanel({ onClose }: SharePanelProps) {
  const [layers, setLayers] = useState<Record<string, boolean>>(
    Object.fromEntries(LAYER_OPTIONS.map(l => [l.key, true])),
  )
  const [shareUrl, setShareUrl] = useState<string | null>(null)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [copied, setCopied] = useState(false)

  const toggleLayer = useCallback((key: string) => {
    setLayers(prev => ({ ...prev, [key]: !prev[key] }))
  }, [])

  const handleShare = useCallback(() => {
    setLoading(true)
    setError(null)
    const selectedLayers = Object.entries(layers).filter(([, v]) => v).map(([k]) => k)
    try {
      if (!chrome.runtime?.id) { setLoading(false); setError('Extension was reloaded — please refresh the page'); return }
      chrome.runtime.sendMessage(
        { type: 'SHARE_ANNOTATIONS', payload: { pageUrl: window.location.href, layers: selectedLayers } },
        (response) => {
          setLoading(false)
          if (chrome.runtime.lastError) { setError('Extension error'); return }
          if (!response?.ok) { setError(response?.error ?? 'Failed to create share link'); return }
          setShareUrl(response.shareUrl)
        },
      )
    } catch {
      setLoading(false)
      setError('Extension context unavailable')
    }
  }, [layers])

  const handleCopy = useCallback(() => {
    if (!shareUrl) return
    navigator.clipboard.writeText(shareUrl).then(() => {
      setCopied(true)
      setTimeout(() => setCopied(false), 2000)
    })
  }, [shareUrl])

  return (
    <PanelShell
      title="Share"
      subtitle="Create a public view-only link"
      width={318}
      onClose={onClose}
      footer={!shareUrl ? (
        <div style={{ padding: '12px 16px' }}>
          <button
            type="button"
            onClick={handleShare}
            disabled={loading}
            aria-label="Create share link"
            style={{
              width: '100%', padding: '12px 0', fontSize: 13.5, fontWeight: 700,
              borderRadius: 14, border: 'none',
              background: C.accent, color: '#fff', cursor: loading ? 'wait' : 'pointer',
              opacity: loading ? 0.75 : 1, transition: 'opacity 0.15s',
              letterSpacing: '-0.01em', display: 'inline-flex', alignItems: 'center',
              justifyContent: 'center', gap: 9, fontFamily: FONT,
              boxShadow: 'none',
            }}
          >
            {loading && <Spinner size={15} />}
            {loading ? 'Creating link…' : 'Create share link'}
          </button>
        </div>
      ) : undefined}
    >
      <div style={{ padding: '16px 18px 18px', fontFamily: FONT }}>
        <SectionLabel>Include layers</SectionLabel>
        <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
          {LAYER_OPTIONS.map(l => (
            <Checkbox key={l.key} checked={layers[l.key]} onChange={() => toggleLayer(l.key)} label={l.label} />
          ))}
        </div>

        {shareUrl && (
          <div style={{ marginTop: 16 }}>
            <SectionLabel>Your link</SectionLabel>
            <div style={{
              display: 'flex', alignItems: 'center', gap: 7,
              background: C.surfaceBubble, borderRadius: 13,
              padding: '7px 7px 7px 12px', border: `1px solid ${C.border}`, boxShadow: C.shadowSoft,
            }}>
              <input
                readOnly
                value={shareUrl}
                aria-label="Share link"
                style={{
                  flex: 1, border: 'none', background: 'transparent',
                  fontSize: 11.5, color: C.text, fontFamily: FONT, outline: 'none', minWidth: 0,
                }}
              />
              <button
                type="button"
                onClick={handleCopy}
                aria-label={copied ? 'Copied' : 'Copy link'}
                style={{
                  display: 'inline-flex', alignItems: 'center', justifyContent: 'center',
                  width: 32, height: 32, border: 'none',
                  borderRadius: 10, background: copied ? '#dcfce7' : C.accent,
                  cursor: 'pointer', color: copied ? '#16a34a' : '#fff',
                  transition: 'background 0.15s, color 0.15s', padding: 0, flexShrink: 0,
                }}
              >
                {copied ? <ICheck /> : <ICopy />}
              </button>
            </div>
            <p style={{ margin: '8px 2px 0', fontSize: 11.5, color: copied ? '#16a34a' : C.textLight, lineHeight: 1.5 }}>
              {copied ? 'Copied to clipboard.' : 'Anyone with this link can view your annotations.'}
            </p>
          </div>
        )}

        {error && (
          <div style={{
            marginTop: 14, padding: '10px 12px', borderRadius: 13,
            background: '#FEF2F2', border: '1px solid rgba(220,38,38,0.18)',
            fontSize: 12, color: '#DC2626', lineHeight: 1.5,
          }}>
            {error}
          </div>
        )}
      </div>
    </PanelShell>
  )
}
