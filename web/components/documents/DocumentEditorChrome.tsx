'use client'

import { useEffect } from 'react'
import { usePathname } from 'next/navigation'
import { useSidebar } from '@/lib/sidebar-context'
import { isDocumentEditorPath } from '@/lib/document-editor-view'

/** Closes workspace activity rail on document editor routes (doc has its own panel). */
export default function DocumentEditorChrome() {
  const pathname = usePathname()
  const { setRightPanelOpen, rightPanelOpen } = useSidebar()

  useEffect(() => {
    if (isDocumentEditorPath(pathname) && rightPanelOpen) {
      setRightPanelOpen(false)
    }
  }, [pathname, rightPanelOpen, setRightPanelOpen])

  return null
}
