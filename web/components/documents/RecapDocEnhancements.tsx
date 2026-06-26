'use client'

import type { Note } from '@/lib/types'
import { studyPlanPath, type StudyPlanRoute } from '@/lib/study-plan-routes'
import TestKnowledgePromo from './TestKnowledgePromo'

interface Props {
  workspaceId: string
  docId: string
  folderId: string
  notes: Note[]
  studyRoute?: StudyPlanRoute
}

export default function RecapDocEnhancements({
  workspaceId,
  docId,
  folderId,
  notes,
  studyRoute = 'doc',
}: Props) {
  if (notes.length === 0) return null

  return (
    <TestKnowledgePromo
      studyPlanHref={topic =>
        studyPlanPath(workspaceId, docId, { route: studyRoute, folderId, topic })
      }
    />
  )
}
