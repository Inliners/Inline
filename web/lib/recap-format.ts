import type { Note } from './types'
import { stripHtml } from './utils'

export interface ParsedCapture {
  aiKind?: string
  selection?: string
  body: string
  sourceExcerpt?: string
  summaryBullets: string[]
}

export interface RecapOverviewAi {
  paragraph?: string
  bullets?: string[]
}

export function formatRecapMinute(iso: string): string {
  return new Date(iso).toLocaleString(undefined, {
    month: 'numeric',
    day: 'numeric',
    year: 'numeric',
    hour: 'numeric',
    minute: '2-digit',
  })
}

export function recapEntryAnchorId(noteId: string): string {
  return `recap-entry-${noteId}`
}

export function captureTypeSlug(note: Note): string {
  const tags = note.tags ?? []
  if (note.type === 'ai-summary' || ['summary', 'rephrase', 'shorten', 'rewrite', 'ai'].some(t => tags.includes(t))) {
    return 'ai'
  }
  const featureTag = [
    'highlight', 'sticky', 'anchor', 'paper-note',
    'drawing', 'handwriting', 'stamp', 'clip',
  ].find(t => tags.includes(t))
  if (featureTag) return featureTag.replace(/-/g, '_')
  return (note.type || 'capture').replace(/-/g, '_')
}

export function actionLabelFor(note: Note): string {
  const tags = note.tags ?? []
  const aiTag = ['summary', 'rephrase', 'shorten', 'rewrite', 'ai'].find(t => tags.includes(t))
  if (aiTag) return aiTag === 'ai' ? 'AI' : aiTag
  const featureTag = [
    'highlight', 'sticky', 'anchor', 'paper-note',
    'drawing', 'handwriting', 'stamp', 'clip',
  ].find(t => tags.includes(t))
  if (featureTag) return featureTag.replace(/-/g, ' ')
  if (note.type === 'ai-summary') return 'summary'
  return (note.type || 'capture').replace(/-/g, ' ')
}

function htmlEscape(s: string): string {
  return s
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
}

function normalizeWhitespace(text: string): string {
  return text.replace(/\s+/g, ' ').trim()
}

function stripMarkdownHeaderPrefix(text: string): string {
  return text
    .replace(/^\*\*([a-z0-9-]+)\*\*\s*/i, '')
    .replace(/^>\s*/, '')
    .trim()
}

const SUMMARY_INTRO_RE = /here(?:'s| is)\s+(?:a\s+)?summary[\s\S]*?:\s*/i

/** Pull bullet lines or sentence chunks from an AI summary tail. */
export function extractSummaryBullets(text: string): string[] {
  const trimmed = text.trim()
  if (!trimmed) return []

  const lines = trimmed.split(/\n+/).map(l => l.trim()).filter(Boolean)
  const lineBullets = lines
    .filter(l => /^[*•\-]\s+/.test(l))
    .map(l => l.replace(/^[*•\-]\s+/, '').trim())
  if (lineBullets.length > 0) return lineBullets

  const segments = trimmed.split(/\s+\*\s+/).map(s => s.trim()).filter(Boolean)
  if (segments.length > 1) {
    const bullets: string[] = []
    for (const seg of segments) {
      const cleaned = seg.replace(/^[*•\-]\s+/, '').trim()
      const sentences = cleaned.match(/[^.!?]+[.!?]+/g) ?? [cleaned]
      for (const s of sentences) {
        const t = s.trim()
        if (t) bullets.push(t)
      }
    }
    return bullets
  }

  const sentences = trimmed.match(/[^.!?]+[.!?]+/g) ?? [trimmed]
  return sentences.map(s => s.trim()).filter(Boolean)
}

/** Parse stored capture text into selection, source excerpt, and summary bullets. */
export function parseCaptureContent(raw: string): ParsedCapture {
  let text = stripHtml(raw ?? '').trim()
  let aiKind: string | undefined
  const kindMatch = /^\*\*([a-z0-9-]+)\*\*\s*/i.exec(text)
  if (kindMatch) {
    aiKind = kindMatch[1]
    text = text.slice(kindMatch[0].length).trim()
  }

  let selection: string | undefined
  const quoteMatch = /^>\s*([\s\S]*?)(?:\n\n|$)/.exec(text)
  if (quoteMatch) {
    selection = normalizeWhitespace(quoteMatch[1]!)
    text = text.slice(quoteMatch[0].length).trim()
  }

  const summaryMatch = text.match(SUMMARY_INTRO_RE)
  if (summaryMatch && summaryMatch.index != null) {
    const sourceWall = text.slice(0, summaryMatch.index).trim()
    const afterIntro = text.slice(summaryMatch.index + summaryMatch[0].length).trim()
    return {
      aiKind,
      selection,
      body: text,
      sourceExcerpt: sourceWall || undefined,
      summaryBullets: extractSummaryBullets(afterIntro),
    }
  }

  const inlineBullets = extractSummaryBullets(text)
  const looksLikeBullets = inlineBullets.length >= 2
    && inlineBullets.every(b => b.length < 320)
    && text.split(/\n+/).some(l => /^[*•\-]\s+/.test(l.trim()))

  if (looksLikeBullets) {
    return { aiKind, selection, body: text, summaryBullets: inlineBullets }
  }

  return { aiKind, selection, body: text, summaryBullets: [] }
}

/** Short readable excerpt from a long capture (e.g. SERP dumps). */
export function smartExcerpt(text: string, maxChars = 420): string {
  const clean = normalizeWhitespace(text)
  if (!clean) return ''
  if (clean.length <= maxChars) return clean

  const sentences = clean.match(/[^.!?]+[.!?]+/g)
  if (sentences) {
    let acc = ''
    for (const s of sentences.slice(0, 4)) {
      if ((acc + s).length > maxChars) break
      acc += s
    }
    if (acc.length >= 80) {
      return acc.trim() + (acc.length < clean.length ? '…' : '')
    }
  }

  const cut = clean.slice(0, maxChars)
  const lastSpace = cut.lastIndexOf(' ')
  return (lastSpace > 60 ? cut.slice(0, lastSpace) : cut) + '…'
}

export function bulletsToHtml(bullets: string[]): string {
  if (bullets.length === 0) return ''
  const items = bullets.map(b => `<li><p>${htmlEscape(b)}</p></li>`).join('')
  return `<ul class="recap-bullets">${items}</ul>`
}

/** Repair sections where TipTap flattened list items into plain paragraphs. */
export function normalizeRecapListSections(html: string): string {
  const labels = ['Key takeaways', 'Summary']
  let out = html
  for (const label of labels) {
    const re = new RegExp(
      `(<h3>\\s*${label}\\s*<\\/h3>)\\s*((?:<p(?![^>]*class="recap-entry-meta")[^>]*>[\\s\\S]*?<\\/p>\\s*)+)`,
      'gi',
    )
    out = out.replace(re, (_match, heading: string, paragraphs: string) => {
      const items = [...paragraphs.matchAll(/<p[^>]*>([\s\S]*?)<\/p>/gi)]
        .map(m => m[1]!.replace(/<[^>]+>/g, '').trim())
        .filter(Boolean)
      if (items.length < 2) return heading + paragraphs
      return heading + bulletsToHtml(items)
    })
  }
  return out
}

function quoteHtml(text: string, className = 'recap-quote'): string {
  const excerpt = smartExcerpt(text)
  if (!excerpt) return ''
  return `<blockquote class="${className}"><p>${htmlEscape(excerpt)}</p></blockquote>`
}

function sectionLabel(text: string): string {
  return `<h3>${htmlEscape(text)}</h3>`
}

function isAiCapture(note: Note): boolean {
  const slug = captureTypeSlug(note)
  return slug === 'ai' || note.type === 'ai-summary'
}

function describeDrawing(note: Note): string | null {
  if (!note.tags?.includes('drawing') && note.type !== 'canvas') return null
  const raw = note.content ?? ''
  try {
    const obj = JSON.parse(raw) as { type?: string; points?: unknown[] }
    const kinds: Record<string, string> = {
      path: 'pen stroke', line: 'line', rect: 'rectangle',
      arrow: 'arrow', ellipse: 'ellipse',
    }
    const kind = obj.type ? kinds[obj.type] ?? obj.type : 'sketch'
    const pts = Array.isArray(obj.points) ? obj.points.length : 0
    return pts > 0 ? `Drawing (${kind}, ${pts} points)` : `Drawing (${kind})`
  } catch {
    return 'Drawing'
  }
}

function describeHandwriting(note: Note): string | null {
  if (!note.tags?.includes('handwriting')) return null
  const m = /([0-9]+)\s+handwriting/i.exec(note.content ?? '')
  return m ? `Handwriting (${m[1]} points)` : 'Handwriting'
}

function positionHint(note: Note): string | null {
  const isAnchor = note.type === 'anchor' || note.tags?.includes('anchor')
  if (!isAnchor) return null
  const parts: string[] = []
  if (note.x != null || note.y != null) {
    parts.push(`pinned at ${Math.round(note.x ?? 0)}%, ${Math.round(note.y ?? 0)}%`)
  }
  if (note.lat != null && note.lng != null) {
    parts.push(`location ${note.lat.toFixed(4)}, ${note.lng.toFixed(4)}`)
  }
  return parts.length ? parts.join(' · ') : null
}

/** Build structured body HTML for a single capture entry. */
export function buildCaptureBodyHtml(note: Note): string {
  const parsed = parseCaptureContent(note.content ?? '')
  const context = note.pageContext?.trim() ?? ''
  const drawing = describeDrawing(note)
  const handwriting = describeHandwriting(note)
  const position = positionHint(note)
  const parts: string[] = []

  if (isAiCapture(note)) {
    if (parsed.summaryBullets.length > 0) {
      parts.push(sectionLabel('Summary'))
      parts.push(bulletsToHtml(parsed.summaryBullets))
    } else if (parsed.body) {
      parts.push(sectionLabel('Summary'))
      parts.push(`<p>${htmlEscape(smartExcerpt(parsed.body, 600))}</p>`)
    }

    const source = parsed.selection
      ?? (parsed.sourceExcerpt && parsed.summaryBullets.length > 0 ? parsed.sourceExcerpt : '')
    if (source) {
      parts.push(sectionLabel('Source excerpt'))
      parts.push(quoteHtml(source))
    } else if (!parsed.summaryBullets.length && parsed.body) {
      parts.push(quoteHtml(parsed.body))
    }
    return parts.join('') + (position ? `<p><em>${htmlEscape(position)}</em></p>` : '')
  }

  if (drawing) {
    parts.push(`<p>${htmlEscape(drawing)}</p>`)
    const body = stripMarkdownHeaderPrefix(stripHtml(note.content ?? ''))
    if (body && !body.startsWith('{')) parts.push(quoteHtml(body))
    return parts.join('') + (position ? `<p><em>${htmlEscape(position)}</em></p>` : '')
  }

  if (handwriting) {
    parts.push(`<p>${htmlEscape(handwriting)}</p>`)
    const body = stripMarkdownHeaderPrefix(stripHtml(note.content ?? ''))
    if (body && !/^\d+\s+handwriting/i.test(body)) parts.push(quoteHtml(body))
    return parts.join('') + (position ? `<p><em>${htmlEscape(position)}</em></p>` : '')
  }

  const body = parsed.body || stripMarkdownHeaderPrefix(stripHtml(note.content ?? ''))
  const quoteSource = context && context !== body ? context : body

  if (quoteSource) {
    const label = note.type === 'highlight' || note.tags?.includes('highlight')
      ? 'Highlighted passage'
      : note.type === 'clip' || note.tags?.includes('clip')
        ? 'Clipped passage'
        : 'Captured text'
    parts.push(sectionLabel(label))
    parts.push(quoteHtml(quoteSource))
  } else {
    parts.push(`<p><em>Empty capture</em></p>`)
  }

  if (position) parts.push(`<p><em>${htmlEscape(position)}</em></p>`)
  return parts.join('')
}

export function collectInsightBullets(notes: Note[]): string[] {
  const seen = new Set<string>()
  const out: string[] = []
  for (const note of notes) {
    const parsed = parseCaptureContent(note.content ?? '')
    for (const bullet of parsed.summaryBullets) {
      const key = bullet.toLowerCase().slice(0, 80)
      if (seen.has(key)) continue
      seen.add(key)
      out.push(bullet)
    }
  }
  return out.slice(0, 6)
}

export function buildOverviewHtml(
  notes: Note[],
  pageTitle: string,
  domain: string,
  ai?: RecapOverviewAi | null,
): string {
  const sorted = [...notes].sort(
    (a, b) => new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime(),
  )
  const first = sorted[0]?.createdAt ?? notes[0]?.createdAt ?? ''
  const lastNote = sorted[sorted.length - 1] ?? notes[0]
  const last = lastNote?.updatedAt ?? lastNote?.createdAt ?? ''
  const totalCount = notes.length
  const insightBullets = ai?.bullets?.length ? ai.bullets : collectInsightBullets(notes)

  let html =
    `<h2>Overview</h2>` +
    `<p>${totalCount} capture${totalCount === 1 ? '' : 's'} from ` +
    `<strong>${htmlEscape(pageTitle)}</strong> (${htmlEscape(domain)}). ` +
    `${formatRecapMinute(first)} – ${formatRecapMinute(last)}.</p>`

  if (ai?.paragraph?.trim()) {
    html += `<p>${htmlEscape(ai.paragraph.trim())}</p>`
  } else if (insightBullets.length > 0) {
    html += `<p>${htmlEscape(insightBullets[0]!)}</p>`
  }

  if (insightBullets.length > 0) {
    html += sectionLabel('Key takeaways')
    html += bulletsToHtml(insightBullets)
  }

  return html
}

export function buildRecapEntryHtml(note: Note): string {
  const ts = formatRecapMinute(note.updatedAt ?? note.createdAt)
  const action = actionLabelFor(note)
  const slug = captureTypeSlug(note)
  const anchorId = recapEntryAnchorId(note.id)
  const body = buildCaptureBodyHtml(note)

  return (
    `<div id="${anchorId}" data-recap-entry data-note-id="${htmlEscape(note.id)}" ` +
    `data-capture-type="${htmlEscape(slug)}" class="recap-entry">` +
    `<p class="recap-entry-meta" data-note-id="${htmlEscape(note.id)}" ` +
    `data-capture-type="${htmlEscape(slug)}">` +
    `<em>${htmlEscape(ts)} — ${htmlEscape(action)}</em></p>` +
    body +
    `</div><hr>`
  )
}

/** Condensed capture summaries for server-side AI overview. */
export function summarizeNotesForAi(notes: Note[]): string {
  return [...notes]
    .sort((a, b) => new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime())
    .map(note => {
      const parsed = parseCaptureContent(note.content ?? '')
      const action = actionLabelFor(note)
      const bullets = parsed.summaryBullets.length
        ? parsed.summaryBullets.map(b => `  - ${b}`).join('\n')
        : `  - ${smartExcerpt(parsed.body || note.pageContext || '', 240)}`
      return `${action}:\n${bullets}`
    })
    .join('\n\n')
    .slice(0, 12000)
}
