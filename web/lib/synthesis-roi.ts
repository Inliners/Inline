import type { Note } from '@/lib/types'

const WORDS_PER_MINUTE = 250

function countWords(text: string): number {
  const stripped = text.replace(/<[^>]+>/g, ' ').replace(/\s+/g, ' ').trim()
  if (!stripped) return 0
  return stripped.split(' ').length
}

export type SynthesisRoi = {
  sourceWords: number
  recapWords: number
  siteCount: number
  minutesSaved: number
}

export function computeSynthesisRoi(sourceNotes: Note[], recapHtml: string): SynthesisRoi | null {
  if (sourceNotes.length === 0) return null

  const sourceWords = sourceNotes.reduce(
    (sum, n) => sum + countWords(`${n.content} ${n.pageContext ?? ''}`),
    0,
  )
  const recapWords = countWords(recapHtml)
  if (sourceWords === 0) return null

  const domains = new Set(sourceNotes.map(n => n.domain).filter(Boolean))
  const siteCount = domains.size > 0 ? domains.size : sourceNotes.length

  const sourceMinutes = sourceWords / WORDS_PER_MINUTE
  const recapMinutes = recapWords / WORDS_PER_MINUTE
  const minutesSaved = Math.max(1, Math.round(sourceMinutes - recapMinutes))

  return { sourceWords, recapWords, siteCount, minutesSaved }
}

/** Share of reading time saved vs. raw captures (0–100). */
export function synthesisRoiSavedPercent(roi: SynthesisRoi): number {
  if (roi.sourceWords <= 0) return 0
  const ratio = 1 - roi.recapWords / roi.sourceWords
  return Math.min(100, Math.max(0, Math.round(ratio * 100)))
}

export function formatSynthesisRoiMessage(roi: SynthesisRoi): string {
  const m = roi.minutesSaved
  return `You just saved ${m} minute${m === 1 ? '' : 's'} of reading time.`
}
