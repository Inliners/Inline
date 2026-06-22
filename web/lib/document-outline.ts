/**
 * Parse document HTML into a navigable heading outline and block inventory.
 * Used by the side panel so AI (and users) can page through document structure.
 */

export interface OutlineNode {
  /** Index among all h1–h3 in document order (for scroll targeting). */
  index: number
  level: 1 | 2 | 3
  text: string
  blockCount: number
  children: OutlineNode[]
}

export interface DocumentSymbolGroup {
  id: string
  label: string
  count: number
  selector: string
}

function stripTags(html: string): string {
  return html.replace(/<[^>]+>/g, ' ').replace(/\s+/g, ' ').trim()
}

function countBlocksInSection(html: string): number {
  const section = html.split(/<h[1-3][\s>]/i)[0] ?? ''
  if (!section.trim()) return 0

  const recapEntries = section.match(/data-recap-entry/gi)
  if (recapEntries?.length) return recapEntries.length

  const matches = section.match(
    /<(p|blockquote|ul|ol|pre|table|div|hr|li|img)\b[^>]*>/gi,
  )
  return matches?.length ?? (section.replace(/<[^>]+>/g, '').trim() ? 1 : 0)
}

interface FlatHeading {
  index: number
  level: 1 | 2 | 3
  text: string
  blockCount: number
}

export function extractHeadingsFromHtml(html: string): FlatHeading[] {
  if (!html.trim()) return []

  const headingRe = /<h([1-3])([^>]*)>([\s\S]*?)<\/h\1>/gi
  const headings: FlatHeading[] = []
  let match: RegExpExecArray | null
  let index = 0

  while ((match = headingRe.exec(html)) !== null) {
    const level = parseInt(match[1]!, 10) as 1 | 2 | 3
    const text = stripTags(match[3] ?? '') || 'Untitled section'
    const after = html.slice(match.index + match[0].length)
    headings.push({
      index,
      level,
      text,
      blockCount: countBlocksInSection(after),
    })
    index += 1
  }

  return headings
}

export function buildOutlineTree(flat: FlatHeading[]): OutlineNode[] {
  const root: OutlineNode[] = []
  const stack: OutlineNode[] = []

  for (const h of flat) {
    const node: OutlineNode = { ...h, children: [] }
    while (stack.length > 0 && stack[stack.length - 1]!.level >= h.level) {
      stack.pop()
    }
    if (stack.length === 0) root.push(node)
    else stack[stack.length - 1]!.children.push(node)
    stack.push(node)
  }

  return root
}

export function parseDocumentOutline(html: string): OutlineNode[] {
  return buildOutlineTree(extractHeadingsFromHtml(html))
}

export function parseDocumentSymbols(html: string): DocumentSymbolGroup[] {
  const count = (re: RegExp) => (html.match(re) ?? []).length

  const groups: DocumentSymbolGroup[] = [
    { id: 'code', label: 'Code blocks', count: count(/<pre\b/gi), selector: 'pre' },
    { id: 'bullet', label: 'Bullet lists', count: count(/<ul\b/gi), selector: 'ul' },
    { id: 'numbered', label: 'Numbered lists', count: count(/<ol\b/gi), selector: 'ol' },
    { id: 'task', label: 'Task lists', count: count(/data-type="taskList"/gi) + count(/<ul[^>]*class="[^"]*task/i), selector: 'ul[data-type="taskList"], ul.contains-task-list' },
    { id: 'quote', label: 'Quotes', count: count(/<blockquote\b/gi), selector: 'blockquote' },
    { id: 'table', label: 'Tables', count: count(/<table\b/gi), selector: 'table' },
    { id: 'image', label: 'Images', count: count(/<img\b/gi), selector: 'img' },
    { id: 'capture', label: 'Capture blocks', count: count(/data-recap-entry/gi), selector: '[data-recap-entry]' },
  ]

  return groups.filter(g => g.count > 0)
}

export function scrollToHeadingIndex(index: number) {
  if (typeof document === 'undefined') return
  const root = document.querySelector('.folder-document-editor .ProseMirror')
  if (!root) return
  const headings = root.querySelectorAll('h1, h2, h3')
  const el = headings[index]
  el?.scrollIntoView({ behavior: 'smooth', block: 'start' })
  el?.classList.add('doc-outline-flash')
  window.setTimeout(() => el?.classList.remove('doc-outline-flash'), 1200)
}

export function scrollToSymbol(selector: string) {
  if (typeof document === 'undefined') return
  const root = document.querySelector('.folder-document-editor .ProseMirror')
  if (!root) return
  const el = root.querySelector(selector)
  el?.scrollIntoView({ behavior: 'smooth', block: 'center' })
  el?.classList.add('doc-outline-flash')
  window.setTimeout(() => el?.classList.remove('doc-outline-flash'), 1200)
}

export function countDocumentWords(html: string): number {
  const text = stripTags(html)
  return text ? text.split(/\s+/).filter(Boolean).length : 0
}
