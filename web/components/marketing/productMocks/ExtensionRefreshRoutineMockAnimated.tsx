'use client'

import { useEffect, useState } from 'react'
import { motion, useReducedMotion } from 'framer-motion'
import { Check, Clock, RefreshCw, User, type LucideIcon } from 'lucide-react'
import { cn } from '@/lib/utils'

const EASE: [number, number, number, number] = [0.25, 0.46, 0.45, 0.94]
const ROW_MS = 2800

const ROWS: { icon: LucideIcon; label: string; spinWhenActive?: boolean }[] = [
  { icon: Check, label: 'Review 4 changes' },
  { icon: RefreshCw, label: 'Re-sync highlights from page', spinWhenActive: true },
  { icon: Clock, label: 'Change refresh schedule' },
]

type ExtensionRefreshRoutineMockAnimatedProps = {
  className?: string
}

export default function ExtensionRefreshRoutineMockAnimated({
  className,
}: ExtensionRefreshRoutineMockAnimatedProps) {
  const reduceMotion = useReducedMotion()
  const [activeRow, setActiveRow] = useState(0)

  useEffect(() => {
    if (reduceMotion) return
    const id = window.setInterval(() => setActiveRow(r => (r + 1) % ROWS.length), ROW_MS)
    return () => window.clearInterval(id)
  }, [reduceMotion])

  return (
    <div
      className={cn(
        'w-full max-w-[342px] overflow-hidden rounded-[14px] border border-border bg-card',
        className,
      )}
      aria-live="polite"
    >
      <motion.div
        className="border-b border-border/60 px-4 py-3"
        initial={reduceMotion ? false : { opacity: 0, y: -4 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.4, ease: EASE }}
      >
        <p className="text-xs text-muted-foreground">
          Inline found{' '}
          <motion.span
            key={activeRow}
            className="font-medium text-foreground"
            initial={reduceMotion ? false : { opacity: 0.4 }}
            animate={{ opacity: 1 }}
            transition={{ duration: 0.3 }}
          >
            4
          </motion.span>{' '}
          suggested updates ready for review.
        </p>
      </motion.div>

      <div className="space-y-1 p-3">
        <p className="px-2 py-1.5 text-[9px] font-semibold uppercase tracking-wider text-muted-foreground">
          Page recap
        </p>

        {ROWS.map((row, i) => {
          const Icon = row.icon
          const active = activeRow === i
          return (
            <motion.div
              key={row.label}
              className={cn(
                'flex items-center gap-2 rounded-lg px-3 py-2',
                active ? 'bg-muted text-foreground' : 'text-muted-foreground',
              )}
              initial={reduceMotion ? false : { opacity: 0, x: -8 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ duration: 0.35, delay: reduceMotion ? 0 : i * 0.08, ease: EASE }}
            >
              <motion.span
                key={active && row.spinWhenActive ? `spin-${activeRow}` : `icon-${i}`}
                animate={
                  reduceMotion || !active || !row.spinWhenActive
                    ? { rotate: 0 }
                    : { rotate: 360 }
                }
                transition={
                  reduceMotion || !row.spinWhenActive
                    ? undefined
                    : { duration: 0.65, ease: 'easeInOut' }
                }
                className="inline-flex"
              >
                <Icon className="h-3.5 w-3.5" aria-hidden />
              </motion.span>
              <span className={cn('text-xs', active && 'font-medium')}>{row.label}</span>
            </motion.div>
          )
        })}

        <motion.p
          className="mt-2 px-2 py-1.5 text-[9px] font-semibold uppercase tracking-wider text-muted-foreground"
          initial={reduceMotion ? false : { opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ duration: 0.4, delay: reduceMotion ? 0 : 0.28, ease: EASE }}
        >
          Recap info
        </motion.p>
        <motion.div
          className="flex items-center gap-2 px-3 py-1"
          initial={reduceMotion ? false : { opacity: 0, y: 6 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.4, delay: reduceMotion ? 0 : 0.34, ease: EASE }}
        >
          <div className="flex h-6 w-6 items-center justify-center rounded-full bg-muted">
            <User className="h-3 w-3 text-muted-foreground" aria-hidden />
          </div>
          <span className="text-xs text-foreground">You</span>
        </motion.div>
      </div>
    </div>
  )
}
