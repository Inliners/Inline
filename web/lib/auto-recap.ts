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
import { prettyNotePreview } from './note-preview'
import {
  loadFolderDocuments,
  upsertFolderDocument,
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
  return withTitle?.pageTitle?.trim() || domainOf(pageUrl)
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

function tagLabel(tag: string): string {
  return tag
    .replace(/-/g, ' ')
    .replace(/\b\w/g, c => c.toUpperCase())
}

function sectionKeyFor(note: Note): string {
  const priority = [
    'summary', 'rephrase', 'shorten', 'rewrite', 'ai',
    'drawing', 'handwriting', 'highlight', 'sticky', 'anchor',
    'paper-note', 'stamp', 'clip',
  ]
  for (const p of priority) if (note.tags?.includes(p)) return p
  return note.type || 'Other'
}

function htmlEscape(s: string): string {
  return s
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
}

/** Build a clean Tiptap-compatible HTML recap. */
function composeRecapHtml(workspaceTitle: string, pageUrl: string, notes: Note[]): string {
  const pageTitle = titleOf(notes, pageUrl)
  const domain = domainOf(pageUrl)
  const first = notes.reduce((acc, n) => (n.createdAt < acc ? n.createdAt : acc), notes[0].createdAt)
  const last = notes.reduce((acc, n) => {
    const ts = n.updatedAt ?? n.createdAt
    return ts > acc ? ts : acc
  }, notes[0].updatedAt ?? notes[0].createdAt)

  const buckets: Record<string, Note[]> = {}
  for (const n of notes) {
    const k = sectionKeyFor(n)
    ;(buckets[k] = buckets[k] ?? []).push(n)
  }

  const ORDER = ['summary', 'rephrase', 'shorten', 'rewrite', 'ai',
    'highlight', 'sticky', 'anchor', 'paper-note',
    'drawing', 'handwriting', 'stamp', 'clip']
  const sectionKeys = [
    ...ORDER.filter(k => buckets[k]?.length),
    ...Object.keys(buckets).filter(k => !ORDER.includes(k)),
  ]

  const totalCount = notes.length
  const typeSummary = sectionKeys
    .map(k => `${buckets[k].length} ${tagLabel(k)}`)
    .join(' · ')

  const overviewLines = [
    `Captured <strong>${totalCount}</strong> item${totalCount === 1 ? '' : 's'} on <strong>${htmlEscape(pageTitle)}</strong> (<code>${htmlEscape(domain)}</code>).`,
    `${htmlEscape(typeSummary)}.`,
    `First interaction: ${new Date(first).toLocaleString()}. Most recent: ${new Date(last).toLocaleString()}.`,
  ]

  const head =
    `<h1>${htmlEscape(pageTitle)}</h1>` +
    `<p><em>Auto-generated recap for ${htmlEscape(workspaceTitle)}.</em> ` +
    `<a href="${htmlEscape(pageUrl)}" target="_blank" rel="noreferrer">Open source page ↗</a></p>` +
    `<h2>Overview</h2>` +
    `<p>${overviewLines.join(' ')}</p>`

  const sectionsHtml = sectionKeys.map(key => {
    const items = buckets[key]
    const heading = tagLabel(key)
    const rows = items.map(n => {
      const stamp = new Date(n.updatedAt ?? n.createdAt).toLocaleString()
      const preview = htmlEscape(prettyNotePreview(n))
      return `<li><strong>${stamp}</strong> — ${preview}</li>`
    }).join('')
    return `<h2>${htmlEscape(heading)}</h2><ul>${rows}</ul>`
  }).join('')

  return head + sectionsHtml
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

    const existing = findRecapDoc(workspaceId, pageUrl)
    const pageTitle = titleOf(pageNotes, pageUrl)
    const content = composeRecapHtml(workspaceTitle, pageUrl, pageNotes)
    const now = Date.now()

    if (existing) {
      const sourceNewest = pageNotes.reduce((acc, n) => {
        const ts = new Date(n.updatedAt ?? n.createdAt).getTime()
        return ts > acc ? ts : acc
      }, 0)
      const shouldRegen =
        sourceNewest > existing.updatedAt ||
        now - existing.updatedAt > RECAP_REGEN_INTERVAL_MS
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
        href: `/app/${workspaceId}/folder/${folderId}/doc/${existing.id}`,
      }
    } else {
      const id = `doc-recap-${encodeURIComponent(pageUrl).slice(0, 40)}-${now}`
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
        href: `/app/${workspaceId}/folder/${folderId}/doc/${id}`,
      }
    }
  }

  return out
}
