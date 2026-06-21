import { NextResponse } from 'next/server'
import { after } from 'next/server'
import { getSupabaseAndUserFromRequest } from '@/lib/ai-key'
import { indexDocumentById } from '@/lib/ai/rag/indexer'

/**
 * GET  /api/library/:docId  — fetch a single server-side document
 * POST /api/library/:docId  — upsert { title, content } for the document
 *
 * Only the owner (auth.uid() = user_id via RLS) can read/write. auto_generated
 * recap documents are writable too — user edits just flip recap_stale back to
 * false on the next read so the AI won't fight them.
 */

type Ctx = { params: Promise<{ docId: string }> }

export async function GET(request: Request, { params }: Ctx) {
  const { user, supabase } = await getSupabaseAndUserFromRequest(request)
  if (!user || !supabase) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const { docId } = await params
  if (!docId) return NextResponse.json({ error: 'Missing docId' }, { status: 400 })

  /* eslint-disable @typescript-eslint/no-explicit-any */
  const sb = supabase as any
  const { data, error } = await sb.from('documents').select('*').eq('id', docId).maybeSingle()
  /* eslint-enable @typescript-eslint/no-explicit-any */
  if (error) return NextResponse.json({ error: 'Read failed' }, { status: 500 })
  if (!data) return NextResponse.json({ error: 'Not found' }, { status: 404 })

  return NextResponse.json({ document: data })
}

export async function POST(request: Request, { params }: Ctx) {
  const { user, supabase } = await getSupabaseAndUserFromRequest(request)
  if (!user || !supabase) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const { docId } = await params
  if (!docId) return NextResponse.json({ error: 'Missing docId' }, { status: 400 })

  let title = '', content = ''
  try {
    const body = await request.json()
    title   = typeof body.title   === 'string' ? body.title   : ''
    content = typeof body.content === 'string' ? body.content : ''
  } catch {
    return NextResponse.json({ error: 'Invalid JSON' }, { status: 400 })
  }

  /* eslint-disable @typescript-eslint/no-explicit-any */
  const sb = supabase as any
  const { data, error } = await sb.from('documents')
    .update({
      title: title.trim() || 'Untitled',
      content,
      updated_at: new Date().toISOString(),
    })
    .eq('id', docId)
    .select()
    .maybeSingle()
  /* eslint-enable @typescript-eslint/no-explicit-any */

  if (error) return NextResponse.json({ error: 'Write failed' }, { status: 500 })
  if (!data)  return NextResponse.json({ error: 'Not found' },  { status: 404 })

  // Re-embed the document for RAG after the response is sent.
  after(async () => {
    try {
      await indexDocumentById(sb, user.id, docId)
    } catch (err) {
      console.warn('[library] indexing failed:', (err as Error)?.message)
    }
  })

  return NextResponse.json({ document: data })
}
