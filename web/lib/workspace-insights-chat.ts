export interface WorkspaceInsightsChatMessage {
  role: 'user' | 'assistant'
  content: string
  sources?: unknown[]
  error?: boolean
}

const STORAGE_KEY = 'inline-workspace-insights-chat'
const MAX_MESSAGES = 80

function storageKey(workspaceId: string) {
  return `${STORAGE_KEY}:${workspaceId}`
}

function isValidMessage(value: unknown): value is WorkspaceInsightsChatMessage {
  if (!value || typeof value !== 'object') return false
  const m = value as WorkspaceInsightsChatMessage
  return (m.role === 'user' || m.role === 'assistant') && typeof m.content === 'string'
}

export function loadInsightsChatMessages(workspaceId: string): WorkspaceInsightsChatMessage[] {
  if (typeof window === 'undefined') return []
  try {
    const raw = localStorage.getItem(storageKey(workspaceId))
    if (!raw) return []
    const parsed = JSON.parse(raw) as unknown
    if (!Array.isArray(parsed)) return []
    return parsed.filter(isValidMessage)
  } catch {
    return []
  }
}

export function saveInsightsChatMessages(
  workspaceId: string,
  messages: WorkspaceInsightsChatMessage[],
) {
  if (typeof window === 'undefined') return
  const trimmed = messages.slice(-MAX_MESSAGES)
  localStorage.setItem(storageKey(workspaceId), JSON.stringify(trimmed))
}
