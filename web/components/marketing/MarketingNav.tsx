'use client'

import { useEffect, useLayoutEffect, useState } from 'react'
import Link from 'next/link'
import { Menu, X } from 'lucide-react'
import { SectionLink, type SectionHref } from '@/components/marketing/SectionLink'
import { DEFAULT_WORKSPACES } from '@/lib/workspaces'
import { workspacePath } from '@/lib/workspace-routes'
import { cn } from '@/lib/utils'

/**
 * Fixed capsule navigation. Every link resolves to a real section id on the
 * landing page or a real route. "Add to Chrome" routes to the install guide
 * (no Chrome Web Store listing yet).
 */
const NAV_LINKS: { label: string; href: SectionHref }[] = [
  { label: 'How it works', href: '/#product'   },
  { label: 'Extension', href: '/#extension' },
  { label: 'Workspace', href: '/#workspace' },
  { label: 'AI search', href: '/#rag'       },
  { label: 'FAQ',       href: '/#faq'       },
]

function InlineWordmark({ onDark }: { onDark: boolean }) {
  return (
    <Link href="/" className="shrink-0" aria-label="Inline home">
      <span
        className={cn(
          'font-semibold text-xl tracking-tight transition-colors sm:text-2xl',
          onDark ? 'text-white' : 'text-[#1C1E26]',
        )}
      >
        inline
      </span>
    </Link>
  )
}

export default function MarketingNav() {
  // Cream hero is the default homepage; only use light nav text on explicit dark heroes.
  const [pastHero, setPastHero] = useState(false)
  const [heroIsDark, setHeroIsDark] = useState(false)
  const [mobileOpen, setMobileOpen] = useState(false)

  useLayoutEffect(() => {
    const hero = document.querySelector<HTMLElement>('main [data-hero]')
    setHeroIsDark(hero?.getAttribute('data-hero-dark') === 'true')
  }, [])

  useEffect(() => {
    const NAV_HEIGHT = 72
    const hero = document.querySelector<HTMLElement>('main [data-hero]')

    if (!hero) {
      const onScroll = () => setPastHero(window.scrollY > NAV_HEIGHT)
      onScroll()
      window.addEventListener('scroll', onScroll, { passive: true })
      return () => window.removeEventListener('scroll', onScroll)
    }

    const observer = new IntersectionObserver(
      ([entry]) => {
        setPastHero(!entry.isIntersecting)
      },
      {
        rootMargin: `-${NAV_HEIGHT}px 0px 0px 0px`,
        threshold: 0,
      },
    )

    observer.observe(hero)
    return () => observer.disconnect()
  }, [])

  // Close the mobile menu on Escape.
  useEffect(() => {
    if (!mobileOpen) return
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') setMobileOpen(false)
    }
    document.addEventListener('keydown', onKey)
    return () => document.removeEventListener('keydown', onKey)
  }, [mobileOpen])

  const onDark = heroIsDark && !pastHero && !mobileOpen

  return (
    <header
      className={cn(
        'fixed top-0 left-0 right-0 z-50 transition-[background-color,border-color,backdrop-filter] duration-300',
        pastHero || mobileOpen
          ? 'border-b border-[#E8DFD4] bg-[#FDFBF7]/94 backdrop-blur-md'
          : 'border-b border-transparent bg-transparent',
      )}
    >
      <nav className="mx-auto grid w-full max-w-7xl grid-cols-[1fr_auto] items-center gap-4 px-6 py-3.5 lg:grid-cols-[1fr_auto_1fr] lg:px-10">
        <InlineWordmark onDark={onDark} />

        <ul className="hidden items-center justify-center gap-2 justify-self-center lg:flex">
          {NAV_LINKS.map(link => (
            <li key={link.href}>
              <SectionLink
                href={link.href}
                className={cn(
                  'inline-flex items-center px-4 py-2.5 text-base font-medium rounded-full transition-colors focus-visible:outline-2 focus-visible:outline-offset-2',
                  onDark
                    ? 'text-stone-200 hover:text-white focus-visible:outline-white/70'
                    : 'text-stone-700 hover:text-[#1C1E26] focus-visible:outline-[#4B83C4]',
                )}
              >
                {link.label}
              </SectionLink>
            </li>
          ))}
        </ul>

        <div className="col-start-2 flex items-center justify-end justify-self-end gap-2 sm:gap-3 lg:col-start-3">
          <Link
            href="/auth/login"
            className={cn(
              'hidden sm:inline-flex items-center justify-center rounded-full border px-5 py-2 text-sm font-medium transition-colors focus-visible:outline-2 focus-visible:outline-offset-2',
              onDark
                ? 'border-white/30 bg-transparent text-white hover:border-white/60 hover:bg-white/10 focus-visible:outline-white/70'
                : 'border-[#D9CFC2] bg-[#FAF5EE]/60 text-[#1C1E26] hover:border-[#C9B49A] hover:bg-[#FDFBF7] focus-visible:outline-[#4B83C4]',
            )}
          >
            Sign in
          </Link>
          <Link
            href="/install"
            className={cn(
              'inline-flex items-center justify-center rounded-full px-5 py-2 text-sm font-medium transition-colors focus-visible:outline-2 focus-visible:outline-offset-2',
              onDark
                ? 'bg-white text-[#1C1E26] hover:bg-stone-100 focus-visible:outline-white/70'
                : 'bg-[#1B1B1B] text-white hover:bg-[#141414] focus-visible:outline-[#4B83C4]',
            )}
          >
            Add to Chrome
          </Link>

          <button
            type="button"
            onClick={() => setMobileOpen(v => !v)}
            aria-expanded={mobileOpen}
            aria-label={mobileOpen ? 'Close menu' : 'Open menu'}
            className={cn(
              'inline-flex lg:hidden h-9 w-9 items-center justify-center rounded-full transition-colors focus-visible:outline-2 focus-visible:outline-offset-2',
              onDark
                ? 'text-white hover:bg-white/10 focus-visible:outline-white/70'
                : 'text-[#1C1E26] hover:bg-stone-100 focus-visible:outline-[#4B83C4]',
            )}
          >
            {mobileOpen ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
          </button>
        </div>
      </nav>

      {mobileOpen && (
        <div className="lg:hidden border-t border-[#F5EDE3] bg-[#FDFBF7] px-6 pb-6 pt-2">
          <ul className="flex flex-col">
            {NAV_LINKS.map(link => (
              <li key={link.href}>
                <SectionLink
                  href={link.href}
                  onClick={() => setMobileOpen(false)}
                  className="block rounded-xl px-3 py-3.5 text-base font-medium text-stone-700 transition-colors hover:bg-stone-100 hover:text-[#1C1E26]"
                >
                  {link.label}
                </SectionLink>
              </li>
            ))}
          </ul>
          <div className="mt-3 flex flex-col gap-2 border-t border-[#d6d3d1]/60 pt-4">
            <Link
              href="/auth/login"
              onClick={() => setMobileOpen(false)}
              className="inline-flex items-center justify-center rounded-full border border-[#d6d3d1] px-5 py-2.5 text-sm font-medium text-[#1C1E26] transition-colors hover:bg-[#F4F4F2]"
            >
              Sign in
            </Link>
            <Link
              href={workspacePath(DEFAULT_WORKSPACES[0]!, 'dashboard')}
              onClick={() => setMobileOpen(false)}
              className="inline-flex items-center justify-center rounded-full bg-[#1B1B1B] px-5 py-2.5 text-sm font-medium text-white transition-colors hover:bg-[#141414]"
            >
              Open workspace
            </Link>
          </div>
        </div>
      )}
    </header>
  )
}
