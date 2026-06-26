'use client'

import { useEffect, useState } from 'react'
import { AnimatePresence, motion, useReducedMotion } from 'framer-motion'
import { Check, StickyNote } from 'lucide-react'
import { DEMO_DOMAIN, DEMO_PAGE_TITLE } from '@/components/marketing/productMocks/sampleData'
import { cn } from '@/lib/utils'

const EASE: [number, number, number, number] = [0.25, 0.46, 0.45, 0.94]
const STEP_MS = 4500
const TRANSITION_S = 0.45

const STEPS = [
  {
    id: 'stale',
    recapText: 'Summary of the opening section and how the author frames the topic.',
    footer: 'Last updated 4 days ago',
    pageText: 'The introduction sets up the main argument and defines a few key terms.',
    showCapture: false,
  },
  {
    id: 'fresh',
    recapText:
      'The recap now reflects your highlights on the core claim and a supporting example from later in the article.',
    footer: 'Last updated today',
    pageLead: 'The author argues the central point in the second section.',
    pageHighlight: 'Your highlight calls out the example that backs it up.',
    note: 'Worth comparing with the related article you saved last week.',
    showCapture: true,
  },
] as const

type RecapStatusCardAnimatedProps = {
  className?: string
}

export default function RecapStatusCardAnimated({ className }: RecapStatusCardAnimatedProps) {
  const reduceMotion = useReducedMotion()
  const [step, setStep] = useState(0)
  const current = STEPS[step]!
  const transition = { duration: reduceMotion ? 0 : TRANSITION_S, ease: EASE }

  useEffect(() => {
    if (reduceMotion) return
    const id = window.setInterval(() => setStep(s => (s + 1) % STEPS.length), STEP_MS)
    return () => window.clearInterval(id)
  }, [reduceMotion])

  return (
    <div
      className={cn('w-full max-w-[342px] rounded-[10px] border border-border bg-card p-4', className)}
      aria-live="polite"
    >
      <motion.span
        className="inline-flex items-center gap-1.5 rounded-full bg-muted px-2.5 py-1 text-[10px] font-medium text-foreground"
        animate={reduceMotion ? undefined : { scale: [1, 1.04, 1] }}
        transition={{ duration: 0.55, repeat: Infinity, repeatDelay: STEP_MS / 1000 - 0.55, ease: EASE }}
      >
        <Check className="h-3 w-3 text-[#22C55E]" aria-hidden />
        Self-updating recap
      </motion.span>

      <div className="relative mt-3 min-h-[4.75rem] overflow-hidden">
        <AnimatePresence mode="wait" initial={false}>
          <motion.p
            key={current.id}
            className="text-sm leading-relaxed text-foreground"
            initial={reduceMotion ? false : { opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            exit={reduceMotion ? undefined : { opacity: 0, y: -6 }}
            transition={transition}
          >
            {current.recapText}
          </motion.p>
        </AnimatePresence>
      </div>

      <AnimatePresence mode="wait" initial={false}>
        <motion.p
          key={current.footer}
          className="mt-2 text-xs text-muted-foreground"
          initial={reduceMotion ? false : { opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={reduceMotion ? undefined : { opacity: 0 }}
          transition={transition}
        >
          {current.footer}
        </motion.p>
      </AnimatePresence>

      <div className="my-4 border-t border-border/60" aria-hidden />

      <div className="flex items-center gap-2">
        <div className="flex gap-1" aria-hidden>
          <span className="h-1.5 w-1.5 rounded-full bg-[#E8DFD4]" />
          <span className="h-1.5 w-1.5 rounded-full bg-[#E8DFD4]" />
          <span className="h-1.5 w-1.5 rounded-full bg-[#E8DFD4]" />
        </div>
        <p className="truncate text-[10px] text-muted-foreground">{DEMO_DOMAIN} · {DEMO_PAGE_TITLE}</p>
      </div>

      <div className="relative mt-3 min-h-[3.25rem] overflow-hidden">
        <AnimatePresence mode="wait" initial={false}>
          {current.showCapture ? (
            <motion.p
              key="fresh-page"
              className="text-sm leading-relaxed text-foreground"
              initial={reduceMotion ? false : { opacity: 0, y: 8 }}
              animate={{ opacity: 1, y: 0 }}
              exit={reduceMotion ? undefined : { opacity: 0, y: -6 }}
              transition={transition}
            >
              {current.pageLead}{' '}
              <motion.span
                className="rounded-sm px-0.5"
                initial={reduceMotion ? false : { backgroundColor: 'rgba(250, 204, 21, 0)' }}
                animate={{ backgroundColor: 'rgba(250, 204, 21, 0.45)' }}
                transition={transition}
              >
                {current.pageHighlight}
              </motion.span>
            </motion.p>
          ) : (
            <motion.p
              key="stale-page"
              className="text-sm leading-relaxed text-foreground"
              initial={reduceMotion ? false : { opacity: 0, y: 8 }}
              animate={{ opacity: 1, y: 0 }}
              exit={reduceMotion ? undefined : { opacity: 0, y: -6 }}
              transition={transition}
            >
              {current.pageText}
            </motion.p>
          )}
        </AnimatePresence>
      </div>

      <div className="relative mt-3 min-h-[3.25rem]">
        <AnimatePresence initial={false} mode="wait">
          {current.showCapture ? (
            <motion.div
              key="note"
              className="flex items-start gap-2 rounded-lg border border-[#E8DFD4] bg-[#FAF5EE] px-2.5 py-2"
              initial={reduceMotion ? false : { opacity: 0, y: 6 }}
              animate={{ opacity: 1, y: 0 }}
              exit={reduceMotion ? undefined : { opacity: 0, y: 4 }}
              transition={transition}
            >
              <StickyNote className="mt-0.5 h-3 w-3 shrink-0 text-[#78716c]" aria-hidden />
              <p className="text-xs leading-snug text-foreground">{current.note}</p>
            </motion.div>
          ) : (
            <motion.div key="empty" className="h-[3.25rem]" aria-hidden />
          )}
        </AnimatePresence>
      </div>
    </div>
  )
}
