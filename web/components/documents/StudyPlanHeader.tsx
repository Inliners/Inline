'use client'

import Link from 'next/link'
import { ChevronRight } from 'lucide-react'
import { workspacePath } from '@/lib/workspace-routes'

interface StudyPlanHeaderProps {
  workspaceId: string
  workspaceName: string
  folderId: string
  folderName: string
  docTitle: string
  docHref: string
}

export default function StudyPlanHeader({
  workspaceId,
  workspaceName,
  folderId,
  folderName,
  docTitle,
  docHref,
}: StudyPlanHeaderProps) {
  const displayDocTitle = docTitle.trim() || 'Untitled'
  const studyTitle = `${displayDocTitle} study plan`

  return (
    <header className="mb-8 space-y-4">
      <nav aria-label="Breadcrumb" className="flex items-center justify-between gap-4">
        <div className="flex min-w-0 flex-wrap items-center gap-1.5 text-sm">
          <Link
            href={workspacePath(workspaceId, 'dashboard')}
            className="shrink-0 text-muted-foreground transition-colors hover:text-foreground"
          >
            {workspaceName}
          </Link>
          <ChevronRight className="h-3.5 w-3.5 shrink-0 text-muted-foreground/50" aria-hidden />
          <Link
            href={workspacePath(workspaceId, 'folder', folderId)}
            className="shrink-0 text-muted-foreground transition-colors hover:text-foreground"
          >
            {folderName}
          </Link>
          <ChevronRight className="h-3.5 w-3.5 shrink-0 text-muted-foreground/50" aria-hidden />
          <Link
            href={docHref}
            className="min-w-0 max-w-[12rem] truncate text-muted-foreground transition-colors hover:text-foreground sm:max-w-xs"
          >
            {displayDocTitle}
          </Link>
          <ChevronRight className="h-3.5 w-3.5 shrink-0 text-muted-foreground/50" aria-hidden />
          <span className="shrink-0 font-medium text-foreground">Study plan</span>
        </div>
      </nav>

      <div className="space-y-2">
        <h1 className="text-3xl font-semibold tracking-tight text-foreground leading-tight">
          {studyTitle}
        </h1>
        <p className="text-sm text-muted-foreground">
          Active recall from your captures — pick a focus, flip three cards.
        </p>
      </div>
    </header>
  )
}
