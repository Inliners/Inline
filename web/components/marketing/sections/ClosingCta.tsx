import Link from 'next/link'
import { Reveal } from '@/components/marketing/primitives/Reveal'
import { mkt, mktBtnPrimaryLg, mktBtnSignInLg } from '@/components/marketing/marketingSurfaces'

export default function ClosingCta() {
  return (
    <section
      className="relative overflow-hidden py-16 sm:py-20 md:py-28"
      style={{ backgroundColor: mkt.cream }}
    >
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
        <Reveal delay={0.1} className="mt-8 flex w-full max-w-sm flex-col items-center justify-center gap-3 sm:max-w-none sm:flex-row">
          <Link href="/install" className={`w-full sm:w-auto ${mktBtnPrimaryLg}`}>
            Add to Chrome
          </Link>
          <Link href="/auth/register" className={`w-full sm:w-auto ${mktBtnSignInLg}`}>
            Create your workspace
          </Link>
        </Reveal>
      </div>
    </section>
  )
}
