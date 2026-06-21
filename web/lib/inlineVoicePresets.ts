/** ElevenLabs voices used across the dashboard and extension (no browser TTS). */

export type InlineVoicePreset = {
  id: string
  name: string
  subtitle: string
  gender: 'female' | 'male'
  tier?: 'free' | 'paid'
}

// Order matters: the first entry is the default. We put free-tier "premade"
// voices first so read-aloud works out of the box on accounts without an
// ElevenLabs paid subscription. The "professional" voices below only work on
// paid plans (API returns 402 paid_plan_required on the free tier).
export const INLINE_VOICE_PRESETS: InlineVoicePreset[] = [
  { id: 'JBFqnCBsd6RMkjVDRZzb', name: 'George',  subtitle: 'Warm, captivating storyteller',   gender: 'male',   tier: 'free' },
  { id: 'EXAVITQu4vr4xnSDxMaL', name: 'Sarah',   subtitle: 'Mature, reassuring, confident',   gender: 'female', tier: 'free' },
  { id: 'Xb7hH8MSUJpSbSDYk0k2', name: 'Alice',   subtitle: 'Clear, engaging educator',        gender: 'female', tier: 'free' },
  { id: 'onwK4e9ZLuTAKqWW03F9', name: 'Daniel',  subtitle: 'Steady broadcaster',              gender: 'male',   tier: 'free' },
  { id: 'A9hvW90SK1w1iyI1xxf9', name: 'Lilian',  subtitle: 'Warm, clear & hybrid (paid)',     gender: 'female', tier: 'paid' },
  { id: 'sNKKDngZymUvjZVKvNU1', name: 'Tyler',   subtitle: 'Primary teaching voice (paid)',   gender: 'male',   tier: 'paid' },
  { id: 'klfRFkxouVP3bt55Whp3', name: 'Joseph',  subtitle: 'Clear, smooth & friendly (paid)', gender: 'male',   tier: 'paid' },
  { id: 'UQoLnPXvf18gaKpLzfb8', name: 'Sawyer',  subtitle: 'Calm, measured & serious (paid)', gender: 'male',   tier: 'paid' },
]

export const DEFAULT_INLINE_VOICE_ID = INLINE_VOICE_PRESETS[0]!.id

const ALLOWED = new Set(INLINE_VOICE_PRESETS.map(v => v.id))

export function isAllowedInlineVoiceId(id: string): boolean {
  return ALLOWED.has(id)
}

export function normalizeInlineVoiceId(id: string | null | undefined): string {
  if (id && ALLOWED.has(id)) return id
  return DEFAULT_INLINE_VOICE_ID
}
