'use client'

import { useEffect, useState } from 'react'
import { AnimatePresence, motion, useReducedMotion } from 'framer-motion'
import WorkspaceDashboardHeroMock, {
  type DashboardHeroPage,
} from '@/components/marketing/productMocks/WorkspaceDashboardHeroMock'
import WorkspaceChatMock from '@/components/marketing/productMocks/WorkspaceChatMock'
import { DEMO_BRIDGE_SOURCES } from '@/components/marketing/productMocks/sampleData'
import { product } from '@/components/marketing/marketingSurfaces'
import { cn } from '@/lib/utils'

const EASE: [number, number, number, number] = [0.25, 0.46, 0.45, 0.94]
const SCENE_MS = 4200

type DashboardScene = {
  id: string
  navIndex: number
  page: DashboardHeroPage
  chatOpen: boolean
  label: string
}

const SCENES: DashboardScene[] = [
  { id: 'home', navIndex: 0, page: 'home', chatOpen: false, label: 'Workspace home' },
  { id: 'captures', navIndex: 1, page: 'captures', chatOpen: false, label: 'Captures library' },
  { id: 'analytics', navIndex: 2, page: 'analytics', chatOpen: false, label: 'Analytics overview' },
  { id: 'ask', navIndex: 0, page: 'home', chatOpen: true, label: 'Ask Inline chat open' },
]

type WorkspaceDashboardHeroAnimatedProps = {
  className?: string
}

export default function WorkspaceDashboardHeroAnimated({
  className,
}: WorkspaceDashboardHeroAnimatedProps) {
  const reduceMotion = useReducedMotion()
  const [index, setIndex] = useState(0)
  const scene = SCENES[index]!

  useEffect(() => {
    if (reduceMotion) return
    const id = window.setInterval(() => setIndex(i => (i + 1) % SCENES.length), SCENE_MS)
    return () => window.clearInterval(id)
  }, [reduceMotion])

  const chatFooter = (
    <div className="pointer-events-none absolute inset-x-0 bottom-3 z-20 flex justify-center px-3 sm:bottom-4 sm:px-4">
      <AnimatePresence mode="wait" initial={false}>
        {scene.chatOpen ? (
          <motion.div
            key="panel"
            className="w-full max-w-[min(100%,420px)] overflow-hidden rounded-2xl border border-border bg-card"
            style={{ boxShadow: product.panelShadow }}
            initial={reduceMotion ? false : { opacity: 0, y: 28, scale: 0.96 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={reduceMotion ? undefined : { opacity: 0, y: 16, scale: 0.98 }}
            transition={{ duration: reduceMotion ? 0 : 0.45, ease: EASE }}
          >
            <WorkspaceChatMock
              variant="panel"
              compactPanel
              elevated={false}
              sessionTitle="Reading session"
              scenario={{
                userMessage: 'What did I save about the main argument?',
                assistantMessage:
                  'Your highlights cover the core claim [1]. Your recap adds context from a sticky note [2].',
                sources: DEMO_BRIDGE_SOURCES.slice(0, 2),
              }}
              hideSourceScrollbar
            />
          </motion.div>
        ) : (
          <motion.div
            key={`pill-${scene.id}`}
            initial={reduceMotion ? false : { opacity: 0, y: 10, scale: 0.94 }}
            animate={
              reduceMotion
                ? { opacity: 1, y: 0, scale: 1 }
                : { opacity: 1, y: 0, scale: [1, 1.04, 1] }
            }
            exit={reduceMotion ? undefined : { opacity: 0, y: 8, scale: 0.96 }}
            transition={{
              duration: reduceMotion ? 0 : 0.4,
              ease: EASE,
              scale: reduceMotion ? undefined : { duration: 0.55, delay: 0.15 },
            }}
          >
            <WorkspaceChatMock variant="pill" elevated />
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  )

  return (
    <div className={cn('relative', className)} aria-live="polite" aria-label={scene.label}>
      <WorkspaceDashboardHeroMock
        compact
        animateTransitions
        activeNavIndex={scene.navIndex}
        page={scene.page}
        chatFooter={chatFooter}
      />
    </div>
  )
}
