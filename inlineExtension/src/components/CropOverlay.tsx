import { useState, useRef, useCallback, useEffect } from 'react'
import { PANEL as C, FONT } from '../lib/extensionTheme'
import { loadSettings } from '../lib/extensionSettings'
import { fetchViaBackground } from '../lib/backgroundFetch'
import { GUEST_AI_LIMIT, reserveAiPrompt } from '../lib/aiAccess'

interface CropOverlayProps {
  screenshot: string
  onClose: () => void
}

export default function CropOverlay({ screenshot, onClose }: CropOverlayProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null)
  const [dragging, setDragging] = useState(false)
  const [start, setStart] = useState({ x: 0, y: 0 })
  const [end, setEnd] = useState({ x: 0, y: 0 })
  const [hasCrop, setHasCrop] = useState(false)
  const [analyzing, setAnalyzing] = useState(false)
  const [result, setResult] = useState<string | null>(null)

  const rect = hasCrop
    ? {
        x: Math.min(start.x, end.x),
        y: Math.min(start.y, end.y),
        w: Math.abs(end.x - start.x),
        h: Math.abs(end.y - start.y),
      }
    : null

  const handleMouseDown = useCallback((e: React.MouseEvent) => {
    if (result) return
    setDragging(true)
    setHasCrop(false)
    setStart({ x: e.clientX, y: e.clientY })
    setEnd({ x: e.clientX, y: e.clientY })
  }, [result])

  const handleMouseMove = useCallback((e: React.MouseEvent) => {
    if (!dragging) return
    setEnd({ x: e.clientX, y: e.clientY })
  }, [dragging])

  const handleMouseUp = useCallback(() => {
    if (!dragging) return
    setDragging(false)
    const w = Math.abs(end.x - start.x)
    const h = Math.abs(end.y - start.y)
    if (w > 10 && h > 10) setHasCrop(true)
  }, [dragging, start, end])

  const cropAndAnalyze = useCallback(async () => {
    if (!rect) return
    setAnalyzing(true)
    try {
      const img = new Image()
      img.src = screenshot
      await new Promise<void>((resolve, reject) => {
        img.onload = () => resolve()
        img.onerror = () => reject()
      })

      const dpr = window.devicePixelRatio || 1
      const canvas = document.createElement('canvas')
      canvas.width = rect.w * dpr
      canvas.height = rect.h * dpr
      const ctx = canvas.getContext('2d')!
      ctx.drawImage(
        img,
        rect.x * dpr, rect.y * dpr,
        rect.w * dpr, rect.h * dpr,
        0, 0,
        rect.w * dpr, rect.h * dpr,
      )
      const croppedDataUrl = canvas.toDataURL('image/png')

      const access = await reserveAiPrompt()
      if (!access.allowed) {
        setResult(`Sign in to keep using AI. Guest mode includes ${GUEST_AI_LIMIT} free prompts on this browser.`)
        return
      }

      const { apiBaseUrl, accessToken } = await loadSettings()
      const headers: Record<string, string> = { 'Content-Type': 'application/json' }
      if (access.signedIn && accessToken) headers.Authorization = `Bearer ${accessToken}`
      if (!access.signedIn) headers['X-Inline-Device-Id'] = access.deviceId

      const res = await fetchViaBackground(`${apiBaseUrl}/api/ai/extension-light`, {
        method: 'POST',
        headers,
        body: JSON.stringify({
          task: 'analyze-image',
          text: 'Analyze this screenshot crop and describe what you see.',
          image: croppedDataUrl,
          guest: !access.signedIn,
          deviceId: access.signedIn ? undefined : access.deviceId,
        }),
      })

      if (res.ok) {
        const json = await res.json<{ result?: string }>()
        setResult(json.result ?? 'No result returned.')
      } else {
        setResult('AI analysis failed. Check your API settings.')
      }
    } catch {
      setResult('Could not reach AI server.')
    } finally {
      setAnalyzing(false)
    }
  }, [rect, screenshot])

  useEffect(() => {
    const handleEsc = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose()
    }
    document.addEventListener('keydown', handleEsc)
    return () => document.removeEventListener('keydown', handleEsc)
  }, [onClose])

  return (
    <div
      style={{
        position: 'fixed', inset: 0, zIndex: 2147483647,
        cursor: result ? 'default' : 'crosshair',
        pointerEvents: 'auto',
      }}
      onMouseDown={handleMouseDown}
      onMouseMove={handleMouseMove}
      onMouseUp={handleMouseUp}
    >
      {/* Screenshot background */}
      <img
        src={screenshot}
        alt=""
        draggable={false}
        style={{ position: 'absolute', inset: 0, width: '100%', height: '100%', objectFit: 'cover', pointerEvents: 'none' }}
      />

      {/* Dim overlay */}
      <div style={{
        position: 'absolute', inset: 0,
        background: 'rgba(0,0,0,0.4)',
        pointerEvents: 'none',
      }} />

      {/* Crop rectangle */}
      {(dragging || hasCrop) && rect && rect.w > 2 && rect.h > 2 && (
        <div style={{
          position: 'absolute',
          left: rect.x, top: rect.y,
          width: rect.w, height: rect.h,
          border: '2px dashed #fff',
          background: 'rgba(255,255,255,0.1)',
          borderRadius: 4,
          pointerEvents: 'none',
        }} />
      )}

      {/* Controls */}
      {hasCrop && !result && (
        <div style={{
          position: 'absolute',
          left: rect!.x,
          top: rect!.y + rect!.h + 12,
          display: 'flex', gap: 8,
          pointerEvents: 'auto',
        }}>
          <button type="button" onClick={cropAndAnalyze} disabled={analyzing} style={{
            padding: '8px 20px', borderRadius: C.radiusPill,
            border: 'none', background: C.accent, color: '#fff',
            fontSize: 13, fontWeight: 500, cursor: 'pointer',
            fontFamily: FONT, boxShadow: C.shadowOuter,
            opacity: analyzing ? 0.7 : 1,
          }}>
            {analyzing ? 'Analyzing…' : 'Analyze'}
          </button>
          <button type="button" onClick={onClose} style={{
            padding: '8px 20px', borderRadius: C.radiusPill,
            border: `1px solid ${C.border}`, background: C.bg, color: C.text,
            fontSize: 13, fontWeight: 500, cursor: 'pointer',
            fontFamily: FONT, boxShadow: C.shadowOuter,
          }}>
            Cancel
          </button>
        </div>
      )}

      {/* Result card */}
      {result && (
        <div
          style={{
            position: 'absolute',
            left: '50%', top: '50%', transform: 'translate(-50%, -50%)',
            width: 300, maxHeight: 420, overflowY: 'auto',
            background: C.bg, border: `1px solid ${C.border}`,
            borderRadius: C.radius, boxShadow: C.shadowOuter,
            fontFamily: FONT, pointerEvents: 'auto',
          }}
          onMouseDown={e => e.stopPropagation()}
        >
          <div style={{
            padding: '10px 14px', background: C.headerBg,
            borderBottom: `1px solid ${C.divider}`,
            display: 'flex', alignItems: 'center', justifyContent: 'space-between',
          }}>
            <span style={{ fontSize: 13, fontWeight: 500, color: C.accent }}>Analysis</span>
            <button type="button" onClick={onClose} style={{
              display: 'inline-flex', alignItems: 'center', justifyContent: 'center',
              width: 28, height: 28, border: 'none', borderRadius: 8,
              background: 'rgba(255,255,255,0.4)', cursor: 'pointer', padding: 0,
            }}>
              <svg width="12" height="12" viewBox="0 0 16 16" fill="#78716c">
                <path d="M4.646 4.646a.5.5 0 0 1 .708 0L8 7.293l2.646-2.647a.5.5 0 0 1 .708.708L8.707 8l2.647 2.646a.5.5 0 0 1-.708.708L8 8.707l-2.646 2.647a.5.5 0 0 1-.708-.708L7.293 8 4.646 5.354a.5.5 0 0 1 0-.708z"/>
              </svg>
            </button>
          </div>
          <div style={{
            padding: 18, fontSize: 13, lineHeight: 1.65, color: C.text,
            whiteSpace: 'pre-wrap', wordBreak: 'break-word',
          }}>
            {result}
          </div>
          <div style={{
            padding: '10px 16px', borderTop: `1px solid ${C.divider}`,
            background: C.surfaceMuted, display: 'flex', justifyContent: 'flex-end',
          }}>
            <button type="button" onClick={onClose} style={{
              padding: '8px 18px', borderRadius: C.radiusPill,
              border: `1px solid ${C.border}`, background: C.surfaceBubble,
              fontSize: 12, fontWeight: 500, cursor: 'pointer',
              color: C.text, fontFamily: FONT,
            }}>
              Close
            </button>
          </div>
        </div>
      )}

      <canvas ref={canvasRef} style={{ display: 'none' }} />
    </div>
  )
}
