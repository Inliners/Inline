'use client'

import { useEffect, useState } from 'react'
import { AnimatePresence, motion, useReducedMotion } from 'framer-motion'
import ExtensionAskPanelMock from '@/components/marketing/productMocks/ExtensionAskPanelMock'
import ExtensionDockMock from '@/components/marketing/productMocks/ExtensionDockMock'
import ExtensionSelectionToolbarMock from '@/components/marketing/productMocks/ExtensionSelectionToolbarMock'
import { DEMO_DOMAIN } from '@/components/marketing/productMocks/sampleData'
import { mkt, product } from '@/components/marketing/marketingSurfaces'
import { cn } from '@/lib/utils'

const EASE: [number, number, number, number] = [0.25, 0.46, 0.45, 0.94]
const SCENE_MS = 4500
const LINE_LEADING_PX = 18
const LINE_GAP_PX = 4

const PAGE_LINES = [
  'The introduction sets up the main argument.',
  'Key terms are defined in the opening paragraphs.',
  'The author states the central point in section two.',
  'A supporting example appears midway through the page.',
  'The conclusion ties back to the introduction.',
] as const

const HIGHLIGHT_SCENES = [
  {
    id: 'main-claim',
    line: 2,
    phrase: 'central point',
    color: 'rgba(250, 204, 21, 0.52)',
    label: 'Highlighting the main claim',
  },
  {
    id: 'supporting-example',
    line: 3,
    phrase: 'supporting example',
    color: 'rgba(250, 204, 21, 0.52)',
    label: 'Highlighting a supporting example',
  },
  {
    id: 'key-term',
    line: 1,
    phrase: 'Key terms',
    color: 'rgba(167, 243, 208, 0.62)',
    label: 'Highlighting a key term',
  },
] as const

type ExtensionDockSceneHighlightAnimatedProps = {
  className?: string
  badgeShape?: 'circle' | 'square'
}

function HighlightedPhrase({
  text,
  color,
  show,
  reduceMotion,
}: {
  text: string
  color: string
  show: boolean
  reduceMotion: boolean | null
}) {
  return (
    <span className="relative inline whitespace-nowrap">
      <motion.span
        aria-hidden
        className="absolute inset-0 -mx-0.5 rounded-[3px]"
        style={{ backgroundColor: color, transformOrigin: 'left center' }}
        initial={false}
        animate={{ scaleX: show ? 1 : 0, opacity: show ? 1 : 0 }}
        transition={{ duration: reduceMotion ? 0 : 0.55, ease: EASE }}
      />
      <span className={cn('relative', show && 'text-foreground/85')}>{text}</span>
      {show && (
        <motion.span
          aria-hidden
          className="relative ml-px inline-block h-3 w-px translate-y-px bg-foreground/55"
          initial={reduceMotion ? false : { opacity: 0 }}
          animate={{ opacity: [0, 1, 1, 0] }}
          transition={{
            duration: reduceMotion ? 0 : 1.1,
            delay: 0.45,
            repeat: reduceMotion ? 0 : Infinity,
            repeatDelay: 2.4,
          }}
        />
      )}
    </span>
  )
}

function PageLine({
  text,
  phrase,
  color,
  isActive,
  reduceMotion,
}: {
  text: string
  phrase?: string
  color?: string
  isActive: boolean
  reduceMotion: boolean | null
}) {
  if (!phrase || !isActive) {
    return <p className="text-[11px] leading-[18px] text-foreground/40">{text}</p>
  }

  const start = text.indexOf(phrase)
  if (start < 0) {
    return <p className="text-[11px] leading-[18px] text-foreground/40">{text}</p>
  }

  const before = text.slice(0, start)
  const after = text.slice(start + phrase.length)

  return (
    <p className="text-[11px] leading-[18px] text-foreground/40">
      {before}
      <HighlightedPhrase
        text={phrase}
        color={color!}
        show={isActive}
        reduceMotion={reduceMotion}
      />
      {after}
    </p>
  )
}

export default function ExtensionDockSceneHighlightAnimated({
  className,
  badgeShape = 'circle',
}: ExtensionDockSceneHighlightAnimatedProps) {
  const reduceMotion = useReducedMotion()
  const [index, setIndex] = useState(0)
  const scene = HIGHLIGHT_SCENES[index]!

  useEffect(() => {
    if (reduceMotion) return
    const id = window.setInterval(() => setIndex(i => (i + 1) % HIGHLIGHT_SCENES.length), SCENE_MS)
    return () => window.clearInterval(id)
  }, [reduceMotion])

  const PAGE_CHROME_OFFSET = 30

  const toolbarTop = PAGE_CHROME_OFFSET + scene.line * (LINE_LEADING_PX + LINE_GAP_PX) - 36

  return (
    <div
      className={cn(
        'relative flex min-h-[280px] flex-col rounded-2xl border border-[#E8DFD4] sm:min-h-[320px] md:min-h-[360px]',
        className,
      )}
      aria-live="polite"
      aria-label={scene.label}
    >
      <div
        className="pointer-events-none absolute inset-0 overflow-hidden rounded-2xl"
        aria-hidden
      >
        <div className="h-[68%]" style={{ backgroundColor: mkt.tan }} />
        <div className="h-[32%]" style={{ backgroundColor: product.brand }} />
      </div>

      <div className="relative z-10 flex flex-[2] flex-col p-4 pb-2 sm:p-5 sm:pb-3 md:p-6 md:pb-4">
        <div className="relative">
          <div className="rounded-lg border border-border/50 bg-white px-3 py-2.5 shadow-sm">
            <p className="truncate text-[10px] text-muted-foreground">{DEMO_DOMAIN}</p>
            <div className="mt-1.5 space-y-1" style={{ gap: LINE_GAP_PX }}>
              {PAGE_LINES.map((line, lineIndex) => (
                <PageLine
                  key={line}
                  text={line}
                  phrase={scene.phrase}
                  color={scene.color}
                  isActive={scene.line === lineIndex}
                  reduceMotion={reduceMotion}
                />
              ))}
            </div>
          </div>

          <AnimatePresence mode="wait">
            <motion.div
              key={`${scene.id}-toolbar`}
              className="absolute left-1/2 z-10 -translate-x-1/2"
              style={{ top: toolbarTop }}
              initial={reduceMotion ? false : { opacity: 0, y: 8, scale: 0.96 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              exit={reduceMotion ? undefined : { opacity: 0, y: 4, scale: 0.98 }}
              transition={{
                duration: reduceMotion ? 0 : 0.4,
                delay: reduceMotion ? 0 : 0.35,
                ease: EASE,
              }}
            >
              <ExtensionSelectionToolbarMock className="scale-[0.72] min-[420px]:scale-[0.85] sm:scale-95" />
            </motion.div>
          </AnimatePresence>
        </div>
      </div>

      <div className="relative z-10 -mt-10 flex min-h-0 flex-1 flex-col items-center justify-start px-4 pb-4 pt-0 sm:-mt-14 sm:flex-row sm:items-end sm:justify-end sm:gap-4 sm:px-5 sm:pb-5 md:-mt-16 md:px-6 md:pb-6">
        <ExtensionAskPanelMock compact className="w-full max-w-[342px]" badgeShape={badgeShape} />
        <ExtensionDockMock activeIndex={2} className="shrink-0" />
      </div>
    </div>
  )
}
