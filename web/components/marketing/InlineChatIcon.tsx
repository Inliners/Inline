/** Inline Ask glyph — matches inlineExtension InlineChatIcon. */

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
