import { NextRequest, NextResponse } from 'next/server'
import { fetchNotes, HAS_SUPABASE } from '@/lib/data'
import { getSupabaseAndUserFromRequest } from '@/lib/ai-key'
import type { Note } from '@/lib/types'

/**
 * GET /api/notes?workspaceId=&pageUrl=
 * Notes for recap panel — scoped to workspace, optionally filtered by page URL.
 */
export async function GET(req: NextRequest) {
  const workspaceId = req.nextUrl.searchParams.get('workspaceId') ?? ''
  const pageUrl = req.nextUrl.searchParams.get('pageUrl') ?? ''

  if (!workspaceId) {
    return NextResponse.json({ error: 'workspaceId required' }, { status: 400 })
  }

  let notes: Note[] = []

  if (HAS_SUPABASE) {
    const { user, supabase } = await getSupabaseAndUserFromRequest(req)
    if (!user || !supabase) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }
    notes = await fetchNotes(workspaceId)
  } else {
    notes = await fetchNotes(workspaceId)
  }

  const filtered = pageUrl ? notes.filter(n => n.pageUrl === pageUrl) : notes
  return NextResponse.json({ notes: filtered })
}
