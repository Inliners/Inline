/**
 * Marketing homepage tokens — cream/tan atmosphere (Lindy/Notion-inspired)
 * with UI constraints from the extension + workspace chat panel.
 *
 * Navy (#0B1735 / #12203f): logo & small emphasis only — not section fills.
 */

/** Warm marketing backgrounds */
export const mkt = {
  creamLight: '#FDFBF7',
  cream: '#FAF5EE',
  tan: '#F5EDE3',
  sand: '#F9EFE4',
  sandDeep: '#EFE8DC',
  mist: '#EBF1F7',
  lavender: '#EFEAF5',
  borderWarm: '#E8DFD4',
  borderSoft: '#E5D9CC',
} as const

/** Extension + chat panel (canonical product chrome) */
export const product = {
  text: '#1C1E26',
  textMuted: '#78716c',
  border: '#d6d3d1',
  borderStrong: '#a8a29e',
  surface: '#FFFFFF',
  surfaceMuted: '#F4F4F2',
  surfaceSecondary: '#F7F7F5',
  /** Logo tile gradient endpoints — launcher only */
  brand: '#0B1735',
  brandMid: '#24386D',
  /** Ask badge / active tool emphasis */
  badge: '#12203f',
  ring: '#4B83C4',
  send: '#2f80ed',
  hover: '#13151B',
  panelShadow: '0 22px 70px -42px rgba(28, 30, 38, 0.38)',
  toolbarShadow:
    '0 14px 40px -8px rgba(28, 30, 38, 0.34), 0 6px 18px -4px rgba(28, 30, 38, 0.2)',
  inputGlow: '0 0 0 3px rgba(75, 131, 196, 0.10)',
} as const

/** Celestial accents on cream (orbits, stars — not full-bleed navy) */
export const celestial = {
  orbit: '#C4B5A8',
  orbitSoft: '#D9CFC2',
  star: '#B8A99A',
  sparkle: '#9BB8D9',
  hub: '#12203f',
} as const

export const mktTileShadow =
  'shadow-[inset_0_1px_0_rgba(255,255,255,0.92),0_6px_14px_-5px_rgba(180,158,132,0.15),0_2px_5px_-2px_rgba(160,138,118,0.09)]'

export const mktLogoTileShadow =
  'shadow-[0_6px_14px_-5px_rgba(140,118,98,0.18),0_2px_5px_-2px_rgba(160,138,118,0.1)]'

export const mktHeroAmbient =
  'radial-gradient(ellipse 92% 82% at 50% 52%, rgba(217, 196, 176, 0.2) 0%, rgba(245, 237, 227, 0.08) 46%, transparent 76%)'

/** Product-shaped card on cream sections */
export const mktCard =
  'rounded-xl border border-[#d6d3d1] bg-white p-6'

/** FAQ / mock shell */
export const mktCardSolid =
  'rounded-xl border border-[#d6d3d1] bg-white p-6'

export const mktBtnPrimary =
  'inline-flex items-center justify-center rounded-full bg-[#1C1E26] px-6 py-2.5 text-sm font-medium text-white transition-colors hover:bg-[#13151B] focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#4B83C4]'

export const mktBtnPrimaryLg =
  'inline-flex items-center justify-center rounded-full bg-[#1C1E26] px-7 py-3 text-sm font-semibold text-white transition-colors hover:bg-[#13151B] focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#4B83C4]'

export const mktBtnSecondary =
  'inline-flex items-center justify-center rounded-full border border-[#d6d3d1] bg-white px-6 py-2.5 text-sm font-medium text-[#1C1E26] transition-colors hover:border-[#a8a29e] hover:bg-[#F4F4F2] focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#4B83C4]'

export const mktBtnSecondaryLg =
  'inline-flex items-center justify-center rounded-full border border-[#d6d3d1] bg-white px-7 py-3 text-sm font-medium text-[#1C1E26] transition-colors hover:border-[#a8a29e] hover:bg-[#F4F4F2] focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#4B83C4]'

export const mktEyebrow =
  'text-xs font-semibold uppercase tracking-[0.18em] text-[#78716c]'

export const mktPanelMock =
  'overflow-hidden rounded-xl border border-[#d6d3d1] bg-white'
