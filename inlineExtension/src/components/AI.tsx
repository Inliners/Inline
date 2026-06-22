import { useState, useCallback, useEffect } from 'react'
import { wrapSelectionWithHighlight } from '../content/highlightWrap'
import { loadSettings } from '../lib/extensionSettings'
import { speakWithElevenLabs, stopSpeaking } from '../lib/elevenLabsTts'
import { PANEL as C, FONT, CHAT } from '../lib/extensionTheme'
import { PROMPT_TEMPLATES } from '../lib/promptTemplates'
import { fetchViaBackground } from '../lib/backgroundFetch'
import { saveAIResultToHistory } from '../lib/historyApi'
import { buildAIInsertMark } from '../lib/insertBadge'
import { GUEST_AI_LIMIT, reserveAiPrompt } from '../lib/aiAccess'
import { PanelShell, Spinner, SectionLabel, ActionTile, Chip, Composer } from './panelKit'
import FormattedAiText from './FormattedAiText'
import { setAiBusy } from '../lib/panelLock'

const ICopy = () => (
  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <rect x="9" y="9" width="13" height="13" rx="2" />
    <path d="M5 15H4a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h9a2 2 0 0 1 2 2v1" />
  </svg>
)
const IVolume = () => (
  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <polygon points="11 5 6 9 2 9 2 15 6 15 11 19 11 5" />
    <path d="M19.07 4.93a10 10 0 0 1 0 14.14M15.54 8.46a5 5 0 0 1 0 7.07" />
  </svg>
)
const IVolumeOff = () => (
  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <polygon points="11 5 6 9 2 9 2 15 6 15 11 19 11 5" />
    <line x1="23" y1="9" x2="17" y2="15" />
    <line x1="17" y1="9" x2="23" y2="15" />
  </svg>
)
const IGlobe = () => (
  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round" strokeLinejoin="round">
    <circle cx="12" cy="12" r="10" />
    <path d="M2 12h20M12 2a15.3 15.3 0 0 1 4 10 15.3 15.3 0 0 1-4 10 15.3 15.3 0 0 1-4-10 15.3 15.3 0 0 1 4-10z" />
  </svg>
)
const GSummarize = () => (
  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round">
    <path d="M4 6h16M4 10h16M4 14h10M4 18h7" />
  </svg>
)
const GRephrase = () => (
  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
    <path d="M3 12a9 9 0 0 1 15-6.7L21 8M21 3v5h-5M21 12a9 9 0 0 1-15 6.7L3 16M3 21v-5h5" />
  </svg>
)
const GShorten = () => (
  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
    <path d="M8 7l-4 5 4 5M16 7l4 5-4 5M14 4l-4 16" />
  </svg>
)
const GActions = () => (
  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
    <path d="M9 11l2 2 4-4M4 6h.01M4 12h.01M4 18h.01M9 18h11M9 6h11" />
  </svg>
)

const QUICK_ACTIONS: { label: string; desc: string; task: string; instruction?: string; icon: React.ReactNode }[] = [
  { label: 'Summarize', desc: 'Key points', task: 'summarize', icon: <GSummarize /> },
  { label: 'Rephrase', desc: 'Same meaning', task: 'rephrase', icon: <GRephrase /> },
  { label: 'Shorten', desc: 'Make it tight', task: 'shorten', icon: <GShorten /> },
  { label: 'Action items', desc: 'Checklist', task: 'rewrite', instruction: 'Extract the key takeaways as a short, clear checklist of action items.', icon: <GActions /> },
]

interface AIProps {
  selectedText: string
  originalRange: Range | null
  onClose: () => void
}

function rangeStartsInEditable(range: Range | null): boolean {
  if (!range) return false
  const node = range.commonAncestorContainer
  const el = node.nodeType === Node.ELEMENT_NODE ? node as Element : node.parentElement
  return !!el?.closest('textarea,input,[contenteditable="true"],[contenteditable="plaintext-only"],[role="textbox"]')
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
  const [copied, setCopied] = useState(false)

  useEffect(() => {
    setPageMeta({ title: document.title || 'Untitled page', domain: window.location.hostname })
  }, [])

  const hasSelection = selectedText.trim().length > 0
  const canInsertResult = rangeStartsInEditable(originalRange)
  const contextualPrompts = PROMPT_TEMPLATES.filter(t => !['eli5', 'pros-cons', 'action-items'].includes(t.id))

  const runPageRecap = useCallback(async () => {
    setRecapState('loading')
    setAiBusy(true)
    try {
      const { apiBaseUrl, accessToken } = await loadSettings()
      const workspaceId = await new Promise<string>(resolve => {
        chrome.storage.local.get(['inlineActiveWorkspaceId'], r => {
          resolve(typeof r.inlineActiveWorkspaceId === 'string' && r.inlineActiveWorkspaceId
            ? r.inlineActiveWorkspaceId : '')
        })
      })
      if (!accessToken || !workspaceId) {
        setRecapState('error')
        return
      }
      const h: Record<string, string> = { 'Content-Type': 'application/json' }
      if (accessToken) h.Authorization = `Bearer ${accessToken}`
      const res = await fetchViaBackground(`${apiBaseUrl}/api/ai/page-recap`, {
        method: 'POST',
        headers: h,
        body: JSON.stringify({ workspaceId, pageUrl: window.location.href }),
      })
      if (!res.ok) {
        setRecapState('error')
        return
      }
      const j = await res.json<{ ok?: boolean; skipped?: string }>()
      setRecapState(j.skipped ? 'empty' : 'done')
    } catch {
      setRecapState('error')
    } finally {
      setAiBusy(false)
    }
  }, [])

  function handleSpeak() {
    if (speaking) {
      stopSpeaking()
      setSpeaking(false)
      return
    }
    if (!result) return
    void speakWithElevenLabs(result, { onStart: () => setSpeaking(true), onEnd: () => setSpeaking(false) })
  }

  const runTask = useCallback(async (task: string, instruction?: string) => {
    if (hasSelection) wrapSelectionWithHighlight(task)
    setLoading(true)
    setAiBusy(true)
    setResult(null)
    setCopied(false)
    setLastTask(task)
    setLastInstruction(instruction)
    try {
      const access = await reserveAiPrompt()
      if (!access.allowed) {
        setResult(`Sign in to keep using AI. Guest mode includes ${GUEST_AI_LIMIT} free prompts on this browser.`)
        return
      }
      const pageText = document.body?.innerText ?? ''
      const text = (hasSelection ? selectedText : pageText).slice(0, 8000)
      const { apiBaseUrl, accessToken } = await loadSettings()
      const h: Record<string, string> = { 'Content-Type': 'application/json' }
      if (access.signedIn && accessToken) h.Authorization = `Bearer ${accessToken}`
      if (!access.signedIn) h['X-Inline-Device-Id'] = access.deviceId
      const res = await fetchViaBackground(`${apiBaseUrl}/api/ai/extension-light`, {
        method: 'POST',
        headers: h,
        body: JSON.stringify({
          task,
          text,
          instruction,
          guest: !access.signedIn,
          deviceId: access.signedIn ? undefined : access.deviceId,
        }),
      })
      if (res.ok) {
        const j = await res.json<{ result?: string }>()
        const output = j.result ?? 'No result returned.'
        setResult(output)
        if (j.result) {
          const kindMap: Record<string, 'ai-rephrase' | 'ai-shorten' | 'ai-summarize' | 'ai-rewrite' | 'ai-custom'> = {
            rephrase: 'ai-rephrase',
            shorten: 'ai-shorten',
            summarize: 'ai-summarize',
            rewrite: instruction ? 'ai-custom' : 'ai-rewrite',
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
  }, [hasSelection, selectedText])

  function handleInsert() {
    if (!result || !originalRange) return
    try {
      originalRange.deleteContents()
      const mark = buildAIInsertMark(result, lastTask, lastInstruction)
      originalRange.insertNode(mark)
    } catch {
      // The selection range can disappear if the page changes while AI is running.
    }
    onClose()
  }

  function handleCopy() {
    if (!result) return
    void navigator.clipboard.writeText(result)
    setCopied(true)
    window.setTimeout(() => setCopied(false), 1400)
  }

  if (!result && !loading) {
    return (
      <PanelShell
        title="Ask"
        subtitle={hasSelection ? 'Working with your selection' : 'Working with this page'}
        chip={hasSelection ? 'Selection' : 'Page'}
        width={342}
        onClose={onClose}
        tool="ai"
      >
        <div style={{ padding: '20px 20px 16px', display: 'flex', flexDirection: 'column', gap: 16 }}>
          <div style={{
            border: `1px solid ${C.border}`,
            borderRadius: C.radiusMd,
            background: C.bg,
            padding: 12,
          }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 9 }}>
              <span style={{
                display: 'inline-flex',
                alignItems: 'center',
                justifyContent: 'center',
                width: 28,
                height: 28,
                borderRadius: C.radiusSm,
                background: C.surfaceMuted,
                color: C.textMuted,
                flexShrink: 0,
              }}><IGlobe /></span>
              <span style={{ minWidth: 0 }}>
                <span style={{
                  display: 'block',
                  fontSize: 14,
                  fontWeight: 500,
                  color: C.text,
                  letterSpacing: '-0.01em',
                  overflow: 'hidden',
                  textOverflow: 'ellipsis',
                  whiteSpace: 'nowrap',
                }}>
                  {pageMeta.title || 'This page'}
                </span>
                <span style={{
                  display: 'block',
                  fontSize: 12,
                  color: C.textMuted,
                  overflow: 'hidden',
                  textOverflow: 'ellipsis',
                  whiteSpace: 'nowrap',
                }}>
                  {pageMeta.domain}
                </span>
              </span>
            </div>
            {hasSelection && (
              <p style={{
                margin: '9px 0 0',
                padding: '8px 10px',
                borderRadius: C.radiusSm,
                background: C.surfaceMuted,
                fontSize: 14,
                lineHeight: 1.55,
                color: C.textMuted,
                display: '-webkit-box',
                WebkitLineClamp: 2,
                WebkitBoxOrient: 'vertical',
                overflow: 'hidden',
              }}>"{selectedText.trim()}"</p>
            )}
          </div>

          <Composer
            value={customPrompt}
            onChange={setCustomPrompt}
            onSubmit={() => void runTask('rewrite', customPrompt)}
            placeholder={hasSelection ? 'Ask about the selected text…' : 'Ask about this page…'}
            modeLabel="Smart mode"
          />

          <div>
            <SectionLabel>Quick actions</SectionLabel>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 8 }}>
              {QUICK_ACTIONS.map(a => (
                <ActionTile
                  key={a.label}
                  icon={a.icon}
                  label={a.label}
                  desc={a.desc}
                  onClick={() => void runTask(a.task, a.instruction)}
                />
              ))}
            </div>
            <p style={{ margin: '9px 2px 0', fontSize: 12, color: C.textMuted, lineHeight: 1.5 }}>
              {hasSelection ? 'Actions use your highlighted selection first.' : 'Actions use visible page text when nothing is selected.'}
            </p>
          </div>

          {contextualPrompts.length > 0 && (
            <div>
              <SectionLabel>Suggestions</SectionLabel>
              <div style={{ display: 'flex', flexWrap: 'wrap', gap: 7 }}>
                {contextualPrompts.map(t => (
                  <Chip key={t.id} label={t.label} onClick={() => void runTask('rewrite', t.prompt)} />
                ))}
              </div>
            </div>
          )}

          <div>
            <SectionLabel>Page tools</SectionLabel>
            <ActionTile
              icon={recapState === 'loading' ? <Spinner size={15} /> : <IGlobe />}
              label={recapState === 'loading' ? 'Generating recap...' : 'Page recap'}
              desc="Save a clean summary to your library"
              disabled={recapState === 'loading'}
              onClick={() => void runPageRecap()}
            />
            {recapState === 'done' && <p style={{ margin: '8px 2px 0', fontSize: 11.5, color: '#0f766e' }}>Recap saved to your workspace library.</p>}
            {recapState === 'empty' && <p style={{ margin: '8px 2px 0', fontSize: 11.5, color: C.textMuted }}>No captures on this page yet. Highlight or clip something first.</p>}
            {recapState === 'error' && <p style={{ margin: '8px 2px 0', fontSize: 11.5, color: '#b91c1c' }}>Recap needs cloud sync. Sign in or open the dashboard to connect your workspace.</p>}
          </div>
        </div>
      </PanelShell>
    )
  }

  return (
    <PanelShell
      title="Ask"
      subtitle={loading ? 'Thinking...' : 'Here is your result'}
      chip={lastTask ? (lastInstruction ? 'Custom' : lastTask) : undefined}
      width={342}
      onClose={onClose}
      tool="ai"
      footer={!loading ? (
        <div style={{ padding: '10px 14px', display: 'flex', alignItems: 'center', gap: 7 }}>
          <button type="button" onClick={() => { setResult(null); setCopied(false) }} aria-label="Back" style={ghostBtn}>Back</button>
          <button
            type="button"
            onClick={canInsertResult ? handleInsert : handleCopy}
            aria-label={canInsertResult ? 'Insert into page' : 'Copy to clipboard'}
            style={primaryBtn}
          >
            {canInsertResult ? 'Insert' : copied ? 'Copied' : 'Copy'}
          </button>
          <button type="button" onClick={handleSpeak} aria-label={speaking ? 'Stop speaking' : 'Speak'} style={{ ...iconBtn, marginLeft: 'auto' }}>{speaking ? <IVolumeOff /> : <IVolume />}</button>
          {canInsertResult && <button type="button" onClick={handleCopy} aria-label="Copy" style={iconBtn}><ICopy /></button>}
        </div>
      ) : undefined}
    >
      <div style={{ padding: '20px 24px' }}>
        <div style={{
          minHeight: 80,
          maxHeight: 320,
          overflowY: 'auto',
        }}>
          {loading ? (
            <p style={{ margin: 0, fontStyle: 'italic', color: C.textMuted, fontSize: 14, lineHeight: 1.625 }}>
              Putting together the best answer — one moment, Inline…
            </p>
          ) : result ? (
            <FormattedAiText text={result} />
          ) : null}
        </div>
      </div>
    </PanelShell>
  )
}

const ghostBtn: React.CSSProperties = {
  padding: '9px 16px',
  borderRadius: C.radiusPill,
  border: `1px solid ${C.border}`,
  background: C.surfaceBubble,
  fontSize: 12.5,
  fontWeight: 600,
  cursor: 'pointer',
  color: C.text,
  fontFamily: FONT,
  boxShadow: 'none',
}
const primaryBtn: React.CSSProperties = {
  padding: '9px 18px',
  borderRadius: C.radiusPill,
  border: 'none',
  background: CHAT.send,
  color: '#fff',
  fontSize: 14,
  fontWeight: 500,
  cursor: 'pointer',
  fontFamily: FONT,
}
const iconBtn: React.CSSProperties = {
  display: 'inline-flex',
  alignItems: 'center',
  justifyContent: 'center',
  width: 36,
  height: 36,
  border: `1px solid ${C.border}`,
  borderRadius: C.radiusSm,
  background: C.surfaceBubble,
  cursor: 'pointer',
  padding: 0,
  color: C.textMuted,
  boxShadow: 'none',
}
