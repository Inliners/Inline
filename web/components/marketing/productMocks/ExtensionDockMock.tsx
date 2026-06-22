import InlineBrandGlyph from '@/components/marketing/InlineBrandGlyph'
import {
  IconAi,
  IconDraw,
  IconEyeOff,
  IconHighlight,
  IconMore,
  IconNotebook,
  IconRewrite,
  IconSearch,
} from '@/components/marketing/extensionToolIcons'
import { cn } from '@/lib/utils'

const DOCK_TOOLS = [
  { id: 'ai', icon: <IconAi size={16} /> },
  { id: 'rewrite', icon: <IconRewrite size={16} /> },
  { id: 'highlight', icon: <IconHighlight size={16} /> },
  { id: 'search', icon: <IconSearch size={16} /> },
  { id: 'more', icon: <IconMore size={16} /> },
  { id: 'draw', icon: <IconDraw size={16} /> },
] as const

type ExtensionDockMockProps = {
  className?: string
  showNotebook?: boolean
  activeIndex?: number
}

export default function ExtensionDockMock({
  className,
  showNotebook = true,
  activeIndex = 0,
}: ExtensionDockMockProps) {
  return (
    <div className={cn('flex flex-col items-center gap-1.5', className)}>
      <div
        className="flex h-10 w-10 items-center justify-center overflow-hidden rounded-[13px] border border-[rgba(17,24,39,0.18)]"
        style={{
          background: 'linear-gradient(145deg, #24386D 0%, #0B1735 58%, #071021 100%)',
        }}
      >
        <InlineBrandGlyph tile={false} />
      </div>
      <div className="flex flex-col gap-0.5 rounded-[17px] border border-border bg-card p-1.5">
        {DOCK_TOOLS.map((tool, i) => (
          <div
            key={tool.id}
            className={cn(
              'flex h-[34px] w-[34px] items-center justify-center rounded-[11px] text-muted-foreground transition-colors duration-300',
              i === activeIndex && 'bg-muted text-foreground ring-1 ring-[#a8a29e]',
            )}
          >
            {tool.icon}
          </div>
        ))}
        {showNotebook && (
          <>
            <div className="mx-1 my-0.5 h-px bg-border" />
            <div className="flex h-[34px] w-[34px] items-center justify-center rounded-[11px] text-muted-foreground">
              <IconNotebook size={16} />
            </div>
            <div className="flex h-[34px] w-[34px] items-center justify-center rounded-[11px] text-muted-foreground">
              <IconEyeOff size={16} />
            </div>
          </>
        )}
      </div>
    </div>
  )
}
