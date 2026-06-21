import { NextResponse } from 'next/server'
import { generateText, streamText } from 'ai'
import { createGoogleGenerativeAI } from '@ai-sdk/google'
import { getAIApiKey, getSupabaseAndUserFromRequest } from '@/lib/ai-key'
import { INLINE_SHORT_PERSONA } from '@/lib/inline-persona'

export async function POST(request: Request) {
  const { user, supabase } = await getSupabaseAndUserFromRequest(request)
  if (!user || !supabase) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  let task = '', text = '', instruction = '', stream = false
  try {
    const body = await request.json()
    task        = body.task        ?? ''
    text        = body.text        ?? ''
    instruction = body.instruction ?? ''
    stream      = body.stream      === true
  } catch {
    return NextResponse.json({ error: 'Invalid JSON' }, { status: 400 })
  }

  const apiKey = await getAIApiKey()
  if (!apiKey) {
    return NextResponse.json({ error: 'No AI API key configured.' }, { status: 403 })
  }

  const prompt =
    task === 'summarize' ? `Summarize the following text in 3 short bullets:\n\n${text}` :
    task === 'rewrite'   ? (instruction
      ? `Rewrite the following text. Instruction: ${instruction}\n\nText:\n${text}`
      : `Rewrite the following text clearly, keeping the same meaning:\n\n${text}`) :
    task === 'shorten'   ? `Shorten the following text by ~40%, keeping all key information:\n\n${text}` :
    `Process this text:\n\n${text}`

  const google = createGoogleGenerativeAI({ apiKey })
  const modelId = 'gemini-2.5-flash'
  const truncatedPrompt = prompt.slice(0, 12000)

  try {
    if (stream) {
      const result = streamText({
        model: google(modelId),
        system: INLINE_SHORT_PERSONA,
        prompt: truncatedPrompt,
      })
      return result.toTextStreamResponse()
    }

    const { text: result } = await generateText({
      model: google(modelId),
      system: INLINE_SHORT_PERSONA,
      prompt: truncatedPrompt,
    })

    return NextResponse.json({ result: result.trim() })
  } catch (err: unknown) {
    const status = (err as { statusCode?: number }).statusCode
    if (status === 429) {
      return NextResponse.json(
        { error: 'AI quota exhausted — add credits at https://ai.studio/projects or use a new API key.' },
        { status: 429 },
      )
    }
    console.error('[extension-light] AI error:', err)
    return NextResponse.json({ error: 'AI request failed.' }, { status: 500 })
  }
}
