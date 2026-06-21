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
