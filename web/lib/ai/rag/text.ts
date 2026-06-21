/**
 * Text utilities for the RAG pipeline. Pure functions — safe on server only
 * (they are only imported from server code, but contain no secrets either).
 */

/** Strip HTML, collapse whitespace, and normalize quotes for stable chunking. */
export function normalizeText(input: string): string {
  return input
    .replace(/<style[\s\S]*?<\/style>/gi, ' ')
    .replace(/<script[\s\S]*?<\/script>/gi, ' ')
    .replace(/<[^>]+>/g, ' ')
    .replace(/&nbsp;/g, ' ')
    .replace(/&amp;/g, '&')
    .replace(/&lt;/g, '<')
    .replace(/&gt;/g, '>')
    .replace(/&#39;|&apos;/g, "'")
    .replace(/&quot;/g, '"')
    .replace(/[ \t]+/g, ' ')
    .replace(/\s*\n\s*/g, '\n')
    .replace(/\n{3,}/g, '\n\n')
    .trim()
}

/** Short, display-safe excerpt for source cards (no newlines, hard cap). */
export function safeSnippet(text: string, maxLen = 220): string {
  const clean = normalizeText(text).replace(/\n+/g, ' ').trim()
  if (clean.length <= maxLen) return clean
  const cut = clean.slice(0, maxLen)
  const lastSpace = cut.lastIndexOf(' ')
  return `${cut.slice(0, lastSpace > maxLen * 0.6 ? lastSpace : maxLen)}…`
}

export type TextChunk = { text: string; index: number }

/**
 * Paragraph-aware chunker. Targets ~`maxChars` per chunk (roughly 800 tokens
 * at 4 chars/token for 3200 chars; we default a bit smaller for precision)
 * with `overlapChars` of trailing context carried into the next chunk.
 */
export function chunkText(
  input: string,
  { maxChars = 2400, overlapChars = 240, minChars = 40 }: { maxChars?: number; overlapChars?: number; minChars?: number } = {},
): TextChunk[] {
  const text = normalizeText(input)
  if (!text || text.length < minChars) {
    return text ? [{ text, index: 0 }] : []
  }
  if (text.length <= maxChars) {
    return [{ text, index: 0 }]
  }

  const paragraphs = text.split(/\n{2,}/)
  const chunks: string[] = []
  let current = ''

  const push = () => {
    const trimmed = current.trim()
    if (trimmed.length >= minChars) chunks.push(trimmed)
    current = ''
  }

  for (const rawPara of paragraphs) {
    // Split oversized paragraphs on sentence boundaries.
    const pieces = rawPara.length > maxChars
      ? rawPara.split(/(?<=[.!?])\s+/)
      : [rawPara]

    for (const piece of pieces) {
      if (current.length + piece.length + 2 > maxChars && current) {
        const tail = current.slice(-overlapChars)
        push()
        current = tail.trimStart()
      }
      // A single sentence longer than maxChars gets hard-split.
      if (piece.length > maxChars) {
        for (let i = 0; i < piece.length; i += maxChars) {
          current += (current ? ' ' : '') + piece.slice(i, i + maxChars)
          if (current.length >= maxChars) {
            const tail = current.slice(-overlapChars)
            push()
            current = tail.trimStart()
          }
        }
      } else {
        current += (current ? '\n\n' : '') + piece
      }
    }
  }
  push()

  return chunks.map((text, index) => ({ text, index }))
}
