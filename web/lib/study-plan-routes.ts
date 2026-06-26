import { workspacePath } from '@/lib/workspace-routes'
import type { KnowledgeTopic } from '@/components/documents/KnowledgeCardDeck'

export type StudyPlanRoute = 'doc' | 'folder' | 'library'

export function studyPlanPath(
  workspaceId: string,
  docId: string,
  opts?: {
    route?: StudyPlanRoute
    folderId?: string
    topic?: KnowledgeTopic
  },
): string {
  const route = opts?.route ?? 'doc'
  const folderId = opts?.folderId
  const base =
    route === 'library'
      ? workspacePath(workspaceId, 'library', docId, 'study')
      : route === 'folder' && folderId
        ? workspacePath(workspaceId, 'folder', folderId, 'doc', docId, 'study')
        : workspacePath(workspaceId, 'doc', docId, 'study')

  return opts?.topic ? `${base}?topic=${opts.topic}` : base
}

export function docPathForStudy(
  workspaceId: string,
  docId: string,
  route: StudyPlanRoute,
  folderId?: string,
): string {
  if (route === 'library') return workspacePath(workspaceId, 'library', docId)
  if (route === 'folder' && folderId) {
    return workspacePath(workspaceId, 'folder', folderId, 'doc', docId)
  }
  return workspacePath(workspaceId, 'doc', docId)
}
