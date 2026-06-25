/**
 * Marketing homepage tokens — warm cream/tan atmosphere
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
  espresso: '#4A3228',
  espressoDark: '#3A2720',
  burntRed: '#8B3329',
  burntOrange: '#C45A2E',
  /** 2-tone marketing cards — distinct from navy, brown, and burnt red */
  deepTeal: '#2A5F58',
} as const

/** Spaced frame around product mocks — saturated fill, no outer border */
export const mktProductRing = {
  tan: '#C9A574',
  navy: '#2E4A72',
  burntRed: '#8B3329',
  espresso: '#4A3228',
  burntOrange: '#B84E1F',
} as const

export type MktProductRingTone = keyof typeof mktProductRing

/** Blurred mesh washes for frosted product rings — paired with mktProductRing base. */
export const mktProductRingMesh: Record<MktProductRingTone, string[]> = {
  tan: [
    'radial-gradient(circle at 88% 10%, rgba(255, 210, 150, 0.5) 0%, transparent 46%)',
    'radial-gradient(circle at 10% 90%, rgba(140, 95, 55, 0.55) 0%, transparent 50%)',
    'radial-gradient(ellipse 85% 70% at 48% 42%, rgba(230, 190, 140, 0.45) 0%, transparent 72%)',
    'linear-gradient(155deg, #B8884E 0%, #C9A574 52%, #A67A42 100%)',
  ],
  navy: [
    'radial-gradient(circle at 90% 8%, rgba(120, 165, 220, 0.45) 0%, transparent 44%)',
    'radial-gradient(circle at 8% 92%, #0B1735 0%, rgba(11, 23, 53, 0.7) 30%, transparent 54%)',
    'radial-gradient(ellipse 88% 72% at 50% 44%, rgba(70, 110, 170, 0.4) 0%, transparent 70%)',
    'linear-gradient(160deg, #1a3050 0%, #2E4A72 48%, #24386D 100%)',
  ],
  burntRed: [
    'radial-gradient(circle at 86% 12%, rgba(220, 140, 120, 0.42) 0%, transparent 44%)',
    'radial-gradient(circle at 12% 88%, #5C2018 0%, rgba(92, 32, 24, 0.65) 32%, transparent 52%)',
    'radial-gradient(ellipse 85% 70% at 50% 45%, rgba(180, 80, 65, 0.38) 0%, transparent 68%)',
    'linear-gradient(155deg, #6B2820 0%, #8B3329 50%, #742A22 100%)',
  ],
  espresso: [
    'radial-gradient(circle at 88% 10%, rgba(180, 140, 115, 0.4) 0%, transparent 45%)',
    'radial-gradient(circle at 10% 90%, #2A1C16 0%, rgba(42, 28, 22, 0.7) 30%, transparent 52%)',
    'radial-gradient(ellipse 85% 70% at 48% 42%, rgba(120, 85, 68, 0.35) 0%, transparent 70%)',
    'linear-gradient(155deg, #3A2720 0%, #4A3228 52%, #36241E 100%)',
  ],
  burntOrange: [
    'radial-gradient(circle at 88% 10%, rgba(255, 180, 110, 0.48) 0%, transparent 44%)',
    'radial-gradient(circle at 10% 90%, #7A3010 0%, rgba(122, 48, 16, 0.65) 30%, transparent 52%)',
    'radial-gradient(ellipse 85% 70% at 50% 44%, rgba(220, 120, 60, 0.4) 0%, transparent 68%)',
    'linear-gradient(155deg, #9A4018 0%, #B84E1F 50%, #8C3C18 100%)',
  ],
}

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
  /** Floating Ask Inline pill — softer than toolbar chrome */
  chatPillShadow:
    '0 6px 18px -6px rgba(28, 30, 38, 0.1), 0 2px 6px -2px rgba(28, 30, 38, 0.06)',
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

/** Hero icon tile — soft glass keycap (inset highlight + drop shadow) */
export const mktTileShadow =
  'rgba(255, 255, 255, 0.9) 0px 1px 0px inset, rgba(200, 200, 210, 0.6) 0px 6px 10px -6px inset, rgba(0, 0, 0, 0.18) 0px 8px 24px -10px'

/** Center-row tiles — slightly deeper elevation */
export const mktTileShadowEmphasis =
  'rgba(255, 255, 255, 0.9) 0px 1px 0px inset, rgba(200, 200, 210, 0.6) 0px 6px 10px -6px inset, rgba(0, 0, 0, 0.22) 0px 10px 28px -10px'

export const mktLogoTileShadow = mktTileShadowEmphasis

export const mktHeroAmbient =
  'radial-gradient(rgba(232, 160, 130, 0.18) 0%, rgba(232, 160, 130, 0.06) 35%, transparent 70%)'

/** Frosted hero tile fill — keep alpha low so backdrop blur reads */
export const mktHeroTileGlass =
  'linear-gradient(180deg, rgba(255, 255, 255, 0.62) 0%, rgba(255, 255, 255, 0.28) 100%)'

export const mktHeroTileBorder = '1px solid rgba(255, 255, 255, 0.72)'

export const mktHeroTileBackdrop = 'blur(20px) saturate(165%)'

/** Product-shaped card on cream sections */
export const mktCard =
  'rounded-xl border border-[#d6d3d1] bg-white p-6'

/** FAQ / mock shell */
export const mktCardSolid =
  'rounded-xl border border-[#d6d3d1] bg-white p-6'

export const mktBtnPrimary =
  'inline-flex items-center justify-center rounded-full bg-[#1B1B1B] px-6 py-2.5 text-sm font-medium text-white transition-colors hover:bg-[#141414] focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#4B83C4]'

export const mktBtnPrimaryLg =
  'inline-flex items-center justify-center rounded-full bg-[#1B1B1B] px-7 py-3 text-sm font-semibold text-white transition-colors hover:bg-[#141414] focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#4B83C4]'

/** Nav sign-in style — bordered, cream fill */
export const mktBtnSignIn =
  'inline-flex items-center justify-center rounded-full border border-[#D9CFC2] bg-[#FAF5EE]/60 px-5 py-2 text-sm font-medium text-[#1C1E26] transition-colors hover:border-[#C9B49A] hover:bg-[#FDFBF7] focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#4B83C4]'

export const mktBtnSignInLg =
  'inline-flex items-center justify-center rounded-full border border-[#D9CFC2] bg-[#FAF5EE]/60 px-7 py-3 text-sm font-semibold text-[#1C1E26] transition-colors hover:border-[#C9B49A] hover:bg-[#FDFBF7] focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#4B83C4]'

export const mktBtnSecondary =
  'inline-flex items-center justify-center rounded-full bg-[#1B1B1B] px-6 py-2.5 text-sm font-medium text-white transition-colors hover:bg-[#141414] focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#4B83C4]'

export const mktBtnSecondaryLg =
  'inline-flex items-center justify-center rounded-full bg-[#1B1B1B] px-7 py-3 text-sm font-semibold text-white transition-colors hover:bg-[#141414] focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#4B83C4]'

/** White secondary CTA — hero only */
export const mktBtnSecondaryHeroLg =
  'inline-flex items-center justify-center rounded-full border border-[#d6d3d1] bg-white px-7 py-3 text-sm font-medium text-[#1C1E26] transition-colors hover:border-[#a8a29e] hover:bg-[#F4F4F2] focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#4B83C4]'

/** Transparent CTA — black text + border, fills black on hover */
export const mktBtnGhost =
  'inline-flex items-center justify-center rounded-full border border-[#1C1E26] bg-transparent px-4 py-1.5 text-sm font-medium text-[#1C1E26] transition-colors hover:border-[#1B1B1B] hover:bg-[#1B1B1B] hover:text-white focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#4B83C4]'

export const mktEyebrow =
  'text-xs font-semibold uppercase tracking-[0.18em] text-[#78716c]'

export const mktPanelMock =
  'overflow-hidden rounded-xl border border-[#d6d3d1] bg-white'
