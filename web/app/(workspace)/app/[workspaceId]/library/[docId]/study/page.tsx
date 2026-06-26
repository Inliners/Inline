import { Suspense } from 'react'
import { Loader2 } from 'lucide-react'
import LibraryStudyPlanPage from '@/components/documents/LibraryStudyPlanPage'

export default function LibraryStudyPlanRoute() {
  return (
    <Suspense
      fallback={(
        <div className="flex h-40 items-center justify-center">
          <Loader2 className="h-5 w-5 animate-spin text-muted-foreground" />
        </div>
      )}
    >
      <LibraryStudyPlanPage />
    </Suspense>
  )
}
