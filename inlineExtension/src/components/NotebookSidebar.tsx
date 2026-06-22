import { useState, useEffect, useCallback } from 'react'
import { PANEL as C, SIDEBAR as S, FONT } from '../lib/extensionTheme'

interface Notebook {
  id: string
  name: string
  color: string
  domain: string
  createdAt: number
}

const STORAGE_KEY = 'inlineNotebooks'

const COLORS = ['#F87171', '#FB923C', '#FBBF24', '#34D399', '#60A5FA', '#A78BFA', '#F472B6']

function randomPick<T>(arr: T[]): T {
  return arr[Math.floor(Math.random() * arr.length)]
}

async function loadNotebooks(): Promise<Notebook[]> {
  return new Promise(resolve => {
    chrome.storage.local.get(STORAGE_KEY, r => {
      resolve(Array.isArray(r[STORAGE_KEY]) ? r[STORAGE_KEY] : [])
    })
  })
}

async function saveNotebooks(notebooks: Notebook[]): Promise<void> {
  await chrome.storage.local.set({ [STORAGE_KEY]: notebooks })
}

const IClose = () => (
  <svg width="14" height="14" viewBox="0 0 16 16" fill="#78716c">
    <path d="M2.146 2.854a.5.5 0 1 1 .708-.708L8 7.293l5.146-5.147a.5.5 0 0 1 .708.708L8.707 8l5.147 5.146a.5.5 0 0 1-.708.708L8 8.707l-5.146 5.147a.5.5 0 0 1-.708-.708L7.293 8 2.146 2.854z"/>
  </svg>
)

const IPlus = () => (
  <svg width="14" height="14" viewBox="0 0 16 16" fill="currentColor">
    <path d="M8 2a.5.5 0 0 1 .5.5v5h5a.5.5 0 0 1 0 1h-5v5a.5.5 0 0 1-1 0v-5h-5a.5.5 0 0 1 0-1h5v-5A.5.5 0 0 1 8 2z"/>
  </svg>
)

interface NotebookSidebarProps {
  onClose: () => void
}

export default function NotebookSidebar({ onClose }: NotebookSidebarProps) {
  const [notebooks, setNotebooks] = useState<Notebook[]>([])
  const [editingId, setEditingId] = useState<string | null>(null)
  const [editName, setEditName] = useState('')
  const [selectedDomain, setSelectedDomain] = useState<string | null>(null)

  useEffect(() => {
    loadNotebooks().then(setNotebooks)
  }, [])

  const createNotebook = useCallback(async () => {
    const domain = window.location.hostname || 'local'
    const nb: Notebook = {
      id: crypto.randomUUID(),
      name: domain.replace(/^www\./, ''),
      color: randomPick(COLORS),
      domain,
      createdAt: Date.now(),
    }
    const updated = [...notebooks, nb]
    setNotebooks(updated)
    await saveNotebooks(updated)
    setEditingId(nb.id)
    setEditName(nb.name)
  }, [notebooks])

  const commitRename = useCallback(async (id: string) => {
    const trimmed = editName.trim()
    if (!trimmed) { setEditingId(null); return }
    const updated = notebooks.map(n => n.id === id ? { ...n, name: trimmed } : n)
    setNotebooks(updated)
    await saveNotebooks(updated)
    setEditingId(null)
  }, [notebooks, editName])

  const deleteNotebook = useCallback(async (id: string) => {
    const updated = notebooks.filter(n => n.id !== id)
    setNotebooks(updated)
    await saveNotebooks(updated)
  }, [notebooks])

  const grouped = notebooks.reduce<Record<string, Notebook[]>>((acc, nb) => {
    const key = nb.domain
    ;(acc[key] ??= []).push(nb)
    return acc
  }, {})

  const domains = Object.keys(grouped).sort()

  return (
    <div style={{
      position: 'fixed', left: 0, top: 0, bottom: 0,
      width: 280, background: S.bg,
      borderRight: `1px solid ${S.border}`,
      borderRadius: '0 18px 18px 0',
      boxShadow: '6px 0 28px -10px rgba(32,28,24,0.16)',
      fontFamily: FONT, zIndex: 2147483647,
      display: 'flex', flexDirection: 'column',
      overflow: 'hidden', pointerEvents: 'auto',
    }}>
      {/* Header */}
      <div style={{
        display: 'flex', alignItems: 'center', justifyContent: 'space-between',
        padding: '16px 14px 12px', background: 'transparent',
      }}>
        <span style={{ display: 'flex', alignItems: 'center', gap: 9, fontSize: 15, fontWeight: 600, color: S.text, letterSpacing: '-0.01em' }}>
          <span style={{ display: 'inline-flex', alignItems: 'center', justifyContent: 'center', width: 22, height: 22, borderRadius: '50%', background: '#0B1735' }}>
            <span style={{ display: 'block', width: 3, height: 11, borderRadius: 2, background: '#fff', transform: 'rotate(-12deg)' }} />
          </span>
          Notebooks
        </span>
        <button type="button" onClick={onClose} aria-label="Close" style={{
          display: 'inline-flex', alignItems: 'center', justifyContent: 'center',
          width: 30, height: 30, border: 'none', borderRadius: C.radiusSm,
          background: 'transparent', cursor: 'pointer', padding: 0,
          transition: 'background 0.13s',
        }}
          onMouseEnter={e => (e.currentTarget.style.background = S.hover)}
          onMouseLeave={e => (e.currentTarget.style.background = 'transparent')}
        ><IClose /></button>
      </div>

      {/* Create button */}
      <div style={{ padding: '4px 12px 8px' }}>
        <button type="button" onClick={createNotebook} style={{
          display: 'flex', alignItems: 'center', gap: 8, width: '100%',
          padding: '10px 14px', border: `1px solid ${S.border}`,
          borderRadius: C.radiusMd, background: '#FFFFFF',
          boxShadow: '0 1px 2px rgba(28,24,18,0.05)', cursor: 'pointer',
          fontSize: 13, fontWeight: 500, color: S.text, fontFamily: FONT,
          transition: 'background 0.13s',
        }}
          onMouseEnter={e => (e.currentTarget.style.background = '#FBFAF7')}
          onMouseLeave={e => (e.currentTarget.style.background = '#FFFFFF')}
        >
          <IPlus /> Create notebook
        </button>
      </div>

      {/* List */}
      <div style={{ flex: 1, overflowY: 'auto', padding: '8px 14px 16px' }}>
        {domains.length === 0 && (
          <p style={{ fontSize: 12, color: S.textLight, textAlign: 'center', marginTop: 32, lineHeight: 1.6, padding: '0 12px' }}>
            No notebooks yet.<br />Create one to get started.
          </p>
        )}

        {domains.map(domain => (
          <div key={domain} style={{ marginBottom: 10 }}>
            <button
              type="button"
              onClick={() => setSelectedDomain(d => d === domain ? null : domain)}
              style={{
                display: 'flex', alignItems: 'center', gap: 6, width: '100%',
                padding: '6px 6px', border: 'none', background: 'transparent',
                cursor: 'pointer', fontSize: 12, fontWeight: 600, color: S.textMuted,
                textTransform: 'none', letterSpacing: 0, fontFamily: FONT,
              }}
            >
              {domain}
              <span style={{
                fontSize: 10, fontWeight: 600, color: S.textMuted,
                background: S.bgSubtle, borderRadius: C.radiusPill,
                padding: '1px 7px',
              }}>
                {grouped[domain].length}
              </span>
            </button>

            {(selectedDomain === null || selectedDomain === domain) &&
              grouped[domain].map(nb => (
                <div key={nb.id} style={{
                  display: 'flex', alignItems: 'center', gap: 10,
                  padding: '8px 8px', marginBottom: 2,
                  borderRadius: C.radiusSm, cursor: 'pointer',
                  transition: 'background 0.15s',
                  background: selectedDomain === domain ? S.active : 'transparent',
                }}
                  onMouseEnter={e => { if (selectedDomain !== domain) e.currentTarget.style.background = S.hover }}
                  onMouseLeave={e => { if (selectedDomain !== domain) e.currentTarget.style.background = 'transparent' }}
                >
                  <span style={{
                    width: 32, height: 32, borderRadius: 10,
                    background: nb.color + '22',
                    display: 'flex', alignItems: 'center', justifyContent: 'center',
                    flexShrink: 0,
                  }}>
                    <div
                      style={{
                        width: 12,
                        height: 12,
                        borderRadius: '50%',
                        background: nb.color,
                      }}
                    />
                  </span>

                  <div style={{ flex: 1, minWidth: 0 }}>
                    {editingId === nb.id ? (
                      <input
                        value={editName}
                        onChange={e => setEditName(e.target.value)}
                        onBlur={() => commitRename(nb.id)}
                        onKeyDown={e => { if (e.key === 'Enter') commitRename(nb.id) }}
                        autoFocus
                        style={{
                          width: '100%', padding: '2px 6px', border: `1px solid ${C.border}`,
                          borderRadius: 6, fontSize: 13, fontWeight: 500,
                          color: C.text, background: C.inputBg, outline: 'none', fontFamily: FONT,
                        }}
                      />
                    ) : (
                      <span
                        onDoubleClick={() => { setEditingId(nb.id); setEditName(nb.name) }}
                        style={{ fontSize: 13, fontWeight: 500, color: C.text, display: 'block', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}
                      >
                        {nb.name}
                      </span>
                    )}
                  </div>

                  <div style={{
                    width: 8, height: 8, borderRadius: '50%', background: nb.color, flexShrink: 0,
                  }} />

                  <button type="button" onClick={() => deleteNotebook(nb.id)} style={{
                    border: 'none', background: 'transparent', cursor: 'pointer',
                    padding: 0, fontSize: 14, color: C.textLight, lineHeight: 1,
                  }}>×</button>
                </div>
              ))
            }
          </div>
        ))}
      </div>
    </div>
  )
}
