import { NextRequest, NextResponse } from 'next/server'
import { normalizeInlineVoiceId } from '@/lib/inlineVoicePresets'
import { getSupabaseAndUserFromRequest } from '@/lib/ai-key'
import { checkRateLimit } from '@/lib/security/rateLimit'

/**
 * POST /api/tts — secure server-side ElevenLabs proxy.
 *
 * Security model:
 * - The ElevenLabs key lives ONLY in the server env (ELEVENLABS_API_KEY).
 *   Client-supplied keys are not accepted; the legacy x-elevenlabs-key
 *   header path was removed.
 * - Auth required: a Supabase cookie session (dashboard) or a Bearer JWT
 *   (extension background worker forwards the dashboard-synced token).
 * - Voice selection is restricted to the preset whitelist; unknown ids
 *   normalize to the default voice.
 * - Per-user rate limit + text length clamp keep quota abuse bounded.
 * - Upstream error details are logged server-side, never returned verbatim.
 *
 * Clients should fall back to window.speechSynthesis when this route fails.
 */

// Free-tier fallback (ElevenLabs "premade" category). Works on every plan.
const FREE_TIER_FALLBACK_VOICE_ID = 'JBFqnCBsd6RMkjVDRZzb' // George

const MAX_TEXT_CHARS = 3000
const RATE_LIMIT = { limit: 20, windowMs: 60_000 }

/**
 * CORS: same-origin needs no headers; the extension's background service
 * worker sends Origin chrome-extension://<id>. Only reflect those origins.
 */
function corsHeadersFor(req: NextRequest): Record<string, string> {
  const origin = req.headers.get('origin') ?? ''
  if (!origin.startsWith('chrome-extension://')) return {}
  return {
    'Access-Control-Allow-Origin': origin,
    'Access-Control-Allow-Methods': 'POST, OPTIONS',
    'Access-Control-Allow-Headers': 'Content-Type, Authorization',
    Vary: 'Origin',
  }
}

export async function OPTIONS(req: NextRequest) {
  return new NextResponse(null, { status: 204, headers: corsHeadersFor(req) })
}

export async function POST(req: NextRequest) {
  const cors = corsHeadersFor(req)
  try {
    const { user } = await getSupabaseAndUserFromRequest(req)
    if (!user) {
      return NextResponse.json(
        { error: 'Sign in to use cloud voices. Falling back to the browser voice is safe.' },
        { status: 401, headers: cors },
      )
    }

    const rate = checkRateLimit(`tts:${user.id}`, RATE_LIMIT)
    if (!rate.ok) {
      return NextResponse.json(
        { error: 'Too many read-aloud requests. Please wait a moment.' },
        { status: 429, headers: { ...cors, 'Retry-After': String(rate.retryAfterSeconds) } },
      )
    }

    let body: { text?: string; voiceId?: string; stability?: number; similarityBoost?: number }
    try {
      body = await req.json()
    } catch {
      return NextResponse.json({ error: 'Invalid JSON' }, { status: 400, headers: cors })
    }

    const text = typeof body.text === 'string' ? body.text.trim() : ''
    if (!text) {
      return NextResponse.json({ error: 'text is required' }, { status: 400, headers: cors })
    }

    const apiKey = process.env.ELEVENLABS_API_KEY?.trim() ?? ''
    if (!apiKey) {
      // 503 tells clients cloud TTS is unavailable so they switch to the
      // browser voice. No setup hints are leaked to end users.
      return NextResponse.json(
        { error: 'Cloud voice is not available right now. Using the browser voice instead.' },
        { status: 503, headers: cors },
      )
    }

    const vid = normalizeInlineVoiceId(body.voiceId)
    const trimmed = text.slice(0, MAX_TEXT_CHARS)
    const stability =
      typeof body.stability === 'number' && Number.isFinite(body.stability)
        ? Math.min(1, Math.max(0, body.stability))
        : 0.5
    const similarityBoost =
      typeof body.similarityBoost === 'number' && Number.isFinite(body.similarityBoost)
        ? Math.min(1, Math.max(0, body.similarityBoost))
        : 0.75

    const ttsBody = JSON.stringify({
      text: trimmed,
      model_id: 'eleven_multilingual_v2',
      voice_settings: { stability, similarity_boost: similarityBoost },
    })

    async function callEleven(voiceIdToUse: string) {
      return fetch(`https://api.elevenlabs.io/v1/text-to-speech/${voiceIdToUse}`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'xi-api-key': apiKey,
        },
        body: ttsBody,
      })
    }

    let elResp = await callEleven(vid)

    // Free-tier accounts cannot use professional/library voices and get 402.
    // Retry once with the free-tier fallback so read-aloud still plays.
    if (!elResp.ok && elResp.status === 402 && vid !== FREE_TIER_FALLBACK_VOICE_ID) {
      elResp = await callEleven(FREE_TIER_FALLBACK_VOICE_ID)
    }

    if (!elResp.ok) {
      const upstream = await elResp.text().catch(() => '')
      console.error('[tts] upstream error:', elResp.status, upstream.slice(0, 300))
      const status = elResp.status
      const friendly =
        status === 401 || status === 403
          ? 'The cloud voice service rejected the request. Using the browser voice instead.'
          : status === 402
            ? 'This voice requires a paid plan. Pick a free voice in Settings, or the browser voice will be used.'
            : status === 429
              ? 'The cloud voice service is busy. Please try again shortly.'
              : 'Cloud voice failed. Using the browser voice instead.'
      return NextResponse.json(
        { error: friendly },
        { status: status === 402 || status === 429 ? status : 502, headers: cors },
      )
    }

    const audioBuffer = await elResp.arrayBuffer()

    return new NextResponse(audioBuffer, {
      status: 200,
      headers: {
        'Content-Type': 'audio/mpeg',
        'Cache-Control': 'no-store',
        ...cors,
      },
    })
  } catch (e) {
    console.error('[tts] error:', e instanceof Error ? e.message : e)
    return NextResponse.json(
      { error: 'Cloud voice failed. Using the browser voice instead.' },
      { status: 500, headers: cors },
    )
  }
}
