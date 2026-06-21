'use client'

import { useEffect, useState } from 'react'
import Link from 'next/link'
import { Menu, X } from 'lucide-react'
import { cn } from '@/lib/utils'

/**
 * Fixed capsule navigation. Every link resolves to a real section id on the
 * landing page or a real route. "Add to Chrome" routes to the install guide
 * (no Chrome Web Store listing yet).
 */
const NAV_LINKS = [
  { label: 'How it works', href: '/#product'   },
  { label: 'Extension', href: '/#extension' },
  { label: 'Workspace', href: '/#workspace' },
  { label: 'AI search', href: '/#rag'       },
  { label: 'Security',  href: '/#security'  },
  { label: 'FAQ',       href: '/#faq'       },
]

/** Inline word-mark. Adapts to the current nav surface (dark hero vs cream scroll). */
function InlineLogo({ onDark, className }: { onDark: boolean; className?: string }) {
  return (
    <Link href="/" className={cn('flex items-center gap-2', className)} aria-label="Inline home">
      <div
        className={cn(
          'flex size-8 shrink-0 items-center justify-center rounded-lg',
          onDark ? 'bg-white/95' : 'bg-[#1C1E26]',
        )}
        aria-hidden
      >
        <span
          className={cn(
            'block h-4 w-1 rounded-full -rotate-12',
            onDark ? 'bg-[#0B1735]' : 'bg-white',
          )}
        />
      </div>
      <span
        className={cn(
          'font-semibold text-lg tracking-tight transition-colors',
          onDark ? 'text-white' : 'text-[#1C1E26]',
        )}
      >
        inline
        <span className={cn('ml-0.5 text-sm align-top', onDark ? 'text-white/60' : 'text-stone-400')}>
          ~
        </span>
      </span>
    </Link>
  )
}

export default function MarketingNav() {
  // `pastHero` is true once the navy hero section has scrolled fully behind the
  // fixed nav. Until then we sit on the navy and need the light palette.
  const [pastHero, setPastHero] = useState(false)
  const [mobileOpen, setMobileOpen] = useState(false)

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

  const onDark = !pastHero && !mobileOpen

  return (
    <header
      className={cn(
        'fixed top-0 left-0 right-0 z-50 transition-colors duration-300',
        pastHero || mobileOpen
          ? 'bg-white/92 backdrop-blur-md border-b border-stone-200/60'
          : 'bg-transparent',
      )}
    >
      <nav className="mx-auto flex w-full max-w-7xl items-center justify-between px-6 lg:px-10 py-3.5">
        <InlineLogo onDark={onDark} />

        <ul className="hidden lg:flex items-center gap-1">
          {NAV_LINKS.map(link => (
            <li key={link.href}>
              <Link
                href={link.href}
                className={cn(
                  'inline-flex items-center px-3.5 py-2 text-sm font-medium rounded-full transition-colors focus-visible:outline-2 focus-visible:outline-offset-2',
                  onDark
                    ? 'text-stone-200 hover:text-white focus-visible:outline-white/70'
                    : 'text-stone-600 hover:text-[#1C1E26] focus-visible:outline-[#4B83C4]',
                )}
              >
                {link.label}
              </Link>
            </li>
          ))}
        </ul>

        <div className="flex items-center gap-2 sm:gap-3">
          <Link
            href="/auth/login"
            className={cn(
              'hidden sm:inline-flex items-center justify-center rounded-full border px-5 py-2 text-sm font-medium transition-colors focus-visible:outline-2 focus-visible:outline-offset-2',
              onDark
                ? 'border-white/30 bg-transparent text-white hover:border-white/60 hover:bg-white/10 focus-visible:outline-white/70'
                : 'border-stone-300 bg-transparent text-stone-800 hover:border-stone-400 hover:bg-white focus-visible:outline-[#4B83C4]',
            )}
          >
            Sign in
          </Link>
          <Link
            href="/install"
            className={cn(
              'inline-flex items-center justify-center rounded-full px-5 py-2 text-sm font-medium transition-colors focus-visible:outline-2 focus-visible:outline-offset-2',
              onDark
                ? 'bg-white text-[#0B1735] hover:bg-stone-100 focus-visible:outline-white/70'
                : 'bg-[#1C1E26] text-white hover:bg-stone-800 focus-visible:outline-[#4B83C4]',
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
        <div className="lg:hidden border-t border-stone-200/60 bg-white px-6 pb-6 pt-2">
          <ul className="flex flex-col">
            {NAV_LINKS.map(link => (
              <li key={link.href}>
                <Link
                  href={link.href}
                  onClick={() => setMobileOpen(false)}
                  className="block rounded-xl px-3 py-3 text-sm font-medium text-stone-700 transition-colors hover:bg-stone-100 hover:text-[#1C1E26]"
                >
                  {link.label}
                </Link>
              </li>
            ))}
          </ul>
          <div className="mt-3 flex flex-col gap-2 border-t border-stone-200/60 pt-4">
            <Link
              href="/auth/login"
              onClick={() => setMobileOpen(false)}
              className="inline-flex items-center justify-center rounded-full border border-stone-300 px-5 py-2.5 text-sm font-medium text-stone-800 transition-colors hover:bg-white"
            >
              Sign in
            </Link>
            <Link
              href="/app/ws-1/dashboard"
              onClick={() => setMobileOpen(false)}
              className="inline-flex items-center justify-center rounded-full bg-[#1C1E26] px-5 py-2.5 text-sm font-medium text-white transition-colors hover:bg-stone-800"
            >
              Open workspace
            </Link>
          </div>
        </div>
      )}
    </header>
  )
}
