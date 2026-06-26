'use client'

/**
 * Client-side page-recap engine.
 *
 * For every distinct `page_url` in the workspace's notes, creates (or
 * refreshes) a structured markdown document in the workspace library. The
 * document lives in a synthetic "Auto Recaps" folder so it renders in the
 * same UI as every other workspace document.
 *
 * This runs entirely client-side so it works without the Supabase
 * `public.documents` migration — the recap is stored via `workspace-library`
 * (localStorage). When the migration IS in place you can still opt into the
 * server-backed variant; they coexist.
 */

import type { Note } from './types'
import { formatDisplayTitle } from './utils'
import {
  buildOverviewHtml,
  buildRecapEntryHtml,
  type RecapOverviewAi,
  formatRecapMinute,
  recapEntryAnchorId,
  captureTypeSlug,
  actionLabelFor,
  summarizeNotesForAi,
  normalizeRecapListSections,
  normalizeRecapEntryTimes,
  recapSectionHeading,
} from './recap-format'

export {
  formatRecapMinute,
  recapEntryAnchorId,
  captureTypeSlug,
  actionLabelFor,
} from './recap-format'
import { documentHref, isUnsafeDocId, recapDocIdForPageUrl } from './doc-routes'
import {
  loadFolderDocuments,
  upsertFolderDocument,
  deleteFolderDocument,
  type FolderDocument,
} from './workspace-library'
import {
  loadWorkspaceFolders,
  saveWorkspaceFolders,
  type WorkspaceFolder,
} from './workspace-folders'

const AUTO_RECAP_FOLDER_NAME = 'Auto Recaps'
const RECAP_REGEN_INTERVAL_MS = 5 * 60 * 1000 // re-run at most once every 5 minutes per page

function domainOf(url: string): string {
  try { return new URL(url).hostname } catch { return url.slice(0, 60) }
}

function titleOf(notes: Note[], pageUrl: string): string {
  const withTitle = notes.find(n => n.pageTitle && n.pageTitle.trim())
  return formatDisplayTitle(withTitle?.pageTitle?.trim() || domainOf(pageUrl))
}

/** Ensure an "Auto Recaps" folder exists for this workspace. Returns its id. */
export function ensureAutoRecapFolder(workspaceId: string): string {
  const folders = loadWorkspaceFolders()
  const existing = folders.find(
    f => f.workspaceId === workspaceId && f.name === AUTO_RECAP_FOLDER_NAME && !f.parentId,
  )
  if (existing) return existing.id

  const folder: WorkspaceFolder = {
    id: `folder-auto-recaps-${workspaceId}`,
    workspaceId,
    name: AUTO_RECAP_FOLDER_NAME,
    parentId: null,
  }
  saveWorkspaceFolders([...folders, folder])
  return folder.id
}

function groupNotesByPageUrl(notes: Note[]): Record<string, Note[]> {
  return notes.reduce<Record<string, Note[]>>((acc, n) => {
    const key = n.pageUrl || '(no page)'
    ;(acc[key] = acc[key] ?? []).push(n)
    return acc
  }, {})
}

function htmlEscape(s: string): string {
  return s
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
}

/** Build a clean Tiptap-compatible HTML recap. */
export function buildRecapHtml(
  _workspaceTitle: string,
  pageUrl: string,
  notes: Note[],
  aiOverview?: RecapOverviewAi | null,
): string {
  return composeRecapHtml(_workspaceTitle, pageUrl, notes, aiOverview)
}

function composeRecapHtml(
  _workspaceTitle: string,
  pageUrl: string,
  notes: Note[],
  aiOverview?: RecapOverviewAi | null,
): string {
  const pageTitle = titleOf(notes, pageUrl)
  const domain = domainOf(pageUrl)
  const sorted = [...notes].sort(
    (a, b) => new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime(),
  )

  const overview = buildOverviewHtml(notes, pageTitle, domain, aiOverview)
  const entries = sorted.map(buildRecapEntryHtml).join('')
  return `${overview}${recapSectionHeading('Activity')}${entries}`
}

async function fetchAiOverview(
  pageTitle: string,
  pageUrl: string,
  notes: Note[],
): Promise<RecapOverviewAi | null> {
  if (typeof window === 'undefined' || notes.length === 0) return null
  try {
    const res = await fetch('/api/ai/recap-compose', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        pageTitle,
        pageUrl,
        captures: summarizeNotesForAi(notes),
      }),
    })
    if (!res.ok) return null
    const json = await res.json() as RecapOverviewAi
    return json
  } catch {
    return null
  }
}

/** Remove legacy duplicate &lt;h1&gt; from stored recap HTML (title lives on the document). */
export function stripRecapLeadingTitle(html: string): string {
  return html.replace(/^\s*<h1[^>]*>[\s\S]*?<\/h1>\s*/i, '')
}

/** Strip duplicate meta block shown in the page header (legacy + new recaps). */
export function normalizeRecapContent(html: string, notes?: Note[]): string {
  let out = stripRecapLeadingTitle(html)
  out = out.replace(
    /^\s*<p>\s*<em>\s*Auto-generated recap[\s\S]*?<\/p>\s*/i,
    '',
  )
  out = out.replace(
    /(class="recap-entry-meta"[^>]*>\s*<em>[^<]*)\s·\s([^<]*<\/em>)/gi,
    '$1 — $2',
  )
  out = normalizeRecapEntryTimes(out)
  out = normalizeRecapListSections(out)
  if (notes?.length) out = ensureRecapEntryAnchors(out, notes)
  return out.trim()
}

/** Inject stable entry wrappers for legacy recaps (outline jump + margin markers). */
export function ensureRecapEntryAnchors(html: string, notes: Note[]): string {
  if (!html.trim() || notes.length === 0) return html
  if (/data-recap-entry/i.test(html) && /<div[^>]*data-recap-entry/i.test(html)) return html

  const activityMatch = html.match(/<h2[^>]*class="[^"]*recap-section-heading[^"]*"[^>]*>\s*Activity\s*<\/h2>/i)
    ?? html.match(/<h2[^>]*>\s*Activity\s*<\/h2>/i)
  if (!activityMatch || activityMatch.index == null) return html

  const splitAt = activityMatch.index + activityMatch[0].length
  const before = html.slice(0, splitAt)
  let activity = html.slice(splitAt)
  const sorted = [...notes].sort(
    (a, b) => new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime(),
  )
  let i = 0

  activity = activity.replace(
    /(<p>\s*<em>[^<]*·[^<]*<\/em>\s*<\/p>)([\s\S]*?)(<hr\s*\/?>)/gi,
    (_m, metaP: string, body: string, hr: string) => {
      if (i >= sorted.length) return metaP + body + hr
      const note = sorted[i]!
      i += 1
      const anchorId = recapEntryAnchorId(note.id)
      const slug = captureTypeSlug(note)
      const meta = metaP.replace(
        /<p(\s[^>]*)?>/i,
        `<p class="recap-entry-meta" data-note-id="${htmlEscape(note.id)}" data-capture-type="${htmlEscape(slug)}">`,
      )
      return (
        `<div id="${anchorId}" data-recap-entry data-note-id="${htmlEscape(note.id)}" ` +
        `data-capture-type="${htmlEscape(slug)}" class="recap-entry">${meta}${body}</div>${hr}`
      )
    },
  )

  return before + activity
}

/** Find an existing recap for a given page url. */
function findRecapDoc(workspaceId: string, pageUrl: string): FolderDocument | undefined {
  return loadFolderDocuments().find(
    d => d.workspaceId === workspaceId && d.autoGenerated && d.pageUrl === pageUrl,
  )
}

/**
 * Ensure up-to-date recap documents exist for every page represented in the
 * given note set. Returns a map of pageUrl → recap document id so callers can
 * deep-link to it.
 */
export function ensurePageRecaps(
  workspaceId: string,
  workspaceTitle: string,
  notes: Note[],
): Record<string, { id: string; title: string; updatedAt: string; href: string }> {
  if (typeof window === 'undefined' || notes.length === 0) return {}

  const folderId = ensureAutoRecapFolder(workspaceId)
  const grouped = groupNotesByPageUrl(notes)
  const out: Record<string, { id: string; title: string; updatedAt: string; href: string }> = {}

  for (const [pageUrl, pageNotes] of Object.entries(grouped)) {
    if (pageUrl === '(no page)') continue
    if (pageNotes.length === 0) continue

    let existing = findRecapDoc(workspaceId, pageUrl)
    const pageTitle = titleOf(pageNotes, pageUrl)
    const content = composeRecapHtml(workspaceTitle, pageUrl, pageNotes)
    const now = Date.now()

    if (existing && isUnsafeDocId(existing.id)) {
      const newId = recapDocIdForPageUrl(pageUrl, existing.createdAt)
      deleteFolderDocument(existing.id)
      existing = { ...existing, id: newId }
      upsertFolderDocument(existing)
    }

    if (existing) {
      const sourceNewest = pageNotes.reduce((acc, n) => {
        const ts = new Date(n.updatedAt ?? n.createdAt).getTime()
        return ts > acc ? ts : acc
      }, 0)
      const shouldRegen =
        sourceNewest > existing.updatedAt ||
        (!existing.recapStale && now - existing.updatedAt > RECAP_REGEN_INTERVAL_MS)
      if (shouldRegen) {
        upsertFolderDocument({
          ...existing,
          title: pageTitle,
          content,
          updatedAt: now,
          autoGenerated: true,
          pageUrl,
          recapStale: false,
        })
      }
      out[pageUrl] = {
        id: existing.id,
        title: pageTitle,
        updatedAt: new Date(now).toISOString(),
        href: documentHref(workspaceId, existing.id),
      }
    } else {
      const id = recapDocIdForPageUrl(pageUrl, now)
      const doc: FolderDocument = {
        id,
        workspaceId,
        folderId,
        title: pageTitle,
        content,
        createdAt: now,
        updatedAt: now,
        autoGenerated: true,
        pageUrl,
        recapStale: false,
      }
      upsertFolderDocument(doc)
      out[pageUrl] = {
        id,
        title: pageTitle,
        updatedAt: new Date(now).toISOString(),
        href: documentHref(workspaceId, id),
      }
    }
  }

  return out
}

/** Rebuild recap body from source captures (clears stale flag). */
export function regenerateRecapFromNotes(
  doc: FolderDocument,
  workspaceTitle: string,
  notes: Note[],
  aiOverview?: RecapOverviewAi | null,
): FolderDocument {
  if (!doc.pageUrl) return doc
  const pageNotes = notes.filter(n => n.pageUrl === doc.pageUrl)
  const content = composeRecapHtml(workspaceTitle, doc.pageUrl, pageNotes, aiOverview)
  return {
    ...doc,
    title: titleOf(pageNotes, doc.pageUrl),
    content,
    updatedAt: Date.now(),
    recapStale: false,
  }
}

/** Rebuild with optional AI overview paragraph + bullets. */
export async function regenerateRecapFromNotesAsync(
  doc: FolderDocument,
  workspaceTitle: string,
  notes: Note[],
): Promise<FolderDocument> {
  if (!doc.pageUrl) return doc
  const pageNotes = notes.filter(n => n.pageUrl === doc.pageUrl)
  const pageTitle = titleOf(pageNotes, doc.pageUrl)
  const aiOverview = await fetchAiOverview(pageTitle, doc.pageUrl, pageNotes)
  return regenerateRecapFromNotes(doc, workspaceTitle, notes, aiOverview)
}
