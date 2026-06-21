import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'

export async function POST(req: NextRequest) {
  const { pageUrl, layers, userId } = await req.json()

  if (!pageUrl) {
    return NextResponse.json({ error: 'pageUrl required' }, { status: 400 })
  }

  const supabase = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
  )

  const shareId = crypto.randomUUID().slice(0, 12)

  const { error } = await supabase.from('annotations').upsert(
    {
      page_url: `share:${shareId}`,
      elements: {
        sourceUrl: pageUrl,
        layers,
        sharedBy: userId,
        sharedAt: new Date().toISOString(),
      },
      updated_at: new Date().toISOString(),
    },
    { onConflict: 'page_url' },
  )

  if (error) return NextResponse.json({ error: error.message }, { status: 500 })

  const shareUrl = `${process.env.NEXT_PUBLIC_SITE_URL || 'http://localhost:3000'}/shared/${shareId}`
  return NextResponse.json({ shareUrl, shareId })
}

export async function GET(req: NextRequest) {
  const shareId = req.nextUrl.searchParams.get('id')
  if (!shareId) return NextResponse.json({ error: 'id required' }, { status: 400 })

  const supabase = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
  )

  const { data, error } = await supabase
    .from('annotations')
    .select('elements')
    .eq('page_url', `share:${shareId}`)
    .maybeSingle()

  if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  if (!data) return NextResponse.json({ error: 'Share not found' }, { status: 404 })

  return NextResponse.json({ share: data.elements })
}
