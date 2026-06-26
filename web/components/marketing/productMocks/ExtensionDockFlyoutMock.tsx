import type { ReactNode } from 'react'
import {
  IconDraw,
  IconHandwriting,
  IconHighlight,
  IconLaser,
  IconLayers,
  IconNotes,
  IconScreenshot,
  IconSettings,
  IconStamp,
} from '@/components/marketing/extensionToolIcons'
import { product } from '@/components/marketing/marketingSurfaces'
import { cn } from '@/lib/utils'

type FlyoutGroup = 'annotate' | 'utility'

type FlyoutItem = {
  id: string
  label: string
  icon: ReactNode
}

const FLYOUT_ITEMS: Record<FlyoutGroup, FlyoutItem[]> = {
  annotate: [
    { id: 'highlighter', label: 'Highlight', icon: <IconHighlight size={14} /> },
    { id: 'notes', label: 'Sticky note', icon: <IconNotes size={14} /> },
    { id: 'draw', label: 'Draw', icon: <IconDraw size={14} /> },
    { id: 'handwriting', label: 'Pen', icon: <IconHandwriting size={14} /> },
    { id: 'stamps', label: 'Stamp', icon: <IconStamp size={14} /> },
  ],
  utility: [
    { id: 'screenshot', label: 'Screenshot', icon: <IconScreenshot size={14} /> },
    { id: 'laser', label: 'Laser pointer', icon: <IconLaser size={14} /> },
    { id: 'layers', label: 'Layers', icon: <IconLayers size={14} /> },
    { id: 'settings', label: 'Settings', icon: <IconSettings size={14} /> },
  ],
}

const GROUP_LABEL: Record<FlyoutGroup, string> = {
  annotate: 'Annotate',
  utility: 'More tools',
}

type ExtensionDockFlyoutMockProps = {
  group: FlyoutGroup
  activeItem?: string
  className?: string
}

function FlyoutMenuIcon({ children, active }: { children: ReactNode; active?: boolean }) {
  return (
    <span
      className={cn(
        'inline-flex h-7 w-7 shrink-0 items-center justify-center rounded-lg border',
        active
          ? 'border-[#a8a29e] bg-[#F4F4F2] text-foreground'
          : 'border-border bg-[#F4F4F2] text-muted-foreground',
      )}
    >
      {children}
    </span>
  )
}

export default function ExtensionDockFlyoutMock({
  group,
  activeItem,
  className,
}: ExtensionDockFlyoutMockProps) {
  const items = FLYOUT_ITEMS[group]

  return (
    <div
      className={cn(
        'w-[200px] rounded-[10px] border border-border bg-card p-1.5',
        className,
      )}
      style={{ boxShadow: product.panelShadow }}
    >
      <p className="px-2 py-1.5 text-[11px] font-medium text-muted-foreground">{GROUP_LABEL[group]}</p>
      <div className="flex flex-col gap-0.5">
        {items.map(item => {
          const active = item.id === activeItem
          return (
            <div
              key={item.id}
              className={cn(
                'flex min-h-9 items-center gap-2.5 rounded-lg px-2 py-1.5 text-xs font-medium',
                active ? 'bg-muted text-foreground' : 'text-muted-foreground',
              )}
            >
              <FlyoutMenuIcon active={active}>{item.icon}</FlyoutMenuIcon>
              <span>{item.label}</span>
            </div>
          )
        })}
      </div>
    </div>
  )
}
