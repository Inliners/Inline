import type { InsightsStats } from '@/components/insights/InsightsSummary'

export type WorkspaceInsightsSummary = {
  narrative: string | null
  stats: InsightsStats | null
  updatedAt: number
}

const STORAGE_KEY = 'inline-workspace-insights-summary'

function storageKey(workspaceId: string) {
  return `${STORAGE_KEY}:${workspaceId}`
}

function isValidStats(value: unknown): value is InsightsStats {
  if (!value || typeof value !== 'object') return false
  const s = value as InsightsStats
  return typeof s.totalWeek === 'number'
    && typeof s.aiWeek === 'number'
    && Array.isArray(s.topDomains)
}

export function loadInsightsSummary(workspaceId: string): WorkspaceInsightsSummary | null {
  if (typeof window === 'undefined') return null
  try {
    const raw = localStorage.getItem(storageKey(workspaceId))
    if (!raw) return null
    const parsed = JSON.parse(raw) as unknown
    if (!parsed || typeof parsed !== 'object') return null
    const row = parsed as WorkspaceInsightsSummary
    if (typeof row.updatedAt !== 'number') return null
    if (row.narrative != null && typeof row.narrative !== 'string') return null
    if (row.stats != null && !isValidStats(row.stats)) return null
    return {
      narrative: row.narrative ?? null,
      stats: row.stats ?? null,
      updatedAt: row.updatedAt,
    }
  } catch {
    return null
  }
}

export function saveInsightsSummary(
  workspaceId: string,
  data: { narrative: string | null; stats: InsightsStats | null },
) {
  if (typeof window === 'undefined') return
  const payload: WorkspaceInsightsSummary = {
    narrative: data.narrative,
    stats: data.stats,
    updatedAt: Date.now(),
  }
  localStorage.setItem(storageKey(workspaceId), JSON.stringify(payload))
}
