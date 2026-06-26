'use client'

import { useEffect } from 'react'
import GettingStartedChecklist from '@/components/dashboard/GettingStartedChecklist'
import { ensureWelcomeDocument } from '@/lib/welcome-document'

interface Props {
  workspaceId: string
  captureCount: number
}

export default function DashboardOnboarding({ workspaceId, captureCount }: Props) {
  useEffect(() => {
    ensureWelcomeDocument(workspaceId)
  }, [workspaceId])

  return (
    <GettingStartedChecklist workspaceId={workspaceId} captureCount={captureCount} />
  )
}
