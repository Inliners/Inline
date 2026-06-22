/**
 * Service worker: registers context menus, relays messages to the content
 * script, and proxies backend API calls for content scripts.
 */

import { enqueue, getQueue } from '../lib/syncQueue'
import { DEFAULT_INLINE_VOICE_ID, normalizeInlineVoiceId } from '../lib/inlineVoicePresets'

/**
 * Port split (see plan section "port-split"):
 *   - `BACKEND_URL` is the Express annotations server (default :3030).
 *   - `WEB_URL`     is the Next.js app that serves /api/clip, /api/share,
 *                   /api/tts, /api/ai/*, etc. (default :3000).
 *
 * Users can override either via `inlineApiBase` (Next) /
 * `inlineBackendBase` (Express) in chrome.storage.local.
 */
const BACKEND_URL = 'http://localhost:3030'
const WEB_URL     = 'http://localhost:3000'

/**
 * Only attach an Authorization header if the token *looks* like a real JWT
 * (three dot-separated, non-empty segments). Otherwise Supabase throws
 * "Expected 3 parts in JWT; got 1" and the whole annotation save 500s.
 */
function isUsableJwt(token: string): boolean {
  if (!token) return false
  const parts = token.split('.')
  return parts.length === 3 && parts.every((p) => p.length > 0)
}

type LocalAnnotationDoc = {
  pageUrl: string
  pageTitle: string
  domain: string
  elements: Record<string, unknown>
  updatedAt: number
  clearedAt?: number | null
}

function hashString(value: string): string {
  let hash = 2166136261
  for (let i = 0; i < value.length; i++) {
    hash ^= value.charCodeAt(i)
    hash = Math.imul(hash, 16777619)
  }
  return (hash >>> 0).toString(36)
}

function localAnnotationsKey(pageUrl: string): string {
  return `inlineLocalAnnotations:${hashString(pageUrl)}`
}

function asLocalAnnotationDoc(value: unknown, pageUrl: string): LocalAnnotationDoc {
  if (!value || typeof value !== 'object') {
    return { pageUrl, pageTitle: '', domain: '', elements: {}, updatedAt: 0 }
  }
  const doc = value as Partial<LocalAnnotationDoc>
  const elements = doc.elements && typeof doc.elements === 'object' && !Array.isArray(doc.elements)
    ? doc.elements as Record<string, unknown>
    : {}
  return {
    pageUrl: typeof doc.pageUrl === 'string' ? doc.pageUrl : pageUrl,
    pageTitle: typeof doc.pageTitle === 'string' ? doc.pageTitle : '',
    domain: typeof doc.domain === 'string' ? doc.domain : '',
    elements,
    updatedAt: typeof doc.updatedAt === 'number' ? doc.updatedAt : 0,
    clearedAt: typeof doc.clearedAt === 'number' ? doc.clearedAt : null,
  }
}

async function loadLocalAnnotations(pageUrl: string): Promise<LocalAnnotationDoc> {
  const key = localAnnotationsKey(pageUrl)
  const stored = await chrome.storage.local.get(key)
  return asLocalAnnotationDoc(stored[key], pageUrl)
}

async function saveLocalAnnotation(input: {
  pageUrl: string
  featureKey: string
  data: unknown
  pageTitle?: string
  domain?: string
  clearedAt?: number | null
}): Promise<LocalAnnotationDoc> {
  const key = localAnnotationsKey(input.pageUrl)
  const current = await loadLocalAnnotations(input.pageUrl)
  const next: LocalAnnotationDoc = {
    ...current,
    pageTitle: input.pageTitle ?? current.pageTitle,
    domain: input.domain ?? current.domain,
    elements: { ...current.elements, [input.featureKey]: input.data },
    updatedAt: Date.now(),
    clearedAt: input.clearedAt ?? current.clearedAt ?? null,
  }
  await chrome.storage.local.set({ [key]: next })
  return next
}

function arrayBufferToBase64(buffer: ArrayBuffer): string {
  const bytes = new Uint8Array(buffer)
  let binary = ''
  for (let i = 0; i < bytes.length; i++) {
    binary += String.fromCharCode(bytes[i]!)
  }
  return btoa(binary)
}

// ─── Context Menus ──────────────────────────────────────────────────────────

chrome.runtime.onInstalled.addListener(() => {
  chrome.alarms.create('inline-sync-retry', { periodInMinutes: 2 })

  chrome.contextMenus.removeAll(() => {
    chrome.contextMenus.create({
      id: 'inline-analyze-risk',
      title: 'Analyze page risk (Inline)',
      contexts: ['page'],
    })

    chrome.contextMenus.create({
      id: 'inline-root',
      title: 'Inline',
      contexts: ['selection'],
    })

    chrome.contextMenus.create({
      id: 'notes',
      parentId: 'inline-root',
      title: '📝 Add Note',
      contexts: ['selection'],
    })

    chrome.contextMenus.create({
      id: 'highlight',
      parentId: 'inline-root',
      title: '🖊️ Highlight',
      contexts: ['selection'],
    })

    chrome.contextMenus.create({
      id: 'rewrite',
      parentId: 'inline-root',
      title: '✏️ Rewrite',
      contexts: ['selection'],
    })

    chrome.contextMenus.create({
      id: 'ai',
      parentId: 'inline-root',
      title: '✨ Ask AI',
      contexts: ['selection'],
    })

    chrome.contextMenus.create({
      id: 'clip-to-workspace',
      parentId: 'inline-root',
      title: '📎 Clip to Workspace',
      contexts: ['selection'],
    })
  })
})

chrome.contextMenus.onClicked.addListener((info, tab) => {
  if (info.menuItemId === 'inline-analyze-risk' && tab?.id != null) {
    chrome.tabs.sendMessage(tab.id, { type: 'INLINE_PAGE_RISK' }).catch(() => {})
    return
  }

  if (!tab?.id || info.menuItemId === 'inline-root') return

  chrome.tabs.sendMessage(tab.id, {
    type: 'INLINE_FEATURE',
    featureId: info.menuItemId,
    selectedText: info.selectionText ?? '',
  })
})

// ─── Backend API Proxy ──────────────────────────────────────────────────────
// Content scripts on public HTTPS pages cannot fetch localhost due to Chrome's
// Private Network Access policy. Background service workers are exempt, so all
// backend calls are routed through here.

chrome.runtime.onMessageExternal.addListener((message, _sender, sendResponse) => {
  if (message?.type === 'INLINE_SYNC_VOICE_SETTINGS') {
    // Voice PREFERENCES only. API keys are never accepted or stored —
    // read-aloud always goes through the dashboard's server-side /api/tts.
    const p = message.payload as {
      voiceId?: string
      stability?: string
      similarity?: string
    }
    const patch: Record<string, string> = {}
    if (p.voiceId !== undefined) patch.inlineVoiceId = normalizeInlineVoiceId(p.voiceId)
    if (p.stability !== undefined) patch.inlineVoiceStability = p.stability
    if (p.similarity !== undefined) patch.inlineVoiceSimilarity = p.similarity
    // Purge any legacy user-pasted key from older versions.
    void chrome.storage.local.remove(['inlineElevenLabsKey'])
    void chrome.storage.local.set(patch, () => {
      if (chrome.runtime.lastError) {
        sendResponse({ ok: false, error: chrome.runtime.lastError.message })
        return
      }
      sendResponse({ ok: true })
    })
    return true
  }

  /**
   * Domain blocklist sync from the dashboard's Extension settings tab.
   * Stored under the same key the content script and popup Settings read.
   */
  if (message?.type === 'INLINE_SYNC_BLOCKLIST') {
    const p = message.payload as { blockedDomains?: string[] }
    if (!Array.isArray(p?.blockedDomains)) {
      sendResponse({ ok: false, error: 'blockedDomains must be an array' })
      return true
    }
    const cleaned = p.blockedDomains
      .filter((d): d is string => typeof d === 'string')
      .map(d => d.trim().toLowerCase())
      .filter(Boolean)
    void chrome.storage.local.set({ inlineBlockedDomains: JSON.stringify(cleaned) }, () => {
      if (chrome.runtime.lastError) {
        sendResponse({ ok: false, error: chrome.runtime.lastError.message })
        return
      }
      sendResponse({ ok: true })
    })
    return true
  }

  /**
   * Auth + workspace handoff from the web dashboard.
   *
   * Every time the dashboard mounts it posts the current Supabase access token
   * and the active workspace id so the extension can save notes under the same
   * user without the user ever pasting a token into the popup. This is what
   * makes History / Analytics populate from extension captures.
   */
  if (message?.type === 'INLINE_SYNC_AUTH') {
    const p = message.payload as {
      accessToken?: string
      userId?: string
      workspaceId?: string
      apiBase?: string
      backendBase?: string
      email?: string
      name?: string
      avatarUrl?: string
    }
    const patch: Record<string, string> = {}
    if (typeof p.accessToken === 'string') patch.inlineAccessToken = p.accessToken
    if (typeof p.userId === 'string')      patch.inlineUserId      = p.userId
    if (typeof p.workspaceId === 'string' && p.workspaceId) patch.inlineActiveWorkspaceId = p.workspaceId
    if (typeof p.apiBase === 'string' && p.apiBase)         patch.inlineApiBase = p.apiBase.replace(/\/$/, '')
    if (typeof p.backendBase === 'string' && p.backendBase) patch.inlineBackendBase = p.backendBase.replace(/\/$/, '')
    if (typeof p.email === 'string' && p.email)             patch.inlineUserEmail = p.email
    if (typeof p.name === 'string' && p.name)               patch.inlineUserName = p.name
    if (typeof p.avatarUrl === 'string' && p.avatarUrl)     patch.inlineUserAvatarUrl = p.avatarUrl
    void chrome.storage.local.set(patch, () => {
      if (chrome.runtime.lastError) {
        sendResponse({ ok: false, error: chrome.runtime.lastError.message })
        return
      }
      sendResponse({ ok: true })
    })
    return true
  }
})

chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
  // Generic proxy: content scripts on HTTPS pages can't reach localhost due to
  // Chrome's Private Network Access policy. Service workers are exempt, so any
  // call routed through here escapes that restriction.
  if (message.type === 'INLINE_PROXY_FETCH') {
    const payload = message.payload as {
      url?: string
      method?: string
      headers?: Record<string, string>
      body?: string
    }
    const url = typeof payload?.url === 'string' ? payload.url : ''
    if (!url) {
      sendResponse({ ok: false, status: 0, bodyText: '', error: 'url required' })
      return true
    }
    ;(async () => {
      try {
        const res = await fetch(url, {
          method: payload.method ?? 'GET',
          headers: payload.headers ?? {},
          body: payload.body,
        })
        const bodyText = await res.text().catch(() => '')
        sendResponse({ ok: res.ok, status: res.status, bodyText })
      } catch (err) {
        sendResponse({
          ok: false,
          status: 0,
          bodyText: '',
          error: err instanceof Error ? err.message : 'proxy fetch failed',
        })
      }
    })()
    return true
  }

  if (message.type === 'INLINE_TTS') {
    const payload = message.payload as { text?: string; voiceId?: string }
    const text = typeof payload?.text === 'string' ? payload.text : ''
    if (!text.trim()) {
      sendResponse({ ok: false, error: 'empty text' })
      return true
    }

    void chrome.storage.local.get(
      ['inlineApiBase', 'inlineAccessToken', 'inlineVoiceId', 'inlineVoiceStability', 'inlineVoiceSimilarity'],
      async (r) => {
        const baseRaw = typeof r.inlineApiBase === 'string' && r.inlineApiBase ? r.inlineApiBase : WEB_URL
        const base = baseRaw.replace(/\/$/, '')
        const vid = normalizeInlineVoiceId(
          (typeof payload.voiceId === 'string' && payload.voiceId) ||
            (typeof r.inlineVoiceId === 'string' && r.inlineVoiceId) ||
            DEFAULT_INLINE_VOICE_ID,
        )
        const stability = parseFloat(
          typeof r.inlineVoiceStability === 'string' ? r.inlineVoiceStability : '0.5',
        )
        const similarity = parseFloat(
          typeof r.inlineVoiceSimilarity === 'string' ? r.inlineVoiceSimilarity : '0.75',
        )

        // The server TTS proxy requires auth; forward the dashboard-synced
        // Supabase JWT. No third-party keys ever leave or enter the extension.
        const accessToken = typeof r.inlineAccessToken === 'string' ? r.inlineAccessToken : ''
        const headers: Record<string, string> = { 'Content-Type': 'application/json' }
        if (isUsableJwt(accessToken)) headers.Authorization = `Bearer ${accessToken}`

        try {
          const res = await fetch(`${base}/api/tts`, {
            method: 'POST',
            headers,
            body: JSON.stringify({
              text: text.slice(0, 3000),
              voiceId: vid,
              stability: Number.isFinite(stability) ? stability : 0.5,
              similarityBoost: Number.isFinite(similarity) ? similarity : 0.75,
            }),
          })

          if (!res.ok) {
            const errText = await res.text().catch(() => `HTTP ${res.status}`)
            sendResponse({ ok: false, error: errText })
            return
          }

          const buf = await res.arrayBuffer()
          sendResponse({
            ok: true,
            audioBase64: arrayBufferToBase64(buf),
            mimeType: res.headers.get('Content-Type') || 'audio/mpeg',
          })
        } catch (e) {
          sendResponse({
            ok: false,
            error: e instanceof Error ? e.message : 'TTS fetch failed',
          })
        }
      },
    )
    return true
  }

  if (message.type === 'CAPTURE_TAB') {
    const windowId = sender.tab?.windowId
    if (windowId == null) {
      sendResponse({ ok: false, error: 'No tab context for capture' })
      return true
    }
    chrome.tabs.captureVisibleTab(windowId, { format: 'png' }, (dataUrl) => {
      if (chrome.runtime.lastError) {
        sendResponse({ ok: false, error: chrome.runtime.lastError.message })
        return
      }
      sendResponse({ ok: true, dataUrl })
    })
    return true
  }

  if (message.type === 'CLIP_TO_WORKSPACE') {
    const { pageUrl, pageTitle, selection, highlights, workspaceId } = message.payload

    void chrome.storage.local.get(
      ['inlineApiBase', 'inlineAccessToken', 'inlineActiveWorkspaceId'],
      async (r) => {
        const base = (typeof r.inlineApiBase === 'string' && r.inlineApiBase ? r.inlineApiBase : WEB_URL).replace(/\/$/, '')
        const accessToken = typeof r.inlineAccessToken === 'string' ? r.inlineAccessToken : ''
        const ws = workspaceId
          || (typeof r.inlineActiveWorkspaceId === 'string' ? r.inlineActiveWorkspaceId : '')

        const headers: Record<string, string> = { 'Content-Type': 'application/json' }
        if (isUsableJwt(accessToken)) headers.Authorization = `Bearer ${accessToken}`

        if (!isUsableJwt(accessToken) || !ws) {
          sendResponse({ ok: false, storageMode: 'local', error: 'Sign in to sync clips.' })
          return
        }

        try {
          const res = await fetch(`${base}/api/clip`, {
            method: 'POST',
            headers,
            body: JSON.stringify({ pageUrl, pageTitle, selection, highlights, workspaceId: ws }),
          })
          const json = await res.json()
          if (!res.ok) {
            sendResponse({ ok: false, error: json.error ?? `HTTP ${res.status}` })
            return
          }
          sendResponse({ ok: true, data: json })
        } catch (err) {
          sendResponse({ ok: false, error: err instanceof Error ? err.message : 'Clip failed' })
        }
      },
    )

    return true
  }

  if (message.type === 'SAVE_ANNOTATIONS') {
    const { pageUrl, featureKey, data, pageTitle, domain, clearedAt } = message.payload;

    void chrome.storage.local.get(
      ['inlineBackendBase', 'inlineAccessToken', 'inlineActiveWorkspaceId', 'inlineUserId'],
      async (r) => {
        const base = (typeof r.inlineBackendBase === 'string' && r.inlineBackendBase ? r.inlineBackendBase : BACKEND_URL).replace(/\/$/, '')
        const accessToken = typeof r.inlineAccessToken === 'string' ? r.inlineAccessToken : ''
        const workspaceId = typeof r.inlineActiveWorkspaceId === 'string' ? r.inlineActiveWorkspaceId : ''
        const userId      = typeof r.inlineUserId === 'string' ? r.inlineUserId : ''

        const headers: Record<string, string> = { 'Content-Type': 'application/json' }
        if (isUsableJwt(accessToken)) headers.Authorization = `Bearer ${accessToken}`

        if (!isUsableJwt(accessToken) || !workspaceId) {
          try {
            const localDoc = await saveLocalAnnotation({ pageUrl, featureKey, data, pageTitle, domain, clearedAt })
            sendResponse({ ok: true, data: localDoc, storageMode: 'local' })
            return
          }
          catch { /* storage full - best-effort */ }
          sendResponse({ ok: false, storageMode: 'local', error: 'Browser storage is full.' })
          return
        }

        try {
          await saveLocalAnnotation({ pageUrl, featureKey, data, pageTitle, domain, clearedAt })
          const res = await fetch(`${base}/api/annotations`, {
            method: 'POST',
            headers,
            body: JSON.stringify({
              pageUrl, featureKey, data,
              pageTitle: pageTitle ?? '',
              domain:    domain ?? '',
              workspaceId,
              userId,
              clearedAt: clearedAt ?? null,
            }),
          })
          const text = await res.text()
          let json: unknown
          try { json = JSON.parse(text) as unknown } catch {
            sendResponse({
              ok: false,
              error: 'Server did not return JSON (check API URL / is the app running?).',
            })
            return
          }
          if (!res.ok) {
            const err = typeof json === 'object' && json !== null && 'error' in json
              ? String((json as { error?: string }).error)
              : `HTTP ${res.status}`
            sendResponse({ ok: false, error: err })
            return
          }
          sendResponse({ ok: true, data: json, storageMode: 'workspace' })
        } catch {
          try {
            await saveLocalAnnotation({ pageUrl, featureKey, data, pageTitle, domain, clearedAt })
            await enqueue({ pageUrl, featureKey, data, timestamp: Date.now() })
          }
          catch { /* storage full – best-effort */ }
          sendResponse({ ok: false, queued: true, storageMode: 'local', error: 'Queued for retry (backend unreachable)' })
        }
      },
    )

    return true
  }

  if (message.type === 'LOAD_ANNOTATIONS') {
    const { pageUrl } = message.payload;

    void chrome.storage.local.get(['inlineBackendBase', 'inlineAccessToken'], async (r) => {
      const base = (typeof r.inlineBackendBase === 'string' && r.inlineBackendBase
        ? r.inlineBackendBase
        : BACKEND_URL).replace(/\/$/, '')
      const accessToken = typeof r.inlineAccessToken === 'string' ? r.inlineAccessToken : ''
      const headers: Record<string, string> = {}
      if (isUsableJwt(accessToken)) headers.Authorization = `Bearer ${accessToken}`

      if (!isUsableJwt(accessToken)) {
        const localDoc = await loadLocalAnnotations(pageUrl)
        sendResponse({ ok: true, data: localDoc, storageMode: 'local' })
        return
      }

      try {
        const res = await fetch(`${base}/api/annotations?url=${encodeURIComponent(pageUrl)}`, { headers })
        const text = await res.text()
        let json: unknown
        try { json = JSON.parse(text) as unknown }
        catch {
          const localDoc = await loadLocalAnnotations(pageUrl)
          sendResponse({ ok: true, data: localDoc, storageMode: 'local', warning: 'Using browser copy.' })
          return
        }
        if (!res.ok) {
          const localDoc = await loadLocalAnnotations(pageUrl)
          sendResponse({ ok: true, data: localDoc, storageMode: 'local', warning: 'Using browser copy.' })
          return
        }
        sendResponse({ ok: true, data: json })
      } catch (err) {
        const localDoc = await loadLocalAnnotations(pageUrl)
        sendResponse({ ok: true, data: localDoc, storageMode: 'local', warning: err instanceof Error ? err.message : 'Using browser copy.' })
      }
    })
    return true
  }

  if (message.type === 'SHARE_ANNOTATIONS') {
    const { pageUrl, layers } = message.payload as { pageUrl: string; layers: string[] }

    void chrome.storage.local.get(['inlineBackendBase', 'inlineApiBase', 'inlineAccessToken'], async (r) => {
      const backend = (typeof r.inlineBackendBase === 'string' && r.inlineBackendBase
        ? r.inlineBackendBase : BACKEND_URL).replace(/\/$/, '')
      const web = (typeof r.inlineApiBase === 'string' && r.inlineApiBase
        ? r.inlineApiBase : WEB_URL).replace(/\/$/, '')
      const accessToken = typeof r.inlineAccessToken === 'string' ? r.inlineAccessToken : ''
      const authHeaders: Record<string, string> = {}
      if (isUsableJwt(accessToken)) authHeaders.Authorization = `Bearer ${accessToken}`

      try {
        const res = await fetch(`${backend}/api/annotations?url=${encodeURIComponent(pageUrl)}`, { headers: authHeaders })
        if (!res.ok) throw new Error(`HTTP ${res.status}`)
        const json = (await res.json()) as { elements?: Record<string, unknown> }
        const allElements = json.elements ?? {}

        const filteredLayers: Record<string, unknown> = {}
        for (const key of layers) {
          if (key in allElements) filteredLayers[key] = allElements[key]
        }

        const shareRes = await fetch(`${web}/api/share`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ pageUrl, layers: filteredLayers }),
        })
        const shareJson = (await shareRes.json()) as { shareUrl?: string; error?: string }
        if (!shareRes.ok) {
          sendResponse({ ok: false, error: shareJson.error ?? `HTTP ${shareRes.status}` })
          return
        }
        sendResponse({ ok: true, shareUrl: shareJson.shareUrl })
      } catch (err) {
        sendResponse({ ok: false, error: err instanceof Error ? err.message : 'Share failed' })
      }
    })

    return true
  }
});

// ─── Keyboard Shortcuts ─────────────────────────────────────────────────────

chrome.commands.onCommand.addListener((command) => {
  chrome.tabs.query({ active: true, currentWindow: true }, (tabs) => {
    const tabId = tabs[0]?.id
    if (tabId == null) return
    chrome.tabs.sendMessage(tabId, { type: 'INLINE_COMMAND', command })
  })
})

// ─── Offline Sync Retry ─────────────────────────────────────────────────────

chrome.alarms.onAlarm.addListener(async (alarm) => {
  if (alarm.name !== 'inline-sync-retry') return

  const queue = await getQueue()
  if (queue.length === 0) return

  const stored = await chrome.storage.local.get([
    'inlineBackendBase', 'inlineAccessToken', 'inlineActiveWorkspaceId',
  ])
  const base = (typeof stored.inlineBackendBase === 'string' && stored.inlineBackendBase
    ? stored.inlineBackendBase
    : BACKEND_URL).replace(/\/$/, '')
  const accessToken = typeof stored.inlineAccessToken === 'string' ? stored.inlineAccessToken : ''
  const workspaceId = typeof stored.inlineActiveWorkspaceId === 'string' ? stored.inlineActiveWorkspaceId : ''

  const headers: Record<string, string> = { 'Content-Type': 'application/json' }
  if (isUsableJwt(accessToken)) headers.Authorization = `Bearer ${accessToken}`

  const remaining = [...queue]

  for (let i = 0; i < remaining.length; i++) {
    const item = remaining[i]
    try {
      const res = await fetch(`${base}/api/annotations`, {
        method: 'POST',
        headers,
        body: JSON.stringify({
          pageUrl: item.pageUrl,
          featureKey: item.featureKey,
          data: item.data,
          workspaceId,
        }),
      })
      if (!res.ok) throw new Error(`HTTP ${res.status}`)
      remaining.splice(i, 1)
      i--
    } catch {
      break
    }
  }

  await chrome.storage.local.set({ inlineSyncQueue: remaining })
})
