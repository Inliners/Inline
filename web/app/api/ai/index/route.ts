import { NextResponse } from 'next/server'
import { getSupabaseAndUserFromRequest } from '@/lib/ai-key'
import {
  backfillWorkspace,
  indexDocumentById,
  indexNoteById,
  indexPageNotes,
} from '@/lib/ai/rag/indexer'

/**
 * Embedding index management.
 *
 * POST — index one source (or all notes on a page):
 *   { sourceType: 'note',     sourceId }
 *   { sourceType: 'document', sourceId }            (covers recaps too)
 *   { pageUrl, workspaceId? }                        (re-index a page's notes)
 *
 * PUT  — backfill a workspace in batches:
 *   { workspaceId, batchSize? } → { indexed, skipped, remaining, errors }
 *
 * Auth required (cookie session or Bearer JWT). All reads/writes run on the
 * caller's RLS-scoped client, so users can only index their own content.
 */

export async function POST(request: Request) {
  const { user, supabase } = await getSupabaseAndUserFromRequest(request)
  if (!user || !supabase) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  let body: {
    sourceType?: string
    sourceId?: string
    pageUrl?: string
    workspaceId?: string
  }
  try {
    body = await request.json()
  } catch {
    return NextResponse.json({ error: 'Invalid JSON' }, { status: 400 })
  }

  try {
    if (body.pageUrl) {
      const result = await indexPageNotes(
        supabase,
        user.id,
        typeof body.workspaceId === 'string' && body.workspaceId ? body.workspaceId : null,
        String(body.pageUrl).slice(0, 2000),
      )
      return NextResponse.json({ ok: true, ...summarize(result) })
    }

    const sourceId = typeof body.sourceId === 'string' ? body.sourceId : ''
    if (!sourceId) {
      return NextResponse.json({ error: 'sourceId or pageUrl required' }, { status: 400 })
    }

    if (body.sourceType === 'note') {
      const result = await indexNoteById(supabase, user.id, sourceId)
      return NextResponse.json({ ok: true, ...summarize(result) })
    }
    if (body.sourceType === 'document' || body.sourceType === 'recap') {
      const result = await indexDocumentById(supabase, user.id, sourceId)
      return NextResponse.json({ ok: true, ...summarize(result) })
    }

    return NextResponse.json({ error: 'sourceType must be note or document' }, { status: 400 })
  } catch (err) {
    console.error('[ai/index] POST failed:', (err as Error)?.message)
    return NextResponse.json({ error: 'Indexing failed' }, { status: 500 })
  }
}

export async function PUT(request: Request) {
  const { user, supabase } = await getSupabaseAndUserFromRequest(request)
  if (!user || !supabase) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  let workspaceId = ''
  let batchSize = 20
  try {
    const body = await request.json()
    workspaceId = typeof body.workspaceId === 'string' ? body.workspaceId : ''
    if (typeof body.batchSize === 'number' && Number.isFinite(body.batchSize)) {
      batchSize = Math.max(1, Math.min(50, Math.floor(body.batchSize)))
    }
  } catch {
    return NextResponse.json({ error: 'Invalid JSON' }, { status: 400 })
  }
  if (!workspaceId) {
    return NextResponse.json({ error: 'workspaceId required' }, { status: 400 })
  }

  try {
    const result = await backfillWorkspace(supabase, user.id, workspaceId, batchSize)
    return NextResponse.json({ ok: true, remaining: result.remaining, ...summarize(result) })
  } catch (err) {
    console.error('[ai/index] PUT failed:', (err as Error)?.message)
    return NextResponse.json({ error: 'Backfill failed' }, { status: 500 })
  }
}

function summarize(result: { indexed: number; skipped: number; errors: string[] }) {
  return {
    indexed: result.indexed,
    skipped: result.skipped,
    // Error strings are internal (table names, provider failures) — return a
    // count and log details server-side instead of leaking them.
    errorCount: result.errors.length,
    ...(result.errors.length ? logErrors(result.errors) : {}),
  }
}

function logErrors(errors: string[]) {
  console.warn('[ai/index] partial failure:', errors.slice(0, 5).join(' | '))
  return {}
}
