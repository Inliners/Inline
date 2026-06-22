'use client'

import { useEffect } from 'react'
import { scrollToSection } from '@/components/marketing/SectionLink'

/** Scroll to the section in the URL hash after landing on the homepage. */
export default function MarketingHashScroll() {
  useEffect(() => {
    const hash = window.location.hash
    if (!hash) return
    const id = decodeURIComponent(hash.slice(1))
    requestAnimationFrame(() => scrollToSection(id))
  }, [])

  return null
}
