import ExtensionAskPanelMock from '@/components/marketing/productMocks/ExtensionAskPanelMock'
import ExtensionDockMock from '@/components/marketing/productMocks/ExtensionDockMock'
import ExtensionToolbarMock from '@/components/marketing/productMocks/ExtensionToolbarMock'
import { cn } from '@/lib/utils'

type ExtensionDockSceneMockProps = {
  className?: string
  showPage?: boolean
  showToolbar?: boolean
  badgeShape?: 'circle' | 'square'
}

export default function ExtensionDockSceneMock({
  className,
  showPage = true,
  showToolbar = true,
  badgeShape = 'circle',
}: ExtensionDockSceneMockProps) {
  return (
    <div
      className={cn(
        'relative flex min-h-[320px] flex-col overflow-hidden rounded-2xl border border-[#E8DFD4] bg-white p-5 md:min-h-[360px] md:p-6',
        className,
      )}
    >
      {showPage && (
        <div className="mb-4 space-y-1.5 opacity-40" aria-hidden>
          <div className="h-1.5 w-3/4 rounded bg-border" />
          <div className="h-1.5 w-full rounded bg-border/80" />
          <div className="h-1.5 w-5/6 rounded bg-border/60" />
          <div className="mt-2 h-1 w-full rounded bg-[#FEF08A]" />
          <div className="h-1 w-4/5 rounded bg-border/60" />
        </div>
      )}

      <div className="flex flex-col gap-4">
        {showToolbar && (
          <div className="flex justify-center">
            <ExtensionToolbarMock />
          </div>
        )}

        <div className="flex flex-1 items-start justify-end gap-3">
          <ExtensionAskPanelMock compact className="shrink-0" badgeShape={badgeShape} />
          <ExtensionDockMock className="shrink-0" />
        </div>
      </div>
    </div>
  )
}
