'use client'

import { Activity } from 'lucide-react'
import { cn } from '@/lib/utils'
import { useSidebar } from '@/lib/sidebar-context'

/**
 * Opens the Activity / Insights rail (RightContextPanel). Lives in the main
 * workspace column so the sidebar only handles nav collapse.
 */
export default function WorkspaceActivityPanelToggle() {
  const { rightPanelOpen, toggleRightPanel } = useSidebar()

  return (
    <button
      type="button"
      onClick={toggleRightPanel}
      className={cn(
        'pointer-events-auto absolute right-4 top-16 z-800 flex h-10 w-10 items-center justify-center rounded-full border border-stone-200/80 bg-white shadow-[0_8px_24px_-16px_rgba(28,30,38,0.35)] transition-colors',
        rightPanelOpen
          ? 'text-stone-800 ring-1 ring-stone-300/80'
          : 'text-stone-500 hover:bg-stone-100 hover:text-stone-800',
      )}
      title={rightPanelOpen ? 'Close activity panel' : 'Activity & insights'}
      aria-expanded={rightPanelOpen}
      aria-label={rightPanelOpen ? 'Close activity panel' : 'Open activity panel'}
    >
      <Activity className="h-4 w-4" />
    </button>
  )
}
