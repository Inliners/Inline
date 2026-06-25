'use client'

import { useEffect, useState, type ReactNode } from 'react'
import { AnimatePresence, motion, useReducedMotion } from 'framer-motion'
import ExtensionAskPanelIdleMock, {
  ExtensionPageRecapPanelMock,
} from '@/components/marketing/productMocks/ExtensionAskPanelIdleMock'
import ExtensionDockMock from '@/components/marketing/productMocks/ExtensionDockMock'
import ExtensionHighlighterPanelMock from '@/components/marketing/productMocks/ExtensionHighlighterPanelMock'
import ExtensionRewritePanelMock from '@/components/marketing/productMocks/ExtensionRewritePanelMock'
import ExtensionSearchPanelMock from '@/components/marketing/productMocks/ExtensionSearchPanelMock'
import ExtensionDockFlyoutMock from '@/components/marketing/productMocks/ExtensionDockFlyoutMock'
import { mkt } from '@/components/marketing/marketingSurfaces'
import { cn } from '@/lib/utils'

const EASE: [number, number, number, number] = [0.25, 0.46, 0.45, 0.94]
const SCENE_INTERVAL_MS = 4200

type DockScene = {
  id: string
  dockIndex: number
  label: string
  popup: ReactNode
}

const DOCK_SCENES: DockScene[] = [
  {
    id: 'ask',
    dockIndex: 0,
    label: 'Ask about this page',
    popup: <ExtensionAskPanelIdleMock className="w-full" />,
  },
  {
    id: 'highlight',
    dockIndex: 2,
    label: 'Highlight colour panel',
    popup: <ExtensionHighlighterPanelMock className="w-full" />,
  },
  {
    id: 'more',
    dockIndex: 4,
    label: 'More tools flyout',
    popup: (
      <div className="flex w-full justify-end">
        <ExtensionDockFlyoutMock group="utility" activeItem="layers" />
      </div>
    ),
  },
  {
    id: 'recap',
    dockIndex: 0,
    label: 'Page recap saved',
    popup: <ExtensionPageRecapPanelMock className="w-full" />,
  },
  {
    id: 'rewrite',
    dockIndex: 1,
    label: 'Rewrite selection',
    popup: <ExtensionRewritePanelMock className="w-full" compact />,
  },
  {
    id: 'search',
    dockIndex: 3,
    label: 'Search captures',
    popup: <ExtensionSearchPanelMock className="w-full" />,
  },
]

type ExtensionDockSceneAnimatedProps = {
  className?: string
  bottomColor?: string
}

export default function ExtensionDockSceneAnimated({
  className,
  bottomColor = mkt.deepTeal,
}: ExtensionDockSceneAnimatedProps) {
  const reduceMotion = useReducedMotion()
  const [index, setIndex] = useState(0)
  const scene = DOCK_SCENES[index]!

  useEffect(() => {
    if (reduceMotion) return
    const id = window.setInterval(() => {
      setIndex(i => (i + 1) % DOCK_SCENES.length)
    }, SCENE_INTERVAL_MS)
    return () => window.clearInterval(id)
  }, [reduceMotion])

  return (
    <div
      className={cn(
        'relative flex flex-col overflow-hidden rounded-2xl border border-[#E8DFD4]',
        className,
      )}
      aria-live="polite"
      aria-label={`Extension preview: ${scene.label}`}
    >
      <div className="pointer-events-none absolute inset-0" aria-hidden>
        <div className="h-[75%]" style={{ backgroundColor: mkt.tan }} />
        <div className="h-[25%]" style={{ backgroundColor: bottomColor }} />
      </div>

      <div className="relative z-10 flex flex-col p-4 sm:p-5 md:p-6">
        <div className="mb-4 space-y-1.5 opacity-40" aria-hidden>
          <div className="h-1.5 w-3/4 rounded bg-border" />
          <div className="h-1.5 w-full rounded bg-border/80" />
          <div className="h-1.5 w-5/6 rounded bg-border/60" />
          <div className="mt-2 h-1 w-full rounded bg-[#FEF08A]" />
          <div className="h-1 w-4/5 rounded bg-border/60" />
        </div>

        <div className="flex flex-col items-center gap-3 sm:flex-row sm:items-start sm:justify-end sm:gap-4">
          <div className="relative flex min-h-[210px] w-full min-w-0 flex-1 justify-center sm:min-h-[460px] sm:justify-end">
            <AnimatePresence mode="wait" initial={false}>
              <motion.div
                key={scene.id}
                className="w-full max-w-[342px]"
                initial={reduceMotion ? false : { opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={reduceMotion ? undefined : { opacity: 0 }}
                transition={{ duration: reduceMotion ? 0 : 0.55, ease: EASE }}
              >
                {scene.popup}
              </motion.div>
            </AnimatePresence>
          </div>

          <ExtensionDockMock
            activeIndex={scene.dockIndex}
            orientation="horizontal"
            showNotebook={false}
            className="shrink-0 sm:hidden"
          />
          <ExtensionDockMock activeIndex={scene.dockIndex} className="hidden shrink-0 sm:flex" />
        </div>
      </div>
    </div>
  )
}
