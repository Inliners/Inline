import { useRef, useCallback, useEffect, useState } from 'react'
import type { StickyNoteData } from './storage'
import { formatTime, seekMedia } from '../lib/mediaDetect'
import { PALETTE } from './palette'

function getPreset(color: string) {
  return PALETTE.find(p => p.bg === color) ?? PALETTE[0]
}

function hexToRgba(hex: string, alpha: number) {
  const r = parseInt(hex.slice(1, 3), 16)
  const g = parseInt(hex.slice(3, 5), 16)
  const b = parseInt(hex.slice(5, 7), 16)
  return `rgba(${r},${g},${b},${alpha})`
}

/* ─── mini icons ─── */
const IBold = () => (
  <svg width="11" height="11" viewBox="0 0 16 16" fill="currentColor">
    <path d="M8.21 13c2.106 0 3.412-1.087 3.412-2.823 0-1.306-.984-2.283-2.324-2.386v-.055a2.176 2.176 0 0 0 1.852-2.14c0-1.51-1.162-2.46-3.014-2.46H3.843V13H8.21zM5.908 4.674h1.696c.963 0 1.517.451 1.517 1.244 0 .834-.629 1.32-1.73 1.32H5.908V4.674zm0 6.788V8.598h1.73c1.217 0 1.88.492 1.88 1.415 0 .943-.643 1.449-1.832 1.449H5.907z"/>
  </svg>
)
const IItalic = () => (
  <svg width="11" height="11" viewBox="0 0 16 16" fill="currentColor">
    <path d="M7.991 11.674 9.53 4.455c.123-.595.246-.71 1.347-.807l.11-.52H7.211l-.11.52c1.06.096 1.128.212 1.005.807L6.57 11.674c-.123.595-.246.71-1.346.806l-.11.52h3.774l.11-.52c-1.06-.095-1.129-.211-1.006-.806z"/>
  </svg>
)
const IList = () => (
  <svg width="11" height="11" viewBox="0 0 16 16" fill="currentColor">
    <path d="M5 11.5a.5.5 0 0 1 .5-.5h9a.5.5 0 0 1 0 1h-9a.5.5 0 0 1-.5-.5zm0-4a.5.5 0 0 1 .5-.5h9a.5.5 0 0 1 0 1h-9a.5.5 0 0 1-.5-.5zm0-4a.5.5 0 0 1 .5-.5h9a.5.5 0 0 1 0 1h-9a.5.5 0 0 1-.5-.5zM3 8a1 1 0 1 1 0-2 1 1 0 0 1 0 2zm0 4a1 1 0 1 1 0-2 1 1 0 0 1 0 2zm0-8a1 1 0 1 1 0-2 1 1 0 0 1 0 2z"/>
  </svg>
)
const IPalette = () => (
  <svg width="11" height="11" viewBox="0 0 16 16" fill="currentColor">
    <path d="M8 5a1.5 1.5 0 1 0 0-3 1.5 1.5 0 0 0 0 3zm4 3a1.5 1.5 0 1 0 0-3 1.5 1.5 0 0 0 0 3zM5.5 7a1.5 1.5 0 1 1-3 0 1.5 1.5 0 0 1 3 0zm.25 2.9a2.5 2.5 0 0 1 3.5 0 .5.5 0 0 0 .5.1 2 2 0 0 0 1.834-2.165 8 8 0 1 0-11.996.946 8 8 0 0 0 .914.48A2 2 0 0 0 2 9.5a2 2 0 0 0 3.75-.6z"/>
  </svg>
)

function FmtBtn({ children, onClick }: { children: React.ReactNode; onClick: () => void }) {
  const [hov, setHov] = useState(false)
  return (
    <button
      type="button"
      onMouseDown={e => { e.preventDefault(); onClick() }}
      onMouseEnter={() => setHov(true)}
      onMouseLeave={() => setHov(false)}
      style={{
        display: 'inline-flex', alignItems: 'center', justifyContent: 'center',
        width: 26, height: 26, border: 'none', borderRadius: 5,
        background: hov ? 'rgba(0,0,0,0.08)' : 'transparent',
        color: '#374151', cursor: 'pointer',
      }}
    >
      {children}
    </button>
  )
}

interface StickyNoteProps {
  note: StickyNoteData
  onUpdate: (id: string, updates: Partial<StickyNoteData>) => void
  onDelete: (id: string) => void
}

export default function StickyNote({ note, onUpdate, onDelete }: StickyNoteProps) {
  const [isDragging, setIsDragging] = useState(false)
  const [isEditingTitle, setIsEditingTitle] = useState(false)
  const [titleDraft, setTitleDraft] = useState(note.title ?? 'Note')
  const [showPalette, setShowPalette] = useState(false)
  const dragOffset = useRef({ x: 0, y: 0 })
  const bodyRef = useRef<HTMLDivElement>(null)
  const titleInputRef = useRef<HTMLInputElement>(null)
  const preset = getPreset(note.color)

  /* ─── drag header ─── */
  const handlePointerDown = useCallback((e: React.PointerEvent) => {
    e.preventDefault()
    setIsDragging(true)
    dragOffset.current = { x: e.clientX - note.x, y: e.clientY - note.y }
    ;(e.target as HTMLElement).setPointerCapture(e.pointerId)
  }, [note.x, note.y])

  const handlePointerMove = useCallback((e: React.PointerEvent) => {
    if (!isDragging) return
    onUpdate(note.id, { x: e.clientX - dragOffset.current.x, y: e.clientY - dragOffset.current.y })
  }, [isDragging, note.id, onUpdate])

  const handlePointerUp = useCallback(() => setIsDragging(false), [])

  /* ─── resize (corner handle) ─── */
  const handleResizeDown = useCallback((e: React.MouseEvent) => {
    e.preventDefault()
    e.stopPropagation()
    const startX = e.clientX, startY = e.clientY
    const startW = note.width, startH = note.height
    const onMove = (ev: MouseEvent) => onUpdate(note.id, {
      width: Math.max(200, startW + ev.clientX - startX),
      height: Math.max(140, startH + ev.clientY - startY),
    })
    const onUp = () => { window.removeEventListener('mousemove', onMove); window.removeEventListener('mouseup', onUp) }
    window.addEventListener('mousemove', onMove)
    window.addEventListener('mouseup', onUp)
  }, [note.id, note.width, note.height, onUpdate])

  /* ─── content ─── */
  const handleInput = useCallback(() => {
    if (bodyRef.current) onUpdate(note.id, { content: bodyRef.current.innerHTML })
  }, [note.id, onUpdate])

  /* set initial HTML once on mount */
  useEffect(() => {
    if (bodyRef.current && bodyRef.current.innerHTML !== note.content) {
      bodyRef.current.innerHTML = note.content || ''
    }
    if (!note.content && Date.now() - note.createdAt < 1000) bodyRef.current?.focus()
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  /* sync title from outside */
  useEffect(() => { setTitleDraft(note.title ?? 'Note') }, [note.title])

  /* auto-focus title input */
  useEffect(() => { if (isEditingTitle) titleInputRef.current?.select() }, [isEditingTitle])

  function commitTitle() {
    const t = titleDraft.trim() || 'Note'
    setTitleDraft(t)
    onUpdate(note.id, { title: t })
    setIsEditingTitle(false)
  }

  function fmt(cmd: string) {
    bodyRef.current?.focus()
    document.execCommand(cmd, false, undefined)
    if (bodyRef.current) onUpdate(note.id, { content: bodyRef.current.innerHTML })
  }

  return (
    <div
      className="sticky-note"
      style={{
        position: 'fixed',
        left: note.x,
        top: note.y,
        width: note.width,
        height: note.height,
        zIndex: isDragging ? 2147483647 : 2147483646,
        background: hexToRgba(preset.bg, 0.82),
        backdropFilter: 'blur(10px)',
        WebkitBackdropFilter: 'blur(10px)',
        borderColor: preset.header,
      }}
    >
      {/* ── header ── */}
      <div
        className="sticky-note-header"
        onPointerDown={handlePointerDown}
        onPointerMove={handlePointerMove}
        onPointerUp={handlePointerUp}
        style={{ background: hexToRgba(preset.header, 0.9), cursor: isDragging ? 'grabbing' : 'grab' }}
      >
        <span className="sticky-drag-handle">⠿</span>

        {isEditingTitle
          ? <input
              ref={titleInputRef}
              value={titleDraft}
              onChange={e => setTitleDraft(e.target.value)}
              onBlur={commitTitle}
              onKeyDown={e => { if (e.key === 'Enter' || e.key === 'Escape') commitTitle() }}
              onPointerDown={e => e.stopPropagation()}
              style={{
                flex: 1, border: 'none', background: 'transparent', outline: 'none',
                fontSize: 12, fontWeight: 700, color: '#1e1b4b', fontFamily: 'system-ui,sans-serif',
              }}
            />
          : <span
              className="sticky-note-title"
              onDoubleClick={e => { e.stopPropagation(); setIsEditingTitle(true) }}
              aria-label="Double-click to rename"
            >
              {note.title ?? 'Note'}
            </span>
        }

        {note.mediaTimestamp != null && (
          <button
            type="button"
            onMouseDown={e => { e.preventDefault(); e.stopPropagation(); seekMedia(note.mediaTimestamp!) }}
            aria-label={`Jump to ${formatTime(note.mediaTimestamp)}`}
            style={{
              display: 'inline-flex', alignItems: 'center', gap: 3,
              padding: '2px 8px', border: 'none', borderRadius: 10,
              background: 'rgba(99,102,241,0.15)', color: '#4f46e5',
              fontSize: 10, fontWeight: 700, cursor: 'pointer',
              fontFamily: 'system-ui,sans-serif', lineHeight: 1,
              whiteSpace: 'nowrap',
            }}
          >
            <svg width="8" height="8" viewBox="0 0 16 16" fill="currentColor">
              <path d="M6.271 5.055a.5.5 0 0 1 .52.038l3.5 2.5a.5.5 0 0 1 0 .814l-3.5 2.5A.5.5 0 0 1 6 10.5v-5a.5.5 0 0 1 .271-.445z"/>
            </svg>
            {formatTime(note.mediaTimestamp)}
          </button>
        )}

        {/* palette toggle */}
        <button
          type="button"
          onMouseDown={e => { e.preventDefault(); e.stopPropagation(); setShowPalette(p => !p) }}
          className="sticky-palette-btn"
          aria-label="Change color"
        >
          <IPalette />
        </button>

        <span className="sticky-dot" style={{ background: '#6366f1' }} />
        <button className="sticky-note-delete" onClick={() => onDelete(note.id)} aria-label="Delete">×</button>
      </div>

      {/* ── color palette (below header) ── */}
      {showPalette && (
        <div style={{
          display: 'flex', gap: 6, padding: '6px 10px',
          background: hexToRgba(preset.header, 0.7),
          borderBottom: `1px solid ${preset.header}`,
        }}>
          {PALETTE.map(p => (
            <button
              key={p.bg}
              type="button"
              onMouseDown={e => { e.preventDefault(); e.stopPropagation(); onUpdate(note.id, { color: p.bg }); setShowPalette(false) }}
              style={{
                width: 20, height: 20, borderRadius: '50%', border: note.color === p.bg ? '2px solid #6366f1' : '2px solid rgba(0,0,0,0.1)',
                background: p.bg, cursor: 'pointer',
              }}
            />
          ))}
        </div>
      )}

      {/* ── formatting bar (always visible) ── */}
      <div style={{
        display: 'flex', alignItems: 'center', gap: 2,
        padding: '4px 8px',
        background: 'rgba(255,255,255,0.65)',
        borderBottom: `1px solid ${preset.header}`,
      }}>
        <FmtBtn onClick={() => fmt('bold')}><IBold /></FmtBtn>
        <FmtBtn onClick={() => fmt('italic')}><IItalic /></FmtBtn>
        <FmtBtn onClick={() => fmt('insertUnorderedList')}><IList /></FmtBtn>
      </div>

      {/* ── body ── */}
      <div
        ref={bodyRef}
        className="sticky-note-body"
        contentEditable
        suppressContentEditableWarning
        onInput={handleInput}
        data-placeholder="Start typing…"
        style={{ background: 'rgba(255,255,255,0.55)' }}
      />

      {/* ── resize corner ── */}
      <div className="sticky-resize" onMouseDown={handleResizeDown}>
        <svg width="10" height="10" viewBox="0 0 10 10" fill="rgba(0,0,0,0.3)">
          <path d="M8 2L2 8M5 2L2 5M8 5L5 8"/>
          <path d="M8 2L2 8" strokeWidth="1" stroke="rgba(0,0,0,0.3)" fill="none"/>
          <path d="M10 4L4 10M10 7L7 10" strokeWidth="1.2" stroke="rgba(0,0,0,0.25)" fill="none"/>
        </svg>
      </div>
    </div>
  )
}