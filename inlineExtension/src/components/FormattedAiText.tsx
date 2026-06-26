import type { CSSProperties } from 'react'
import { PANEL as C } from '../lib/extensionTheme'

const BULLET_RE = /^[*•-]\s+/
const NUMBER_RE = /^\d+[.)]\s+/

function stripMarker(line: string): string {
  return line.replace(/^[*•-]\s+/, '').replace(/^\d+[.)]\s+/, '')
}

interface FormattedAiTextProps {
  text: string
  style?: CSSProperties
}

/** Renders AI output with real list bullets instead of literal * characters. */
export default function FormattedAiText({ text, style }: FormattedAiTextProps) {
  const base: CSSProperties = {
    fontSize: 14,
    lineHeight: 1.625,
    color: C.text,
    ...style,
  }

  if (!text.trim()) return null

  const blocks = text.split(/\n\n+/)

  return (
    <div style={base}>
      {blocks.map((block, blockIdx) => {
        const trimmed = block.trim()
        if (!trimmed) return null

        const lines = trimmed.split('\n').map(l => l.trim()).filter(Boolean)
        const bulletLines = lines.filter(l => BULLET_RE.test(l))
        const numberedLines = lines.filter(l => NUMBER_RE.test(l))
        const proseLines = lines.filter(l => !BULLET_RE.test(l) && !NUMBER_RE.test(l))
        const blockGap = blockIdx < blocks.length - 1 ? 12 : 0

        if (bulletLines.length > 0) {
          return (
            <div key={blockIdx} style={{ marginBottom: blockGap }}>
              {proseLines.length > 0 && (
                <p style={{ margin: '0 0 8px' }}>{proseLines.join(' ')}</p>
              )}
              <ul style={{ margin: 0, paddingLeft: 20, listStyleType: 'disc' }}>
                {bulletLines.map((line, j) => (
                  <li
                    key={j}
                    style={{ marginBottom: j < bulletLines.length - 1 ? 6 : 0, paddingLeft: 2 }}
                  >
                    {stripMarker(line)}
                  </li>
                ))}
              </ul>
            </div>
          )
        }

        if (numberedLines.length > 0) {
          return (
            <div key={blockIdx} style={{ marginBottom: blockGap }}>
              {proseLines.length > 0 && (
                <p style={{ margin: '0 0 8px' }}>{proseLines.join(' ')}</p>
              )}
              <ol style={{ margin: 0, paddingLeft: 20 }}>
                {numberedLines.map((line, j) => (
                  <li
                    key={j}
                    style={{ marginBottom: j < numberedLines.length - 1 ? 6 : 0, paddingLeft: 2 }}
                  >
                    {stripMarker(line)}
                  </li>
                ))}
              </ol>
            </div>
          )
        }

        return (
          <p
            key={blockIdx}
            style={{ margin: 0, marginBottom: blockGap, whiteSpace: 'pre-wrap' }}
          >
            {trimmed}
          </p>
        )
      })}
    </div>
  )
}
