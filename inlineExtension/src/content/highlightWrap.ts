import { emitSaveToast } from '../lib/saveToast'

const ACTION_META: Record<string, { bg: string; title: string }> = {
  summarize: { bg: 'rgba(187,247,208,0.92)', title: 'Summarized via Inline' },
  rewrite:   { bg: 'rgba(191,219,254,0.92)', title: 'Rewritten via Inline' },
  shorten:   { bg: 'rgba(254,215,170,0.92)', title: 'Shortened via Inline' },
  extract:   { bg: 'rgba(233,213,255,0.92)', title: 'Extracted via Inline' },
  risk:      { bg: 'rgba(254,202,202,0.92)', title: 'Risk-flagged via Inline' },
  }
  
  interface SavedHighlight {
    id: string
    text: string
    action: string
    bg: string
    title: string
    timestamp: number
  }

  function generateHighlightId(): string {
    return `hl-${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 8)}`
  }
  
  function highlightStorageKey(): string {
    try {
      const u = new URL(window.location.href)
      return `inlineHighlights:${u.origin}${u.pathname}`.replace(/\/$/, '')
    } catch {
      return `inlineHighlights:${window.location.href}`
    }
  }
  
  function loadSavedHighlights(): SavedHighlight[] {
    try {
      const raw = localStorage.getItem(highlightStorageKey())
      return raw ? JSON.parse(raw) : []
    } catch { return [] }
  }
  
  function saveHighlight(highlight: SavedHighlight): void {
    try {
      const existing = loadSavedHighlights()
      existing.push(highlight)
      localStorage.setItem(highlightStorageKey(), JSON.stringify(existing))
    } catch { /* ignore in sandboxed contexts */ }

    try {
      if (!chrome.runtime?.id) return
      const all = loadSavedHighlights()
      chrome.runtime.sendMessage(
        {
          type: 'SAVE_ANNOTATIONS',
          payload: {
            pageUrl: window.location.href,
            featureKey: 'highlights',
            data: all,
            pageTitle: document.title,
            domain: window.location.hostname,
          },
        },
        (response) => {
          if (chrome.runtime.lastError) return
          emitSaveToast(response)
        },
      )
    } catch { /* extension context unavailable */ }
  }

  export function wrapSelectionWithHighlight(
    action: string,
    colorOverride?: string,
  ): { text: string; title: string; span: HTMLElement } | null {
  const sel = window.getSelection()
  if (!sel || sel.rangeCount === 0 || sel.isCollapsed) return null
  const text = sel.toString()
  if (!text.trim()) return null

  const range = sel.getRangeAt(0)
  const meta = ACTION_META[action] ?? { bg: 'rgba(226,232,240,0.95)', title: 'Highlighted by Inline' }
  const bg = colorOverride ?? meta.bg

  const span = document.createElement('span')
  span.setAttribute('data-inline-highlight', action)
  span.style.backgroundColor = bg
  span.style.borderRadius = '4px'
  span.style.padding = '0 3px'
  span.title = meta.title

  try {
  range.surroundContents(span)
  } catch {
  const contents = range.extractContents()
  span.appendChild(contents)
  range.insertNode(span)
  }

  sel.removeAllRanges()

    saveHighlight({
      id: generateHighlightId(),
      text: text.trim(),
      action,
      bg,
      title: meta.title,
      timestamp: Date.now(),
    })

  return { text, title: meta.title, span }
  }
  
  function applyHighlights(saved: SavedHighlight[]): void {
    const body = document.body
    if (!body) return

    for (const h of saved) {
      if (!h.text || h.text.length < 3) continue

      const walker = document.createTreeWalker(body, NodeFilter.SHOW_TEXT)
      let node: Text | null
      while ((node = walker.nextNode() as Text | null)) {
        const idx = node.textContent?.indexOf(h.text) ?? -1
        if (idx === -1) continue

        const parent = node.parentElement
        if (parent?.hasAttribute('data-inline-highlight')) continue

        try {
          const range = document.createRange()
          range.setStart(node, idx)
          range.setEnd(node, idx + h.text.length)

          const span = document.createElement('span')
          span.setAttribute('data-inline-highlight', h.action)
          span.style.backgroundColor = h.bg
          span.style.borderRadius = '4px'
          span.style.padding = '0 3px'
          span.title = h.title

          range.surroundContents(span)
        } catch { /* skip if DOM structure doesn't allow it */ }

        break
      }
    }
  }

  export function restoreHighlights(): void {
    const local = loadSavedHighlights()
    if (local.length > 0) applyHighlights(local)

    try {
      if (!chrome.runtime?.id) return
      chrome.runtime.sendMessage(
        { type: 'LOAD_ANNOTATIONS', payload: { pageUrl: window.location.href } },
        (response) => {
          if (chrome.runtime.lastError || !response?.ok) return
          const remote: SavedHighlight[] = response.data?.elements?.highlights
          if (!Array.isArray(remote) || remote.length === 0) return

          const localTexts = new Set(loadSavedHighlights().map((h: SavedHighlight) => h.text))
          const newOnes = remote.filter((h: SavedHighlight) => !localTexts.has(h.text))
          if (newOnes.length === 0) return

          const merged = [...loadSavedHighlights(), ...newOnes]
          try { localStorage.setItem(highlightStorageKey(), JSON.stringify(merged)) } catch { /* ignore */ }

          applyHighlights(newOnes)
        },
      )
    } catch { /* extension context unavailable */ }
  }
