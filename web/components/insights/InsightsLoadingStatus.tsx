'use client'

import { useEffect, useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { INSIGHTS_LOADING_PHRASES } from '@/lib/chat-format'
import { CHAT_EASE } from '@/components/chat/chat-motion'
import { cn } from '@/lib/utils'

const ROTATE_MS = 2400

interface Props {
  className?: string
}

export default function InsightsLoadingStatus({ className }: Props) {
  const [index, setIndex] = useState(0)

  useEffect(() => {
    const id = window.setInterval(() => {
      setIndex(i => (i + 1) % INSIGHTS_LOADING_PHRASES.length)
    }, ROTATE_MS)
    return () => window.clearInterval(id)
  }, [])

  return (
    <p
      className={cn('text-sm italic text-muted-foreground', className)}
      role="status"
      aria-live="polite"
      aria-busy="true"
    >
      <AnimatePresence mode="wait" initial={false}>
        <motion.span
          key={index}
          initial={{ opacity: 0, y: 6 }}
          animate={{ opacity: 1, y: 0, transition: { duration: 0.4, ease: CHAT_EASE } }}
          exit={{ opacity: 0, y: -6, transition: { duration: 0.28, ease: CHAT_EASE } }}
          className="inline-block"
        >
          {INSIGHTS_LOADING_PHRASES[index]}
        </motion.span>
      </AnimatePresence>
    </p>
  )
}
