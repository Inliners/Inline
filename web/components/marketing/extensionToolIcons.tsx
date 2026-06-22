/**
 * Extension tool glyphs — mirrored from inlineExtension/src/components/toolIcons.tsx
 * so the marketing hero uses the same icons as the Chrome extension.
 */

import type { ReactNode } from 'react'
import { InlineChatIcon } from '@/components/marketing/InlineChatIcon'

export type ToolId =
  | 'rewrite'
  | 'ai'
  | 'notes'
  | 'settings'
  | 'highlighter'
  | 'draw'
  | 'layers'
  | 'stamps'
  | 'search'
  | 'screenshot'
  | 'laser'
  | 'share'
  | 'handwriting'

function Svg({ size = 18, children }: { size?: number; children: ReactNode }) {
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
    <svg
      width={size}
      height={size}
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.8"
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden
    >
      <circle cx="12" cy="12" r="1.5" />
      <circle cx="19" cy="12" r="1.5" />
      <circle cx="5" cy="12" r="1.5" />
    </svg>
  )
}

export function IconEyeOff({ size = 18 }: { size?: number }) {
  return (
    <Svg size={size}>
      <path d="M17.94 17.94A10.07 10.07 0 0 1 12 20c-7 0-11-8-11-8a18.45 18.45 0 0 1 5.06-5.94" />
      <path d="M9.9 4.24A9.12 9.12 0 0 1 12 4c7 0 11 8 11 8a18.5 18.5 0 0 1-2.16 3.19" />
      <path d="M14.12 14.12a3 3 0 1 1-4.24-4.24" />
      <line x1="1" y1="1" x2="23" y2="23" />
    </Svg>
  )
}

export function IconCollapse({ size = 18 }: { size?: number }) {
  return (
    <Svg size={size}>
      <polyline points="4 14 10 14 10 20" />
      <polyline points="20 10 14 10 14 4" />
      <line x1="14" y1="10" x2="21" y2="3" />
      <line x1="3" y1="21" x2="10" y2="14" />
    </Svg>
  )
}

export function IconPause({ size = 18 }: { size?: number }) {
  return (
    <Svg size={size}>
      <rect x="6" y="4" width="4" height="16" />
      <rect x="14" y="4" width="4" height="16" />
    </Svg>
  )
}

export type HeroToolIconId =
  | ToolId
  | 'notebook'
  | 'more'
  | 'eyeOff'
  | 'collapse'
  | 'pause'

const HERO_ICON_MAP: Record<HeroToolIconId, (props: { size?: number }) => ReactNode> = {
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
  notebook: IconNotebook,
  more: IconMore,
  eyeOff: IconEyeOff,
  collapse: IconCollapse,
  pause: IconPause,
}

export function renderHeroToolIcon(tool: HeroToolIconId, size = 32) {
  const Icon = HERO_ICON_MAP[tool]
  return <Icon size={size} />
}
