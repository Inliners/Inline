import type { LayerVisibility } from '../lib/layerState'

const STYLE_ID = 'inline-layer-visibility-style'
const HIGHLIGHT_SELECTOR = '[data-inline-highlight]'

const NON_HIGHLIGHT_SELECTORS: Record<Exclude<keyof LayerVisibility, 'highlights'>, string[]> = {
  drawings: ['#inline-draw-canvas', '#inline-handwriting-canvas'],
  stickies: ['[data-inline-sticky]', '[data-inline-anchor]'],
  stamps: ['[data-inline-stamp]'],
}

function ensureLayerVisibilityStyle(): void {
  if (document.getElementById(STYLE_ID)) return

  const style = document.createElement('style')
  style.id = STYLE_ID
  style.textContent = `
    html[data-inline-hide-highlights] ${HIGHLIGHT_SELECTOR} {
      background-color: transparent !important;
      border-radius: 0 !important;
      padding: 0 !important;
    }
  `
  document.head.appendChild(style)
}

/** Hide highlight colour only — never remove the wrapped text from layout. */
export function applyHighlightLayerVisibility(visible: boolean): void {
  ensureLayerVisibilityStyle()

  document.querySelectorAll<HTMLElement>(HIGHLIGHT_SELECTOR).forEach((el) => {
    el.style.removeProperty('display')
  })

  if (visible) {
    document.documentElement.removeAttribute('data-inline-hide-highlights')
  } else {
    document.documentElement.setAttribute('data-inline-hide-highlights', '')
  }
}

export function applyLayerVisibility(layers: LayerVisibility): void {
  applyHighlightLayerVisibility(layers.highlights)

  ;(Object.keys(NON_HIGHLIGHT_SELECTORS) as (keyof typeof NON_HIGHLIGHT_SELECTORS)[]).forEach((key) => {
    const visible = layers[key]
    for (const sel of NON_HIGHLIGHT_SELECTORS[key]) {
      document.querySelectorAll<HTMLElement>(sel).forEach((el) => {
        el.style.display = visible ? '' : 'none'
      })
    }
  })
}
