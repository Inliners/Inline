import { NextResponse } from 'next/server'
import { getSupabaseAndUserFromRequest } from '@/lib/ai-key'

const ALLOWED_SURFACES = new Set([
  'chat',
  'insights',
  'roi',
  'knowledge-cards',
])

export async function POST(request: Request) {
  const { user, supabase } = await getSupabaseAndUserFromRequest(request)
  if (!user || !supabase) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  let workspaceId = ''
  let surface = ''
  let targetId = ''
  let rating = 0
  let comment: string | null = null

  try {
    const body = await request.json()
    workspaceId = typeof body.workspaceId === 'string' ? body.workspaceId : ''
    surface = typeof body.surface === 'string' ? body.surface : ''
    targetId = typeof body.targetId === 'string' ? body.targetId : ''
    rating = body.rating === 1 || body.rating === -1 ? body.rating : 0
    comment = typeof body.comment === 'string' && body.comment.trim()
      ? body.comment.trim().slice(0, 500)
      : null
  } catch {
    return NextResponse.json({ error: 'Invalid JSON' }, { status: 400 })
  }

  if (!workspaceId || !ALLOWED_SURFACES.has(surface) || rating === 0) {
    return NextResponse.json({ error: 'workspaceId, surface, and rating required' }, { status: 400 })
  }

  /* eslint-disable @typescript-eslint/no-explicit-any */
  const { error } = await (supabase as any).from('ai_feedback').insert({
    user_id: user.id,
    workspace_id: workspaceId,
    surface,
    target_id: targetId,
    rating,
    comment,
  })
  /* eslint-enable @typescript-eslint/no-explicit-any */

  if (error) {
    console.error('[feedback] insert error:', error)
    return NextResponse.json({ error: 'Failed to save feedback' }, { status: 500 })
  }

  return NextResponse.json({ ok: true })
}
