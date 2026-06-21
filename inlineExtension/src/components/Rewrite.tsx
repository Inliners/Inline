import { useState, useRef, useCallback } from 'react'
import { loadSettings } from '../lib/extensionSettings'
import { speakWithElevenLabs, stopSpeaking } from '../lib/elevenLabsTts'
import { PANEL as C, FONT } from '../lib/extensionTheme'
import { PROMPT_TEMPLATES } from '../lib/promptTemplates'
import { fetchViaBackground } from '../lib/backgroundFetch'
import { saveAIResultToHistory } from '../lib/historyApi'
import { buildAIInsertMark } from '../lib/insertBadge'
import { saveAIReplacement } from '../content/aiReplacements'
import { PanelShell, Spinner, SectionLabel, ActionTile, Chip, Segmented, Composer } from './panelKit'
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
const GRephrase = () => (<svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"><path d="M3 12a9 9 0 0 1 15-6.7L21 8M21 3v5h-5M21 12a9 9 0 0 1-15 6.7L3 16M3 21v-5h5" /></svg>)
const GShorten = () => (<svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"><path d="M8 7l-4 5 4 5M16 7l4 5-4 5M14 4l-4 16" /></svg>)
const GSummarize = () => (<svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round"><path d="M4 6h16M4 10h16M4 14h10M4 18h7" /></svg>)

const TONES = ['Formal', 'Casual', 'Concise'] as const
type Tone = typeof TONES[number]

const REWRITE_ACTIONS: { label: string; desc: string; task: string; icon: React.ReactNode }[] = [
  { label: 'Rephrase', desc: 'Reword while keeping the meaning', task: 'rephrase', icon: <GRephrase /> },
  { label: 'Shorten', desc: 'Trim it down without losing the point', task: 'shorten', icon: <GShorten /> },
  { label: 'Summarize', desc: 'Condense to the essentials', task: 'summarize', icon: <GSummarize /> },
]

interface RewriteProps {
  selectedText: string
  originalRange: Range | null
  onClose: () => void
}

function computeWordDiff(oldText: string, newText: string) {
  const oldWords = oldText.split(/(\s+)/)
  const newWords = newText.split(/(\s+)/)
  let prefixLen = 0
  while (prefixLen < oldWords.length && prefixLen < newWords.length && oldWords[prefixLen] === newWords[prefixLen]) prefixLen++
  let oldSuffix = oldWords.length - 1
  let newSuffix = newWords.length - 1
  while (oldSuffix >= prefixLen && newSuffix >= prefixLen && oldWords[oldSuffix] === newWords[newSuffix]) { oldSuffix--; newSuffix-- }
  const parts: { type: 'same' | 'del' | 'add'; text: string }[] = []
  if (prefixLen > 0) parts.push({ type: 'same', text: oldWords.slice(0, prefixLen).join('') })
  const deleted = oldWords.slice(prefixLen, oldSuffix + 1).join('')
  const added = newWords.slice(prefixLen, newSuffix + 1).join('')
  if (deleted) parts.push({ type: 'del', text: deleted })
  if (added) parts.push({ type: 'add', text: added })
  const suffixStart = oldSuffix + 1
  if (suffixStart < oldWords.length) parts.push({ type: 'same', text: oldWords.slice(suffixStart).join('') })
  return parts
}

export default function Rewrite({ selectedText, originalRange, onClose }: RewriteProps) {
  const [tone, setTone] = useState<Tone>('Casual')
  const [result, setResult] = useState<string | null>(null)
  const [loading, setLoading] = useState(false)
  const [customPrompt, setCustomPrompt] = useState('')
  const [showDiff, setShowDiff] = useState(false)
  const [inserted, setInserted] = useState(false)
  const [speaking, setSpeaking] = useState(false)
  const [lastTask, setLastTask] = useState<string>('')
  const [lastInstruction, setLastInstruction] = useState<string | undefined>(undefined)
  const originalContentRef = useRef<string | null>(null)

  const hasSelection = selectedText.trim().length > 0

  function handleSpeak() {
    if (speaking) { stopSpeaking(); setSpeaking(false); return }
    if (!result) return
    void speakWithElevenLabs(result, { onStart: () => setSpeaking(true), onEnd: () => setSpeaking(false) })
  }

  const runTask = useCallback(async (task: string, instruction?: string) => {
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
        setResult('AI request failed. Check your API settings.')
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
      const originalText = originalRange.toString()
      originalContentRef.current = originalText
      originalRange.deleteContents()
      const mark = buildAIInsertMark(result, lastTask, lastInstruction)
      mark.style.display = 'inline-block'
      mark.style.lineHeight = '1.55'
      const attr = document.createElement('span')
      attr.className = 'inline-cite-attr'
      attr.style.cssText = 'display:block;font-size:10px;color:#78716c;margin-top:4px;font-style:italic;'
      attr.textContent = `via Inline · ${new Date().toLocaleString()}`
      mark.appendChild(document.createElement('br'))
      mark.appendChild(attr)
      originalRange.insertNode(mark)
      setInserted(true)
      saveAIReplacement(mark, originalText, result, lastTask, lastInstruction)
    } catch { /* range may be invalid if user navigated away */ }
  }

  function handleUndo() {
    if (!originalContentRef.current || !originalRange) return
    try {
      originalRange.deleteContents()
      originalRange.insertNode(document.createTextNode(originalContentRef.current))
      originalContentRef.current = null
      setInserted(false)
    } catch { /* range may be invalid */ }
  }

  function handleCopy() {
    if (result) navigator.clipboard.writeText(result)
  }

  /* ─── Config state (before AI result) ─── */
  if (!result && !loading) {
    return (
      <PanelShell
        title="Rewrite"
        subtitle="Reword your selection with AI"
        chip={hasSelection ? 'Selection' : undefined}
        width={358}
        onClose={onClose}
        footer={
          <div style={{ padding: '12px 16px 14px' }}>
            <Composer
              value={customPrompt}
              onChange={setCustomPrompt}
              onSubmit={() => { if (customPrompt.trim()) runTask('rewrite', customPrompt) }}
              placeholder={hasSelection ? 'Describe how to rewrite it…' : 'Select text to rewrite'}
              sendDisabled={!hasSelection}
              modeLabel={tone}
            />
          </div>
        }
      >
        <div style={{ padding: '16px 18px 18px', display: 'flex', flexDirection: 'column', gap: 18 }}>
          {/* Tone */}
          <div>
            <SectionLabel>Tone</SectionLabel>
            <Segmented options={TONES.map(t => ({ value: t, label: t }))} value={tone} onChange={setTone} />
          </div>

          {/* Actions */}
          <div>
            <SectionLabel>Rewrite as</SectionLabel>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 9 }}>
              {REWRITE_ACTIONS.map(a => (
                <ActionTile
                  key={a.label}
                  icon={a.icon}
                  label={a.label}
                  desc={a.desc}
                  disabled={!hasSelection}
                  onClick={() => runTask(a.task, `Tone: ${tone}`)}
                />
              ))}
            </div>
            {!hasSelection && (
              <p style={{ margin: '10px 2px 0', fontSize: 11.5, color: C.textLight, lineHeight: 1.5 }}>
                Select text on the page to rewrite it.
              </p>
            )}
          </div>

          {/* Quick prompts */}
          {PROMPT_TEMPLATES.length > 0 && (
            <div>
              <SectionLabel>Quick prompts</SectionLabel>
              <div style={{ display: 'flex', flexWrap: 'wrap', gap: 7 }}>
                {PROMPT_TEMPLATES.map(t => (
                  <Chip key={t.id} label={t.label} disabled={!hasSelection} onClick={() => runTask('rewrite', t.prompt)} />
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
      title="Rewrite"
      subtitle={loading ? 'Rewriting…' : 'Review & apply'}
      chip={lastInstruction ? 'Custom' : (lastTask || undefined)}
      width={364}
      onClose={onClose}
      footer={!loading ? (
        <div style={{ padding: '12px 16px', display: 'flex', alignItems: 'center', gap: 8, flexWrap: 'wrap' }}>
          <button type="button" onClick={() => { setResult(null); setShowDiff(false); setInserted(false) }} aria-label="Back" style={ghostBtn}>Back</button>
          <button type="button" onClick={() => setShowDiff(d => !d)} aria-label={showDiff ? 'Hide diff' : 'Show diff'} style={ghostBtn}>{showDiff ? 'Hide diff' : 'Diff'}</button>
          {!inserted ? (
            <button type="button" onClick={handleInsert} aria-label="Insert into page" style={primaryBtn}>Insert</button>
          ) : (
            <button type="button" onClick={handleUndo} aria-label="Undo insert" style={{ ...primaryBtn, background: '#DC2626', boxShadow: 'none' }}>Undo</button>
          )}
          <button type="button" onClick={handleSpeak} aria-label={speaking ? 'Stop speaking' : 'Speak'} style={{ ...iconBtn, marginLeft: 'auto' }}>{speaking ? <IVolumeOff /> : <IVolume />}</button>
          <button type="button" onClick={handleCopy} aria-label="Copy" style={iconBtn}><ICopy /></button>
        </div>
      ) : undefined}
    >
      <div style={{ padding: 18, display: 'flex', flexDirection: 'column', gap: 14 }}>
        <div style={{
          padding: 16, border: `1px solid ${C.border}`, borderRadius: 18,
          fontSize: 13.5, lineHeight: 1.7, color: C.text, minHeight: 80,
          background: C.surfaceBubble, boxShadow: C.shadowCard,
          maxHeight: 280, overflowY: 'auto', whiteSpace: 'pre-wrap',
        }}>
          {loading ? (
            <span style={{ display: 'inline-flex', alignItems: 'center', gap: 10, color: C.textMuted }}>
              <Spinner size={16} /><span style={{ fontStyle: 'italic' }}>Generating…</span>
            </span>
          ) : showDiff && result ? (
            <span>
              {computeWordDiff(selectedText, result).map((p, i) =>
                p.type === 'del' ? (
                  <span key={i} style={{ color: '#ef4444', textDecoration: 'line-through', background: 'rgba(239,68,68,0.1)' }}>{p.text}</span>
                ) : p.type === 'add' ? (
                  <span key={i} style={{ color: '#16a34a', background: 'rgba(34,197,94,0.12)' }}>{p.text}</span>
                ) : (
                  <span key={i}>{p.text}</span>
                )
              )}
            </span>
          ) : result}
        </div>

        {!loading && (
          <Composer
            value={customPrompt}
            onChange={setCustomPrompt}
            onSubmit={() => { if (customPrompt.trim()) runTask('rewrite', customPrompt) }}
            placeholder="Refine with another instruction…"
            sendDisabled={!hasSelection}
            modeLabel={tone}
          />
        )}
      </div>
    </PanelShell>
  )
}

const ghostBtn: React.CSSProperties = {
  padding: '9px 16px', borderRadius: C.radiusPill,
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
