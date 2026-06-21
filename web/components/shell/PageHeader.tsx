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

function getWorkspaceSettingsHref(pathname: string): string {
  const match = pathname.match(/\/app\/(ws-[^/]+)/)
  if (match) return `/app/${match[1]}/settings`
  return '/app/settings'
}

function getWorkspaceId(pathname: string): string | undefined {
  const match = pathname.match(/\/app\/(ws-[^/]+)/)
  return match ? match[1] : undefined
}

export default function PageHeader({ crumbs, title, titleSlot, subtitle, action, className }: PageHeaderProps) {
  const pathname    = usePathname()
  const router      = useRouter()
  const settingsHref = getWorkspaceSettingsHref(pathname)
  const workspaceId  = getWorkspaceId(pathname)

  return (
    <div className={cn('border-b border-slate-200 bg-white sticky top-0 z-10', className)}>
      <div className="flex items-center justify-between px-6 h-[52px]">
        <nav className="flex items-center gap-1 text-sm text-slate-400">
          {crumbs.map((crumb, i) => (
            <span key={i} className="flex items-center gap-1">
              {i > 0 && <ChevronRight className="w-3.5 h-3.5 text-slate-300" />}
              {crumb.href ? (
                <Link href={crumb.href} className="hover:text-slate-700 transition-colors cursor-pointer">
                  {crumb.label}
                </Link>
              ) : (
                <span className={cn(i === crumbs.length - 1 && 'text-slate-700 font-medium')}>
                  {crumb.label}
                </span>
              )}
            </span>
          ))}
        </nav>

        <div className="flex items-center gap-2">
          {action}

          <DropdownMenu>
            <DropdownMenuTrigger className="w-8 h-8 flex items-center justify-center rounded-lg text-slate-400 hover:text-slate-700 hover:bg-slate-100 transition-colors cursor-pointer outline-none">
              <MoreHorizontal className="w-4 h-4" />
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" className="w-48 bg-white border border-slate-200 rounded-xl">
              <DropdownMenuItem
                className="flex items-center gap-2 cursor-pointer text-slate-600 hover:text-slate-800"
                onClick={() => router.push(settingsHref)}
              >
                <Settings2 className="w-3.5 h-3.5 text-slate-400" />
                <span>Workspace Settings</span>
              </DropdownMenuItem>
              <DropdownMenuItem
                className="p-0 focus:bg-transparent"
                onSelect={e => e.preventDefault()}
              >
                <ExportButton
                  workspaceId={workspaceId}
                  className="flex items-center gap-2 w-full px-2 py-1.5 text-sm text-slate-600 rounded-sm hover:bg-slate-50 transition-colors"
                />
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      </div>

      {(title || subtitle) && (
        <div className="px-6 pb-3 pt-0.5 min-w-0 space-y-0.5">
          {title && <h1 className="text-lg font-semibold tracking-tight text-slate-900">{title}</h1>}
          {subtitle && <p className="text-sm text-slate-500">{subtitle}</p>}
        </div>
      )}

      {titleSlot && (
        <div className="px-6 pb-3 pt-0.5 min-w-0">{titleSlot}</div>
      )}
    </div>
  )
}
