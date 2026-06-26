import { cn } from '@/lib/utils'

export type MarketingSidebarFolder = {
  label: string
  active?: boolean
}

type MarketingSidebarFolderListProps = {
  folders: readonly MarketingSidebarFolder[]
  className?: string
}

/** Sidebar folder rows with a rounded tree spine — marketing dashboard mocks only. */
export default function MarketingSidebarFolderList({
  folders,
  className,
}: MarketingSidebarFolderListProps) {
  return (
    <div className={cn('mt-4', className)}>
      <p className="mb-1.5 px-2.5 text-[10px] font-semibold uppercase tracking-wider text-muted-foreground">
        Folders
      </p>
      <ul className="relative mx-2.5 lg:mx-3">
        {folders.map((folder, index) => {
          const isLast = index === folders.length - 1

          return (
            <li
              key={folder.label}
              className="relative flex min-h-[30px] items-center pl-5 lg:pl-6"
            >
              <span
                aria-hidden
                className={cn(
                  'pointer-events-none absolute left-2 w-2.5 border-[#E8DFD4] lg:left-2.5 lg:w-3',
                  isLast
                    ? 'top-0 h-[calc(50%+0.5px)] border-b border-l rounded-bl-[6px]'
                    : 'inset-y-0 border-l',
                )}
              />
              <span
                aria-hidden
                className="pointer-events-none absolute left-2 top-1/2 h-px w-2.5 -translate-y-1/2 bg-[#E8DFD4] lg:left-2.5 lg:w-3"
              />
              <div
                className={cn(
                  'min-w-0 flex-1 rounded-md py-1.5 pr-2 text-xs',
                  folder.active
                    ? 'bg-[#F1F1EF] font-semibold text-[#37352F]'
                    : 'text-muted-foreground',
                )}
              >
                {folder.label}
              </div>
            </li>
          )
        })}
      </ul>
    </div>
  )
}
