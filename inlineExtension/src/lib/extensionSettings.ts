import { normalizeInlineVoiceId } from './inlineVoicePresets'

export type ExtensionSettings = {
  apiBaseUrl: string
  accessToken: string
  blockedDomains: string[]
  focusMode: boolean
  voiceId: string
  screenReader: boolean
}

const DEFAULT_BASE = 'http://localhost:3000'

export async function loadSettings(): Promise<ExtensionSettings> {
  return new Promise(resolve => {
    chrome.storage.local.get(
      [
        'inlineApiBase', 'inlineAccessToken', 'inlineBlockedDomains', 'inlineFocusMode',
        'inlineVoiceId', 'inlineScreenReader',
      ],
      r => {
        let blockedDomains: string[] = []
        try {
          const raw = r.inlineBlockedDomains
          if (typeof raw === 'string') blockedDomains = JSON.parse(raw)
        } catch { /* invalid JSON, keep default */ }

        resolve({
          apiBaseUrl: typeof r.inlineApiBase === 'string' && r.inlineApiBase ? r.inlineApiBase : DEFAULT_BASE,
          accessToken: typeof r.inlineAccessToken === 'string' ? r.inlineAccessToken : '',
          blockedDomains: Array.isArray(blockedDomains) ? blockedDomains : [],
          focusMode: r.inlineFocusMode === 'true' || r.inlineFocusMode === true,
          voiceId: normalizeInlineVoiceId(
            typeof r.inlineVoiceId === 'string' ? r.inlineVoiceId : undefined,
          ),
          screenReader: r.inlineScreenReader === 'true' || r.inlineScreenReader === true,
        })
      },
    )
  })
}

export async function saveSettings(s: Partial<ExtensionSettings>): Promise<void> {
  const patch: Record<string, string> = {}
  if (s.apiBaseUrl !== undefined) patch.inlineApiBase = s.apiBaseUrl.replace(/\/$/, '')
  if (s.accessToken !== undefined) patch.inlineAccessToken = s.accessToken
  if (s.blockedDomains !== undefined) patch.inlineBlockedDomains = JSON.stringify(s.blockedDomains)
  if (s.focusMode !== undefined) patch.inlineFocusMode = String(s.focusMode)
  if (s.voiceId !== undefined) patch.inlineVoiceId = normalizeInlineVoiceId(s.voiceId)
  if (s.screenReader !== undefined) patch.inlineScreenReader = String(s.screenReader)
  await chrome.storage.local.set(patch)
}

/** One-time cleanup: remove the legacy user-pasted ElevenLabs key from storage. */
export async function purgeLegacySecrets(): Promise<void> {
  try {
    await chrome.storage.local.remove(['inlineElevenLabsKey'])
  } catch { /* ignore */ }
}
