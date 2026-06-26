import { FileText, Sparkles, Star } from 'lucide-react'
import { DEMO_LIBRARY_DOCS } from '@/components/marketing/productMocks/sampleData'
import { cn, formatDisplayTitle } from '@/lib/utils'

type LibraryDocumentsMockProps = {
  className?: string
  limit?: number
}

export default function LibraryDocumentsMock({ className, limit = 4 }: LibraryDocumentsMockProps) {
  const docs = DEMO_LIBRARY_DOCS.slice(0, limit)

  return (
    <div className={cn('flex gap-4 overflow-x-auto overflow-y-hidden pb-2 scrollbar-minimal', className)}>
      {docs.map(doc => (
        <div
          key={doc.title}
          className="relative flex h-40 w-[240px] shrink-0 snap-start flex-col justify-between rounded-2xl border border-border bg-card p-5"
        >
          <Star className="absolute right-3 top-3 h-4 w-4 text-muted-foreground/40" aria-hidden />
          <div>
            <p className="line-clamp-1 pr-6 text-base font-semibold tracking-tight text-foreground">
              {formatDisplayTitle(doc.title)}
            </p>
            <p className="mt-1 line-clamp-2 text-xs text-muted-foreground">{doc.preview}</p>
          </div>
          <div className="mt-4 flex items-center justify-between gap-2">
            {doc.autoRecap ? (
              <span className="inline-flex shrink-0 items-center gap-1 rounded-full bg-amber-500/10 px-2 py-0.5 text-[10px] font-medium text-amber-700">
                <Sparkles className="h-2.5 w-2.5" aria-hidden />
                Auto-recap
              </span>
            ) : (
              <span className="inline-flex items-center gap-1 text-[10px] text-muted-foreground">
                <FileText className="h-3 w-3" aria-hidden />
                Document
              </span>
            )}
            <span className="shrink-0 truncate text-[10px] text-muted-foreground">
              {'folder' in doc && doc.folder ? `${doc.folder} · ${doc.time}` : doc.time}
            </span>
          </div>
        </div>
      ))}
    </div>
  )
}
