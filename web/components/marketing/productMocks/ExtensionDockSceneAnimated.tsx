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
import ExtensionSelectionToolbarMock from '@/components/marketing/productMocks/ExtensionSelectionToolbarMock'
import { cn } from '@/lib/utils'

const EASE: [number, number, number, number] = [0.25, 0.46, 0.45, 0.94]
const SCENE_INTERVAL_MS = 4200

/** Tall enough for the rewrite panel (footer + body) without clipping. */
const POPUP_MIN_H = 460

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
    id: 'selection',
    dockIndex: 2,
    label: 'Selection toolbar',
    popup: (
      <div className="flex w-full items-start justify-center pt-8">
        <ExtensionSelectionToolbarMock />
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
    popup: <ExtensionRewritePanelMock className="w-full" />,
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
}

export default function ExtensionDockSceneAnimated({ className }: ExtensionDockSceneAnimatedProps) {
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
        'relative flex flex-col rounded-2xl border border-[#E8DFD4] bg-white p-5 md:p-6',
        className,
      )}
      aria-live="polite"
      aria-label={`Extension preview: ${scene.label}`}
    >
      <div className="mb-4 space-y-1.5 opacity-40" aria-hidden>
        <div className="h-1.5 w-3/4 rounded bg-border" />
        <div className="h-1.5 w-full rounded bg-border/80" />
        <div className="h-1.5 w-5/6 rounded bg-border/60" />
        <div className="mt-2 h-1 w-full rounded bg-[#FEF08A]" />
        <div className="h-1 w-4/5 rounded bg-border/60" />
      </div>

      <div className="flex items-start justify-end gap-3">
        <div
          className="relative flex min-w-0 flex-1 justify-end"
          style={{ minHeight: POPUP_MIN_H }}
        >
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

        <ExtensionDockMock activeIndex={scene.dockIndex} className="shrink-0" />
      </div>
    </div>
  )
}
