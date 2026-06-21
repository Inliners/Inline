'use client'

/**
 * Pushes the current Supabase session and active workspace id to the Inline
 * Chrome extension so the extension can save annotations under the logged-in
 * user. Without this handoff the extension has no access token, the backend
 * falls back to the anon client, and public.notes never gets a user_id — which
 * is why History / Analytics / Graph would otherwise show empty.
 *
 * Requires NEXT_PUBLIC_CHROME_EXTENSION_ID and NEXT_PUBLIC_INLINE_BACKEND_URL
 * (optional, defaults to http://localhost:3030) in .env.local.
 */

import { useEffect } from 'react'
import { usePathname } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'

type ChromeLike = {
  runtime?: {
    sendMessage: (extensionId: string, message: unknown, responseCallback?: () => void) => void
  }
}

function extractWorkspaceId(pathname: string | null): string {
  if (!pathname) return ''
  const m = pathname.match(/^\/app\/([^/]+)/)
  return m ? decodeURIComponent(m[1]) : ''
}

function sendToExtension(
  extId: string,
  payload: {
    accessToken: string
    userId: string
    workspaceId: string
    apiBase: string
    backendBase: string
  },
) {
  if (typeof window === 'undefined') return
  const w = window as unknown as { chrome?: ChromeLike }
  try {
    w.chrome?.runtime?.sendMessage(extId, { type: 'INLINE_SYNC_AUTH', payload }, () => {
      /* ignore lastError — extension may not be installed */
    })
  } catch {
    /* not Chrome or extension missing */
  }
}

export default function ExtensionAuthSync() {
  const pathname = usePathname()

  useEffect(() => {
    const extId = process.env.NEXT_PUBLIC_CHROME_EXTENSION_ID
    if (!extId) return

    const apiBase =
      (typeof window !== 'undefined' ? window.location.origin : '') ||
      'http://localhost:3000'
    const backendBase =
      process.env.NEXT_PUBLIC_INLINE_BACKEND_URL || 'http://localhost:3030'

    const supabase = createClient()

    const push = (session: { access_token?: string; user?: { id?: string } } | null) => {
      const workspaceId = extractWorkspaceId(pathname)
      sendToExtension(extId, {
        accessToken: session?.access_token ?? '',
        userId:      session?.user?.id ?? '',
        workspaceId,
        apiBase,
        backendBase,
      })
    }

    void supabase.auth.getSession().then(({ data }) => push(data.session))

    const { data: sub } = supabase.auth.onAuthStateChange((_event, session) => push(session))

    return () => { sub.subscription.unsubscribe() }
  }, [pathname])

  return null
}
