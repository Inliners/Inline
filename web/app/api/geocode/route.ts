import { NextResponse } from 'next/server'

export type GeocodeHit = {
  lat: number
  lng: number
  label: string
}

/** Proxy Nominatim (OSM) — browser cannot call it directly (CORS + User-Agent policy). */
export async function GET(req: Request) {
  const { searchParams } = new URL(req.url)
  const q = searchParams.get('q')?.trim()
  if (!q || q.length < 2) {
    return NextResponse.json([] satisfies GeocodeHit[])
  }

  const url = new URL('https://nominatim.openstreetmap.org/search')
  url.searchParams.set('q', q)
  url.searchParams.set('format', 'json')
  url.searchParams.set('limit', '8')

  const res = await fetch(url.toString(), {
    headers: {
      Accept: 'application/json',
      'User-Agent': 'InlineWorkspaceMap/1.0',
    },
    next: { revalidate: 0 },
  })

  if (!res.ok) {
    return NextResponse.json({ error: 'Geocode failed' }, { status: 502 })
  }

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const raw = (await res.json()) as any[]
  const hits: GeocodeHit[] = raw
    .map(row => {
      const lat = parseFloat(row.lat)
      const lng = parseFloat(row.lon)
      if (Number.isNaN(lat) || Number.isNaN(lng)) return null
      const label =
        typeof row.display_name === 'string' ? row.display_name : `${lat}, ${lng}`
      return { lat, lng, label }
    })
    .filter((x): x is GeocodeHit => x !== null)

  return NextResponse.json(hits)
}
