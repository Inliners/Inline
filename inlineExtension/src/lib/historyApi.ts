/**
 * Save an AI result (summary / rephrase / shorten / custom) to the user's
 * History / Analytics / Graph so activity is never lost. Writes are routed
 * through the background service worker's CLIP_TO_WORKSPACE handler which
 * hits Next.js /api/clip — that route scopes the row to the authenticated
 * user (Bearer JWT) or userId fallback.
 */

import { loadSettings } from './extensionSettings'
import { fetchViaBackground } from './backgroundFetch'

type HistoryEntryKind =
  | 'ai-rephrase'
  | 'ai-shorten'
  | 'ai-summarize'
  | 'ai-rewrite'
  | 'ai-custom'
  | 'clip'

export interface HistoryEntry {
  kind: HistoryEntryKind
  selection?: string
  result: string
  pageUrl?: string
  pageTitle?: string
  workspaceId?: string
}

function guessPage(): { pageUrl: string; pageTitle: string } {
  if (typeof window === 'undefined') return { pageUrl: '', pageTitle: '' }
  return { pageUrl: window.location?.href ?? '', pageTitle: document?.title ?? '' }
}

export async function saveAIResultToHistory(entry: HistoryEntry): Promise<void> {
  try {
    const { pageUrl, pageTitle } = guessPage()
    const { apiBaseUrl, accessToken } = await loadSettings()

    const storage = await new Promise<{ inlineActiveWorkspaceId?: string; inlineUserId?: string }>(
      (resolve) => {
        chrome.storage.local.get(['inlineActiveWorkspaceId', 'inlineUserId'], (r) => {
          resolve(r as { inlineActiveWorkspaceId?: string; inlineUserId?: string })
        })
      },
    )

    const workspaceId = entry.workspaceId ?? storage.inlineActiveWorkspaceId ?? ''
    const userId = storage.inlineUserId ?? ''

    // The notes.type column has a CHECK constraint, so every AI action is
    // written as 'ai-summary' and differentiated via tags. UI filters and
    // counts should read tags for fine-grained distinctions.
    const tagMap: Record<HistoryEntryKind, string[]> = {
      'ai-rephrase':  ['ai', 'rephrase'],
      'ai-shorten':   ['ai', 'shorten'],
      'ai-summarize': ['ai', 'summary'],
      'ai-rewrite':   ['ai', 'rewrite'],
      'ai-custom':    ['ai', 'custom'],
      'clip':         ['clip'],
    }

    const typeMap: Record<HistoryEntryKind, string> = {
      'ai-rephrase':  'ai-summary',
      'ai-shorten':   'ai-summary',
      'ai-summarize': 'ai-summary',
      'ai-rewrite':   'ai-summary',
      'ai-custom':    'ai-summary',
      'clip':         'clip',
    }

    const body = {
      pageUrl: entry.pageUrl ?? pageUrl,
      pageTitle: entry.pageTitle ?? pageTitle,
      workspaceId,
      userId,
      type: typeMap[entry.kind],
      tags: tagMap[entry.kind],
      content: entry.selection
        ? `**${entry.kind}**\n\n> ${entry.selection}\n\n${entry.result}`
        : entry.result,
    }

    const headers: Record<string, string> = { 'Content-Type': 'application/json' }
    if (accessToken) headers.Authorization = `Bearer ${accessToken}`

    await fetchViaBackground(`${apiBaseUrl}/api/clip`, {
      method: 'POST',
      headers,
      body: JSON.stringify(body),
    })
  } catch {
    /* best-effort: a failed history write should never block the UI */
  }
}
