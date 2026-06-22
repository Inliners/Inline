'use client'

import type { ElementType, ReactNode } from 'react'
import { ChevronLeft, PanelRightClose } from 'lucide-react'
import { cn } from '@/lib/utils'

export interface DocumentSideRailTab {
  id: string
  label: string
  icon: ElementType
}

interface DocumentSideRailProps {
  collapsed: boolean
  onToggleCollapse: () => void
  title?: string
  tabs: DocumentSideRailTab[]
  activeTab: string
  onTabChange: (id: string) => void
  children: ReactNode
  footer?: ReactNode
  collapsedLabel?: string
}

/**
 * Shared chrome for the document context rail — matches workspace panel
 * hierarchy: header, pill tabs, scroll body, pinned footer.
 */
export default function DocumentSideRail({
  collapsed,
  onToggleCollapse,
  title = 'Document',
  tabs,
  activeTab,
  onTabChange,
  children,
  footer,
  collapsedLabel = 'Panel',
}: DocumentSideRailProps) {
  if (collapsed) {
    const active = tabs.find(t => t.id === activeTab) ?? tabs[0]
    const ActiveIcon = active?.icon

    return (
      <div className="flex h-full w-10 shrink-0 flex-col border-l border-border/40 bg-card">
        <button
          type="button"
          onClick={onToggleCollapse}
          className="flex h-11 w-full items-center justify-center text-muted-foreground transition-colors hover:bg-muted/50 hover:text-foreground cursor-pointer"
          aria-label="Expand document panel"
          title="Expand document panel"
        >
          <ChevronLeft className="h-4 w-4" />
        </button>
        <div className="flex flex-1 flex-col items-center gap-3 py-4">
          {ActiveIcon && (
            <span className="flex h-8 w-8 items-center justify-center rounded-lg bg-muted/60 text-foreground">
              <ActiveIcon className="h-4 w-4" aria-hidden />
            </span>
          )}
          <span
            className="text-[9px] font-semibold uppercase tracking-widest text-muted-foreground"
            style={{ writingMode: 'vertical-rl', transform: 'rotate(180deg)' }}
          >
            {collapsedLabel}
          </span>
        </div>
      </div>
    )
  }

  return (
    <aside
      className="flex h-full w-[min(100vw-2rem,280px)] shrink-0 flex-col border-l border-border/40 bg-card"
      aria-label={title}
    >
      <div className="shrink-0 px-3 pt-2.5 pb-2">
        <div className="mb-2 flex h-7 items-center justify-between gap-2">
          <span className="text-xs font-semibold text-foreground">{title}</span>
          <button
            type="button"
            onClick={onToggleCollapse}
            className="flex h-7 w-7 items-center justify-center rounded-md text-muted-foreground transition-colors hover:bg-muted/60 hover:text-foreground cursor-pointer"
            aria-label="Collapse document panel"
            title="Collapse panel"
          >
            <PanelRightClose className="h-4 w-4" />
          </button>
        </div>

        <div className="flex gap-1">
          {tabs.map(tab => {
            const Icon = tab.icon
            const active = tab.id === activeTab
            return (
              <button
                key={tab.id}
                type="button"
                onClick={() => onTabChange(tab.id)}
                className={cn(
                  'flex h-7 flex-1 cursor-pointer items-center justify-center gap-1 rounded-md text-[11px] font-semibold transition-colors duration-150',
                  active
                    ? 'bg-muted/70 text-foreground'
                    : 'text-muted-foreground hover:bg-muted/40 hover:text-foreground',
                )}
              >
                <Icon className="h-3.5 w-3.5 shrink-0" aria-hidden />
                <span className="truncate">{tab.label}</span>
              </button>
            )
          })}
        </div>
      </div>

      <div className="scrollbar-minimal min-h-0 flex-1 overflow-y-auto px-3 py-2">
        {children}
      </div>

      {footer && (
        <div className="shrink-0 bg-muted/20">
          {footer}
        </div>
      )}
    </aside>
  )
}
