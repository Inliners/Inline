import Link from 'next/link'
import { Reveal } from '@/components/marketing/primitives/Reveal'
import { celestial, mktBtnPrimaryLg, mktBtnSecondaryLg } from '@/components/marketing/marketingSurfaces'

export default function ClosingCta() {
  return (
    <section className="relative overflow-hidden bg-[#EBF1F7] py-20 md:py-28">
      <svg
        viewBox="0 0 1000 400"
        preserveAspectRatio="xMidYMid slice"
        className="pointer-events-none absolute inset-0 h-full w-full"
        aria-hidden
        fill="none"
      >
        <circle
          cx="500"
          cy="420"
          r="360"
          stroke={celestial.orbit}
          strokeOpacity="0.45"
          strokeWidth="1"
          strokeDasharray="4 8"
        />
        <circle
          cx="500"
          cy="420"
          r="280"
          stroke={celestial.orbitSoft}
          strokeOpacity="0.35"
          strokeWidth="1"
          strokeDasharray="4 8"
        />
        <circle cx="500" cy="120" r="2" fill={celestial.sparkle} fillOpacity="0.5" />
        <circle cx="180" cy="80" r="1.5" fill={celestial.star} fillOpacity="0.4" />
        <circle cx="820" cy="180" r="1.5" fill={celestial.star} fillOpacity="0.4" />
      </svg>
      <div className="relative mx-auto max-w-3xl px-6 text-center">
        <Reveal>
          <h2 className="text-3xl font-semibold leading-[1.12] tracking-tight text-[#1C1E26] md:text-5xl">
            Start remembering the web.
          </h2>
          <p className="mx-auto mt-4 max-w-xl text-base leading-relaxed text-[#78716c] md:text-lg">
            Install the extension, open your workspace, and every page you read becomes part of a
            memory you can ask.
          </p>
        </Reveal>
        <Reveal delay={0.1} className="mt-8 flex flex-col items-center justify-center gap-3 sm:flex-row">
          <Link href="/install" className={mktBtnPrimaryLg}>
            Add to Chrome
          </Link>
          <Link href="/auth/register" className={mktBtnSecondaryLg}>
            Create your workspace
          </Link>
        </Reveal>
      </div>
    </section>
  )
}
