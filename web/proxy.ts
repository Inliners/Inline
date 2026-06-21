import { NextResponse, type NextRequest } from 'next/server'
import { updateSession } from '@/lib/supabase/middleware'

const DEFAULT_WORKSPACE_ID = 'ws-1'

function redirectLegacyFlatDocUrl(request: NextRequest): NextResponse | null {
  const { pathname } = request.nextUrl
  const m = pathname.match(/^\/app\/([^/]+)\/(doc-\d+[^/]*)$/i)
  if (!m) return null
  const url = request.nextUrl.clone()
  url.pathname = `/app/${m[1]}/doc/${m[2]}`
  return NextResponse.redirect(url)
}

function redirectFolderSegmentIsDocId(request: NextRequest): NextResponse | null {
  const { pathname } = request.nextUrl
  const m = pathname.match(/^\/app\/([^/]+)\/folder\/(doc-\d+[^/]*)$/i)
  if (!m) return null
  const url = request.nextUrl.clone()
  url.pathname = `/app/${m[1]}/doc/${m[2]}`
  return NextResponse.redirect(url)
}

function redirectRootDocId(request: NextRequest): NextResponse | null {
  const { pathname } = request.nextUrl
  const m = pathname.match(/^\/(doc-\d+[^/]*)$/i)
  if (!m) return null
  const url = request.nextUrl.clone()
  url.pathname = `/app/${DEFAULT_WORKSPACE_ID}/doc/${m[1]}`
  return NextResponse.redirect(url)
}

export async function proxy(request: NextRequest) {
  const fixed =
    redirectFolderSegmentIsDocId(request) ??
    redirectLegacyFlatDocUrl(request) ??
    redirectRootDocId(request)
  if (fixed) return fixed

  if (!process.env.NEXT_PUBLIC_SUPABASE_URL) {
    return NextResponse.next()
  }

  try {
    return await updateSession(request)
  } catch (err) {
    console.error('[proxy] updateSession error:', err)
    return NextResponse.next()
  }
}

export const config = {
  matcher: [
    '/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)',
  ],
}
