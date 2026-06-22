import type { ReactNode } from 'react'
import { X } from 'lucide-react'
import { InlineChatIcon } from '@/components/ui/inline-chat-icon'
import {
  renderHeroToolIcon,
  type ToolId,
} from '@/components/marketing/extensionToolIcons'
import { product } from '@/components/marketing/marketingSurfaces'
import { cn } from '@/lib/utils'

export function ExtensionToolHeaderIcon({ tool }: { tool: ToolId }) {
  if (tool === 'ai') {
    return <InlineChatIcon size="md" variant="badge" />
  }
  return (
    <span className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-[#12203f] text-white">
      <span className="[&>svg]:h-[13px] [&>svg]:w-[13px]">{renderHeroToolIcon(tool, 13)}</span>
    </span>
  )
}

type ExtensionPanelShellMockProps = {
  title: string
  subtitle?: string
  chip?: string
  tool?: ToolId
  useChatBrand?: boolean
  width?: number
  className?: string
  footer?: ReactNode
  children: ReactNode
}

export function ExtensionPanelShellMock({
  title,
  subtitle,
  chip,
  tool,
  useChatBrand = false,
  width = 342,
  className,
  footer,
  children,
}: ExtensionPanelShellMockProps) {
  return (
    <div
      className={cn(
        'flex w-full flex-col overflow-hidden rounded-[14px] border border-border bg-card font-sans',
        className,
      )}
      style={{ width: '100%', maxWidth: width, boxShadow: product.panelShadow }}
    >
      <header className="flex min-h-14 shrink-0 items-center justify-between bg-card pl-5 pr-4">
        <div className="flex min-w-0 flex-1 items-center gap-2.5">
          {useChatBrand || tool === 'ai' ? (
            <InlineChatIcon size="md" variant="badge" />
          ) : tool ? (
            <ExtensionToolHeaderIcon tool={tool} />
          ) : null}
          <div className="min-w-0">
            <p className="truncate text-sm font-medium tracking-tight text-foreground">{title}</p>
            {subtitle && (
              <p className="truncate text-xs text-muted-foreground">{subtitle}</p>
            )}
          </div>
          {chip && (
            <span className="shrink-0 rounded-full bg-muted px-2 py-0.5 text-[10px] font-semibold text-muted-foreground">
              {chip}
            </span>
          )}
        </div>
        <button
          type="button"
          className="flex h-[30px] w-[30px] shrink-0 items-center justify-center rounded-lg text-muted-foreground"
          aria-hidden
        >
          <X className="h-4 w-4" />
        </button>
      </header>

      <div className="min-h-0 flex-1">{children}</div>

      {footer && <footer className="shrink-0 border-t border-border/60 bg-card">{footer}</footer>}
    </div>
  )
}

export function ExtensionSectionLabel({ children }: { children: ReactNode }) {
  return <p className="mb-2 px-0.5 text-xs font-medium text-muted-foreground">{children}</p>
}

export function ExtensionActionTile({
  icon,
  label,
  desc,
  className,
}: {
  icon?: ReactNode
  label: string
  desc?: string
  className?: string
}) {
  return (
    <div
      className={cn(
        'flex w-full items-center gap-2.5 rounded-[10px] border border-border bg-[#F7F7F5] px-3 py-2.5 text-left',
        className,
      )}
    >
      {icon && (
        <span className="flex h-[30px] w-[30px] shrink-0 items-center justify-center rounded-lg bg-muted text-foreground">
          {icon}
        </span>
      )}
      <span className="min-w-0">
        <span className="block text-xs font-medium tracking-tight text-foreground">{label}</span>
        {desc && <span className="mt-0.5 block text-[11px] leading-snug text-muted-foreground">{desc}</span>}
      </span>
    </div>
  )
}

export function ExtensionSegmentedMock({
  options,
  value,
}: {
  options: { value: string; label: string }[]
  value: string
}) {
  return (
    <div className="flex gap-0.5 rounded-[10px] border border-border/60 bg-[#F4F4F2] p-1">
      {options.map(option => (
        <span
          key={option.value}
          className={cn(
            'flex-1 rounded-lg px-1 py-1.5 text-center text-xs font-medium',
            option.value === value
              ? 'bg-card font-semibold text-foreground'
              : 'text-muted-foreground',
          )}
        >
          {option.label}
        </span>
      ))}
    </div>
  )
}

export function ExtensionComposerMock({
  placeholder,
  modeLabel = 'Smart mode',
}: {
  placeholder: string
  modeLabel?: string
}) {
  return (
    <div className="overflow-hidden rounded-[10px] border border-[rgba(28,30,38,0.25)] bg-card shadow-[0_0_0_3px_rgba(75,131,196,0.10)]">
      <div className="flex min-h-[78px] flex-col px-3 py-2">
        <p className="text-sm text-muted-foreground">{placeholder}</p>
        <div className="mt-auto flex items-center justify-end gap-2">
          <span className="rounded-md bg-muted px-2 py-1 text-[10px] font-medium text-muted-foreground">
            {modeLabel}
          </span>
          <span className="flex h-8 w-8 items-center justify-center rounded-full bg-[#2f80ed] text-white opacity-90">
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" aria-hidden>
              <path d="M12 19V5M5 12l7-7 7 7" />
            </svg>
          </span>
        </div>
      </div>
    </div>
  )
}

export function ExtensionChipMock({ label }: { label: string }) {
  return (
    <span className="rounded-full border border-border bg-[#F7F7F5] px-3 py-1.5 text-xs font-medium text-foreground">
      {label}
    </span>
  )
}
