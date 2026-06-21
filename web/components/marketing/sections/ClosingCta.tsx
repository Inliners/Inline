import Link from 'next/link'
import { Reveal } from '@/components/marketing/primitives/Reveal'

export default function ClosingCta() {
  return (
    <section className="bg-[#0B1735] py-20 md:py-28 overflow-hidden relative">
      <svg
        viewBox="0 0 1000 400"
        preserveAspectRatio="xMidYMid slice"
        className="pointer-events-none absolute inset-0 h-full w-full"
        aria-hidden
        fill="none"
      >
        <circle cx="500" cy="520" r="380" stroke="#8AACDB" strokeOpacity="0.18" strokeWidth="1" strokeDasharray="4 8" />
        <circle cx="500" cy="520" r="300" stroke="#8AACDB" strokeOpacity="0.22" strokeWidth="1" strokeDasharray="4 8" />
        <circle cx="500" cy="140" r="2.5" fill="#B5CDEF" fillOpacity="0.6" />
        <circle cx="170" cy="90" r="1.8" fill="#B5CDEF" fillOpacity="0.4" />
        <circle cx="840" cy="200" r="1.8" fill="#B5CDEF" fillOpacity="0.4" />
      </svg>
      <div className="relative mx-auto max-w-3xl px-6 text-center">
        <Reveal>
          <h2 className="text-3xl md:text-5xl font-semibold tracking-tight text-white leading-[1.12]">
            Start remembering the web.
          </h2>
          <p className="mx-auto mt-4 max-w-xl text-base md:text-lg leading-relaxed text-stone-300">
            Install the extension, open your workspace, and every page you read
            becomes part of a memory you can ask.
          </p>
        </Reveal>
        <Reveal delay={0.1} className="mt-8 flex flex-col items-center justify-center gap-3 sm:flex-row">
          <Link
            href="/install"
            className="inline-flex items-center justify-center rounded-full bg-white px-7 py-3 text-sm font-medium text-[#0B1735] transition-colors hover:bg-stone-100 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-white/70"
          >
            Add to Chrome
          </Link>
          <Link
            href="/auth/register"
            className="inline-flex items-center justify-center rounded-full border border-white/30 px-7 py-3 text-sm font-medium text-white transition-colors hover:border-white/60 hover:bg-white/10 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-white/70"
          >
            Create your workspace
          </Link>
        </Reveal>
      </div>
    </section>
  )
}
