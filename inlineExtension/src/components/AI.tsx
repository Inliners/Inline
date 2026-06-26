import { useState, useCallback, useEffect } from 'react'
import { wrapSelectionWithHighlight } from '../content/highlightWrap'
import { loadSettings } from '../lib/extensionSettings'
import { PANEL as C } from '../lib/extensionTheme'
import { PROMPT_TEMPLATES } from '../lib/promptTemplates'
import { fetchViaBackground } from '../lib/backgroundFetch'
import { saveAIResultToHistory } from '../lib/historyApi'
import { buildAIInsertMark } from '../lib/insertBadge'
import { GUEST_AI_LIMIT, reserveAiPrompt } from '../lib/aiAccess'
import { PanelShell, Spinner, SectionLabel, ActionTile, Chip, Composer, BlockDiffView, PanelResultCard, ReviewFooter, PanelSection, panelBodyStyle } from './panelKit'
import FormattedAiText from './FormattedAiText'
import { setAiBusy } from '../lib/panelLock'

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
        <div style={panelBodyStyle}>
          <PanelSection>
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
          </PanelSection>

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
      subtitle={loading ? 'Thinking…' : hasSelection ? (
        lastTask === 'summarize' ? 'Summary update'
          : lastTask === 'rephrase' ? 'Rephrase update'
            : lastTask === 'shorten' ? 'Shorten update'
              : 'Rewrite update'
      ) : 'Here is your result'}
      chip={lastTask ? (lastInstruction ? 'Custom' : lastTask) : undefined}
      width={342}
      onClose={onClose}
      tool="ai"
      footer={!loading ? (
        <ReviewFooter
          onBack={() => { setResult(null); setCopied(false) }}
          onReject={() => { setResult(null); setCopied(false) }}
          onApprove={canInsertResult ? handleInsert : handleCopy}
          approveLabel={canInsertResult ? 'Approve' : copied ? 'Copied' : 'Copy'}
          showReject={!!result}
        />
      ) : undefined}
    >
      <div style={{ padding: '16px 20px' }}>
        <PanelResultCard>
          {loading ? (
            <span style={{ display: 'inline-flex', alignItems: 'center', gap: 10, color: C.textMuted, fontSize: 14, fontStyle: 'italic' }}>
              <Spinner size={16} /> Putting together the best answer — one moment, Inline…
            </span>
          ) : result && hasSelection ? (
            <BlockDiffView original={selectedText} updated={result} />
          ) : result ? (
            <FormattedAiText text={result} style={{ fontSize: 13.5, lineHeight: 1.55 }} />
          ) : null}
        </PanelResultCard>
      </div>
    </PanelShell>
  )
}
