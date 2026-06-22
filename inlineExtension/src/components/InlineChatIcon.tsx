/** Canonical Inline chat glyph (lucide MessageCircle) for extension surfaces. */

import type { ReactNode } from 'react'
import { CHAT, PANEL_HEADER_ICON } from '../lib/extensionTheme'

export function NavyHeaderBadge({
  size = PANEL_HEADER_ICON.badgeSize,
  background = CHAT.badge,
  children,
}: {
  size?: number
  background?: string
  children: ReactNode
}) {
  return (
    <span
      style={{
        display: 'inline-flex',
        alignItems: 'center',
        justifyContent: 'center',
        width: size,
        height: size,
        borderRadius: '50%',
        background,
        color: '#fff',
        flexShrink: 0,
      }}
    >
      {children}
    </span>
  )
}

export function InlineChatIcon({
  size = 18,
  strokeWidth = 1.75,
  color = 'currentColor',
}: {
  size?: number
  strokeWidth?: number
  color?: string
}) {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 24 24"
      fill="none"
      stroke={color}
      strokeWidth={strokeWidth}
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden
    >
      <path d="M7.9 20A9 9 0 1 0 4 16.1L2 22Z" />
    </svg>
  )
}

export function InlineChatBadge({
  size = PANEL_HEADER_ICON.badgeSize,
  iconSize = PANEL_HEADER_ICON.glyphSize,
  background = CHAT.badge,
}: {
  size?: number
  iconSize?: number
  background?: string
}) {
  return (
    <NavyHeaderBadge size={size} background={background}>
      <InlineChatIcon size={iconSize} strokeWidth={2} color="#fff" />
    </NavyHeaderBadge>
  )
}
