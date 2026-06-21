'use client'

import { useMemo, useState } from 'react'
import Link from 'next/link'
import { cn } from '@/lib/utils'
import { Input } from '@/components/ui/input'
import { Settings, Search, ChevronRight } from 'lucide-react'

export type SettingsNavItem = {
  id: string
  label: string
  icon: React.ElementType
  danger?: boolean
}

export type SettingsNavGroup = {
  label: string
  items: SettingsNavItem[]
}

type SettingsShellProps = {
  title: string
  subtitle?: string
  groups: SettingsNavGroup[]
  activeId: string
  onSelect: (id: string) => void
  children: React.ReactNode
  /** Optional: show support + sign-out in left rail */
  footer?: React.ReactNode
  /** Accent for active item (workspace can use purple-ish) */
  accentClass?: string
}

export default function SettingsShell({
  title,
  subtitle,
  groups,
  activeId,
  onSelect,
  children,
  footer,
  accentClass = 'bg-primary text-primary-foreground',
}: SettingsShellProps) {
  const [q, setQ] = useState('')

  const filtered = useMemo(() => {
    if (!q.trim()) return groups
    const qq = q.toLowerCase()
    return groups
      .map(g => ({
        ...g,
        items: g.items.filter(i => i.label.toLowerCase().includes(qq)),
      }))
      .filter(g => g.items.length > 0)
  }, [groups, q])

  return (
    <div className="min-h-screen bg-background p-4 md:p-6 lg:p-8">
      <div className="w-full max-w-none rounded-[1.75rem] border border-border bg-card overflow-hidden flex flex-col min-h-[calc(100vh-2rem)] md:min-h-[calc(100vh-3rem)]">
        {/* Top bar */}
        <header className="shrink-0 flex items-center justify-between gap-4 px-5 py-4 border-b border-border bg-card">
          <div className="flex items-center gap-3 min-w-0">
            <div className="w-10 h-10 rounded-xl bg-primary/15 flex items-center justify-center shrink-0">
              <Settings className="w-5 h-5 text-primary" />
            </div>
            <div className="min-w-0">
              <h1 className="text-lg font-semibold tracking-tight text-foreground truncate">{title}</h1>
              {subtitle && <p className="text-xs text-muted-foreground truncate">{subtitle}</p>}
            </div>
          </div>
          <Link
            href="/app/ws-1/dashboard"
            className="hidden sm:inline-flex items-center gap-1 text-xs font-medium text-muted-foreground hover:text-foreground transition-colors cursor-pointer shrink-0"
          >
            Exit <ChevronRight className="w-3.5 h-3.5" />
          </Link>
        </header>

        <div className="flex flex-1 min-h-0">
          {/* Navigation rail — matches app sidebar tokens */}
          <aside className="w-[220px] shrink-0 bg-sidebar text-sidebar-foreground flex flex-col border-r border-sidebar-border">
            <div className="p-3 border-b border-sidebar-border">
              <div className="relative">
                <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-muted-foreground" />
                <Input
                  value={q}
                  onChange={e => setQ(e.target.value)}
                  placeholder="Search settings…"
                  className="h-8 pl-8 text-xs bg-background border-border text-foreground placeholder:text-muted-foreground focus-visible:ring-primary/40"
                />
              </div>
            </div>

            <nav className="flex-1 overflow-y-auto py-3 px-2 space-y-5 scrollbar-minimal">
              {filtered.map(group => (
                <div key={group.label}>
                  <p className="px-2 mb-1.5 text-[10px] font-semibold uppercase tracking-wider text-muted-foreground">
                    {group.label}
                  </p>
                  <ul className="space-y-0.5">
                    {group.items.map(item => {
                      const Icon = item.icon
                      const active = activeId === item.id
                      return (
                        <li key={item.id}>
                          <button
                            type="button"
                            onClick={() => onSelect(item.id)}
                            className={cn(
                              'w-full flex items-center gap-2.5 px-2.5 py-2 rounded-lg text-left text-sm transition-all cursor-pointer',
                              active && !item.danger && accentClass,
                              active && item.danger && 'bg-destructive/15 text-destructive',
                              !active && !item.danger && 'text-muted-foreground hover:bg-sidebar-accent hover:text-sidebar-accent-foreground',
                              !active && item.danger && 'text-destructive/80 hover:bg-destructive/10 hover:text-destructive',
                            )}
                          >
                            <Icon className="w-4 h-4 shrink-0 opacity-90" />
                            <span className="truncate font-medium">{item.label}</span>
                          </button>
                        </li>
                      )
                    })}
                  </ul>
                </div>
              ))}
            </nav>

            {footer && (
              <div className="p-3 border-t border-sidebar-border space-y-1 shrink-0">
                {footer}
              </div>
            )}
          </aside>

          {/* Main content */}
          <main className="flex-1 overflow-y-auto bg-background scrollbar-minimal">
            <div className="w-full max-w-none px-6 py-8 lg:px-10 lg:py-10">{children}</div>
          </main>
        </div>
      </div>
    </div>
  )
}

