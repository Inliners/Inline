import { useState, useCallback, useEffect } from 'react'
import { wrapSelectionWithHighlight } from '../content/highlightWrap'
import { loadSettings } from '../lib/extensionSettings'
import { speakWithElevenLabs, stopSpeaking } from '../lib/elevenLabsTts'
import { PANEL as C, FONT } from '../lib/extensionTheme'
import { PROMPT_TEMPLATES } from '../lib/promptTemplates'
import { fetchViaBackground } from '../lib/backgroundFetch'
import { saveAIResultToHistory } from '../lib/historyApi'
import { buildAIInsertMark } from '../lib/insertBadge'
import { PanelShell, Spinner, SectionLabel, ActionTile, Chip, Composer } from './panelKit'
import { setAiBusy } from '../lib/panelLock'

const ICopy = () => (
  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <rect x="9" y="9" width="13" height="13" rx="2" /><path d="M5 15H4a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h9a2 2 0 0 1 2 2v1" />
  </svg>
)
const IVolume = () => (
  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <polygon points="11 5 6 9 2 9 2 15 6 15 11 19 11 5"/><path d="M19.07 4.93a10 10 0 0 1 0 14.14M15.54 8.46a5 5 0 0 1 0 7.07"/>
  </svg>
)
const IVolumeOff = () => (
  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <polygon points="11 5 6 9 2 9 2 15 6 15 11 19 11 5"/><line x1="23" y1="9" x2="17" y2="15"/><line x1="17" y1="9" x2="23" y2="15"/>
  </svg>
)
const IGlobe = () => (
  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round" strokeLinejoin="round">
    <circle cx="12" cy="12" r="10" /><path d="M2 12h20M12 2a15.3 15.3 0 0 1 4 10 15.3 15.3 0 0 1-4 10 15.3 15.3 0 0 1-4-10 15.3 15.3 0 0 1 4-10z" />
  </svg>
)
/* Quick-action glyphs */
const GSummarize = () => (<svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round"><path d="M4 6h16M4 10h16M4 14h10M4 18h7" /></svg>)
const GRephrase = () => (<svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"><path d="M3 12a9 9 0 0 1 15-6.7L21 8M21 3v5h-5M21 12a9 9 0 0 1-15 6.7L3 16M3 21v-5h5" /></svg>)
const GShorten = () => (<svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"><path d="M8 7l-4 5 4 5M16 7l4 5-4 5M14 4l-4 16" /></svg>)
const GExplain = () => (<svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"><path d="M9 18h6M10 22h4M12 2a7 7 0 0 0-4 12.7c.6.5 1 1.3 1 2.1V17h6v-.2c0-.8.4-1.6 1-2.1A7 7 0 0 0 12 2z" /></svg>)
const GProsCons = () => (<svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"><path d="M12 3v18M3 7h6M5 5v4M15 9h6M18 7v4" /><circle cx="6" cy="14" r="3" /><circle cx="18" cy="16" r="3" /></svg>)
const GActions = () => (<svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"><path d="M9 11l2 2 4-4M4 6h.01M4 12h.01M4 18h.01M9 18h11M9 6h11" /></svg>)

/** Quick actions — all operate on the current text selection. */
const QUICK_ACTIONS: { label: string; desc: string; task: string; instruction?: string; icon: React.ReactNode }[] = [
  { label: 'Summarize', desc: 'Key points', task: 'summarize', icon: <GSummarize /> },
  { label: 'Rephrase', desc: 'Same meaning', task: 'rephrase', icon: <GRephrase /> },
  { label: 'Shorten', desc: 'Make it tight', task: 'shorten', icon: <GShorten /> },
  { label: 'Explain simply', desc: 'Plain language', task: 'rewrite', instruction: 'Explain this clearly in simple, plain language anyone can understand.', icon: <GExplain /> },
  { label: 'Pros & cons', desc: 'Two lists', task: 'rewrite', instruction: 'Summarize this as two short labelled lists: Pros and Cons.', icon: <GProsCons /> },
  { label: 'Action items', desc: 'Checklist', task: 'rewrite', instruction: 'Extract the key takeaways as a short, clear checklist of action items.', icon: <GActions /> },
]

interface AIProps {
  selectedText: string
  originalRange: Range | null
  onClose: () => void
}

export default function AI({ selectedText, originalRange, onClose }: AIProps) {
  const [customPrompt, setCustomPrompt] = useState('')
  const [result, setResult] = useState<string | null>(null)
  const [loading, setLoading] = useState(false)
  const [speaking, setSpeaking] = useState(false)
  const [lastTask, setLastTask] = useState<string>('')
  const [lastInstruction, setLastInstruction] = useState<string | undefined>(undefined)
  const [recapState, setRecapState] = useState<'idle' | 'loading' | 'done' | 'empty' | 'error'>('idle')
  const [pageMeta, setPageMeta] = useState({ title: '', domain: '' })

  useEffect(() => {
    setPageMeta({ title: document.title || 'Untitled page', domain: window.location.hostname })
  }, [])

  const hasSelection = selectedText.trim().length > 0

  const runPageRecap = useCallback(async () => {
    setRecapState('loading')
    setAiBusy(true)
    try {
      const { apiBaseUrl, accessToken } = await loadSettings()
      const workspaceId = await new Promise<string>(resolve => {
        chrome.storage.local.get(['inlineActiveWorkspaceId'], r => {
          resolve(typeof r.inlineActiveWorkspaceId === 'string' && r.inlineActiveWorkspaceId
            ? r.inlineActiveWorkspaceId : 'ws-1')
        })
      })
      const h: Record<string, string> = { 'Content-Type': 'application/json' }
      if (accessToken) h.Authorization = `Bearer ${accessToken}`
      const res = await fetchViaBackground(`${apiBaseUrl}/api/ai/page-recap`, {
        method: 'POST', headers: h,
        body: JSON.stringify({ workspaceId, pageUrl: window.location.href }),
      })
      if (!res.ok) { setRecapState('error'); return }
      const j = await res.json<{ ok?: boolean; skipped?: string }>()
      setRecapState(j.skipped ? 'empty' : 'done')
    } catch {
      setRecapState('error')
    } finally {
      setAiBusy(false)
    }
  }, [])

  function handleSpeak() {
    if (speaking) { stopSpeaking(); setSpeaking(false); return }
    if (!result) return
    void speakWithElevenLabs(result, { onStart: () => setSpeaking(true), onEnd: () => setSpeaking(false) })
  }

  const runTask = useCallback(async (task: string, instruction?: string) => {
    wrapSelectionWithHighlight(task)
    setLoading(true)
    setAiBusy(true)
    setResult(null)
    setLastTask(task)
    setLastInstruction(instruction)
    try {
      const text = selectedText.slice(0, 8000)
      const { apiBaseUrl, accessToken } = await loadSettings()
      const h: Record<string, string> = { 'Content-Type': 'application/json' }
      if (accessToken) h.Authorization = `Bearer ${accessToken}`
      const res = await fetchViaBackground(`${apiBaseUrl}/api/ai/extension-light`, {
        method: 'POST', headers: h,
        body: JSON.stringify({ task, text, instruction }),
      })
      if (res.ok) {
        const j = await res.json<{ result?: string }>()
        const output = j.result ?? 'No result returned.'
        setResult(output)
        if (j.result) {
          const kindMap: Record<string, 'ai-rephrase' | 'ai-shorten' | 'ai-summarize' | 'ai-rewrite' | 'ai-custom'> = {
            rephrase:  'ai-rephrase',
            shorten:   'ai-shorten',
            summarize: 'ai-summarize',
            rewrite:   instruction ? 'ai-custom' : 'ai-rewrite',
          }
          void saveAIResultToHistory({ kind: kindMap[task] ?? 'ai-custom', selection: text, result: output })
        }
      } else {
        setResult('AI request failed. Check settings.')
      }
    } catch {
      setResult('Could not reach AI server.')
    } finally {
      setLoading(false)
      setAiBusy(false)
    }
  }, [selectedText])

  function handleInsert() {
    if (!result || !originalRange) return
    try {
      originalRange.deleteContents()
      const mark = buildAIInsertMark(result, lastTask, lastInstruction)
      originalRange.insertNode(mark)
    } catch { /* range may be invalid if user navigated away */ }
    onClose()
  }

  function handleCopy() {
    if (result) navigator.clipboard.writeText(result)
  }

  /* ─── Assistant home (before result) ─── */
  if (!result && !loading) {
    return (
      <PanelShell
        title="Ask Inline"
        subtitle={hasSelection ? 'Working with your selection' : 'Working with this page'}
        chip={hasSelection ? 'Selection' : 'Page'}
        width={372}
        onClose={onClose}
        footer={
          <div style={{ padding: '12px 16px 14px' }}>
            <Composer
              value={customPrompt}
              onChange={setCustomPrompt}
              onSubmit={() => void runTask('rewrite', customPrompt)}
              placeholder={hasSelection ? 'Ask Inline anything about this text…' : 'Select text on the page to ask Inline'}
              sendDisabled={!hasSelection}
              modeLabel="Auto"
            />
          </div>
        }
      >
        <div style={{ padding: '16px 18px 18px', display: 'flex', flexDirection: 'column', gap: 18 }}>
          {/* Working-context card */}
          <div style={{
            border: `1px solid ${C.border}`, borderRadius: 18,
            background: C.surfaceBubble, padding: 14, boxShadow: C.shadowCard,
          }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 9 }}>
              <span style={{
                display: 'inline-flex', alignItems: 'center', justifyContent: 'center',
                width: 30, height: 30, borderRadius: 9, background: C.surfaceMuted, color: C.accent, flexShrink: 0,
              }}><IGlobe /></span>
              <span style={{ minWidth: 0 }}>
                <span style={{ display: 'block', fontSize: 13, fontWeight: 700, color: C.text, letterSpacing: '-0.01em', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                  {pageMeta.title || 'This page'}
                </span>
                <span style={{ display: 'block', fontSize: 11, color: C.textLight, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                  {pageMeta.domain}
                </span>
              </span>
            </div>
            {hasSelection && (
              <p style={{
                margin: '11px 0 0', padding: '9px 11px', borderRadius: 12,
                background: C.surfaceSunken, fontSize: 11.5, lineHeight: 1.55, color: C.textMuted,
                display: '-webkit-box', WebkitLineClamp: 3, WebkitBoxOrient: 'vertical', overflow: 'hidden',
              }}>“{selectedText.trim()}”</p>
            )}
          </div>

          {/* Quick actions */}
          <div>
            <SectionLabel>Quick actions</SectionLabel>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 9 }}>
              {QUICK_ACTIONS.map(a => (
                <ActionTile
                  key={a.label}
                  icon={a.icon}
                  label={a.label}
                  desc={a.desc}
                  disabled={!hasSelection}
                  onClick={() => void runTask(a.task, a.instruction)}
                />
              ))}
            </div>
            {!hasSelection && (
              <p style={{ margin: '10px 2px 0', fontSize: 11.5, color: C.textLight, lineHeight: 1.5 }}>
                Select text on the page to use these actions.
              </p>
            )}
          </div>

          {/* Whole-page recap */}
          <div>
            <SectionLabel>This page</SectionLabel>
            <ActionTile
              icon={recapState === 'loading' ? <Spinner size={15} /> : <IGlobe />}
              label={recapState === 'loading' ? 'Generating recap…' : 'Page recap'}
              desc="Summarize everything you captured here"
              disabled={recapState === 'loading'}
              onClick={() => void runPageRecap()}
            />
            {recapState === 'done' && <p style={{ margin: '8px 2px 0', fontSize: 11.5, color: '#0f766e' }}>Recap saved to your workspace library.</p>}
            {recapState === 'empty' && <p style={{ margin: '8px 2px 0', fontSize: 11.5, color: C.textMuted }}>No captures on this page yet — highlight or clip something first.</p>}
            {recapState === 'error' && <p style={{ margin: '8px 2px 0', fontSize: 11.5, color: '#b91c1c' }}>Recap failed. Check that you&apos;re signed in to the dashboard.</p>}
          </div>

          {/* Suggestions */}
          {PROMPT_TEMPLATES.length > 0 && (
            <div>
              <SectionLabel>Suggestions</SectionLabel>
              <div style={{ display: 'flex', flexWrap: 'wrap', gap: 7 }}>
                {PROMPT_TEMPLATES.map(t => (
                  <Chip key={t.id} label={t.label} disabled={!hasSelection} onClick={() => void runTask('rewrite', t.prompt)} />
                ))}
              </div>
            </div>
          )}
        </div>
      </PanelShell>
    )
  }

  /* ─── Result / Loading state ─── */
  return (
    <PanelShell
      title="Ask Inline"
      subtitle={loading ? 'Thinking…' : 'Here is your result'}
      chip={lastTask ? (lastInstruction ? 'Custom' : lastTask) : undefined}
      width={364}
      onClose={onClose}
      footer={!loading ? (
        <div style={{ padding: '12px 16px', display: 'flex', alignItems: 'center', gap: 8 }}>
          <button type="button" onClick={() => setResult(null)} aria-label="Back" style={ghostBtn}>Back</button>
          <button type="button" onClick={handleInsert} aria-label="Insert into page" style={primaryBtn}>Insert</button>
          <button type="button" onClick={handleSpeak} aria-label={speaking ? 'Stop speaking' : 'Speak'} style={{ ...iconBtn, marginLeft: 'auto' }}>{speaking ? <IVolumeOff /> : <IVolume />}</button>
          <button type="button" onClick={handleCopy} aria-label="Copy" style={iconBtn}><ICopy /></button>
        </div>
      ) : undefined}
    >
      <div style={{ padding: 18 }}>
        <div style={{
          padding: 16, border: `1px solid ${C.border}`, borderRadius: 18,
          fontSize: 13.5, lineHeight: 1.7, color: C.text, minHeight: 80,
          background: C.surfaceBubble, boxShadow: C.shadowCard,
          maxHeight: 320, overflowY: 'auto', whiteSpace: 'pre-wrap',
        }}>
          {loading ? (
            <div style={{ display: 'flex', alignItems: 'center', gap: 10, color: C.textMuted }}>
              <Spinner size={16} /><span style={{ fontStyle: 'italic' }}>Generating…</span>
            </div>
          ) : result}
        </div>
      </div>
    </PanelShell>
  )
}

const ghostBtn: React.CSSProperties = {
  padding: '9px 18px', borderRadius: C.radiusPill,
  border: `1px solid ${C.border}`, background: C.surfaceBubble,
  fontSize: 12.5, fontWeight: 600, cursor: 'pointer', color: C.text, fontFamily: FONT,
  boxShadow: C.shadowSoft,
}
const primaryBtn: React.CSSProperties = {
  padding: '9px 20px', borderRadius: C.radiusPill, border: 'none',
  background: C.accent, color: '#fff', fontSize: 12.5, fontWeight: 700,
  cursor: 'pointer', fontFamily: FONT, boxShadow: 'none',
}
const iconBtn: React.CSSProperties = {
  display: 'inline-flex', alignItems: 'center', justifyContent: 'center',
  width: 36, height: 36, border: `1px solid ${C.border}`, borderRadius: 12,
  background: C.surfaceBubble, cursor: 'pointer', padding: 0, color: C.textMuted,
  boxShadow: C.shadowSoft,
}
