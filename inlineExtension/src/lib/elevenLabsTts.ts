import { loadSettings } from './extensionSettings'
import { normalizeInlineVoiceId } from './inlineVoicePresets'

/**
 * Read-aloud resolution order:
 *
 *   1. Proxy through the dashboard's /api/tts via the background service
 *      worker. The ElevenLabs key lives ONLY in the server env — it never
 *      ships in the extension bundle, chrome.storage, or any request from
 *      the extension.
 *   2. `window.speechSynthesis` — the browser's built-in voice. Always
 *      available, needs no keys, and keeps read-aloud working when the
 *      server route is unreachable or cloud TTS is unavailable.
 *
 * The only audible surface a caller needs is `speakWithElevenLabs`; it
 * walks the list in order and stops on the first success. Callers can pass
 * `onFallback` to tell the user the browser voice is being used.
 */

type PlaybackHandle =
  | { kind: 'audio'; el: HTMLAudioElement }
  | { kind: 'utterance'; utterance: SpeechSynthesisUtterance }

let currentPlayback: PlaybackHandle | null = null

export function stopSpeaking(): void {
  if (!currentPlayback) return
  if (currentPlayback.kind === 'audio') {
    try { currentPlayback.el.pause() } catch { /* ignore */ }
  } else if (currentPlayback.kind === 'utterance') {
    try { window.speechSynthesis.cancel() } catch { /* ignore */ }
  }
  currentPlayback = null
}

/** Pause/resume whatever is currently speaking. Returns the new paused state. */
export function togglePauseSpeaking(): boolean {
  if (!currentPlayback) return false
  if (currentPlayback.kind === 'audio') {
    const el = currentPlayback.el
    if (el.paused) { void el.play(); return false }
    el.pause(); return true
  }
  const synth = window.speechSynthesis
  if (synth.paused) { synth.resume(); return false }
  synth.pause(); return true
}

export function isSpeaking(): boolean {
  return currentPlayback !== null
}

function playBlobUrl(url: string, opts?: { onEnd?: () => void }) {
  const audio = new Audio(url)
  currentPlayback = { kind: 'audio', el: audio }
  audio.onended = () => {
    URL.revokeObjectURL(url)
    currentPlayback = null
    opts?.onEnd?.()
  }
  audio.onerror = () => {
    URL.revokeObjectURL(url)
    currentPlayback = null
    opts?.onEnd?.()
  }
  void audio.play()
}

/** Proxy through the dashboard so the server's ELEVENLABS_API_KEY is used. */
function ttsViaBackground(
  text: string,
  voiceId: string,
  opts?: { onStart?: () => void; onEnd?: () => void },
): Promise<boolean> {
  return new Promise((resolve) => {
    if (typeof chrome === 'undefined' || !chrome.runtime?.sendMessage) {
      resolve(false)
      return
    }
    chrome.runtime.sendMessage(
      { type: 'INLINE_TTS', payload: { text, voiceId } },
      (response: { ok?: boolean; audioBase64?: string; mimeType?: string; error?: string } | undefined) => {
        if (chrome.runtime.lastError) {
          resolve(false)
          return
        }
        if (!response?.ok || !response.audioBase64) {
          resolve(false)
          return
        }
        try {
          opts?.onStart?.()
          const binary = atob(response.audioBase64)
          const bytes = new Uint8Array(binary.length)
          for (let i = 0; i < binary.length; i++) bytes[i] = binary.charCodeAt(i)
          const blob = new Blob([bytes], { type: response.mimeType || 'audio/mpeg' })
          const url = URL.createObjectURL(blob)
          playBlobUrl(url, { onEnd: opts?.onEnd })
          resolve(true)
        } catch {
          resolve(false)
        }
      },
    )
  })
}

/**
 * Final fallback: the browser's built-in speech synthesis. Has no quota, no
 * keys, and works offline in every modern browser, so the read-aloud
 * feature is functional even when the cloud voice is unavailable.
 */
function ttsViaBrowserSynth(
  text: string,
  opts?: { onStart?: () => void; onEnd?: () => void },
): boolean {
  try {
    if (typeof window === 'undefined' || !window.speechSynthesis) return false
    const synth = window.speechSynthesis
    const utter = new SpeechSynthesisUtterance(text)
    utter.rate = 1
    utter.pitch = 1
    // Prefer an English voice when one is available so the output matches
    // the typical dashboard audience. We silently accept whatever the user
    // has installed if none match.
    const voices = synth.getVoices()
    const preferred = voices.find(v => /en(-|_)?(US|GB)?/i.test(v.lang))
    if (preferred) utter.voice = preferred

    utter.onstart = () => { opts?.onStart?.() }
    utter.onend = () => {
      currentPlayback = null
      opts?.onEnd?.()
    }
    utter.onerror = () => {
      currentPlayback = null
      opts?.onEnd?.()
    }

    currentPlayback = { kind: 'utterance', utterance: utter }
    synth.speak(utter)
    return true
  } catch {
    return false
  }
}

export async function speakWithElevenLabs(
  text: string,
  opts?: { onStart?: () => void; onEnd?: () => void; onFallback?: () => void },
): Promise<void> {
  stopSpeaking()

  const trimmed = text.slice(0, 2000)
  if (!trimmed.trim()) return

  const { voiceId: rawVoiceId } = await loadSettings()
  const voiceId = normalizeInlineVoiceId(rawVoiceId)

  // 1. Secure server proxy (server-side key, never exposed to the client).
  if (await ttsViaBackground(trimmed, voiceId, opts)) return

  // 2. Browser speech synthesis — guaranteed to work offline, no keys.
  opts?.onFallback?.()
  if (ttsViaBrowserSynth(trimmed, opts)) return

  // Nothing produced audio. Fire onEnd so callers that were waiting on the
  // promise chain can unblock their UI state.
  opts?.onEnd?.()
}
