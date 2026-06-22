'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'
import type { ComponentProps, MouseEvent } from 'react'

const NAV_OFFSET = 72

export type SectionHref = `/#${string}`

type SectionLinkProps = Omit<ComponentProps<typeof Link>, 'href'> & {
  href: SectionHref
}

export function scrollToSection(id: string) {
  const el = document.getElementById(id)
  if (!el) return
  const top = el.getBoundingClientRect().top + window.scrollY - NAV_OFFSET
  window.scrollTo({ top, behavior: 'smooth' })
  window.history.replaceState(null, '', `#${id}`)
}

/**
 * Section anchor on the homepage — native hash scroll on `/`, Next Link elsewhere.
 * Avoids App Router soft navigation + RSC fetches for in-page jumps.
 */
export function SectionLink({ href, onClick, ...props }: SectionLinkProps) {
  const pathname = usePathname()
  const id = href.slice(2)

  if (pathname === '/') {
    return (
      <a
        href={`#${id}`}
        onClick={(e: MouseEvent<HTMLAnchorElement>) => {
          e.preventDefault()
          scrollToSection(id)
          onClick?.(e as unknown as MouseEvent<HTMLAnchorElement>)
        }}
        {...(props as ComponentProps<'a'>)}
      />
    )
  }

  return <Link href={href} onClick={onClick} {...props} />
}
