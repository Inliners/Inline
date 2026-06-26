'use client'

import { motion, useReducedMotion } from 'framer-motion'
import { MARKETING_EASE } from '@/components/marketing/primitives/Reveal'
import { cn } from '@/lib/utils'

const THOUGHT_LINES = [
  'Reading page context…',
  'Pulling highlights from this page…',
  'Grounding the answer in your captures…',
] as const

type AskThoughtTraceProps = {
  className?: string
}

export default function AskThoughtTrace({ className }: AskThoughtTraceProps) {
  const reduce = useReducedMotion()

  if (reduce) {
    return (
      <div className={cn('space-y-2', className)} aria-hidden>
        {THOUGHT_LINES.map(line => (
          <p key={line} className="text-sm leading-relaxed text-muted-foreground/80">
            {line}
          </p>
        ))}
      </div>
    )
  }

  return (
    <div className={cn('space-y-2', className)} aria-hidden>
      {THOUGHT_LINES.map((line, i) => (
        <motion.p
          key={line}
          initial={{ opacity: 0 }}
          whileInView={{ opacity: 1 }}
          viewport={{ once: true, margin: '-40px' }}
          transition={{ duration: 0.7, delay: 0.35 + i * 0.45, ease: MARKETING_EASE }}
          className="text-sm leading-relaxed text-muted-foreground/80"
        >
          {line}
        </motion.p>
      ))}
    </div>
  )
}
