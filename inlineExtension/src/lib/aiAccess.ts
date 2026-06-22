const DEVICE_KEY = 'inlineGuestDeviceId'
const USAGE_KEY = 'inlineGuestAiUsage'

export const GUEST_AI_LIMIT = 10

type GuestUsage = {
  used: number
  updatedAt: number
}

export type AiReservation = {
  allowed: boolean
  signedIn: boolean
  deviceId: string
  used: number
  remaining: number
}

export function looksLikeJwt(value: unknown): boolean {
  if (typeof value !== 'string') return false
  const parts = value.split('.')
  return parts.length === 3 && parts.every(part => part.length > 0)
}

function makeDeviceId(): string {
  try {
    return crypto.randomUUID()
  } catch {
    return `guest-${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 10)}`
  }
}

async function getDeviceId(): Promise<string> {
  const stored = await chrome.storage.local.get([DEVICE_KEY])
  const current = typeof stored[DEVICE_KEY] === 'string' ? stored[DEVICE_KEY] : ''
  if (current) return current
  const next = makeDeviceId()
  await chrome.storage.local.set({ [DEVICE_KEY]: next })
  return next
}

function readUsage(value: unknown): GuestUsage {
  if (!value || typeof value !== 'object') return { used: 0, updatedAt: 0 }
  const record = value as Partial<GuestUsage>
  return {
    used: typeof record.used === 'number' && Number.isFinite(record.used) ? Math.max(0, record.used) : 0,
    updatedAt: typeof record.updatedAt === 'number' ? record.updatedAt : 0,
  }
}

export async function getAiAccessState(): Promise<AiReservation> {
  const [stored, deviceId] = await Promise.all([
    chrome.storage.local.get(['inlineAccessToken', USAGE_KEY]),
    getDeviceId(),
  ])
  const signedIn = looksLikeJwt(stored.inlineAccessToken)
  const usage = readUsage(stored[USAGE_KEY])
  return {
    allowed: signedIn || usage.used < GUEST_AI_LIMIT,
    signedIn,
    deviceId,
    used: usage.used,
    remaining: signedIn ? Number.POSITIVE_INFINITY : Math.max(0, GUEST_AI_LIMIT - usage.used),
  }
}

export async function reserveAiPrompt(): Promise<AiReservation> {
  const state = await getAiAccessState()
  if (state.signedIn || !state.allowed) return state

  const nextUsed = state.used + 1
  await chrome.storage.local.set({ [USAGE_KEY]: { used: nextUsed, updatedAt: Date.now() } })
  return {
    ...state,
    used: nextUsed,
    remaining: Math.max(0, GUEST_AI_LIMIT - nextUsed),
  }
}
