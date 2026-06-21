import { NextRequest, NextResponse } from 'next/server'
import { getSupabaseAndUserFromRequest } from '@/lib/ai-key'

/**
 * GET /api/search?q=&workspaceId= — keyword search over the caller's notes.
 * Auth required (cookie session or Bearer JWT); results are scoped to the
 * signed-in user on top of RLS.
 */
export async function GET(req: NextRequest) {
  const { user, supabase } = await getSupabaseAndUserFromRequest(req)
  if (!user || !supabase) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const q = (req.nextUrl.searchParams.get('q') ?? '').trim().slice(0, 200)
  const workspaceId = req.nextUrl.searchParams.get('workspaceId') ?? ''
  if (!q) return NextResponse.json({ results: [] })

  // Escape PostgREST ilike wildcards in user input.
  const escaped = q.replace(/[%_]/g, m => `\\${m}`)

  /* eslint-disable @typescript-eslint/no-explicit-any */
  let query = (supabase.from('notes') as any)
    .select('id, page_url, page_title, content, type, workspace_id, created_at')
    .eq('user_id', user.id)
    .or(`content.ilike.%${escaped}%,page_title.ilike.%${escaped}%`)
    .order('created_at', { ascending: false })
    .limit(20)
  /* eslint-enable @typescript-eslint/no-explicit-any */
  if (workspaceId) query = query.eq('workspace_id', workspaceId)

  const { data, error } = await query
  if (error) {
    console.error('[search] failed:', error.message)
    return NextResponse.json({ error: 'Search failed' }, { status: 500 })
  }
  return NextResponse.json({ results: data ?? [] })
}
