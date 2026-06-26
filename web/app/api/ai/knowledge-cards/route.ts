import { NextResponse } from 'next/server'
import { generateText } from 'ai'
import { createGoogleGenerativeAI } from '@ai-sdk/google'
import { getAIApiKey, getSupabaseAndUserFromRequest } from '@/lib/ai-key'
import { INLINE_SHORT_PERSONA } from '@/lib/inline-persona'

const TOPICS = new Set(['interview', 'concepts', 'connections', 'gaps'])

const TOPIC_PROMPTS: Record<string, string> = {
  interview: 'Generate tough PM-style interview questions from the material. Front = question, back = concise model answer grounded in the captures.',
  concepts: 'Extract key terms and definitions. Front = term, back = clear definition from the material.',
  connections: 'Show how ideas across captures relate. Front = relationship prompt, back = explanation tying sources together.',
  gaps: 'Surface what the notes do not cover yet. Front = gap or open question, back = what is missing or under-explored (lightweight, not exhaustive).',
}

export async function POST(request: Request) {
  const { user, supabase } = await getSupabaseAndUserFromRequest(request)
  if (!user || !supabase) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  let recapText = ''
  let notesText = ''
  let topic = 'interview'

  try {
    const body = await request.json()
    recapText = typeof body.recapText === 'string' ? body.recapText : ''
    notesText = typeof body.notes === 'string' ? body.notes : ''
    topic = typeof body.topic === 'string' ? body.topic : 'interview'
  } catch {
    return NextResponse.json({ error: 'Invalid JSON' }, { status: 400 })
  }

  if (!TOPICS.has(topic)) {
    return NextResponse.json({ error: 'Invalid topic' }, { status: 400 })
  }

  const combined = `${recapText}\n\n${notesText}`.trim()
  if (!combined) {
    return NextResponse.json({ error: 'recapText or notes required' }, { status: 400 })
  }

  const apiKey = await getAIApiKey()
  if (!apiKey) {
    return NextResponse.json({ error: 'No AI API key configured.' }, { status: 403 })
  }

  const google = createGoogleGenerativeAI({ apiKey })
  const instruction = TOPIC_PROMPTS[topic] ?? TOPIC_PROMPTS.interview!

  try {
    const { text } = await generateText({
      model: google('gemini-2.5-flash'),
      system: INLINE_SHORT_PERSONA,
      prompt: [
        instruction,
        '',
        'Return ONLY valid JSON:',
        '{"cards":[{"front":"string","back":"string","topic":"' + topic + '"}]}',
        '',
        'Rules:',
        '- Exactly 3 cards.',
        '- Use only facts from the material below.',
        '- Keep fronts short; backs scannable (2-4 sentences max).',
        '',
        'Material:',
        combined.slice(0, 14000),
      ].join('\n'),
    })

    const jsonMatch = text.trim().match(/\{[\s\S]*\}/)
    if (!jsonMatch) {
      return NextResponse.json({ error: 'Failed to parse cards' }, { status: 500 })
    }

    const parsed = JSON.parse(jsonMatch[0]) as {
      cards?: { front?: string; back?: string; topic?: string }[]
    }

    const cards = (parsed.cards ?? [])
      .filter(c => typeof c.front === 'string' && typeof c.back === 'string')
      .slice(0, 3)
      .map(c => ({
        front: c.front!.trim(),
        back: c.back!.trim(),
        topic,
      }))

    if (cards.length === 0) {
      return NextResponse.json({ error: 'No cards generated' }, { status: 500 })
    }

    return NextResponse.json({ cards })
  } catch (err) {
    console.error('[knowledge-cards] Error:', err)
    return NextResponse.json({ error: 'AI request failed.' }, { status: 500 })
  }
}
