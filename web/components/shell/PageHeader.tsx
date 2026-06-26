'use client'

import Link from 'next/link'
import { usePathname, useRouter } from 'next/navigation'
import { ChevronRight } from 'lucide-react'
import { cn } from '@/lib/utils'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'
import { Settings2, MoreHorizontal } from 'lucide-react'
import ExportButton from './ExportButton'
import WorkspaceActivityPanelToggle from './WorkspaceActivityPanelToggle'

interface Crumb { label: string; href?: string }

interface PageHeaderProps {
  crumbs:     Crumb[]
  /** Optional; when set, shown below the crumb row (most pages use their own page title instead). */
  title?:     string
  titleSlot?: React.ReactNode
  subtitle?:  string
  action?:    React.ReactNode
  className?: string
}

import { resolveWorkspaceIdFromBrowserPath, workspacePath } from '@/lib/workspace-routes'

function getWorkspaceSettingsHref(pathname: string): string {
  const wsId = resolveWorkspaceIdFromBrowserPath(pathname)
  return workspacePath(wsId, 'settings')
}

function getWorkspaceId(pathname: string): string | undefined {
  const segment = pathname.match(/\/app\/([^/]+)/)?.[1]
  return segment ? resolveWorkspaceIdFromBrowserPath(pathname) : undefined
}

export default function PageHeader({ crumbs, title, titleSlot, subtitle, action, className }: PageHeaderProps) {
  const pathname    = usePathname()
  const router      = useRouter()
  const settingsHref = getWorkspaceSettingsHref(pathname)
  const workspaceId  = getWorkspaceId(pathname)

  return (
    <div className={cn('sticky top-0 z-10 border-b border-border bg-white dark:border-sidebar-border dark:bg-sidebar', className)}>
      <div className="flex h-[52px] items-center justify-between px-6">
        <nav className="flex items-center gap-1 text-sm text-muted-foreground">
          {crumbs.map((crumb, i) => (
            <span key={i} className="flex items-center gap-1">
              {i > 0 && <ChevronRight className="h-3.5 w-3.5 text-muted-foreground/50" />}
              {crumb.href ? (
                <Link href={crumb.href} className="cursor-pointer transition-colors hover:text-foreground">
                  {crumb.label}
                </Link>
              ) : (
                <span className={cn(i === crumbs.length - 1 && 'font-medium text-foreground')}>
                  {crumb.label}
                </span>
              )}
            </span>
          ))}
        </nav>

        <div className="flex items-center gap-2">
          {action}

          <DropdownMenu>
            <DropdownMenuTrigger className="flex h-8 w-8 cursor-pointer items-center justify-center rounded-lg text-muted-foreground outline-none transition-colors hover:bg-muted hover:text-foreground dark:hover:bg-sidebar-accent">
              <MoreHorizontal className="h-4 w-4" />
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" className="w-48 rounded-xl border border-border bg-popover">
              <DropdownMenuItem
                className="flex cursor-pointer items-center gap-2 text-foreground"
                onClick={() => router.push(settingsHref)}
              >
                <Settings2 className="h-3.5 w-3.5 text-muted-foreground" />
                <span>Workspace Settings</span>
              </DropdownMenuItem>
              <DropdownMenuItem
                className="p-0 focus:bg-transparent"
                onSelect={e => e.preventDefault()}
              >
                <ExportButton
                  workspaceId={workspaceId}
                  className="flex w-full items-center gap-2 rounded-sm px-2 py-1.5 text-sm text-foreground transition-colors hover:bg-muted"
                />
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>

          <WorkspaceActivityPanelToggle />
        </div>
      </div>

      {(title || subtitle) && (
        <div className="min-w-0 space-y-0.5 px-6 pb-3 pt-0.5">
          {title && <h1 className="text-lg font-semibold tracking-tight text-foreground">{title}</h1>}
          {subtitle && <p className="text-sm text-muted-foreground">{subtitle}</p>}
        </div>
      )}

      {titleSlot && (
        <div className="min-w-0 px-6 pb-3 pt-0.5">{titleSlot}</div>
      )}
    </div>
  )
}
