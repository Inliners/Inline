export interface WorkspaceChatMessage {
  role: 'user' | 'assistant'
  content: string
  sources?: unknown[]
  mode?: string
  error?: boolean
}

export interface WorkspaceChatSession {
  id: string
  workspaceId: string
  title: string
  messages: WorkspaceChatMessage[]
  createdAt: number
  updatedAt: number
}

const STORAGE_KEY = 'inline-workspace-chat-sessions'
const MAX_SESSIONS_PER_WORKSPACE = 20
const DEFAULT_TITLE = 'New AI chat'

function storageKey(workspaceId: string) {
  return `${STORAGE_KEY}:${workspaceId}`
}

export function deriveChatTitle(messages: WorkspaceChatMessage[]): string {
  const firstUser = messages.find(m => m.role === 'user' && m.content.trim())
  if (!firstUser) return DEFAULT_TITLE

  const text = firstUser.content.trim().replace(/\s+/g, ' ')
  if (text.length <= 48) return text
  return `${text.slice(0, 48).trimEnd()}…`
}

export function createChatSession(workspaceId: string): WorkspaceChatSession {
  const now = Date.now()
  return {
    id: `chat-${now}-${Math.random().toString(36).slice(2, 8)}`,
    workspaceId,
    title: DEFAULT_TITLE,
    messages: [],
    createdAt: now,
    updatedAt: now,
  }
}

export function loadChatSessions(workspaceId: string): WorkspaceChatSession[] {
  if (typeof window === 'undefined') return []
  try {
    const raw = localStorage.getItem(storageKey(workspaceId))
    if (!raw) return []
    const parsed = JSON.parse(raw) as unknown
    if (!Array.isArray(parsed)) return []
    return parsed
      .filter((s): s is WorkspaceChatSession => {
        return !!s
          && typeof s === 'object'
          && typeof (s as WorkspaceChatSession).id === 'string'
          && Array.isArray((s as WorkspaceChatSession).messages)
      })
      .sort((a, b) => b.updatedAt - a.updatedAt)
  } catch {
    return []
  }
}

export function saveChatSessions(workspaceId: string, sessions: WorkspaceChatSession[]) {
  if (typeof window === 'undefined') return
  const trimmed = sessions
    .slice()
    .sort((a, b) => b.updatedAt - a.updatedAt)
    .slice(0, MAX_SESSIONS_PER_WORKSPACE)
  localStorage.setItem(storageKey(workspaceId), JSON.stringify(trimmed))
}

export function touchSession(
  session: WorkspaceChatSession,
  messages: WorkspaceChatMessage[],
): WorkspaceChatSession {
  return {
    ...session,
    messages,
    title: deriveChatTitle(messages),
    updatedAt: Date.now(),
  }
}
