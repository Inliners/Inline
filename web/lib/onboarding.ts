const STORAGE_KEY = 'inline_onboarding_v1'

export type OnboardingState = {
  dismissed?: boolean
  installClicked?: boolean
  welcomeSeeded?: boolean
}

type Store = Record<string, OnboardingState>

function loadStore(): Store {
  if (typeof window === 'undefined') return {}
  try {
    const raw = localStorage.getItem(STORAGE_KEY)
    return raw ? (JSON.parse(raw) as Store) : {}
  } catch {
    return {}
  }
}

function saveStore(store: Store) {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(store))
}

export function loadOnboarding(workspaceId: string): OnboardingState {
  return loadStore()[workspaceId] ?? {}
}

export function patchOnboarding(workspaceId: string, patch: Partial<OnboardingState>) {
  const store = loadStore()
  store[workspaceId] = { ...store[workspaceId], ...patch }
  saveStore(store)
}

export function hasAskedAiInWorkspace(workspaceId: string): boolean {
  if (typeof window === 'undefined') return false
  try {
    const raw = localStorage.getItem(`inline-workspace-chat-sessions:${workspaceId}`)
    if (!raw) return false
    const sessions = JSON.parse(raw) as { messages?: { role?: string }[] }[]
    if (!Array.isArray(sessions)) return false
    return sessions.some(s =>
      Array.isArray(s.messages) && s.messages.some(m => m.role === 'user' && String(m).length > 0),
    )
  } catch {
    return false
  }
}

/** Re-read chat sessions with proper shape. */
export function workspaceHasUserChat(workspaceId: string): boolean {
  if (typeof window === 'undefined') return false
  try {
    const raw = localStorage.getItem(`inline-workspace-chat-sessions:${workspaceId}`)
    if (!raw) return false
    const sessions = JSON.parse(raw) as { messages?: { role?: string; content?: string }[] }[]
    if (!Array.isArray(sessions)) return false
    return sessions.some(s =>
      Array.isArray(s.messages) &&
      s.messages.some(m => m.role === 'user' && typeof m.content === 'string' && m.content.trim().length > 0),
    )
  } catch {
    return false
  }
}

export function isOnboardingComplete(
  workspaceId: string,
  captureCount: number,
): boolean {
  const state = loadOnboarding(workspaceId)
  if (state.dismissed) return true
  const installDone = !!state.installClicked
  const captureDone = captureCount > 0
  const askDone = workspaceHasUserChat(workspaceId)
  return installDone && captureDone && askDone
}
