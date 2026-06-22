import { clsx, type ClassValue } from "clsx"
import { twMerge } from "tailwind-merge"

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

/** Strip all HTML tags and decode common entities, returning plain text. */
export function stripHtml(html: string): string {
  if (!html) return ''
  let out = html
    .replace(/<[^>]*>/g, ' ')
    .replace(/&nbsp;/gi, ' ')
    .replace(/&amp;/gi, '&')
    .replace(/&lt;/gi, '<')
    .replace(/&gt;/gi, '>')
    .replace(/&quot;/gi, '"')
    .replace(/&#39;/gi, "'")

  // Collapse raw JSON-looking blobs (e.g. "{"id":"abc","type":"path","d":...")
  // down to a friendly label so cards never show stroke payloads.
  if (/^\s*\{.*"(id|type|points|path)"\s*:/.test(out)) {
    try {
      const parsed = JSON.parse(out)
      if (parsed && typeof parsed === 'object') {
        if (typeof parsed.type === 'string') {
          const kind = ({
            path: 'pen stroke',
            line: 'line',
            rect: 'rectangle',
            arrow: 'arrow',
            ellipse: 'ellipse',
          } as Record<string, string>)[parsed.type] || parsed.type
          const pts = Array.isArray(parsed.points) ? parsed.points.length : 0
          out = `Drawing — ${kind}${pts ? ` (${pts} points)` : ''}`
        } else {
          out = 'Drawing'
        }
      }
    } catch {
      out = 'Drawing'
    }
  }

  // Strip common markdown decorations so previews read as plain sentences.
  out = out
    .replace(/\*\*([^*]+)\*\*/g, '$1')
    .replace(/\*([^*]+)\*/g, '$1')
    .replace(/^#{1,6}\s*/gm, '')
    .replace(/^>\s*/gm, '')
    .replace(/`([^`]+)`/g, '$1')

  return out.replace(/\s+/g, ' ').trim()
}

/** Plain-text document preview for cards and lists (strips HTML, then truncates). */
export function previewText(content: string, max = 140): string {
  const clean = stripHtml(content)
  if (!clean) return ''
  if (clean.length <= max) return clean
  return `${clean.slice(0, max - 1).trimEnd()}…`
}

/**
 * Compact URL for history lists — keeps host + path and collapses long queries.
 */
export function truncateDisplayUrl(url: string, maxLen = 72): string {
  if (!url) return ''
  if (url.length <= maxLen) return url

  try {
    const u = new URL(url)
    const host = u.hostname
    const path = u.pathname === '/' ? '' : u.pathname
    const search = u.search

    const primaryQuery =
      u.searchParams.get('q') ??
      u.searchParams.get('oq') ??
      u.searchParams.get('query')

    if (primaryQuery && /search/i.test(path)) {
      const compact = `${host}${path}?q=${primaryQuery}`
      if (compact.length <= maxLen) {
        return search.length > `?q=${primaryQuery}`.length + 1 ? `${compact}&…` : compact
      }
      return `${compact.slice(0, maxLen - 1)}…`
    }

    const base = `${host}${path}`
    if (!search && !u.hash) {
      return base.length <= maxLen ? base : `${base.slice(0, maxLen - 1)}…`
    }

    const suffix = search || u.hash
    const room = maxLen - base.length
    if (room <= 6) return `${base.slice(0, maxLen - 1)}…`

    const shortSuffix = suffix.length > room ? `${suffix.slice(0, room - 1)}…` : suffix
    return `${base}${shortSuffix}`
  } catch {
    return `${url.slice(0, maxLen - 1)}…`
  }
}
