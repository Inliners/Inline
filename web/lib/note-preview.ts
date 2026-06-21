/**
 * Human-readable previews for captured notes.
 *
 * Raw stored content is sometimes JSON (drawings), markdown with headers
 * (AI actions) or HTML (library documents). This helper normalizes all of
 * that into a short piece of plain text safe to render in a table cell,
 * a card, or a graph label.
 */

import type { Note } from './types'
import { stripHtml } from './utils'

const AI_TAG_LABELS: Record<string, string> = {
  rephrase:  'AI rephrase',
  shorten:   'AI shorten',
  summary:   'AI summary',
  summarize: 'AI summary',
  rewrite:   'AI rewrite',
  custom:    'AI custom',
}

const FEATURE_TAG_LABELS: Record<string, string> = {
  sticky:      'Sticky note',
  anchor:      'Anchor note',
  'paper-note':'Paper note',
  highlight:   'Highlight',
  drawing:     'Drawing',
  handwriting: 'Handwriting',
  stamp:       'Stamp',
  clip:        'Clip',
  clipped:     'Clip',
}

function describeDrawingJson(raw: string): string {
  try {
    const obj = JSON.parse(raw) as {
      type?: string
      points?: Array<{ x?: number; y?: number } | [number, number]>
      stroke?: string
    }
    const typeLabel: Record<string, string> = {
      path:  'pen stroke',
      line:  'line',
      rect:  'rectangle',
      arrow: 'arrow',
      ellipse: 'ellipse',
    }
    const kind = obj.type ? typeLabel[obj.type] ?? obj.type : 'sketch'
    const points = Array.isArray(obj.points) ? obj.points.length : 0
    const detail = points > 0 ? ` (${points} points)` : ''
    return `Drawing — ${kind}${detail}`
  } catch {
    return 'Drawing'
  }
}

function describeHandwriting(content: string): string {
  const m = /([0-9]+)\s+handwriting/i.exec(content)
  if (m) return `Handwriting — ${m[1]} points`
  return 'Handwriting'
}

function stripMarkdownHeaderPrefix(text: string): string {
  return text
    .replace(/^\*\*([a-z0-9-]+)\*\*\s*/i, '')
    .replace(/^>\s*/, '')
    .replace(/\s+/g, ' ')
    .trim()
}

/**
 * Produce a short, human-friendly preview for a note. Never returns JSON
 * blobs, HTML tags, or stroke arrays. Callers should still truncate with CSS
 * (`line-clamp`, `truncate`) but the returned string is safe to render
 * directly.
 */
export function prettyNotePreview(note: Pick<Note, 'content' | 'type' | 'tags' | 'domain'>): string {
  const tags = note.tags ?? []
  const raw = note.content ?? ''

  if (tags.includes('drawing') || note.type === 'canvas') {
    return describeDrawingJson(raw)
  }
  if (tags.includes('handwriting')) {
    return describeHandwriting(raw)
  }
  if (tags.includes('stamp')) {
    const clean = stripHtml(raw) || 'Stamp'
    return `Stamp — ${clean.slice(0, 80)}`
  }

  if (note.type === 'ai-summary') {
    const aiKind = tags.find(t => AI_TAG_LABELS[t])
    const kindLabel = aiKind ? AI_TAG_LABELS[aiKind] : 'AI output'
    const body = stripMarkdownHeaderPrefix(stripHtml(raw)) || 'No output'
    return `${kindLabel}: ${body}`
  }

  const featureLabel = tags
    .map(t => FEATURE_TAG_LABELS[t])
    .find(Boolean)
  const body = stripHtml(raw).replace(/\s+/g, ' ').trim()

  if (!body) return featureLabel ?? note.domain ?? 'Capture'
  if (featureLabel && featureLabel !== 'Clip') return `${featureLabel}: ${body}`
  return body
}

/**
 * Same as prettyNotePreview, truncated to a fixed length with an ellipsis.
 */
export function prettyNotePreviewTruncated(
  note: Pick<Note, 'content' | 'type' | 'tags' | 'domain'>,
  max = 140,
): string {
  const text = prettyNotePreview(note)
  return text.length > max ? `${text.slice(0, max - 1).trimEnd()}…` : text
}
