/**
 * Content Script Entry Point
 *
 * Creates an isolated Shadow DOM container, injects scoped CSS,
 * and mounts ContentShell (privacy gate + capture UI) inside it.
 */
import { createRoot, type Root } from 'react-dom/client'
import ContentShell from './ContentShell'
import { enableReaderMode, disableReaderMode } from '../lib/readerMode'
import { loadLayers, type LayerVisibility } from '../lib/layerState'
import { applyHighlightLayerVisibility, applyLayerVisibility } from './layerVisibility'
import { speakWithElevenLabs, stopSpeaking } from '../lib/elevenLabsTts'
import { readPrivacyAccepted } from '../lib/privacyConsent'
import cssText from './content.css?inline'
import { FONT_FACE_CSS } from '../lib/extensionFonts'

const HOST_ID = 'inline-extension-root'
let uiRoot: Root | null = null

function waitForBody(): Promise<HTMLElement> {
  if (document.body) return Promise.resolve(document.body)
  return new Promise(resolve => {
    const done = () => {
      if (document.body) {
        observer.disconnect()
        resolve(document.body)
      }
    }
    const observer = new MutationObserver(done)
    observer.observe(document.documentElement, { childList: true, subtree: true })
    done()
  })
}

function ensureMountPoint(shadow: ShadowRoot): HTMLDivElement {
  const existing = shadow.getElementById('inline-mount')
  const mountPoint = document.createElement('div')
  mountPoint.id = 'inline-mount'
  mountPoint.style.cssText =
    'position:fixed; top:0; left:0; width:100vw; height:100vh; pointer-events:none;'
  if (existing) existing.replaceWith(mountPoint)
  else shadow.appendChild(mountPoint)
  return mountPoint
}

function mountContentShell(focusMode: boolean): void {
  let host = document.getElementById(HOST_ID) as HTMLDivElement | null

  if (host && !host.shadowRoot) {
    host.remove()
    host = null
  }

  if (!host) {
    host = document.createElement('div')
    host.id = HOST_ID
    host.style.cssText =
      'position:fixed; top:0; left:0; width:0; height:0; z-index:2147483647; pointer-events:none;'
    if (focusMode) host.dataset.inlineFocus = 'true'

    const shadow = host.attachShadow({ mode: 'open' })

    const style = document.createElement('style')
    style.textContent = FONT_FACE_CSS + '\n' + cssText
    shadow.appendChild(style)

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
      'font:500 12px/1.4 Geist,ui-sans-serif,system-ui,sans-serif',
      'pointer-events:none', 'display:none', 'z-index:2147483647',
    ].join(';')
    shadow.appendChild(offlineBadge)

    const showBadge = () => { offlineBadge.style.display = 'block' }
    const hideBadge = () => { offlineBadge.style.display = 'none' }

    window.addEventListener('offline', showBadge)
    window.addEventListener('online', hideBadge)
    if (!navigator.onLine) showBadge()

    document.body.appendChild(host)
  }

  const mountPoint = ensureMountPoint(host.shadowRoot!)
  try { uiRoot?.unmount() } catch { /* stale after extension reload */ }
  uiRoot = createRoot(mountPoint)
  uiRoot.render(<ContentShell />)
}

;(async () => {
  if (!chrome.runtime?.id) return

  const body = await waitForBody().catch(() => null)
  if (!body) return

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

  let privacyAccepted = await readPrivacyAccepted()
  let postConsentInitialized = false

  mountContentShell(focusMode)

  function initAfterPrivacyConsent(): void {
    if (!privacyAccepted || postConsentInitialized) return
    postConsentInitialized = true

    chrome.runtime.onMessage.addListener((message) => {
      if (message.action === 'addNote') {
        document.dispatchEvent(new CustomEvent('inline:addNote'))
      }
      if (message.type === 'INLINE_COMMAND') {
        document.dispatchEvent(
          new CustomEvent('inline:command', { detail: { command: message.command } }),
        )
      }

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

    let currentLayers: LayerVisibility | null = null

    function syncLayerVisibility(layers: LayerVisibility): void {
      currentLayers = layers
      applyLayerVisibility(layers)
    }

    loadLayers().then(syncLayerVisibility).catch(() => {})

    document.addEventListener('inline:layerToggle', ((e: CustomEvent<LayerVisibility>) => {
      if (e.detail) syncLayerVisibility(e.detail)
    }) as EventListener)

    document.addEventListener('inline:highlightsRestored', reapplyHighlightLayer)
    document.addEventListener('inline:highlightAdded', reapplyHighlightLayer)

    function reapplyHighlightLayer(): void {
      if (currentLayers) applyHighlightLayerVisibility(currentLayers.highlights)
    }

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
  }

  document.addEventListener('inline:privacyAccepted', () => {
    privacyAccepted = true
    initAfterPrivacyConsent()
  })

  if (privacyAccepted) initAfterPrivacyConsent()

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
})()
