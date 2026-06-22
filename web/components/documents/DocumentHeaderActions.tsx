'use client'

import { useRef, type ReactNode } from 'react'
import { MoreHorizontal, Share2 } from 'lucide-react'
import { motion, AnimatePresence } from 'framer-motion'
import { cn } from '@/lib/utils'

interface DocumentHeaderActionsProps {
  saved?: boolean
  savedLabel?: string
  copied?: boolean
  onShare: () => void
  menuOpen: boolean
  onMenuToggle: () => void
  onMenuClose: () => void
  menuItems: {
    icon: React.ElementType
    label: string
    action: () => void
    danger?: boolean
  }[]
  extra?: ReactNode
}

export default function DocumentHeaderActions({
  saved,
  savedLabel = 'Saved',
  copied,
  onShare,
  menuOpen,
  onMenuToggle,
  onMenuClose,
  menuItems,
  extra,
}: DocumentHeaderActionsProps) {
  const menuRef = useRef<HTMLDivElement>(null)

  return (
    <div className="flex shrink-0 items-center gap-1.5" ref={menuRef}>
      {extra}
      <span
        className={cn(
          'text-[11px] text-muted-foreground transition-opacity duration-300 mr-0.5',
          saved ? 'opacity-100' : 'opacity-0',
        )}
        aria-live="polite"
      >
        {savedLabel}
      </span>
      <button
        type="button"
        onClick={onShare}
        className="inline-flex h-8 items-center gap-1.5 rounded-lg border border-border px-3 text-xs font-medium text-muted-foreground transition-colors hover:border-border hover:bg-muted/50 hover:text-foreground cursor-pointer"
      >
        <Share2 className="h-3.5 w-3.5" aria-hidden />
        {copied ? 'Copied' : 'Share'}
      </button>
      <div className="relative">
        <button
          type="button"
          onClick={onMenuToggle}
          aria-label="Document options"
          aria-expanded={menuOpen}
          className={cn(
            'flex h-8 w-8 items-center justify-center rounded-lg border transition-colors cursor-pointer',
            menuOpen
              ? 'border-border bg-muted text-foreground'
              : 'border-border text-muted-foreground hover:bg-muted/50 hover:text-foreground',
          )}
        >
          <MoreHorizontal className="h-4 w-4" />
        </button>
        <AnimatePresence>
          {menuOpen && (
            <motion.div
              initial={{ opacity: 0, scale: 0.96, y: -4 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.96, y: -4 }}
              transition={{ duration: 0.1 }}
              className="absolute top-full right-0 z-50 mt-1.5 w-48 rounded-xl border border-border bg-card py-1 shadow-md"
            >
              {menuItems.map(item => (
                <button
                  key={item.label}
                  type="button"
                  onClick={() => { item.action(); onMenuClose() }}
                  className={cn(
                    'flex w-full cursor-pointer items-center gap-2.5 px-3 py-2 text-left text-sm transition-colors',
                    item.danger
                      ? 'text-red-600 hover:bg-red-50 dark:hover:bg-red-950/30'
                      : 'text-foreground hover:bg-muted/60',
                  )}
                >
                  <item.icon className="h-3.5 w-3.5 shrink-0" />
                  {item.label}
                </button>
              ))}
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </div>
  )
}
