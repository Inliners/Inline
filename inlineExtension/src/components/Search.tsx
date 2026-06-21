import { useState, useCallback, useRef, useEffect } from 'react'
import { PANEL as C, FONT } from '../lib/extensionTheme'
import { loadSettings } from '../lib/extensionSettings'
import { fetchViaBackground } from '../lib/backgroundFetch'
import { PanelShell, PanelLoading, PanelEmpty, Segmented } from './panelKit'

const ISearchGlyph = () => (
  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
    <circle cx="11" cy="11" r="8" /><line x1="21" y1="21" x2="16.65" y2="16.65" />
  </svg>
)

interface SearchResult {
  id: string
  page_url: string
  page_title: string
  content: string
  type: string
  created_at: string
}

interface SearchProps {
  onClose: () => void
}

export default function Search({ onClose }: SearchProps) {
  const [query, setQuery] = useState('')
  const [results, setResults] = useState<SearchResult[]>([])
  const [loading, setLoading] = useState(false)
  const [scope, setScope] = useState<'page' | 'all'>('page')
  const [focus, setFocus] = useState(false)
  const inputRef = useRef<HTMLInputElement>(null)
  const debounceRef = useRef<ReturnType<typeof setTimeout>>(undefined)

  useEffect(() => {
    inputRef.current?.focus()
  }, [])

  const searchBackend = useCallback(async (q: string) => {
    if (!q.trim()) { setResults([]); return }
    setLoading(true)
    try {
      const { apiBaseUrl, accessToken } = await loadSettings()
      const h: Record<string, string> = {}
      if (accessToken) h.Authorization = `Bearer ${accessToken}`
      const res = await fetchViaBackground(
        `${apiBaseUrl}/api/search?q=${encodeURIComponent(q)}`,
        { headers: h },
      )
      if (res.ok) {
        const json = await res.json() as { results: SearchResult[] }
        setResults(json.results ?? [])
      }
    } catch { /* network error */ }
    finally { setLoading(false) }
  }, [])

  const searchLocal = useCallback(async (q: string) => {
    if (!q.trim()) { setResults([]); return }
    setLoading(true)
    try {
      const pageUrl = window.location.href
      const response = await new Promise<{ ok: boolean; data?: unknown }>((resolve) => {
        if (!chrome.runtime?.id) { resolve({ ok: false }); return }
        chrome.runtime.sendMessage(
          { type: 'LOAD_ANNOTATIONS', payload: { pageUrl } },
          (res) => resolve(res ?? { ok: false }),
        )
      })
      if (response.ok && response.data) {
        const annotations = response.data as Record<string, unknown>
        const matched: SearchResult[] = []
        const lowerQ = q.toLowerCase()
        for (const [key, value] of Object.entries(annotations)) {
          if (typeof value === 'object' && value !== null) {
            const str = JSON.stringify(value).toLowerCase()
            if (str.includes(lowerQ)) {
              matched.push({
                id: key,
                page_url: pageUrl,
                page_title: document.title,
                content: typeof value === 'string' ? value : JSON.stringify(value).slice(0, 200),
                type: 'annotation',
                created_at: new Date().toISOString(),
              })
            }
          }
        }
        setResults(matched)
      }
    } catch { /* network error */ }
    finally { setLoading(false) }
  }, [])

  const runSearch = useCallback((value: string, useAll: boolean) => {
    if (useAll) searchBackend(value)
    else searchLocal(value)
  }, [searchBackend, searchLocal])

  const handleInput = useCallback((value: string) => {
    setQuery(value)
    if (debounceRef.current) clearTimeout(debounceRef.current)
    debounceRef.current = setTimeout(() => runSearch(value, scope === 'all'), 300)
  }, [scope, runSearch])

  const handleScope = useCallback((v: 'page' | 'all') => {
    setScope(v)
    if (query.trim()) runSearch(query, v === 'all')
  }, [query, runSearch])

  const snippet = (text: string) => {
    const max = 120
    if (text.length <= max) return text
    const lower = text.toLowerCase()
    const idx = lower.indexOf(query.toLowerCase())
    if (idx < 0) return text.slice(0, max) + '…'
    const start = Math.max(0, idx - 40)
    return (start > 0 ? '…' : '') + text.slice(start, start + max) + '…'
  }

  return (
    <PanelShell title="Search" subtitle="Find your notes & annotations" width={332} onClose={onClose} style={{ height: 'min(520px, calc(100vh - 64px))' }}>
      {/* Search input + scope */}
      <div style={{ padding: '16px 18px 12px', flexShrink: 0, display: 'flex', flexDirection: 'column', gap: 12 }}>
        <div style={{
          display: 'flex', alignItems: 'center', gap: 10, padding: '0 14px',
          height: 44, borderRadius: 14, background: C.surfaceBubble,
          border: `1.5px solid ${focus ? C.accent : C.border}`,
          boxShadow: focus ? '0 0 0 4px rgba(11,23,53,0.07)' : C.shadowSoft,
          transition: 'border-color 0.15s, box-shadow 0.15s',
        }}>
          <span style={{ color: focus ? C.accent : C.textLight, display: 'inline-flex', flexShrink: 0 }}><ISearchGlyph /></span>
          <input
            ref={inputRef}
            value={query}
            onChange={e => handleInput(e.target.value)}
            onFocus={() => setFocus(true)}
            onBlur={() => setFocus(false)}
            placeholder="Search highlights, notes & clips…"
            style={{
              flex: 1, minWidth: 0, border: 'none', outline: 'none', background: 'transparent',
              fontSize: 13.5, color: C.text, fontFamily: FONT,
            }}
          />
        </div>
        <Segmented
          options={[{ value: 'page', label: 'This page' }, { value: 'all', label: 'All pages' }]}
          value={scope}
          onChange={handleScope}
        />
      </div>

      {/* Results */}
      <div style={{ flex: 1, overflowY: 'auto', padding: '2px 16px 16px' }}>
        {loading && <PanelLoading label="Searching…" />}
        {!loading && query.trim() && results.length === 0 && (
          <PanelEmpty icon={<ISearchGlyph />} title="No results found" hint="Try a different keyword, or switch to “All pages”." />
        )}
        {!loading && !query.trim() && results.length === 0 && (
          <PanelEmpty icon={<ISearchGlyph />} title="Search your captures" hint="Type to find highlights, notes and clips you've saved." />
        )}
        {!loading && results.map(r => (
          <button key={r.id} type="button"
            onClick={() => { if (r.page_url) window.open(r.page_url, '_blank') }}
            aria-label={r.page_title || 'Open result'}
            style={{
              display: 'block', width: '100%', textAlign: 'left',
              padding: '12px 14px', marginBottom: 9,
              border: `1px solid ${C.border}`, borderRadius: 16,
              background: C.surfaceBubble, boxShadow: C.shadowSoft, cursor: 'pointer', fontFamily: FONT,
              transition: 'box-shadow 0.14s, border-color 0.14s',
            }}
            onMouseEnter={e => { e.currentTarget.style.boxShadow = C.shadowCard; e.currentTarget.style.borderColor = C.borderStrong }}
            onMouseLeave={e => { e.currentTarget.style.boxShadow = C.shadowSoft; e.currentTarget.style.borderColor = C.border }}
          >
            <p style={{ margin: 0, fontSize: 12.5, fontWeight: 700, color: C.text, lineHeight: 1.4, letterSpacing: '-0.01em' }}>
              {r.page_title || 'Untitled'}
            </p>
            <p style={{
              margin: '4px 0 0', fontSize: 11.5, color: C.textMuted, lineHeight: 1.55,
              whiteSpace: 'pre-wrap', wordBreak: 'break-word',
            }}>
              {snippet(r.content)}
            </p>
            {r.page_url && (
              <p style={{ margin: '6px 0 0', fontSize: 10.5, color: C.textLight, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                {r.page_url}
              </p>
            )}
          </button>
        ))}
      </div>
    </PanelShell>
  )
}
