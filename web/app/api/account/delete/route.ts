import { NextResponse } from 'next/server'
import { createClient as createBareSupabase } from '@supabase/supabase-js'
import { createClient } from '@/lib/supabase/server'

/**
 * Permanently deletes the signed-in user's account and their data.
 * Requires SUPABASE_SERVICE_ROLE_KEY (server-only); without it Supabase
 * doesn't allow self-serve user deletion, so we return 501 and the UI
 * explains that deletion isn't configured on this deployment.
 */
export async function POST() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) {
    return NextResponse.json({ error: 'Not authenticated' }, { status: 401 })
  }

  const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL
  if (!serviceKey || !url) {
    return NextResponse.json(
      { error: 'Account deletion is not configured on this deployment.' },
      { status: 501 },
    )
  }

  const admin = createBareSupabase(url, serviceKey, {
    auth: { autoRefreshToken: false, persistSession: false },
  })

  // Remove user-owned rows first (tables without ON DELETE CASCADE).
  const tables = ['workspace_embeddings', 'notes', 'documents', 'extractions'] as const
  for (const table of tables) {
    const { error } = await admin.from(table).delete().eq('user_id', user.id)
    if (error && error.code !== '42P01') {
      console.error(`[account/delete] failed clearing ${table}:`, error.message)
      return NextResponse.json({ error: 'Failed to delete account data.' }, { status: 500 })
    }
  }

  const { error: deleteError } = await admin.auth.admin.deleteUser(user.id)
  if (deleteError) {
    console.error('[account/delete] auth deletion failed:', deleteError.message)
    return NextResponse.json({ error: 'Failed to delete account.' }, { status: 500 })
  }

  await supabase.auth.signOut()
  return NextResponse.json({ ok: true })
}
