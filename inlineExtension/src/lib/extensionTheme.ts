/**
 * Extension UI tokens aligned with the web dashboard chat panel
 * (globals.css + WorkspaceChatPanel.tsx).
 *
 * BRAND / BRAND_GRADIENT are unchanged for the launcher dock tile.
 */
import { FONT } from './extensionFonts'

export { FONT }

/** Deep navy brand — launcher tile only (dock not restyled in this pass). */
export const BRAND = '#0B1735' as const
export const BRAND_GRADIENT = 'linear-gradient(145deg, #24386D 0%, #0B1735 58%, #071021 100%)' as const

/** Chat-specific accents from the web AI panel. */
export const CHAT = {
  send: '#2f80ed',
  badge: '#12203f',
  ring: '#4B83C4',
  inputBorder: 'rgba(28, 30, 38, 0.25)',
  inputGlow: '0 0 0 3px rgba(75, 131, 196, 0.10)',
  destructive: '#EB5757',
} as const

/** Navy tile behind tool icons — matches the web chat badge. */
export const TOOL_TILE = {
  bg: '#12203f',
  fg: '#FFFFFF',
  border: 'rgba(18, 32, 63, 0.22)',
  borderActive: 'rgba(75, 131, 196, 0.45)',
  activeRing: '0 0 0 2px rgba(75, 131, 196, 0.18)',
  /** Fully round navy icon buttons in panel popups. */
  radius: '50%',
} as const

/** Canonical popup header badge — matches Ask panel chrome. */
export const PANEL_HEADER_ICON = {
  badgeSize: 24,
  glyphSize: 13,
} as const

export const PANEL = {
  bg: '#FFFFFF',
  headerBg: '#FFFFFF',
  surfaceMuted: '#F4F4F2',
  surfaceBubble: '#FFFFFF',
  surfaceSunken: '#F4F4F2',
  border: '#d6d3d1',
  borderStrong: '#a8a29e',
  divider: 'rgba(28, 30, 38, 0.07)',
  shadow: '0 1px 2px rgba(28, 30, 38, 0.06)',
  shadowOuter: '0 22px 70px -42px rgba(28, 30, 38, 0.38)',
  shadowSoft: 'none',
  shadowCard: 'none',
  text: '#1C1E26',
  textMuted: '#78716c',
  textLight: '#78716c',
  accent: '#1C1E26',
  accentHover: '#13151B',
  link: '#4B83C4',
  hoverBg: 'rgba(28, 30, 38, 0.045)',
  toneSelectedBg: '#F4F4F2',
  radius: 14,
  radiusLg: 14,
  radiusMd: 10,
  radiusSm: 8,
  radiusPill: 9999,
  toggleOn: '#2f80ed',
  toggleOff: '#d6d3d1',
  inputBg: '#FFFFFF',
} as const

export const SIDEBAR = {
  bg: '#F7F7F5',
  bgSubtle: '#F4F4F2',
  border: '#d6d3d1',
  hover: 'rgba(28, 30, 38, 0.045)',
  active: 'rgba(28, 30, 38, 0.08)',
  text: '#1C1E26',
  textMuted: '#78716c',
  textLight: '#78716c',
} as const

export const TOOLBAR = {
  bg: '#FFFFFF',
  border: '#d6d3d1',
  divider: 'rgba(28, 30, 38, 0.09)',
  shadow: '0 14px 40px -8px rgba(28, 30, 38, 0.34), 0 6px 18px -4px rgba(28, 30, 38, 0.2)',
  text: '#78716c',
  textStrong: '#1C1E26',
  textMuted: '#78716c',
  hover: 'rgba(28, 30, 38, 0.045)',
  active: 'rgba(28, 30, 38, 0.08)',
  radius: 10,
  radiusInner: 8,
} as const

export const SWATCHES = [
  { name: 'Default', value: '#1C1E26' },
  { name: 'Gray', value: '#78716c' },
  { name: 'Red', value: '#F2555A' },
  { name: 'Pink', value: '#EC4899' },
  { name: 'Orange', value: '#F59E0B' },
  { name: 'Yellow', value: '#FACC15' },
  { name: 'Green', value: '#22C55E' },
  { name: 'Cyan', value: '#22D3EE' },
  { name: 'Blue', value: '#4B83C4' },
  { name: 'Purple', value: '#A855F7' },
] as const

export const HIGHLIGHT_SWATCHES = [
  { name: 'Yellow', value: 'rgba(250, 204, 21, 0.45)' },
  { name: 'Green', value: 'rgba(34, 197, 94, 0.38)' },
  { name: 'Blue', value: 'rgba(75, 131, 196, 0.28)' },
  { name: 'Pink', value: 'rgba(236, 72, 153, 0.32)' },
  { name: 'Orange', value: 'rgba(245, 158, 11, 0.40)' },
  { name: 'Purple', value: 'rgba(168, 85, 247, 0.32)' },
] as const

export const DARK_PANEL = {
  bg: '#15285C',
  headerBg: '#15285C',
  surfaceMuted: '#1e3268',
  surfaceBubble: '#15285C',
  border: 'rgba(255, 255, 255, 0.08)',
  divider: 'rgba(255, 255, 255, 0.06)',
  shadow: '0 1px 2px rgba(0, 0, 0, 0.24)',
  shadowSoft: 'none',
  text: '#E7EEF9',
  textMuted: '#8AACDB',
  textLight: '#8AACDB',
  accent: '#B5CDEF',
  accentHover: '#FFFFFF',
  link: '#8AACDB',
  hoverBg: 'rgba(255, 255, 255, 0.06)',
  toneSelectedBg: '#1e3268',
  radius: 14,
  radiusMd: 10,
  radiusSm: 8,
  radiusPill: 9999,
  toggleOn: '#2f80ed',
  toggleOff: '#3a3d48',
  inputBg: '#1e3268',
} as const

export type PanelTheme = typeof PANEL

/** Stacking order — floating overlays must sit above the dock rail (2147483647). */
export const Z = {
  dockPanel: 2147483646,
  dockRail: 2147483647,
  floatingOverlay: 2147483648,
} as const

/** Right inset so top-floating cards clear the launcher + dock rail. */
export const DOCK_CLEARANCE = 80 as const
