'use client'



import { useCallback, useEffect, useState } from 'react'

import { AnimatePresence, motion } from 'framer-motion'

import { Compass } from 'lucide-react'

import InlineGuideCard from '@/components/guide/InlineGuideCard'

import { useInlineGuide } from '@/lib/inline-guide-context'

import { cn } from '@/lib/utils'



const EASE = [0.22, 1, 0.36, 1] as const



const STEP_FEATURE_ROW: Partial<Record<string, string>> = {

  home: 'nav-home',

  captures: 'nav-captures',

  analytics: 'nav-analytics',

}



type Rect = { top: number; left: number; width: number; height: number }



function measureTarget(selector: string): Rect | null {

  const el = document.querySelector(`[data-inline-guide="${selector}"]`)

  if (!el) return null

  const r = el.getBoundingClientRect()

  if (r.width < 1 && r.height < 1) return null

  const pad =

    selector === 'settings-page' ? 0

      : selector.startsWith('nav-') ? 6

        : 8

  return {

    top: Math.max(8, r.top - pad),

    left: Math.max(8, r.left - pad),

    width: r.width + pad * 2,

    height: r.height + pad * 2,

  }

}



export default function InlineGuideOverlay() {

  const {

    active,

    step,

    stepIndex,

    totalSteps,

    next,

    back,

    skipTour,

    openChatPanel,

  } = useInlineGuide()



  const [rect, setRect] = useState<Rect | null>(null)

  const [viewportHeight, setViewportHeight] = useState(800)



  useEffect(() => {

    const update = () => setViewportHeight(window.innerHeight)

    update()

    window.addEventListener('resize', update)

    return () => window.removeEventListener('resize', update)

  }, [])



  const updateRect = useCallback(() => {

    if (!active || !step || step.centerCard || !step.target) {

      setRect(null)

      return

    }

    setRect(measureTarget(step.target))

  }, [active, step])



  useEffect(() => {

    updateRect()

    if (!active) return



    const id = window.setTimeout(updateRect, 120)

    const id2 = window.setTimeout(updateRect, 320)

    window.addEventListener('resize', updateRect)

    window.addEventListener('scroll', updateRect, true)

    return () => {

      window.clearTimeout(id)

      window.clearTimeout(id2)

      window.removeEventListener('resize', updateRect)

      window.removeEventListener('scroll', updateRect, true)

    }

  }, [active, step, stepIndex, updateRect])



  useEffect(() => {

    if (!active || !step?.target) return



    const el = document.querySelector(`[data-inline-guide="${step.target}"]`)

    if (!el) return

    el.setAttribute('data-inline-guide-active', '')



    return () => {

      el.removeAttribute('data-inline-guide-active')

    }

  }, [active, step?.target, stepIndex])



  useEffect(() => {

    if (!active || !step) return



    document.querySelectorAll('[data-inline-guide-focus]').forEach(node => {

      node.removeAttribute('data-inline-guide-focus')

    })



    const rowId = STEP_FEATURE_ROW[step.id]

    if (!rowId) return



    const row = document.querySelector(`[data-inline-guide="${rowId}"]`)

    row?.setAttribute('data-inline-guide-focus', '')



    return () => {

      row?.removeAttribute('data-inline-guide-focus')

    }

  }, [active, step, stepIndex])



  if (!active || !step) return null



  const isFirst = stepIndex === 0

  const isLast = stepIndex === totalSteps - 1

  const centered = step.centerCard || !rect

  const scrimAlpha = step.lightScrim ? 0.22 : 0.38



  return (

    <AnimatePresence>

      <motion.div

        key="guide-scrim"

        initial={{ opacity: 0 }}

        animate={{ opacity: 1 }}

        exit={{ opacity: 0 }}

        transition={{ duration: 0.3, ease: EASE }}

        className="fixed inset-0 z-[60] pointer-events-auto"

        aria-hidden={false}

      >

        {rect && !step.centerCard ? (

          <div

            className="absolute rounded-xl transition-all duration-300 ease-out ring-2 ring-primary/40"

            style={{

              top: rect.top,

              left: rect.left,

              width: rect.width,

              height: rect.height,

              boxShadow: `0 0 0 9999px rgba(15, 23, 42, ${scrimAlpha})`,

            }}

          />

        ) : (

          <div className="absolute inset-0 bg-background/50 backdrop-blur-md" />

        )}



        <div

          className={cn(

            'absolute z-[61] px-4',

            centered

              ? 'inset-0 flex items-center justify-center'

              : 'left-0 right-0',

          )}

          style={

            !centered && rect

              ? rect.top > viewportHeight * 0.45

                ? { top: Math.max(16, rect.top - 12), transform: 'translateY(-100%)' }

                : { top: rect.top + rect.height + 12 }

              : undefined

          }

        >

          <InlineGuideCard

            title={step.title}

            body={step.body}

            stepIndex={stepIndex}

            totalSteps={totalSteps}

            suggestedPrompt={step.suggestedPrompt}

            showOpenChat={step.openChat}

            onNext={next}

            onBack={back}

            onSkip={skipTour}

            onOpenChat={openChatPanel}

            isFirst={isFirst}

            isLast={isLast}

          />

        </div>

      </motion.div>

    </AnimatePresence>

  )

}



export function InlineGuideResumeChip() {

  const { paused, resume, dismissGuide, stepIndex, totalSteps } = useInlineGuide()



  if (!paused) return null



  return (

    <motion.div

      initial={{ opacity: 0, y: 8 }}

      animate={{ opacity: 1, y: 0 }}

      className="fixed bottom-6 left-6 z-[55] flex items-center gap-2 rounded-full border border-border bg-card/95 py-1.5 pl-2 pr-1.5 shadow-md backdrop-blur-md"

    >

      <Compass className="ml-1 h-4 w-4 text-muted-foreground" aria-hidden />

      <span className="text-xs font-medium text-foreground">

        Resume guide ({stepIndex + 1}/{totalSteps})

      </span>

      <button

        type="button"

        onClick={resume}

        className="rounded-full bg-primary px-3 py-1 text-xs font-semibold text-primary-foreground cursor-pointer"

      >

        Continue

      </button>

      <button

        type="button"

        onClick={dismissGuide}

        className="rounded-full px-2 py-1 text-xs text-muted-foreground hover:text-foreground cursor-pointer"

        aria-label="Dismiss guide"

      >

        ×

      </button>

    </motion.div>

  )

}


