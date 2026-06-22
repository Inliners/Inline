/** Canonical Inline chat glyph (lucide MessageCircle) for extension surfaces. */

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
  size = 20,
  iconSize = 12,
  background = '#12203f',
}: {
  size?: number
  iconSize?: number
  background?: string
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
      <InlineChatIcon size={iconSize} strokeWidth={2} color="#fff" />
    </span>
  )
}
