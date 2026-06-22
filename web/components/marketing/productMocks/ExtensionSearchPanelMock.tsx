import { IconSearch } from '@/components/marketing/extensionToolIcons'
import {
  ExtensionPanelShellMock,
  ExtensionSegmentedMock,
} from '@/components/marketing/productMocks/ExtensionPanelShellMock'
import { cn } from '@/lib/utils'

const RESULTS = [
  {
    title: 'Cable-stayed bridge design',
    snippet: 'Towers carry deck loads directly through stay cables rather than anchorages…',
    url: 'engineering.org',
  },
  {
    title: 'Suspension bridge',
    snippet: 'The deck hangs from main cables anchored at both ends…',
    url: 'en.wikipedia.org',
  },
] as const

type ExtensionSearchPanelMockProps = {
  className?: string
}

export default function ExtensionSearchPanelMock({ className }: ExtensionSearchPanelMockProps) {
  return (
    <ExtensionPanelShellMock
      title="Search"
      subtitle="Find your notes & annotations"
      tool="search"
      width={332}
      className={cn('min-h-[360px]', className)}
    >
      <div className="flex flex-col gap-3 p-[18px] pb-4">
        <div className="flex h-11 items-center gap-2.5 rounded-[14px] border-[1.5px] border-[#1C1E26] bg-[#F7F7F5] px-3.5 shadow-[0_0_0_3px_rgba(11,23,53,0.06)]">
          <span className="text-muted-foreground">
            <IconSearch size={18} />
          </span>
          <span className="text-sm text-foreground">bridge load paths</span>
        </div>
        <ExtensionSegmentedMock
          options={[
            { value: 'page', label: 'This page' },
            { value: 'all', label: 'All pages' },
          ]}
          value="page"
        />
      </div>

      <div className="space-y-2 px-4 pb-4">
        {RESULTS.map(result => (
          <div
            key={result.title}
            className="rounded-2xl border border-border bg-[#F7F7F5] px-3.5 py-3"
          >
            <p className="text-[12.5px] font-bold tracking-tight text-foreground">{result.title}</p>
            <p className="mt-1 text-[11.5px] leading-relaxed text-muted-foreground">{result.snippet}</p>
            <p className="mt-1.5 truncate text-[10.5px] text-muted-foreground/80">{result.url}</p>
          </div>
        ))}
      </div>
    </ExtensionPanelShellMock>
  )
}
