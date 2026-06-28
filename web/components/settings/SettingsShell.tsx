'use client'

import { useMemo, useState } from 'react'
import Link from 'next/link'
import { cn } from '@/lib/utils'
import { Input } from '@/components/ui/input'
import { ArrowLeft, HelpCircle, Search } from 'lucide-react'

export type SettingsNavItem = {
  id: string
  label: string
  icon: React.ElementType
  danger?: boolean
  /** When set, renders a link instead of a tab button. */
  href?: string
}

export type SettingsNavGroup = {
  label: string
  items: SettingsNavItem[]
}

type SettingsShellProps = {
  groups: SettingsNavGroup[]
  activeId: string
  onSelect: (id: string) => void
  children: React.ReactNode
  footer?: React.ReactNode
  sectionDescriptions?: Record<string, string>
  exitHref: string
  helpHref?: string
}

function NavItem({
  item,
  active,
  onSelect,
}: {
  item: SettingsNavItem
  active: boolean
  onSelect: (id: string) => void
}) {
  const Icon = item.icon
  const className = cn(
    'flex w-full cursor-pointer items-center gap-2.5 rounded-lg px-2.5 py-2 text-left text-sm transition-colors',
    active && !item.danger && 'bg-muted/80 font-medium text-foreground',
    active && item.danger && 'bg-destructive/10 font-medium text-destructive',
    !active && !item.danger && 'text-muted-foreground hover:bg-muted/60 hover:text-foreground',
    !active && item.danger && 'text-destructive/80 hover:bg-destructive/10 hover:text-destructive',
  )

  if (item.href) {
    return (
      <Link href={item.href} className={className}>
        <Icon className="h-4 w-4 shrink-0 opacity-80" />
        <span className="truncate">{item.label}</span>
      </Link>
    )
  }

  return (
    <button type="button" onClick={() => onSelect(item.id)} className={className}>
      <Icon className="h-4 w-4 shrink-0 opacity-80" />
      <span className="truncate">{item.label}</span>
    </button>
  )
}

export default function SettingsShell({
  groups,
  activeId,
  onSelect,
  children,
  footer,
  sectionDescriptions,
  exitHref,
  helpHref = '/install',
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

  const activeItem = useMemo(() => {
    for (const group of groups) {
      const item = group.items.find(i => i.id === activeId)
      if (item) return item
    }
    return null
  }, [groups, activeId])

  const activeDescription = activeItem ? sectionDescriptions?.[activeItem.id] : undefined
  const ActiveIcon = activeItem?.icon

  return (
    <div className="flex h-full min-h-0 flex-col bg-background">
      <header
        data-inline-guide="settings-page"
        className="flex h-12 shrink-0 items-center justify-between gap-4 border-b border-border bg-card px-4 md:px-6"
      >
        <div className="flex min-w-0 items-center gap-3">
          <Link
            href={exitHref}
            className="inline-flex shrink-0 cursor-pointer items-center gap-1.5 text-sm font-medium text-foreground transition-colors hover:text-muted-foreground"
          >
            <ArrowLeft className="h-4 w-4" />
            Settings
          </Link>

          {activeItem && ActiveIcon && (
            <>
              <span className="hidden h-4 w-px bg-border sm:block" aria-hidden />
              <div className="hidden min-w-0 items-center gap-2 sm:flex">
                <ActiveIcon className="h-4 w-4 shrink-0 text-muted-foreground" />
                <span className="truncate text-sm font-medium text-foreground">{activeItem.label}</span>
              </div>
            </>
          )}
        </div>

        <Link
          href={helpHref}
          className="inline-flex shrink-0 cursor-pointer items-center gap-1.5 text-sm text-muted-foreground transition-colors hover:text-foreground"
        >
          Help
          <HelpCircle className="h-4 w-4" />
        </Link>
      </header>

      <div className="flex min-h-0 flex-1">
        <aside className="flex w-[248px] shrink-0 flex-col border-r border-border bg-muted/20">
          <div className="p-3">
            <div className="relative">
              <Search className="absolute left-2.5 top-1/2 h-3.5 w-3.5 -translate-y-1/2 text-muted-foreground" />
              <Input
                value={q}
                onChange={e => setQ(e.target.value)}
                placeholder="Search settings"
                className="h-9 border-border bg-background pl-8 text-sm shadow-none placeholder:text-muted-foreground focus-visible:ring-primary/30 dark:border-sidebar-border dark:bg-secondary/50"
              />
            </div>
          </div>

          <nav className="scrollbar-minimal flex-1 space-y-6 overflow-y-auto px-2 py-4">
            {filtered.map(group => (
              <div key={group.label}>
                <p className="mb-1 px-2 text-[11px] font-medium text-muted-foreground">
                  {group.label}
                </p>
                <ul className="space-y-0.5">
                  {group.items.map(item => (
                    <li key={item.id}>
                      <NavItem
                        item={item}
                        active={!item.href && activeId === item.id}
                        onSelect={onSelect}
                      />
                    </li>
                  ))}
                </ul>
              </div>
            ))}
          </nav>

          {footer && (
            <div className="shrink-0 space-y-1 border-t border-border p-3">
              {footer}
            </div>
          )}
        </aside>

        <main className="scrollbar-minimal min-w-0 flex-1 overflow-y-auto bg-background">
          <div className="mx-auto w-full max-w-3xl px-6 py-8 md:px-10 md:py-10">
            {activeItem && (
              <div className="mb-8 border-b border-border pb-6">
                <h1 className="text-xl font-semibold tracking-tight text-foreground">
                  {activeItem.label}
                </h1>
                {activeDescription && (
                  <p className="mt-1.5 text-sm leading-relaxed text-muted-foreground">
                    {activeDescription}
                  </p>
                )}
              </div>
            )}

            {children}
          </div>
        </main>
      </div>
    </div>
  )
}

/** Flat section block — matches reference settings detail rows. */
export function SettingsSection({
  title,
  description,
  children,
  action,
  className,
}: {
  title: string
  description?: string
  children: React.ReactNode
  action?: React.ReactNode
  className?: string
}) {
  return (
    <section className={cn('space-y-5 border-t border-border/80 pt-8 first:border-t-0 first:pt-0', className)}>
      <div className="flex items-start justify-between gap-3">
        <div>
          <h2 className="text-sm font-semibold text-foreground">{title}</h2>
          {description && (
            <p className="mt-1 text-sm leading-relaxed text-muted-foreground">{description}</p>
          )}
        </div>
        {action}
      </div>
      <div className="space-y-5">{children}</div>
    </section>
  )
}

export function SettingsRow({
  label,
  hint,
  children,
}: {
  label: string
  hint?: string
  children: React.ReactNode
}) {
  return (
    <div className="grid grid-cols-1 items-start gap-2 md:grid-cols-[minmax(0,200px)_1fr] md:gap-8">
      <div className="pt-0.5">
        <p className="text-sm font-medium text-foreground">{label}</p>
        {hint && <p className="mt-0.5 text-xs leading-snug text-muted-foreground">{hint}</p>}
      </div>
      <div className="min-w-0">{children}</div>
    </div>
  )
}
