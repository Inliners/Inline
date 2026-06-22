'use client'

import { useEffect, useRef, useState } from 'react'
import Link from 'next/link'
import {
  motion,
  AnimatePresence,
  useScroll,
  useTransform,
  useReducedMotion,
} from 'framer-motion'
import HeroCaptureGrid from '@/components/marketing/HeroCaptureGrid'
import HeroContextRings from '@/components/marketing/HeroContextRings'
import { SectionLink } from '@/components/marketing/SectionLink'
import { mktBtnPrimaryLg, mktBtnSecondaryLg } from '@/components/marketing/marketingSurfaces'

const EASE: [number, number, number, number] = [0.25, 0.46, 0.45, 0.94]

const ROTATING_WORDS = ['Memory', 'Highlights', 'Notes', 'Captures', 'Context', 'Answers']
const WORD_INTERVAL_MS = 4200

function HeroRotatingWord({ paused }: { paused: boolean }) {
  const [index, setIndex] = useState(0)

  useEffect(() => {
    if (paused) return
    const id = window.setInterval(() => {
      setIndex(i => (i + 1) % ROTATING_WORDS.length)
    }, WORD_INTERVAL_MS)
    return () => window.clearInterval(id)
  }, [paused])

  const word = ROTATING_WORDS[index]

  return (
    <motion.span layout className="inline-block align-baseline" aria-live="polite">
      {paused ? (
        <span>{ROTATING_WORDS[0]}</span>
      ) : (
        <AnimatePresence mode="wait" initial={false}>
          <motion.span
            key={word}
            layout
            className="inline-block whitespace-nowrap"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.9, ease: EASE }}
          >
            {word}
          </motion.span>
        </AnimatePresence>
      )}
    </motion.span>
  )
}

export default function Hero() {
  const heroRef = useRef<HTMLElement>(null)
  const reduce = useReducedMotion()
  const { scrollYProgress } = useScroll({
    target: heroRef,
    offset: ['start start', 'end start'],
  })
  const contentY = useTransform(scrollYProgress, [0, 1], [0, -16])

  const fade = (delay = 0) =>
    reduce
      ? {}
      : {
          initial: { opacity: 0, y: 16 },
          animate: { opacity: 1, y: 0 },
          transition: { duration: 0.55, delay, ease: EASE },
        }

  return (
    <section
      ref={heroRef}
      data-hero
      data-hero-dark="false"
      className="relative flex min-h-svh w-full flex-col overflow-hidden bg-[#FDFBF7] text-[#1C1E26]"
    >
      <HeroContextRings />

      <motion.div
        style={{ y: reduce ? 0 : contentY }}
        className="relative z-10 mx-auto flex h-full min-h-0 w-full max-w-4xl flex-col items-center justify-center px-6 pt-[4.5rem] pb-10 text-center sm:px-8 lg:px-10"
      >
        <motion.div {...fade(0)} className="w-full min-h-0 shrink-0">
          <HeroCaptureGrid />
        </motion.div>

        <div className="relative min-h-0 max-w-3xl shrink">
          <motion.h1
            {...fade(0.1)}
            layout
            className="text-balance text-center text-[2.75rem] font-semibold leading-[1.06] tracking-tight text-[#1C1E26] sm:text-6xl md:text-[4.5rem]"
          >
            <HeroRotatingWord paused={!!reduce} /> for the web.
          </motion.h1>

          <motion.p
            {...fade(0.18)}
            className="mx-auto mt-4 max-w-lg text-pretty text-base leading-relaxed text-stone-600 sm:text-[1.05rem]"
          >
            Capture highlights, notes, and answers on any page—then search them anytime.
          </motion.p>

          <motion.div {...fade(0.26)} className="mt-7 flex flex-col justify-center gap-3 sm:flex-row">
            <Link href="/install" className={mktBtnPrimaryLg}>
              Add to Chrome
            </Link>
            <SectionLink href="/#product" className={mktBtnSecondaryLg}>
              See how it works
            </SectionLink>
          </motion.div>
        </div>
      </motion.div>
    </section>
  )
}
