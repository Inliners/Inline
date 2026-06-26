'use client'

import { useState } from 'react'
import { AnalyticsModeShell } from '@/components/analytics/AnalyticsInsightsView'
import { loadAnalyticsView, saveAnalyticsView, type AnalyticsViewMode } from '@/lib/analytics-view'

interface Props {
  workspaceId: string
  charts: React.ReactNode
}

export default function AnalyticsPageClient({ workspaceId, charts }: Props) {
  const [mode, setMode] = useState<AnalyticsViewMode>(() => loadAnalyticsView())

  function handleModeChange(next: AnalyticsViewMode) {
    setMode(next)
    saveAnalyticsView(next)
  }

  return (
    <div className="h-full min-h-0">
      <AnalyticsModeShell
      mode={mode}
      onModeChange={handleModeChange}
      charts={charts}
      workspaceId={workspaceId}
    />
    </div>
  )
}
