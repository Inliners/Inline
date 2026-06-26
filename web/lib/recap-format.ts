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

/** TipTap-safe header: label + right-aligned time via data-recap-time (survives editor round-trips). */
export function recapSectionHeading(label: string, time?: string): string {
  const timeAttr = time ? ` data-recap-time="${htmlEscape(time)}"` : ''
  return `<h2 class="recap-section-heading"${timeAttr}>${htmlEscape(label)}</h2>`
}

function recapEntryHeading(label: string, ts: string): string {
  return (
    `<h3 class="recap-entry-header" data-recap-time="${htmlEscape(ts)}">` +
    `${htmlEscape(label)}</h3>`
  )
}

function recapEntryLead(label: string, ts: string): string {
  return (
    `<p class="recap-entry-header" data-recap-time="${htmlEscape(ts)}">` +
    `${htmlEscape(label)}</p>`
  )
}

function mergeLegacyEntryHeader(label: string, ts: string): string {
  const clean = label.replace(/<[^>]+>/g, '').trim()
  return recapEntryHeading(clean, ts.trim())
}

function extractTimeFromSpanHeader(
  tag: 'h2' | 'h3' | 'p',
  inner: string,
): string | null {
  const timeMatch = inner.match(
    /<span[^>]*class="[^"]*recap-entry-time[^"]*"[^>]*>([\s\S]*?)<\/span>/i,
  )
  if (!timeMatch) return null
  const label = inner
    .replace(/<span[^>]*class="[^"]*recap-(?:section-label|entry-label)[^"]*"[^>]*>([\s\S]*?)<\/span>/i, '$1')
    .replace(/<span[^>]*class="[^"]*recap-entry-time[^"]*"[^>]*>[\s\S]*?<\/span>/gi, '')
    .replace(/<[^>]+>/g, '')
    .trim()
  const ts = timeMatch[1]!.replace(/<[^>]+>/g, '').trim()
  if (tag === 'h2') return recapSectionHeading(label, ts)
  if (tag === 'h3') return recapEntryHeading(label, ts)
  return recapEntryLead(label, ts)
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
export function buildCaptureBodyHtml(note: Note, entryTime?: string): string {
  const parsed = parseCaptureContent(note.content ?? '')
  const context = note.pageContext?.trim() ?? ''
  const drawing = describeDrawing(note)
  const handwriting = describeHandwriting(note)
  const position = positionHint(note)
  const parts: string[] = []
  const label = (text: string) =>
    entryTime ? recapEntryHeading(text, entryTime) : sectionLabel(text)

  if (isAiCapture(note)) {
    if (parsed.summaryBullets.length > 0) {
      parts.push(label('Summary'))
      parts.push(bulletsToHtml(parsed.summaryBullets))
    } else if (parsed.body) {
      parts.push(label('Summary'))
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
    parts.push(entryTime ? recapEntryLead(drawing, entryTime) : `<p>${htmlEscape(drawing)}</p>`)
    const body = stripMarkdownHeaderPrefix(stripHtml(note.content ?? ''))
    if (body && !body.startsWith('{')) parts.push(quoteHtml(body))
    return parts.join('') + (position ? `<p><em>${htmlEscape(position)}</em></p>` : '')
  }

  if (handwriting) {
    parts.push(entryTime ? recapEntryLead(handwriting, entryTime) : `<p>${htmlEscape(handwriting)}</p>`)
    const body = stripMarkdownHeaderPrefix(stripHtml(note.content ?? ''))
    if (body && !/^\d+\s+handwriting/i.test(body)) parts.push(quoteHtml(body))
    return parts.join('') + (position ? `<p><em>${htmlEscape(position)}</em></p>` : '')
  }

  const body = parsed.body || stripMarkdownHeaderPrefix(stripHtml(note.content ?? ''))
  const quoteSource = context && context !== body ? context : body

  if (quoteSource) {
    const passageLabel = note.type === 'highlight' || note.tags?.includes('highlight')
      ? 'Highlighted passage'
      : note.type === 'clip' || note.tags?.includes('clip')
        ? 'Clipped passage'
        : 'Captured text'
    parts.push(label(passageLabel))
    parts.push(quoteHtml(quoteSource))
  } else {
    parts.push(entryTime ? recapEntryLead('Capture', entryTime) : `<p><em>Empty capture</em></p>`)
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
    recapSectionHeading('Overview', `${formatRecapMinute(first)} – ${formatRecapMinute(last)}`) +
    `<p>${totalCount} capture${totalCount === 1 ? '' : 's'} from ` +
    `<strong>${htmlEscape(pageTitle)}</strong> (${htmlEscape(domain)}).</p>`

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
  const slug = captureTypeSlug(note)
  const anchorId = recapEntryAnchorId(note.id)
  const body = buildCaptureBodyHtml(note, ts)

  return (
    `<div id="${anchorId}" data-recap-entry data-note-id="${htmlEscape(note.id)}" ` +
    `data-capture-type="${htmlEscape(slug)}" class="recap-entry">` +
    body +
    `</div><hr>`
  )
}

function splitInlineRecapTime(text: string): { label: string; time?: string } {
  const plain = text.replace(/<[^>]+>/g, ' ').replace(/\s+/g, ' ').trim()
  if (!plain) return { label: plain }

  const rangeMatch = plain.match(
    /^(.+?)\s+(\d{1,2}\/\d{1,2}\/\d{4},\s*\d{1,2}:\d{2}\s*(?:AM|PM)\s*[–-]\s*\d{1,2}\/\d{1,2}\/\d{4},\s*\d{1,2}:\d{2}\s*(?:AM|PM))$/i,
  )
  if (rangeMatch) return { label: rangeMatch[1]!.trim(), time: rangeMatch[2]!.trim() }

  const singleMatch = plain.match(
    /^(.+?)\s+(\d{1,2}\/\d{1,2}\/\d{4},\s*\d{1,2}:\d{2}\s*(?:AM|PM))$/i,
  )
  if (singleMatch) return { label: singleMatch[1]!.trim(), time: singleMatch[2]!.trim() }

  return { label: plain }
}

function repairInlineTimeTag(
  tag: 'h2' | 'h3' | 'p',
  attrs: string,
  inner: string,
): string | null {
  if (/data-recap-time\s*=/i.test(attrs)) return null
  if (tag === 'p' && !/recap-entry-header/i.test(attrs)) return null

  const { label, time } = splitInlineRecapTime(inner)
  if (!time) return null

  if (tag === 'h2') {
    if (/^activity$/i.test(label)) return recapSectionHeading('Activity')
    if (/^overview$/i.test(label)) return recapSectionHeading('Overview', time)
    return recapSectionHeading(label, time)
  }
  if (tag === 'h3') return recapEntryHeading(label, time)
  return recapEntryLead(label, time)
}

/** Migrate legacy entry meta lines to right-aligned time headers. */
export function normalizeRecapEntryTimes(html: string): string {
  let out = html

  const mergeMetaBeforeH3 =
    /<p[^>]*>\s*<em>([^<]+?)(?:\s*[—·–]\s*[^<]*)?<\/em>\s*<\/p>\s*<h3[^>]*>([\s\S]*?)<\/h3>/gi
  out = out.replace(mergeMetaBeforeH3, (_m, ts: string, label: string) =>
    mergeLegacyEntryHeader(label, ts))

  out = out.replace(
    /<div class="recap-entry-header">\s*<h3[^>]*>([\s\S]*?)<\/h3>\s*<time[^>]*>([^<]*)<\/time>\s*<\/div>/gi,
    (_m, label: string, ts: string) => mergeLegacyEntryHeader(label, ts),
  )

  for (const tag of ['h2', 'h3', 'p'] as const) {
    const spanHeaderRe = new RegExp(
      `<${tag}([^>]*class="[^"]*recap-(?:section|entry)-header[^"]*"[^>]*)>([\\s\\S]*?)<\\/${tag}>`,
      'gi',
    )
    out = out.replace(spanHeaderRe, (full, attrs: string, inner: string) => {
      if (!/recap-entry-time/i.test(inner)) return full
      return extractTimeFromSpanHeader(tag, inner) ?? full
    })
  }

  out = out.replace(
    /<h2([^>]*class="recap-section-heading"[^>]*)>([^<]*)<\/h2>/gi,
    (_m, attrs: string, label: string) => {
      const time = /data-recap-time="([^"]*)"/i.exec(attrs)?.[1]
      return time ? recapSectionHeading(label.trim(), time) : recapSectionHeading(label.trim())
    },
  )

  out = out.replace(
    /<h2>\s*Overview\s*<span class="recap-overview-range">([\s\S]*?)<\/span>\s*<\/h2>/gi,
    (_m, range: string) => recapSectionHeading('Overview', range.trim()),
  )

  out = out.replace(
    /<h2 class="recap-section-heading"><span>Overview<\/span><span class="recap-(?:time )?recap-overview-range">([\s\S]*?)<\/span><\/h2>/gi,
    (_m, range: string) => recapSectionHeading('Overview', range.trim()),
  )

  out = out.replace(
    /<h2 class="recap-section-heading"><span class="recap-section-label">Overview<\/span><span class="recap-entry-time">([\s\S]*?)<\/span><\/h2>/gi,
    (_m, range: string) => recapSectionHeading('Overview', range.trim()),
  )

  out = out.replace(
    /<h2[^>]*>\s*<span[^>]*>\s*Overview\s*<\/span>\s*<span[^>]*>([\s\S]*?)<\/span>\s*<\/h2>/gi,
    (_m, range: string) => recapSectionHeading('Overview', range.trim()),
  )

  out = out.replace(/<h2>\s*Activity\s*<\/h2>/gi, recapSectionHeading('Activity'))
  out = out.replace(
    /<h2 class="recap-section-heading"><span>Activity<\/span>\s*<\/h2>/gi,
    recapSectionHeading('Activity'),
  )
  out = out.replace(
    /<h2 class="recap-section-heading"><span class="recap-section-label">Activity<\/span>\s*<\/h2>/gi,
    recapSectionHeading('Activity'),
  )

  // Drop leftover timestamp-only lines (already merged into headers).
  out = out.replace(
    /<p[^>]*>\s*<em>\s*\d{1,2}\/\d{1,2}\/\d{4}[^<]*[—·–][^<]*<\/em>\s*<\/p>/gi,
    '',
  )

  // Split timestamps merged into heading text (TipTap round-trip).
  out = out.replace(/<(h2|h3|p)([^>]*)>([\s\S]*?)<\/\1>/gi, (full, tag, attrs, inner) => {
    const fixed = repairInlineTimeTag(tag as 'h2' | 'h3' | 'p', attrs, inner)
    return fixed ?? full
  })

  return out
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
