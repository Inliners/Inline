import { Suspense } from 'react'
import { Loader2 } from 'lucide-react'
import StudyPlanPage from '@/components/documents/StudyPlanPage'

export default function FolderDocStudyPlanRoute() {
  return (
    <Suspense
      fallback={(
        <div className="flex h-40 items-center justify-center">
          <Loader2 className="h-5 w-5 animate-spin text-muted-foreground" />
        </div>
      )}
    >
      <StudyPlanPage route="folder" />
    </Suspense>
  )
}
