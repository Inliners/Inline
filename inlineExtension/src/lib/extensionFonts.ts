/**
 * Geist Sans — same family as the web dashboard chat panel (app/layout.tsx).
 * Loaded via CDN so popup + shadow-DOM surfaces share one stack.
 */
export const FONT =
  "'Geist', ui-sans-serif, system-ui, -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif" as const

const GEIST_BASE =
  'https://cdn.jsdelivr.net/npm/geist@1.3.1/dist/fonts/geist-sans'

export const FONT_FACE_CSS = `
@font-face {
  font-family: 'Geist';
  font-style: normal;
  font-weight: 400;
  font-display: swap;
  src: url('${GEIST_BASE}/Geist-Regular.woff2') format('woff2');
}
@font-face {
  font-family: 'Geist';
  font-style: normal;
  font-weight: 500;
  font-display: swap;
  src: url('${GEIST_BASE}/Geist-Medium.woff2') format('woff2');
}
@font-face {
  font-family: 'Geist';
  font-style: normal;
  font-weight: 600;
  font-display: swap;
  src: url('${GEIST_BASE}/Geist-SemiBold.woff2') format('woff2');
}
@font-face {
  font-family: 'Geist';
  font-style: normal;
  font-weight: 700;
  font-display: swap;
  src: url('${GEIST_BASE}/Geist-Bold.woff2') format('woff2');
}
`

let fontsInjected = false

/** Inject Geist @font-face rules once into a document or shadow root. */
export function injectExtensionFonts(root: Document | ShadowRoot | null) {
  if (fontsInjected || !root) return
  try {
    const style = document.createElement('style')
    style.setAttribute('data-inline-fonts', 'geist')
    style.textContent = FONT_FACE_CSS
    ;(root as ShadowRoot).appendChild?.(style) ?? (root as Document).head?.appendChild(style)
    fontsInjected = true
  } catch {
    /* ignore */
  }
}
