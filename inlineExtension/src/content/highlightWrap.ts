import { emitSaveToast } from '../lib/saveToast'

const ACTION_META: Record<string, { bg: string; title: string }> = {
  summarize:      { bg: 'rgba(187,247,208,0.92)', title: 'Summarized via Inline' },
  rephrase:       { bg: 'rgba(196,181,253,0.92)', title: 'Rephrased via Inline' },
  rewrite:        { bg: 'rgba(191,219,254,0.92)', title: 'Rewritten via Inline' },
  shorten:        { bg: 'rgba(254,215,170,0.92)', title: 'Shortened via Inline' },
  extract:        { bg: 'rgba(233,213,255,0.92)', title: 'Extracted via Inline' },
  risk:           { bg: 'rgba(254,202,202,0.92)', title: 'Risk-flagged via Inline' },
  'selection-hold': { bg: 'rgba(147,197,253,0.55)', title: 'Selected for Inline' },
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

let sessionHighlights: SavedHighlight[] = []

function saveHighlight(highlight: SavedHighlight): void {
  sessionHighlights = [...sessionHighlights, highlight]

  try {
    if (!chrome.runtime?.id) return
    chrome.runtime.sendMessage(
      {
        type: 'SAVE_ANNOTATIONS',
        payload: {
          pageUrl: window.location.href,
          featureKey: 'highlights',
          data: sessionHighlights,
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

function rangeInsideHighlight(range: Range): boolean {
  const node = range.commonAncestorContainer
  const el = node.nodeType === Node.ELEMENT_NODE ? (node as Element) : node.parentElement
  return !!el?.closest('[data-inline-highlight]')
}

/**
 * Wrap an arbitrary Range in a persistent highlight span. Returns a fresh
 * Range that selects the inserted span so callers can Insert after the DOM
 * mutates (the original Range becomes stale once wrapped).
 */
export function wrapRangeWithHighlight(
  range: Range,
  action: string,
  colorOverride?: string,
): { text: string; title: string; span: HTMLElement; range: Range } | null {
  const text = range.toString()
  if (!text.trim()) return null
  if (rangeInsideHighlight(range)) return null

  const meta = ACTION_META[action] ?? { bg: 'rgba(226,232,240,0.95)', title: 'Highlighted by Inline' }
  const bg = colorOverride ?? meta.bg

  const work = range.cloneRange()
  const span = document.createElement('span')
  span.setAttribute('data-inline-highlight', action)
  span.style.backgroundColor = bg
  span.style.borderRadius = '4px'
  span.style.padding = '0 3px'
  span.title = meta.title

  try {
    work.surroundContents(span)
  } catch {
    const contents = work.extractContents()
    span.appendChild(contents)
    work.insertNode(span)
  }

  saveHighlight({
    id: generateHighlightId(),
    text: text.trim(),
    action,
    bg,
    title: meta.title,
    timestamp: Date.now(),
  })

  const newRange = document.createRange()
  newRange.selectNode(span)
  document.dispatchEvent(new CustomEvent('inline:highlightAdded'))
  return { text, title: meta.title, span, range: newRange }
}

export function wrapSelectionWithHighlight(
  action: string,
  colorOverride?: string,
): { text: string; title: string; span: HTMLElement } | null {
  const sel = window.getSelection()
  if (!sel || sel.rangeCount === 0 || sel.isCollapsed) return null

  const result = wrapRangeWithHighlight(sel.getRangeAt(0), action, colorOverride)
  if (!result) return null

  sel.removeAllRanges()
  return { text: result.text, title: result.title, span: result.span }
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
  try {
    if (!chrome.runtime?.id) return
    chrome.runtime.sendMessage(
      { type: 'LOAD_ANNOTATIONS', payload: { pageUrl: window.location.href } },
      (response) => {
        if (chrome.runtime.lastError || !response?.ok) return
        const remote: SavedHighlight[] = response.data?.elements?.highlights
        if (!Array.isArray(remote) || remote.length === 0) return
        sessionHighlights = remote
        applyHighlights(remote)
        document.dispatchEvent(new CustomEvent('inline:highlightsRestored'))
      },
    )
  } catch { /* extension context unavailable */ }
}
