'use client'

import { PanelRight } from 'lucide-react'
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
        'flex h-8 w-8 shrink-0 cursor-pointer items-center justify-center rounded-lg transition-colors outline-none',
        rightPanelOpen
          ? 'bg-muted text-foreground'
          : 'text-muted-foreground hover:bg-muted/70 hover:text-foreground',
      )}
      title={rightPanelOpen ? 'Close activity & insights' : 'Activity & insights'}
      aria-expanded={rightPanelOpen}
      aria-label={rightPanelOpen ? 'Close activity & insights panel' : 'Open activity & insights panel'}
    >
      <PanelRight className="h-4 w-4" />
    </button>
  )
}
