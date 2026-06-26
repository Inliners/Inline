'use client'

import { ChevronRight } from 'lucide-react'
import WorkspaceActivityPanelToggle from '@/components/shell/WorkspaceActivityPanelToggle'

export default function DashboardTopBar({ workspaceName }: { workspaceName: string }) {
  return (
    <div className="flex items-center justify-between gap-4 border-b border-border bg-card px-8 py-3 dark:border-sidebar-border dark:bg-sidebar">
      <nav className="flex min-w-0 items-center gap-1.5 text-xs text-muted-foreground">
        <span className="truncate">{workspaceName}</span>
        <ChevronRight className="h-3 w-3 shrink-0" />
        <span className="shrink-0 font-medium text-foreground">Dashboard</span>
      </nav>
      <WorkspaceActivityPanelToggle />
    </div>
  )
}
