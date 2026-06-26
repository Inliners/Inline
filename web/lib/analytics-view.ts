const STORAGE_KEY = 'inline_analytics_view'

export type AnalyticsViewMode = 'charts' | 'insights'

export function loadAnalyticsView(): AnalyticsViewMode {
  if (typeof window === 'undefined') return 'charts'
  const v = localStorage.getItem(STORAGE_KEY)
  return v === 'insights' ? 'insights' : 'charts'
}

export function saveAnalyticsView(mode: AnalyticsViewMode) {
  localStorage.setItem(STORAGE_KEY, mode)
}
