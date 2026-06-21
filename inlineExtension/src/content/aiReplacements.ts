/**
 * AI Insert persistence — saves the (original → AI) text replacements
 * performed from the Rewrite panel so they survive a page reload.
 *
 * Flow on save (Rewrite.tsx → handleInsert):
 *   1. `buildAIInsertMark` creates the styled <mark> element.
 *   2. The original text in the selection range is replaced with that mark.
 *   3. We then call `saveAIReplacement(...)` to persist
 *      { id, originalText, aiText, task, instruction, timestamp }
 *      under the `aiReplacements` feature key for this page URL.
 *
 * Flow on restore (content.tsx → restoreAIReplacements):
 *   1. Load the list from the backend (via the service worker).
 *   2. Walk the DOM looking for `originalText` as a contiguous substring.
 *   3. Replace it with a freshly-built mark and wire up click-to-remove.
 *
 * Remove (user discards an AI edit):
 *   Hovering a persisted mark shows a small "×" badge. Clicking it
 *   restores the original text in the DOM AND removes the entry from
 *   storage, so the edit doesn't come back on the next reload.
 */

import { buildAIInsertMark } from '../lib/insertBadge'

export interface AIReplacement {
  id: string
  originalText: string
  aiText: string
  task: string
  instruction?: string
  timestamp: number
}

const STORAGE_KEY = 'inlineAIReplacements'

function replacementId(): string {
  return `air-${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 8)}`
}

/** Per-page localStorage key (mirrors highlightWrap.ts conventions). */
function localKey(): string {
  try {
    const u = new URL(window.location.href)
    return `${STORAGE_KEY}:${u.origin}${u.pathname}`.replace(/\/$/, '')
  } catch {
    return `${STORAGE_KEY}:${window.location.href}`
  }
}

function readLocal(): AIReplacement[] {
  try {
    const raw = localStorage.getItem(localKey())
    return raw ? (JSON.parse(raw) as AIReplacement[]) : []
  } catch {
    return []
  }
}

function writeLocal(list: AIReplacement[]): void {
  try {
    localStorage.setItem(localKey(), JSON.stringify(list))
  } catch { /* storage quota / sandboxed context */ }
}

function pushToBackend(list: AIReplacement[]): void {
  try {
    if (!chrome.runtime?.id) return
    chrome.runtime.sendMessage(
      {
        type: 'SAVE_ANNOTATIONS',
        payload: {
          pageUrl: window.location.href,
          featureKey: 'aiReplacements',
          data: list,
          pageTitle: document.title,
          domain: window.location.hostname,
          clearedAt: list.length === 0 ? Date.now() : null,
        },
      },
      () => { if (chrome.runtime.lastError) { /* ignore */ } },
    )
  } catch { /* extension context unavailable */ }
}

/**
 * Persist a newly-inserted AI replacement. The caller is expected to
 * have already mutated the DOM; this function only records what happened
 * so we can replay it on the next page load.
 *
 * The returned ID is written to the live <mark> element as
 * `data-inline-ai-id` so the click-to-remove handler can delete the
 * matching entry later.
 */
export function saveAIReplacement(
  mark: HTMLElement,
  originalText: string,
  aiText: string,
  task: string,
  instruction?: string,
): string {
  const id = replacementId()
  mark.setAttribute('data-inline-ai-id', id)

  const entry: AIReplacement = {
    id,
    originalText,
    aiText,
    task,
    instruction,
    timestamp: Date.now(),
  }

  const next = [...readLocal(), entry]
  writeLocal(next)
  pushToBackend(next)

  attachRemoveHandler(mark, id)
  return id
}

function removeReplacementById(id: string): void {
  const next = readLocal().filter(r => r.id !== id)
  writeLocal(next)
  pushToBackend(next)
}

/**
 * Wire a small "×" badge to a persisted mark. Clicking the × unwraps
 * the mark (restoring the original text) AND deletes its storage entry.
 */
function attachRemoveHandler(mark: HTMLElement, id: string): void {
  // The original text is what the mark displays (we set mark.textContent in
  // buildAIInsertMark), but Rewrite.tsx also appends a <br> + citation span,
  // so strip them when unwrapping so the user just sees their original text
  // back. We read the original from storage on click to be safe.
  mark.style.cursor = 'pointer'

  const onClick = (e: MouseEvent) => {
    // Only act on the × badge child, or on Alt/Option+click as a fallback.
    const target = e.target as HTMLElement | null
    const isBadge = target?.classList.contains('inline-ai-remove-badge')
    if (!isBadge && !e.altKey) return
    e.preventDefault()
    e.stopPropagation()

    const stored = readLocal().find(r => r.id === id)
    removeReplacementById(id)

    const parent = mark.parentNode
    if (!parent) return
    const text = document.createTextNode(stored?.originalText ?? mark.textContent ?? '')
    parent.replaceChild(text, mark)
  }

  mark.addEventListener('click', onClick)

  // Hover badge — positioned absolutely inside the mark.
  const badge = document.createElement('span')
  badge.className = 'inline-ai-remove-badge'
  badge.textContent = '×'
  badge.setAttribute('aria-label', 'Remove this AI edit')
  badge.title = 'Remove this AI edit'
  badge.style.cssText = [
    'display:none', 'position:absolute', 'top:-10px', 'right:-8px',
    'width:18px', 'height:18px', 'border-radius:9999px',
    'background:#1C1E26', 'color:#fff', 'font:600 11px/18px system-ui,sans-serif',
    'text-align:center', 'cursor:pointer', 'user-select:none',
    'box-shadow:none', 'z-index:2147483646',
  ].join(';')

  // Ensure the mark can host absolutely-positioned children.
  if (!mark.style.position) mark.style.position = 'relative'
  mark.appendChild(badge)
  mark.addEventListener('mouseenter', () => { badge.style.display = 'inline-block' })
  mark.addEventListener('mouseleave', () => { badge.style.display = 'none' })
}

/**
 * Replay saved AI replacements on page load.
 *
 * We walk every text node and, for each saved replacement, look for the
 * first contiguous occurrence of `originalText`. If found, replace that
 * range with a freshly-built mark. If the page's content shifted so the
 * text can't be located, we leave that entry untouched in storage — it
 * may match on a future load.
 */
export function restoreAIReplacements(): void {
  // Local cache first so the page paints immediately; then merge backend.
  const local = readLocal()
  if (local.length > 0) applyReplacements(local)

  try {
    if (!chrome.runtime?.id) return
    chrome.runtime.sendMessage(
      { type: 'LOAD_ANNOTATIONS', payload: { pageUrl: window.location.href } },
      (response) => {
        if (chrome.runtime.lastError || !response?.ok) return
        const remote = response.data?.elements?.aiReplacements as AIReplacement[] | undefined
        if (!Array.isArray(remote) || remote.length === 0) return

        const localIds = new Set(readLocal().map(r => r.id))
        const fresh = remote.filter(r => !localIds.has(r.id))
        if (fresh.length === 0) return

        const merged = [...readLocal(), ...fresh]
        writeLocal(merged)
        applyReplacements(fresh)
      },
    )
  } catch { /* extension context unavailable */ }
}

function applyReplacements(list: AIReplacement[]): void {
  const body = document.body
  if (!body) return

  for (const r of list) {
    if (!r.originalText || r.originalText.length < 3) continue
    // Already rendered? Skip.
    if (document.querySelector(`[data-inline-ai-id="${CSS.escape(r.id)}"]`)) continue

    const walker = document.createTreeWalker(body, NodeFilter.SHOW_TEXT, {
      acceptNode(node) {
        const parent = node.parentElement
        if (!parent) return NodeFilter.FILTER_REJECT
        // Skip text that's already inside an inline-ai mark, our shadow
        // root host, or a script/style container.
        if (parent.closest('[data-inline-ai-id]')) return NodeFilter.FILTER_REJECT
        if (parent.closest('#inline-extension-root')) return NodeFilter.FILTER_REJECT
        const tag = parent.tagName
        if (tag === 'SCRIPT' || tag === 'STYLE' || tag === 'NOSCRIPT') return NodeFilter.FILTER_REJECT
        return NodeFilter.FILTER_ACCEPT
      },
    })

    let node: Text | null
    while ((node = walker.nextNode() as Text | null)) {
      const idx = node.textContent?.indexOf(r.originalText) ?? -1
      if (idx === -1) continue

      try {
        const range = document.createRange()
        range.setStart(node, idx)
        range.setEnd(node, idx + r.originalText.length)

        const mark = buildAIInsertMark(r.aiText, r.task, r.instruction)
        mark.setAttribute('data-inline-ai-id', r.id)
        range.deleteContents()
        range.insertNode(mark)

        attachRemoveHandler(mark, r.id)
      } catch { /* range invalid — skip, try next match */ }

      break
    }
  }
}
