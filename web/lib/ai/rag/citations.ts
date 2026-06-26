/**
 * Client-safe citation helpers — no server imports.
 * Used by WorkspaceChatPanel and server-side RAG routes.
 */

/** Minimum cosine similarity to surface a source card in semantic mode. */
export const MIN_DISPLAY_SIMILARITY = 0.28

/** Parse [n], [n, m], and [n–m] citation markers from assistant text. */
export function extractCitationRefs(text: string): Set<number> {
  const refs = new Set<number>()
  for (const match of text.matchAll(/\[\s*([^\]]+)\s*\]/g)) {
    for (const segment of match[1]!.split(/\s*,\s*/)) {
      const range = segment.split(/\s*[–-]\s*/)
      if (range.length === 2) {
        const a = parseInt(range[0]!.trim(), 10)
        const b = parseInt(range[1]!.trim(), 10)
        if (!Number.isNaN(a) && !Number.isNaN(b)) {
          const lo = Math.min(a, b)
          const hi = Math.max(a, b)
          for (let i = lo; i <= hi; i++) refs.add(i)
        }
        continue
      }
      const n = parseInt(segment.trim(), 10)
      if (!Number.isNaN(n)) refs.add(n)
    }
  }
  return refs
}

type CitableSource = { ref: number; similarity: number | null }

/** Keep only sources the model actually cited, optionally gated by similarity. */
export function filterSourcesForDisplay<T extends CitableSource>(
  sources: T[],
  answerText: string,
  { minSimilarity = MIN_DISPLAY_SIMILARITY }: { minSimilarity?: number } = {},
): T[] {
  const cited = extractCitationRefs(answerText)
  if (cited.size === 0) return []
  return sources.filter(s => {
    if (!cited.has(s.ref)) return false
    if (s.similarity != null && s.similarity < minSimilarity) return false
    return true
  })
}
