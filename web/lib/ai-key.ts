import { createClient as createServerSupabase } from '@/lib/supabase/server'
import { createClient as createBareSupabase } from '@supabase/supabase-js'
import type { Database } from '@/lib/supabase/types'

export async function getAIApiKey(): Promise<string | null> {
  return process.env.GOOGLE_GENERATIVE_AI_API_KEY ?? null
}

/**
 * Resolve the calling user plus a Supabase client whose PostgREST requests run
 * AS that user, so RLS policies apply correctly in both auth modes:
 *
 * - `Authorization: Bearer <jwt>` (extension / Express backend): a client
 *   bound to that token. Previously the token was only used to look up the
 *   user while queries ran anonymously — RPCs relying on auth.uid() failed.
 * - Cookie session (dashboard): the SSR cookie client.
 */
export async function getSupabaseAndUserFromRequest(request: Request) {
  const authHeader = request.headers.get('Authorization')

  if (authHeader?.startsWith('Bearer ')) {
    const token = authHeader.slice(7).trim()
    if (token.split('.').length === 3 && process.env.NEXT_PUBLIC_SUPABASE_URL) {
      const bearerClient = createBareSupabase<Database>(
        process.env.NEXT_PUBLIC_SUPABASE_URL,
        process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
        {
          global: { headers: { Authorization: `Bearer ${token}` } },
          auth: { autoRefreshToken: false, persistSession: false, detectSessionInUrl: false },
        },
      )
      const { data: { user } } = await bearerClient.auth.getUser(token)
      if (user) return { supabase: bearerClient, user }
    }
  }

  const supabase = await createServerSupabase()
  const { data: { user } } = await supabase.auth.getUser()
  return { supabase, user: user ?? null }
}
