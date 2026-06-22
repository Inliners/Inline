import type { CSSProperties, ReactNode } from 'react'
import { InlineChatIcon, NavyHeaderBadge } from './InlineChatIcon'
import { PANEL as C, PANEL_HEADER_ICON, TOOL_TILE } from '../lib/extensionTheme'

export type ToolId =
  | 'rewrite' | 'ai' | 'notes' | 'settings' | 'highlighter' | 'draw'
  | 'layers' | 'stamps' | 'search' | 'screenshot' | 'laser' | 'share' | 'handwriting'

function Svg({
  size = 18,
  children,
}: {
  size?: number
  children: ReactNode
}) {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.7"
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden
    >
      {children}
    </svg>
  )
}

export function IconRewrite({ size = 18 }: { size?: number }) {
  return (
    <Svg size={size}>
      <path d="M17 3a2.828 2.828 0 1 1 4 4L7.5 20.5 2 22l1.5-5.5L17 3z" />
    </Svg>
  )
}

export function IconAi({ size = 18 }: { size?: number }) {
  return <InlineChatIcon size={size} strokeWidth={1.75} />
}

export function IconNotes({ size = 18 }: { size?: number }) {
  return (
    <Svg size={size}>
      <path d="M14.5 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V7.5L14.5 2z" />
      <polyline points="14 2 14 8 20 8" />
      <line x1="16" y1="13" x2="8" y2="13" />
      <line x1="16" y1="17" x2="8" y2="17" />
      <line x1="10" y1="9" x2="8" y2="9" />
    </Svg>
  )
}

export function IconDraw({ size = 18 }: { size?: number }) {
  return (
    <Svg size={size}>
      <path d="M12 19l7-7 3 3-7 7-3-3z" />
      <path d="M18 13l-1.5-7.5L2 2l3.5 14.5L13 18l5-5z" />
      <path d="M2 2l7.586 7.586" />
      <circle cx="11" cy="11" r="2" />
    </Svg>
  )
}

export function IconHighlight({ size = 18 }: { size?: number }) {
  return (
    <Svg size={size}>
      <path d="M9 11l-6 6v3h9l3-3" />
      <path d="M22 12l-4.6 4.6a2 2 0 0 1-2.8 0l-5.2-5.2a2 2 0 0 1 0-2.8L14 4" />
    </Svg>
  )
}

export function IconSettings({ size = 18 }: { size?: number }) {
  return (
    <Svg size={size}>
      <circle cx="12" cy="12" r="3" />
      <path d="M12 1v2M12 21v2M4.22 4.22l1.42 1.42M18.36 18.36l1.42 1.42M1 12h2M21 12h2M4.22 19.78l1.42-1.42M18.36 5.64l1.42-1.42" />
    </Svg>
  )
}

export function IconLayers({ size = 18 }: { size?: number }) {
  return (
    <Svg size={size}>
      <polygon points="12 2 2 7 12 12 22 7 12 2" />
      <polyline points="2 17 12 22 22 17" />
      <polyline points="2 12 12 17 22 12" />
    </Svg>
  )
}

export function IconStamp({ size = 18 }: { size?: number }) {
  return (
    <Svg size={size}>
      <path d="M5 21h14" />
      <path d="M8 21v-6l4-9 4 9v6" />
      <path d="M9.5 12h5" />
    </Svg>
  )
}

export function IconSearch({ size = 18 }: { size?: number }) {
  return (
    <Svg size={size}>
      <circle cx="11" cy="11" r="8" />
      <line x1="21" y1="21" x2="16.65" y2="16.65" />
    </Svg>
  )
}

export function IconScreenshot({ size = 18 }: { size?: number }) {
  return (
    <Svg size={size}>
      <path d="M23 19a2 2 0 0 1-2 2H3a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h4l2-3h6l2 3h4a2 2 0 0 1 2 2z" />
      <circle cx="12" cy="13" r="4" />
    </Svg>
  )
}

export function IconLaser({ size = 18 }: { size?: number }) {
  return (
    <Svg size={size}>
      <circle cx="12" cy="12" r="2" fill="currentColor" stroke="none" />
      <path d="M12 2v4M12 18v4M2 12h4M18 12h4M4.93 4.93l2.83 2.83M16.24 16.24l2.83 2.83M4.93 19.07l2.83-2.83M16.24 7.76l2.83-2.83" />
    </Svg>
  )
}

export function IconShare({ size = 18 }: { size?: number }) {
  return (
    <Svg size={size}>
      <circle cx="18" cy="5" r="3" />
      <circle cx="6" cy="12" r="3" />
      <circle cx="18" cy="19" r="3" />
      <line x1="8.59" y1="13.51" x2="15.42" y2="17.49" />
      <line x1="15.41" y1="6.51" x2="8.59" y2="10.49" />
    </Svg>
  )
}

export function IconHandwriting({ size = 18 }: { size?: number }) {
  return (
    <Svg size={size}>
      <path d="M17 3a2.828 2.828 0 1 1 4 4L7.5 20.5 2 22l1.5-5.5L17 3z" />
      <path d="M2 22c2-2 4-3.5 6-3.5s3 1 5 1 4-1.5 6-3.5" />
    </Svg>
  )
}

export function IconNotebook({ size = 18 }: { size?: number }) {
  return (
    <Svg size={size}>
      <path d="M4 19.5A2.5 2.5 0 0 1 6.5 17H20" />
      <path d="M6.5 2H20v20H6.5A2.5 2.5 0 0 1 4 19.5v-15A2.5 2.5 0 0 1 6.5 2z" />
    </Svg>
  )
}

export function IconMore({ size = 18 }: { size?: number }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" aria-hidden>
      <circle cx="12" cy="12" r="1.5" />
      <circle cx="19" cy="12" r="1.5" />
      <circle cx="5" cy="12" r="1.5" />
    </svg>
  )
}

export function IconEyeOff({ size = 17 }: { size?: number }) {
  return (
    <Svg size={size}>
      <path d="M17.94 17.94A10.07 10.07 0 0 1 12 20c-7 0-11-8-11-8a18.45 18.45 0 0 1 5.06-5.94" />
      <path d="M9.9 4.24A9.12 9.12 0 0 1 12 4c7 0 11 8 11 8a18.5 18.5 0 0 1-2.16 3.19" />
      <path d="M14.12 14.12a3 3 0 1 1-4.24-4.24" />
      <line x1="1" y1="1" x2="23" y2="23" />
    </Svg>
  )
}

const TOOL_ICON_MAP: Record<ToolId, (props: { size?: number }) => ReactNode> = {
  rewrite: IconRewrite,
  ai: IconAi,
  notes: IconNotes,
  settings: IconSettings,
  highlighter: IconHighlight,
  draw: IconDraw,
  layers: IconLayers,
  stamps: IconStamp,
  search: IconSearch,
  screenshot: IconScreenshot,
  laser: IconLaser,
  share: IconShare,
  handwriting: IconHandwriting,
}

export function renderToolIcon(tool: ToolId, size = 18) {
  const Icon = TOOL_ICON_MAP[tool]
  return <Icon size={size} />
}

/** Light icon tile for dock flyout menus (Annotate, More tools) and mode pill. */
export function DockMenuIcon({
  children,
  size = 28,
  active,
}: {
  children: ReactNode
  size?: number
  active?: boolean
}) {
  return (
    <span
      style={{
        display: 'inline-flex',
        alignItems: 'center',
        justifyContent: 'center',
        width: size,
        height: size,
        borderRadius: C.radiusSm,
        background: active ? C.toneSelectedBg : C.surfaceMuted,
        border: `1px solid ${active ? C.borderStrong : C.border}`,
        color: active ? C.text : C.textMuted,
        flexShrink: 0,
      }}
    >
      {children}
    </span>
  )
}

/** Navy icon tile — tool panel headers and command palette only. */
export function ToolIconTile({
  children,
  size = 24,
  active,
  style,
}: {
  children: ReactNode
  size?: number
  active?: boolean
  style?: CSSProperties
}) {
  return (
    <span
      style={{
        display: 'inline-flex',
        alignItems: 'center',
        justifyContent: 'center',
        width: size,
        height: size,
        borderRadius: TOOL_TILE.radius,
        background: TOOL_TILE.bg,
        border: `1px solid ${active ? TOOL_TILE.borderActive : TOOL_TILE.border}`,
        color: TOOL_TILE.fg,
        flexShrink: 0,
        boxShadow: active ? TOOL_TILE.activeRing : 'none',
        ...style,
      }}
    >
      {children}
    </span>
  )
}

/** Header mark for tool panel popups — same navy circle as Ask. */
export function ToolHeaderIcon({
  tool,
  size = PANEL_HEADER_ICON.badgeSize,
}: {
  tool: ToolId
  size?: number
}) {
  const glyph = Math.round(size * (PANEL_HEADER_ICON.glyphSize / PANEL_HEADER_ICON.badgeSize))
  return (
    <NavyHeaderBadge size={size}>
      {tool === 'ai'
        ? <InlineChatIcon size={glyph} strokeWidth={2} color="#fff" />
        : renderToolIcon(tool, glyph)}
    </NavyHeaderBadge>
  )
}
