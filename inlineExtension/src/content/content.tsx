/**
 * Content Script Entry Point
 *
 * Creates an isolated Shadow DOM container, injects scoped CSS,
 * and mounts SmartOverlay (selection toolbar, highlights, modals),
 * StickyNotesManager, and the floating panel toolbar (Home) inside it.
 */
import { createRoot } from 'react-dom/client'
import StickyNotesManager from './StickyNotesManager'
import SmartOverlay from './SmartOverlay'
import PanelHost from './PanelHost'
import { restoreHighlights } from './highlightWrap'
import { restoreDrawings } from './drawingsRestore'
import { restoreHandwriting } from './handwritingRestore'
import { restoreAIReplacements } from './aiReplacements'
import { enableReaderMode, disableReaderMode } from '../lib/readerMode'
import { loadLayers, type LayerVisibility } from '../lib/layerState'
import { speakWithElevenLabs, stopSpeaking } from '../lib/elevenLabsTts'
import cssText from './content.css?inline'

;(async () => {
  const stored = await new Promise<Record<string, unknown>>(resolve =>
    chrome.storage.local.get(['inlineBlockedDomains', 'inlineFocusMode'], r => resolve(r)),
  )

  let blockedDomains: string[] = []
  try {
    const raw = stored.inlineBlockedDomains
    if (typeof raw === 'string') blockedDomains = JSON.parse(raw)
  } catch { /* keep default */ }

  const hostname = window.location.hostname
  if (Array.isArray(blockedDomains) && blockedDomains.some(d => hostname === d || hostname.endsWith(`.${d}`))) {
    return
  }

  const focusMode = stored.inlineFocusMode === 'true' || stored.inlineFocusMode === true
  if (focusMode) enableReaderMode()

  /* ── Feature restoration (runs regardless of which panels the user opens) ──
   *
   * These helpers create the relevant layer (SVG / canvas / wrapped text)
   * and repopulate it from storage, so every annotation feature survives
   * a page reload without requiring the user to reopen the authoring
   * panel. The 800ms delay gives the host page a chance to hydrate its
   * own DOM first — otherwise we'd miss text nodes rendered by the SPA.
   */
  setTimeout(() => {
    restoreHighlights()
    restoreDrawings()
    restoreHandwriting()
    restoreAIReplacements()
  }, 800)

  const HOST_ID = 'inline-extension-root'
  if (!document.getElementById(HOST_ID)) {
    const host = document.createElement('div')
    host.id = HOST_ID
    host.style.cssText =
      'position:fixed; top:0; left:0; width:0; height:0; z-index:2147483647; pointer-events:none;'
    if (focusMode) host.dataset.inlineFocus = 'true'
    document.body.appendChild(host)

    const shadow = host.attachShadow({ mode: 'open' })

    const style = document.createElement('style')
    style.textContent = cssText
    shadow.appendChild(style)

    const mountPoint = document.createElement('div')
    mountPoint.id = 'inline-mount'
    mountPoint.style.cssText =
      'position:fixed; top:0; left:0; width:100vw; height:100vh; pointer-events:none;'
    shadow.appendChild(mountPoint)

    /* pointer-events for all interactive overlays */
    const extraStyle = document.createElement('style')
    extraStyle.textContent = `
      .sticky-note, .add-note-button,
      .add-note-launcher, .add-note-launcher *,
      .launcher-eye, .launcher-add,
      .inline-toolbar, .inline-toolbar *,
      .inline-anchor, .inline-anchor *,
      .inline-modal-backdrop, .inline-modal-backdrop *,
      [data-inline-interactive], [data-inline-interactive] * {
        pointer-events: auto;
      }
      *::-webkit-scrollbar { display: none; }
      * { scrollbar-width: none; }
    `
    shadow.appendChild(extraStyle)

    const offlineBadge = document.createElement('div')
    offlineBadge.id = 'inline-offline-badge'
    offlineBadge.textContent = 'Offline'
    offlineBadge.style.cssText = [
      'position:fixed', 'bottom:72px', 'right:24px',
      'padding:4px 12px', 'border-radius:9999px',
      'background:#ef4444', 'color:#fff',
      'font:600 12px/1.4 system-ui,sans-serif',
      'pointer-events:none', 'display:none', 'z-index:2147483647',
    ].join(';')
    shadow.appendChild(offlineBadge)

    const showBadge = () => { offlineBadge.style.display = 'block' }
    const hideBadge = () => { offlineBadge.style.display = 'none' }

    window.addEventListener('offline', showBadge)
    window.addEventListener('online', hideBadge)
    if (!navigator.onLine) showBadge()

    const root = createRoot(mountPoint)
    root.render(
      <>
        <SmartOverlay />
        <StickyNotesManager />
        {/* After sticky layer so the right toolbar paints above any full-page hit areas */}
        <PanelHost />
      </>,
    )
  }

  document.addEventListener('inline:focusMode', ((e: CustomEvent<{ enabled: boolean }>) => {
    const host = document.getElementById('inline-extension-root')
    if (!host) return
    if (e.detail.enabled) {
      host.dataset.inlineFocus = 'true'
      enableReaderMode()
    } else {
      delete host.dataset.inlineFocus
      disableReaderMode()
    }
  }) as EventListener)

  document.addEventListener('inline:saveResult', ((e: CustomEvent<{ error?: string }>) => {
    const badge = document
      .getElementById('inline-extension-root')
      ?.shadowRoot?.getElementById('inline-offline-badge')
    if (!badge) return
    const err = e.detail?.error ?? ''
    if (/offline|queued/i.test(err)) {
      badge.style.display = 'block'
    }
  }) as EventListener)

  chrome.runtime.onMessage.addListener((message) => {
    if (message.action === 'addNote') {
      document.dispatchEvent(new CustomEvent('inline:addNote'))
    }
    if (message.type === 'INLINE_COMMAND') {
      document.dispatchEvent(
        new CustomEvent('inline:command', { detail: { command: message.command } }),
      )
    }

    /* ── Right-click context-menu: Clip to Workspace ── */
    if (message.type === 'INLINE_FEATURE' && message.featureId === 'clip-to-workspace') {
      const selection = (message.selectedText as string | undefined)?.trim() ?? ''
      if (!selection) return
      try {
        chrome.storage.local.get(['inlineActiveWorkspaceId'], (r) => {
          const workspaceId = typeof r.inlineActiveWorkspaceId === 'string'
            ? r.inlineActiveWorkspaceId
            : ''
          chrome.runtime.sendMessage({
            type: 'CLIP_TO_WORKSPACE',
            payload: {
              pageUrl: window.location.href,
              pageTitle: document.title,
              selection,
              highlights: [],
              workspaceId,
            },
          }, () => { if (chrome.runtime.lastError) { /* ignore */ } })
        })
      } catch { /* extension context unavailable */ }
    }
  })

  /* ── Layer visibility toggles ── */
  const LAYER_SELECTORS: Record<keyof LayerVisibility, string[]> = {
    highlights: ['[data-inline-highlight]'],
    drawings: ['#inline-draw-canvas', '#inline-handwriting-canvas'],
    stickies: ['[data-inline-sticky]', '[data-inline-anchor]'],
    stamps: ['[data-inline-stamp]'],
  }

  function applyLayerVisibility(layers: LayerVisibility): void {
    (Object.keys(LAYER_SELECTORS) as (keyof LayerVisibility)[]).forEach((key) => {
      const visible = layers[key]
      for (const sel of LAYER_SELECTORS[key]) {
        document.querySelectorAll<HTMLElement>(sel).forEach((el) => {
          el.style.display = visible ? '' : 'none'
        })
      }
    })
  }

  loadLayers().then(applyLayerVisibility).catch(() => {})

  document.addEventListener('inline:layerToggle', ((e: CustomEvent<LayerVisibility>) => {
    if (e.detail) applyLayerVisibility(e.detail)
  }) as EventListener)

  /* ── Stamp placement + persistence ── */
  interface PlacedStamp {
    id: string
    emoji: string
    x: number
    y: number
    createdAt: number
  }

  let pendingStampEmoji: string | null = null
  let placedStamps: PlacedStamp[] = []
  let stampsLoaded = false

  function stampId(): string {
    return `st-${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 8)}`
  }

  function renderStamp(s: PlacedStamp): void {
    if (document.querySelector(`[data-inline-stamp-id="${s.id}"]`)) return
    const el = document.createElement('div')
    el.setAttribute('data-inline-stamp', 'true')
    el.setAttribute('data-inline-stamp-id', s.id)
    el.textContent = s.emoji
    el.style.cssText = [
      'position:absolute', `left:${s.x}px`, `top:${s.y}px`,
      'font-size:24px', 'line-height:1',
      'pointer-events:none', 'z-index:2147483640',
      'user-select:none', 'transform:translate(-50%,-50%)',
    ].join(';')
    document.body.appendChild(el)
  }

  function persistStamps(): void {
    if (!chrome.runtime?.id) return
    chrome.runtime.sendMessage(
      {
        type: 'SAVE_ANNOTATIONS',
        payload: {
          pageUrl: window.location.href,
          featureKey: 'stamps',
          data: placedStamps,
          pageTitle: document.title,
          domain: window.location.hostname,
          clearedAt: placedStamps.length === 0 ? Date.now() : null,
        },
      },
      () => { if (chrome.runtime.lastError) { /* ignore */ } },
    )
  }

  if (chrome.runtime?.id) {
    chrome.runtime.sendMessage(
      { type: 'LOAD_ANNOTATIONS', payload: { pageUrl: window.location.href } },
      (response) => {
        stampsLoaded = true
        if (chrome.runtime.lastError || !response?.ok) return
        const saved = response.data?.elements?.stamps as PlacedStamp[] | undefined
        if (Array.isArray(saved)) {
          placedStamps = saved
          for (const s of placedStamps) renderStamp(s)
        }
      },
    )
  } else {
    stampsLoaded = true
  }

  document.addEventListener('inline:stampPlace', ((e: CustomEvent<{ emoji: string }>) => {
    pendingStampEmoji = e.detail?.emoji ?? null
    document.body.style.cursor = 'crosshair'
  }) as EventListener)

  /* ── Screen-reader mode: speak selection / focused text via ElevenLabs ──
   *
   * The screen-reader toggle only *enables* the capability. Speech is never
   * triggered just because the user highlighted or focused something — that
   * would overlap with every other selection-driven feature (highlight,
   * rewrite, AI, clip). Instead, the user explicitly triggers speech via:
   *   • Alt+Shift+S keyboard shortcut (speaks the current selection)
   *   • `inline:speakSelection` custom event (dispatched by a toolbar action)
   *   • The per-panel "Speak" buttons in AI / Rewrite, which remain unchanged
   *     because they call speakWithElevenLabs directly on the panel's result.
   */
  let screenReaderEnabled = false

  chrome.storage.local.get(['inlineScreenReader'], (r) => {
    screenReaderEnabled = r.inlineScreenReader === 'true' || r.inlineScreenReader === true
  })

  document.addEventListener('inline:screenReader', ((e: CustomEvent<{ enabled: boolean }>) => {
    screenReaderEnabled = !!e.detail?.enabled
    if (!screenReaderEnabled) stopSpeaking()
  }) as EventListener)

  function getFocusedOrSelectedText(): string {
    const sel = window.getSelection()?.toString().trim()
    if (sel) return sel
    const active = document.activeElement as HTMLElement | null
    if (active) {
      if ('value' in active && typeof (active as HTMLInputElement).value === 'string') {
        return (active as HTMLInputElement).value.trim()
      }
      const text = (active.innerText ?? active.textContent ?? '').trim()
      if (text) return text.slice(0, 600)
    }
    return ''
  }

  function speakNow(): void {
    if (!screenReaderEnabled) return
    const text = getFocusedOrSelectedText()
    if (!text) return
    void speakWithElevenLabs(text)
  }

  document.addEventListener('keydown', (e: KeyboardEvent) => {
    if (!screenReaderEnabled) return
    if (e.altKey && e.shiftKey && (e.key === 'S' || e.key === 's')) {
      e.preventDefault()
      speakNow()
    }
    if (e.key === 'Escape') stopSpeaking()
  })

  document.addEventListener('inline:speakSelection', () => { speakNow() })
  document.addEventListener('inline:stopSpeaking', () => { stopSpeaking() })

  document.addEventListener('click', (e: MouseEvent) => {
    if (!pendingStampEmoji) return
    const target = e.target as Element | null
    if (target?.closest?.('#inline-extension-root')) return
    const x = e.pageX
    const y = e.pageY
    const stamp: PlacedStamp = {
      id: stampId(),
      emoji: pendingStampEmoji,
      x, y,
      createdAt: Date.now(),
    }
    placedStamps = [...placedStamps, stamp]
    renderStamp(stamp)
    pendingStampEmoji = null
    document.body.style.cursor = ''
    if (stampsLoaded) persistStamps()
    document.dispatchEvent(new CustomEvent('inline:stampPlaced', { detail: stamp }))
  }, true)
})()
