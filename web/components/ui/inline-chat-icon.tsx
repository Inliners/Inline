import { MessageCircle } from 'lucide-react'
import { cn } from '@/lib/utils'

type InlineChatIconProps = {
  className?: string
  iconClassName?: string
  size?: 'sm' | 'md' | 'lg'
  variant?: 'plain' | 'badge'
}

const SIZES = {
  sm: { wrap: 'h-5 w-5', icon: 'h-3 w-3' },
  md: { wrap: 'h-6 w-6', icon: 'h-3.5 w-3.5' },
  lg: { wrap: 'h-8 w-8', icon: 'h-4 w-4' },
} as const

/** Canonical Inline chat glyph — MessageCircle everywhere chat appears. */
export function InlineChatIcon({
  className,
  iconClassName,
  size = 'sm',
  variant = 'plain',
}: InlineChatIconProps) {
  const s = SIZES[size]
  const icon = <MessageCircle className={cn(s.icon, 'shrink-0', iconClassName)} />

  if (variant === 'badge') {
    return (
      <span
        className={cn(
          'inline-flex items-center justify-center rounded-full bg-[#12203f] text-white shadow-none',
          s.wrap,
          className,
        )}
      >
        {icon}
      </span>
    )
  }

  return <span className={cn('inline-flex shrink-0', className)}>{icon}</span>
}
