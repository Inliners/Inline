'use client'

import { useRef } from 'react'
import Link from 'next/link'
import { motion, useScroll, useTransform, useReducedMotion } from 'framer-motion'
import SolarSystemArt from '@/components/auth/SolarSystemArt'

const EASE: [number, number, number, number] = [0.25, 0.46, 0.45, 0.94]

export default function Hero() {
  const heroRef = useRef<HTMLElement>(null)
  const reduce = useReducedMotion()
  const { scrollYProgress } = useScroll({
    target: heroRef,
    offset: ['start start', 'end start'],
  })
  const contentY = useTransform(scrollYProgress, [0, 1], [0, -40])

  const fade = (delay = 0) =>
    reduce
      ? {}
      : {
          initial: { opacity: 0, y: 18 },
          animate: { opacity: 1, y: 0 },
          transition: { duration: 0.6, delay, ease: EASE },
        }

  return (
    <section
      ref={heroRef}
      data-hero
      className="relative h-svh w-full overflow-hidden bg-[#0B1735]"
    >
      {/* Same solar-system art as auth pages — reframed so it frames, not covers, copy */}
      <div className="pointer-events-none absolute inset-0 z-0">
        <SolarSystemArt background />
      </div>

      <div className="relative z-10 flex h-full flex-col">
        {/* ── Centered content ── */}
        <motion.div
          style={{ y: reduce ? 0 : contentY }}
          className="mx-auto flex w-full max-w-4xl flex-1 flex-col items-center justify-center px-6 pt-24 pb-[calc(7rem+env(safe-area-inset-bottom,0px))] text-center lg:px-10"
        >
          <div className="relative max-w-4xl">
            {/* Soft radial vignette — legibility without a visible box */}
            <div
              className="pointer-events-none absolute left-1/2 top-1/2 -z-10 h-[125%] w-[min(100vw,52rem)] -translate-x-1/2 -translate-y-1/2 backdrop-blur-[2px]"
              style={{
                background:
                  'radial-gradient(ellipse 72% 68% at 50% 48%, rgba(11, 23, 53, 0.58) 0%, rgba(11, 23, 53, 0.22) 48%, rgba(11, 23, 53, 0) 72%)',
              }}
              aria-hidden
            />

            {/* Quiet eyebrow — wordmark, not a marketing banner */}
            <motion.div {...fade(0)} className="mb-7 flex items-center justify-center gap-2.5">
              <span className="flex h-6 w-6 items-center justify-center rounded-md bg-white/10 ring-1 ring-white/15">
                <span className="block h-3 w-[3px] -rotate-12 rounded-full bg-[#C9DAF0]" />
              </span>
              <span className="text-sm font-medium tracking-wide text-stone-300/80">Inline</span>
            </motion.div>

            {/* Headline — DM Sans, large and calm */}
            <motion.h1
              {...fade(0.08)}
              className="text-balance text-[2.85rem] font-semibold leading-[1.05] tracking-tight text-white sm:text-6xl md:text-[4.5rem]"
            >
              Your{' '}
              <span className="relative inline-block translate-y-1 -rotate-2 px-0.5 text-[1.08em] font-semibold leading-none tracking-wide text-[#EAF2FC] [font-family:var(--font-handwritten),cursive]">
                memory
                <svg
                  className="pointer-events-none absolute -bottom-0.5 left-0 w-[106%] -translate-x-[3%] opacity-75"
                  height="7"
                  viewBox="0 0 120 7"
                  fill="none"
                  aria-hidden
                >
                  <path
                    d="M1 4.5 C 24 6.5, 48 2.5, 72 5 C 96 6.5, 108 3.5, 119 4.5"
                    stroke="#B5CDEF"
                    strokeWidth="1.6"
                    strokeLinecap="round"
                  />
                </svg>
              </span>{' '}
              layer
              <br className="hidden sm:block" /> for the web.
            </motion.h1>

            {/* Subcopy — plain, non-technical */}
            <motion.p
              {...fade(0.16)}
              className="mx-auto mt-6 max-w-xl text-pretty text-base leading-relaxed text-stone-300/90 sm:text-lg"
            >
              Highlight, write, summarize, and ask questions on any webpage. Inline saves the
              context into a workspace you can search later.
            </motion.p>

            {/* CTAs */}
            <motion.div {...fade(0.24)} className="mt-10 flex flex-col justify-center gap-3 sm:flex-row">
              <Link
                href="/install"
                className="inline-flex items-center justify-center rounded-full bg-white px-7 py-3 text-sm font-semibold text-[#0B1735] transition-colors hover:bg-stone-100 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-white/70"
              >
                Add to Chrome
              </Link>
              <Link
                href="/#product"
                className="inline-flex items-center justify-center rounded-full border border-white/25 px-7 py-3 text-sm font-medium text-white transition-colors hover:border-white/55 hover:bg-white/10 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-white/70"
              >
                See how it works
              </Link>
            </motion.div>
          </div>
        </motion.div>
      </div>

      {/* ── Curved transition — pinned to viewport bottom, does not extend hero height ── */}
      <div
        className="pointer-events-none absolute bottom-0 left-0 right-0 z-10 overflow-hidden"
        style={{ height: 120 }}
        aria-hidden
      >
        <svg
          viewBox="0 0 1440 120"
          className="absolute bottom-0 left-0 block w-full"
          preserveAspectRatio="none"
          style={{ height: 120 }}
        >
          <path d="M0,120 L0,48 C420,112 1020,112 1440,48 L1440,120 Z" fill="#FDFBF7" />
        </svg>
      </div>
    </section>
  )
}
