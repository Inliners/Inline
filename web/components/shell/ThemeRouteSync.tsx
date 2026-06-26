'use client'

import { useEffect } from 'react'
import { usePathname } from 'next/navigation'
import { syncThemeForPath } from '@/lib/theme'

/** Keeps marketing pages light when navigating from the workspace in dark mode. */
export function ThemeRouteSync() {
  const pathname = usePathname()

  useEffect(() => {
    syncThemeForPath(pathname)
  }, [pathname])

  return null
}
