'use client'

import { useEffect } from 'react'
import { usePathname } from 'next/navigation'
import { useSidebar } from '@/lib/sidebar-context'
import { isDocumentEditorPath } from '@/lib/document-editor-view'
import { isStandaloneSettingsPath } from '@/lib/workspace-chrome'

/** Closes the activity rail on routes that use their own full-page chrome. */
export default function DocumentEditorChrome() {
  const pathname = usePathname()
  const { setRightPanelOpen, rightPanelOpen } = useSidebar()

  useEffect(() => {
    const hideRail = isDocumentEditorPath(pathname) || isStandaloneSettingsPath(pathname)
    if (hideRail && rightPanelOpen) {
      setRightPanelOpen(false)
    }
  }, [pathname, rightPanelOpen, setRightPanelOpen])

  return null
}
