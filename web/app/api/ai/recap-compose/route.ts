import { NextResponse } from 'next/server'
import { generateText } from 'ai'
import { createGoogleGenerativeAI } from '@ai-sdk/google'
import { getAIApiKey, getSupabaseAndUserFromRequest } from '@/lib/ai-key'
import { INLINE_SHORT_PERSONA } from '@/lib/inline-persona'

/**
 * POST /api/ai/recap-compose
 * Body: { pageTitle, pageUrl, captures: string }
 * Returns: { paragraph?: string, bullets?: string[] }
 */
export async function POST(request: Request) {
  const { user, supabase } = await getSupabaseAndUserFromRequest(request)
  if (!user || !supabase) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  let pageTitle = ''
  let pageUrl = ''
  let captures = ''
  try {
    const body = await request.json()
    pageTitle = typeof body.pageTitle === 'string' ? body.pageTitle : ''
    pageUrl = typeof body.pageUrl === 'string' ? body.pageUrl : ''
    captures = typeof body.captures === 'string' ? body.captures : ''
  } catch {
    return NextResponse.json({ error: 'Invalid JSON' }, { status: 400 })
  }

  if (!captures.trim()) {
    return NextResponse.json({ paragraph: '', bullets: [] })
  }

  const apiKey = await getAIApiKey()
  if (!apiKey) {
    return NextResponse.json({ error: 'No AI API key configured.' }, { status: 403 })
  }

  const google = createGoogleGenerativeAI({ apiKey })
  const prompt = [
    `Compose a short overview for a recap document about: ${pageTitle} (${pageUrl}).`,
    '',
    'Return ONLY valid JSON with this shape:',
    '{"paragraph":"2-4 sentence overview in plain prose","bullets":["3-6 concise bullet strings"]}',
    '',
    'Rules:',
    '- Use only facts present in the captures below.',
    '- Bullets should be scannable key takeaways, not walls of text.',
    '- Do not invent statistics or quotes.',
  ].join('\n')

  try {
    const { text } = await generateText({
      model: google('gemini-2.5-flash'),
      system: INLINE_SHORT_PERSONA,
      prompt: `${prompt}\n\nCaptures:\n${captures.slice(0, 12000)}`,
    })

    const raw = text.trim()
    const jsonMatch = raw.match(/\{[\s\S]*\}/)
    if (!jsonMatch) {
      return NextResponse.json({ paragraph: raw.slice(0, 600), bullets: [] })
    }

    const parsed = JSON.parse(jsonMatch[0]) as { paragraph?: string; bullets?: unknown }
    const bullets = Array.isArray(parsed.bullets)
      ? parsed.bullets.filter((b): b is string => typeof b === 'string' && b.trim().length > 0).slice(0, 8)
      : []

    return NextResponse.json({
      paragraph: typeof parsed.paragraph === 'string' ? parsed.paragraph.trim() : '',
      bullets,
    })
  } catch (err) {
    console.error('[recap-compose] AI error:', err)
    return NextResponse.json({ error: 'AI request failed.' }, { status: 500 })
  }
}
