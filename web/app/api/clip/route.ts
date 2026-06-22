import { NextRequest, NextResponse } from 'next/server'
import { after } from 'next/server'
import { getSupabaseAndUserFromRequest } from '@/lib/ai-key'
import { indexNoteById } from '@/lib/ai/rag/indexer'

/**
 * Save a captured clip / AI result / highlight bundle into public.notes so it
 * appears on the History and Analytics pages.
 *
 * Auth: a verified Supabase session is required — either a Bearer JWT (the
 * extension forwards the dashboard-synced token) or the dashboard cookie
 * session. Raw userId values in the body are no longer trusted.
 *
 * After the row is written, the note is chunked + embedded for RAG in a
 * post-response task so saving stays fast.
 */

export async function POST(req: NextRequest) {
  const { user, supabase } = await getSupabaseAndUserFromRequest(req)
  if (!user || !supabase) {
    return NextResponse.json(
      { error: 'Not signed in. Open the Inline dashboard once to sync your session, then try again.' },
      { status: 401 },
    )
  }

  let body: {
    pageUrl?: string
    pageTitle?: string
    selection?: string
    highlights?: Array<{ text?: string }>
    workspaceId?: string
    type?: string
    tags?: string[]
    content?: string
    color?: string
  }
  try {
    body = await req.json()
  } catch {
    return NextResponse.json({ error: 'Invalid JSON' }, { status: 400 })
  }

  const { pageUrl, pageTitle, selection, highlights, workspaceId, type, tags, content: overrideContent, color } = body

  if (!pageUrl || typeof pageUrl !== 'string') {
    return NextResponse.json({ error: 'pageUrl required' }, { status: 400 })
  }

  const content =
    overrideContent ??
    [
      selection ? `> ${selection}\n\n` : '',
      `Source: ${pageUrl}\n`,
      pageTitle ? `Title: ${pageTitle}\n` : '',
      highlights?.length
        ? `\nHighlights:\n${highlights.map(h => `- ${h.text ?? ''}`).join('\n')}`
        : '',
    ].join('')

  let domain = ''
  try { domain = new URL(pageUrl).hostname } catch { /* ignore */ }

  // notes.type is constrained to 'text' | 'canvas' | 'ai-summary'. Map any
  // richer kind (e.g. 'ai-rephrase', 'clip', 'highlight') down to one of the
  // three and stash the original in tags so the UI can still distinguish.
  const allowedTypes = new Set(['text', 'canvas', 'ai-summary'])
  const requestedType = (type || 'text').trim()
  const finalType = allowedTypes.has(requestedType)
    ? requestedType
    : requestedType.startsWith('ai-')
      ? 'ai-summary'
      : 'text'
  const finalTags =
    tags && tags.length
      ? finalType === requestedType
        ? tags
        : Array.from(new Set([...tags, requestedType]))
      : finalType === requestedType
        ? ['clipped']
        : ['clipped', requestedType]

  /* eslint-disable @typescript-eslint/no-explicit-any */
  const { data, error } = await (supabase.from('notes') as any)
    .insert({
      user_id:      user.id,
      workspace_id: workspaceId ?? null,
      page_url:     pageUrl,
      page_title:   pageTitle || '',
      content:      String(content).slice(0, 20_000),
      type:         finalType,
      domain,
      color:        color || '#FFEB3B',
      tags:         finalTags,
    })
    .select()
    .single()
  /* eslint-enable @typescript-eslint/no-explicit-any */

  if (error) {
    console.error('[clip] insert failed:', error.message)
    return NextResponse.json({ error: 'Failed to save clip' }, { status: 500 })
  }

  const noteId: string = data.id
  after(async () => {
    try {
      /* eslint-disable @typescript-eslint/no-explicit-any */
      await indexNoteById(supabase as any, user.id, noteId)
      /* eslint-enable @typescript-eslint/no-explicit-any */
    } catch (err) {
      console.warn('[clip] indexing failed:', (err as Error)?.message)
    }
  })

  return NextResponse.json({ success: true, noteId })
}
