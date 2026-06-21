/**
 * Panel UI tokens — modelled directly on Attio's product surfaces:
 * crisp white cards, hairline borders, restrained elevation, a warm
 * cream sidebar, and the segmented "New toolbar" formatting bar.
 *
 * Token names are kept stable so every existing panel keeps rendering;
 * the values are tuned to the Attio reference shots (white pages, cream
 * sidebars only, soft 1px borders, gentle shadows).
 */
export const FONT =
  '-apple-system, BlinkMacSystemFont, "Inter", "SF Pro Text", system-ui, sans-serif' as const

/** Deep navy brand colour — the launcher tile and every panel brand mark. */
export const BRAND = '#0B1735' as const
export const BRAND_GRADIENT = 'linear-gradient(145deg, #24386D 0%, #0B1735 58%, #071021 100%)' as const

export const PANEL = {
  /* Warm, solid product surfaces — off-white panel, crisp white inner cards. */
  bg: '#FFFFFF',
  headerBg: '#FFFFFF',
  surfaceMuted: '#F6F7F9',
  surfaceBubble: '#FFFFFF',
  surfaceSunken: '#F1F2F4',
  border: 'rgba(15, 18, 23, 0.10)',
  borderStrong: 'rgba(15, 18, 23, 0.17)',
  divider: 'rgba(15, 18, 23, 0.07)',
  /* Layered, soft elevation — not heavy blur. */
  shadow: '0 1px 2px rgba(17, 24, 39, 0.08)',
  shadowOuter: '0 18px 48px -28px rgba(15, 18, 23, 0.42), 0 8px 22px -18px rgba(15, 18, 23, 0.28)',
  shadowSoft: 'none',
  shadowCard: 'none',
  text: '#111318',
  textMuted: '#5D6470',
  textLight: '#8C929D',
  accent: '#0B1735',
  accentHover: '#13244D',
  link: '#315A9F',
  hoverBg: 'rgba(15, 18, 23, 0.045)',
  toneSelectedBg: '#F0F3F8',
  radius: 18,
  radiusLg: 18,
  radiusMd: 12,
  radiusSm: 9,
  radiusPill: 9999,
  toggleOn: '#0B1735',
  toggleOff: '#D8DCE3',
  inputBg: '#F5F6F8',
} as const

/**
 * Cream/beige sidebar palette — Attio applies the warm tint *only* to the
 * sidebar/rail; main surfaces stay white. Used by panels that render a
 * navigation sidebar (e.g. Notebooks).
 */
export const SIDEBAR = {
  bg: '#F6F7F9',
  bgSubtle: '#EEF1F5',
  border: 'rgba(17, 24, 39, 0.09)',
  hover: 'rgba(17, 24, 39, 0.05)',
  active: 'rgba(11, 23, 53, 0.08)',
  text: '#111318',
  textMuted: '#5D6470',
  textLight: '#8C929D',
} as const

/**
 * The Attio "New toolbar" — a floating, segmented formatting bar.
 * `swatches` mirror the colour row in the reference (light variant).
 */
export const TOOLBAR = {
  bg: '#FFFFFF',
  border: 'rgba(15, 18, 23, 0.10)',
  divider: 'rgba(15, 18, 23, 0.09)',
  shadow: '0 1px 2px rgba(15, 18, 23, 0.10)',
  text: '#3A3D44',
  textStrong: '#1C1E26',
  textMuted: '#8A8F98',
  hover: 'rgba(15, 18, 23, 0.05)',
  active: 'rgba(15, 18, 23, 0.08)',
  radius: 13,
  radiusInner: 8,
} as const

/** Colour swatches matching the Attio New-toolbar palette (light). */
export const SWATCHES = [
  { name: 'Default', value: '#2A2A2E' },
  { name: 'Gray', value: '#8A8F98' },
  { name: 'Red', value: '#F2555A' },
  { name: 'Pink', value: '#EC4899' },
  { name: 'Orange', value: '#F59E0B' },
  { name: 'Yellow', value: '#FACC15' },
  { name: 'Green', value: '#22C55E' },
  { name: 'Cyan', value: '#22D3EE' },
  { name: 'Blue', value: '#315A9F' },
  { name: 'Purple', value: '#A855F7' },
] as const

/** Soft highlight fills keyed to the swatch colours (used when highlighting). */
export const HIGHLIGHT_SWATCHES = [
  { name: 'Yellow', value: 'rgba(250, 204, 21, 0.45)' },
  { name: 'Green', value: 'rgba(34, 197, 94, 0.38)' },
  { name: 'Blue', value: 'rgba(49, 90, 159, 0.28)' },
  { name: 'Pink', value: 'rgba(236, 72, 153, 0.32)' },
  { name: 'Orange', value: 'rgba(245, 158, 11, 0.40)' },
  { name: 'Purple', value: 'rgba(168, 85, 247, 0.32)' },
] as const

export const DARK_PANEL = {
  bg: '#1C1E26',
  headerBg: '#252830',
  surfaceMuted: '#2a2d38',
  surfaceBubble: '#22252e',
  border: 'rgba(255, 255, 255, 0.08)',
  divider: 'rgba(255, 255, 255, 0.06)',
  shadow: '0 1px 2px rgba(0, 0, 0, 0.24)',
  shadowSoft: 'none',
  text: '#E4E4E8',
  textMuted: '#9a9ba4',
  textLight: '#6b6d78',
  accent: '#E4E4E8',
  accentHover: '#FFFFFF',
  link: '#A9B7D0',
  hoverBg: 'rgba(255, 255, 255, 0.06)',
  toneSelectedBg: '#31343e',
  radius: 14,
  radiusMd: 10,
  radiusSm: 8,
  radiusPill: 9999,
  toggleOn: '#A9B7D0',
  toggleOff: '#3a3d48',
  inputBg: '#22252e',
} as const

export type PanelTheme = typeof PANEL
