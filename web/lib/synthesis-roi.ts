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

export function formatSynthesisRoiMessage(roi: SynthesisRoi): string {
  const sourceK = roi.sourceWords >= 1000
    ? `${(roi.sourceWords / 1000).toFixed(1).replace(/\.0$/, '')}k`
    : String(roi.sourceWords)

  return `You captured ${sourceK} words across ${roi.siteCount} site${roi.siteCount === 1 ? '' : 's'}. This brief is ${roi.recapWords.toLocaleString()} words — about ${roi.minutesSaved} minute${roi.minutesSaved === 1 ? '' : 's'} back.`
}
