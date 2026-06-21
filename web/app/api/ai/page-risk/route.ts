import { NextResponse } from 'next/server'
import { generateText } from 'ai'
import { createGoogleGenerativeAI } from '@ai-sdk/google'
import { getAIApiKey, getSupabaseAndUserFromRequest } from '@/lib/ai-key'
import { INLINE_SHORT_PERSONA } from '@/lib/inline-persona'

export async function POST(request: Request) {
  const { user, supabase } = await getSupabaseAndUserFromRequest(request)
  if (!user || !supabase) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  let pageTextSample = ''
  try {
    const body = await request.json()
    pageTextSample = typeof body.pageTextSample === 'string' ? body.pageTextSample : ''
  } catch {
    return NextResponse.json({ error: 'Invalid JSON' }, { status: 400 })
  }

  const apiKey = await getAIApiKey()
  if (!apiKey) {
    return NextResponse.json({ error: 'No AI API key configured.' }, { status: 403 })
  }

  const google = createGoogleGenerativeAI({ apiKey })
  const { text } = await generateText({
    model: google('gemini-2.5-flash'),
    system: `${INLINE_SHORT_PERSONA}\n\nIn this surface you are running as Inline's page-risk analyzer (invoked from the extension's right-click "Analyze page risk" action).`,
    prompt: `Analyze the following page content for:
1. Misinformation or bias
2. Privacy risks or data collection
3. Security concerns (phishing, malware indicators)
4. Content safety issues

Be concise (3-5 bullet points). Flag only genuine concerns.

Page content:
${pageTextSample.slice(0, 10000)}`,
  })

  return NextResponse.json({ analysis: text.trim() })
}
