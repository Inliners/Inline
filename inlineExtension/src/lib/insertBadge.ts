/**
 * When the user accepts an AI output ("Insert" in AI.tsx / Rewrite.tsx), the
 * inserted text is wrapped in a styled <mark> element so it's visible as an
 * AI edit and the action performed (Summarize, Rephrase, Shorten, etc.)
 * shows as a native tooltip on hover.
 *
 * Style is kept inline so it survives any content-script CSP the host page
 * applies. The <mark> gets a data-inline-ai attribute to make it easy to find
 * if the user wants to undo.
 */

const ACTION_COLORS: Record<string, { bg: string; border: string }> = {
  rephrase:  { bg: 'rgba(167, 139, 250, 0.25)', border: 'rgba(139, 92, 246, 0.5)'  },
  shorten:   { bg: 'rgba(251, 191, 36, 0.3)',   border: 'rgba(217, 119, 6, 0.5)'   },
  summarize: { bg: 'rgba(110, 231, 183, 0.3)',  border: 'rgba(5, 150, 105, 0.5)'   },
  rewrite:   { bg: 'rgba(147, 197, 253, 0.3)',  border: 'rgba(37, 99, 235, 0.55)'  },
  custom:    { bg: 'rgba(248, 180, 217, 0.35)', border: 'rgba(236, 72, 153, 0.55)' },
  default:   { bg: 'rgba(244, 231, 211, 0.4)',  border: 'rgba(161, 98, 7, 0.4)'    },
}

const ACTION_LABEL: Record<string, string> = {
  rephrase:  'Rephrased by Inline AI',
  shorten:   'Shortened by Inline AI',
  summarize: 'Summarized by Inline AI',
  rewrite:   'Rewritten by Inline AI',
  custom:    'Custom AI prompt applied',
}

export function buildAIInsertMark(text: string, task: string, instruction?: string): HTMLElement {
  const key = ACTION_COLORS[task] ? task : 'default'
  const palette = ACTION_COLORS[key]
  const label = ACTION_LABEL[task] ?? 'Inline AI edit'
  const tipExtra = instruction ? ` — ${instruction.slice(0, 120)}` : ''

  const mark = document.createElement('mark')
  mark.setAttribute('data-inline-ai', task || 'edit')
  mark.setAttribute('title', `${label}${tipExtra}`)
  mark.setAttribute('aria-label', label)
  mark.style.background = palette.bg
  mark.style.borderBottom = `1.5px solid ${palette.border}`
  mark.style.borderRadius = '3px'
  mark.style.padding = '0 2px'
  mark.style.color = 'inherit'
  mark.style.transition = 'background 120ms ease'
  mark.textContent = text

  // Subtle glow on hover to reinforce that the span is meaningful.
  mark.addEventListener('mouseenter', () => {
    mark.style.boxShadow = `0 0 0 2px ${palette.border}`
  })
  mark.addEventListener('mouseleave', () => {
    mark.style.boxShadow = 'none'
  })

  return mark
}
