/** Shared assistant text normalization for workspace + analytics chat. */

export const CHAT_THINKING_MESSAGE =
  'Putting together the best answer — one moment, Inline…'

/** Rotating status lines while analytics insights load */
export const INSIGHTS_LOADING_PHRASES = [
  'Taking it one step at a time, Inline…',
  'Reading through your captures, Inline…',
  'Finding patterns in your research, Inline…',
  'Putting the pieces together, Inline…',
] as const

function formatCitations(text: string): string {
  return text.replace(/\[\s*(\d+(?:\s*,\s*\d+)*)\s*\]/g, (_, numsStr: string) => {
    const nums = numsStr
      .split(',')
      .map(s => parseInt(s.trim(), 10))
      .filter(n => !Number.isNaN(n))
    if (nums.length === 0) return ''
    if (nums.length === 1) return `[${nums[0]}]`
    nums.sort((a, b) => a - b)
    const consecutive = nums.every((n, i) => i === 0 || n === nums[i - 1]! + 1)
    if (consecutive || nums.length > 3) {
      return `[${nums[0]}–${nums[nums.length - 1]}]`
    }
    return `[${nums.join(', ')}]`
  })
}

function stripInlineMarkdown(text: string): string {
  return text
    .replace(/\*\*(.+?)\*\*/g, '$1')
    .replace(/__(.+?)__/g, '$1')
    .replace(/(?<!\*)\*(?!\*)(.+?)(?<!\*)\*(?!\*)/g, '$1')
    .replace(/`([^`]+)`/g, '$1')
    .replace(/^#{1,6}\s+/gm, '')
}

function reflowDomainList(text: string): string {
  const host = '(?:localhost|[a-z0-9][\\w.-]*\\.[a-z]{2,})'
  const citation = '\\[(?:\\d+\\s*[,–-]\\s*)*\\d+\\]'
  const runOn = new RegExp(`(${host})\\s*(?:${citation})?`, 'gi')
  const matches = [...text.matchAll(runOn)]
  if (matches.length < 2) return text

  const firstIdx = matches[0]!.index ?? 0
  const intro = text.slice(0, firstIdx).trim()

  const seen = new Set<string>()
  const bullets: string[] = []
  for (const match of matches) {
    const domain = match[1]!.toLowerCase()
    if (seen.has(domain)) continue
    seen.add(domain)
    bullets.push(`- ${match[1]}`)
  }

  if (bullets.length < 2) return text
  return intro ? `${intro}\n\n${bullets.join('\n')}` : bullets.join('\n')
}

export function normalizeAssistantText(text: string): string {
  return reflowDomainList(formatCitations(stripInlineMarkdown(text)))
}

export function getChatGreeting(): string {
  const hour = new Date().getHours()
  if (hour < 12) return 'Morning'
  if (hour < 17) return 'Afternoon'
  return 'Evening'
}
