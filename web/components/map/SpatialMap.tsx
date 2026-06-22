'use client'

import { useEffect, useMemo, useState, useCallback, useRef } from 'react'
import dynamic from 'next/dynamic'
import Link from 'next/link'
import type { MapCoordinate } from '@/lib/types'
type GeocodeHit = { lat: number; lng: number; label: string }
import { Skeleton } from '@/components/ui/skeleton'
import { cn } from '@/lib/utils'
import { getDomainColor } from '@/lib/map-theme'
import {
  Globe2, Map as MapIcon, Box, Eye,
  Search, X, MapPinPlus, ArrowLeft, ExternalLink,
} from 'lucide-react'

const LeafletMap = dynamic(() => import('./LeafletMap'), {
  ssr: false,
  loading: () => <Skeleton className="h-full w-full rounded-none" />,
})

type ViewMode = '2d' | '3d' | 'globe' | 'street'

const VIEW_MODES: { id: ViewMode; label: string; icon: React.ElementType }[] = [
  { id: '2d', label: 'Map', icon: MapIcon },
  { id: '3d', label: 'Focus', icon: Box },
  { id: 'globe', label: 'Satellite', icon: Globe2 },
  { id: 'street', label: 'Street', icon: Eye },
]

const MY_PLACES_DOMAIN = 'my-places'

/**
 * Decorative placeholder for location cards: a soft tint of the domain color
 * with the location's initial. Deterministic and honest (no stock photos
 * pretending to be the actual place).
 */
function LocationThumb({ coord, color }: { coord: MapCoordinate; color: string }) {
  const initial = (coord.locationLabel || coord.domain || '?').trim().charAt(0).toUpperCase()
  return (
    <div
      className="relative flex h-full w-full items-center justify-center"
      style={{ background: `linear-gradient(135deg, ${color}22, ${color}3d)` }}
      aria-hidden
    >
      <span
        className="flex h-12 w-12 items-center justify-center rounded-full text-lg font-bold text-white"
        style={{ backgroundColor: color }}
      >
        {initial}
      </span>
    </div>
  )
}

function loadStoredPins(key: string): MapCoordinate[] {
  if (typeof window === 'undefined') return []
  try {
    const raw = localStorage.getItem(key)
    if (!raw) return []
    const parsed = JSON.parse(raw) as MapCoordinate[]
    return Array.isArray(parsed) ? parsed : []
  } catch {
    return []
  }
}

interface SpatialMapProps {
  coordinates: MapCoordinate[]
  storageKey?: string
  backHref?: string
}

export default function SpatialMap({
  coordinates: serverCoordinates,
  storageKey = 'inline-map-pins',
  backHref = '/app/ws-1/dashboard',
}: SpatialMapProps) {
  const [mounted, setMounted] = useState(false)
  const [userPins, setUserPins] = useState<MapCoordinate[]>([])
  const [viewMode, setViewMode] = useState<ViewMode>('2d')
  const [selectedId, setSelectedId] = useState<string | null>(null)
  const [hoveredDomain, setHoveredDomain] = useState<string | null>(null)

  const [placeQuery, setPlaceQuery] = useState('')
  const [placeHits, setPlaceHits] = useState<GeocodeHit[]>([])
  const [placeLoading, setPlaceLoading] = useState(false)
  const [draft, setDraft] = useState<{ lat: number; lng: number; label: string } | null>(null)
  const [draftNote, setDraftNote] = useState('')
  const [pickMode, setPickMode] = useState(false)
  const [flyTo, setFlyTo] = useState<{ lat: number; lng: number; zoom?: number } | null>(null)
  const [searchOpen, setSearchOpen] = useState(false)

  const placeTimer = useRef<ReturnType<typeof setTimeout> | null>(null)
  const carouselRef = useRef<HTMLDivElement>(null)
  const cardRefs = useRef<Map<string, HTMLDivElement>>(new Map())
  const searchInputRef = useRef<HTMLInputElement>(null)

  useEffect(() => setMounted(true), [])

  useEffect(() => {
    if (!flyTo) return
    const t = setTimeout(() => setFlyTo(null), 700)
    return () => clearTimeout(t)
  }, [flyTo])

  useEffect(() => {
    setUserPins(loadStoredPins(storageKey))
  }, [storageKey])

  useEffect(() => {
    if (!mounted) return
    try {
      localStorage.setItem(storageKey, JSON.stringify(userPins))
    } catch { /* ignore quota */ }
  }, [userPins, storageKey, mounted])

  const allCoordinates = useMemo(
    () => [...serverCoordinates, ...userPins],
    [serverCoordinates, userPins],
  )

  const selectedCoord = allCoordinates.find(c => c.id === selectedId) ?? null
  const domainCount = useMemo(
    () => new Set(allCoordinates.map(c => c.domain).filter(Boolean)).size,
    [allCoordinates],
  )

  const tileUrl = useMemo(() => {
    switch (viewMode) {
      case '3d':
        return 'https://{s}.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}{r}.png'
      case 'globe':
        return 'https://server.arcgisonline.com/ArcGIS/rest/services/World_Imagery/MapServer/tile/{z}/{y}/{x}'
      case 'street':
        return 'https://{s}.tile.openstreetmap.fr/hot/{z}/{x}/{y}.png'
      default:
        return 'https://{s}.basemaps.cartocdn.com/light_all/{z}/{x}/{y}{r}.png'
    }
  }, [viewMode])

  const tileAttribution = useMemo(() => {
    switch (viewMode) {
      case 'globe':
        return '© Esri, Maxar, Earthstar Geographics'
      case 'street':
        return '© OpenStreetMap contributors, Humanitarian OSM'
      default:
        return '© <a href="https://www.openstreetmap.org/copyright">OSM</a> © <a href="https://carto.com/attributions">CARTO</a>'
    }
  }, [viewMode])

  useEffect(() => {
    if (placeTimer.current) clearTimeout(placeTimer.current)
    const q = placeQuery.trim()
    if (q.length < 2) {
      setPlaceHits([])
      setPlaceLoading(false)
      return
    }
    setPlaceLoading(true)
    placeTimer.current = setTimeout(async () => {
      try {
        const res = await fetch(`/api/geocode?q=${encodeURIComponent(q)}`)
        if (!res.ok) { setPlaceHits([]); return }
        const data = (await res.json()) as GeocodeHit[] | { error?: string }
        if (Array.isArray(data)) setPlaceHits(data)
        else setPlaceHits([])
      } catch { setPlaceHits([]) }
      finally { setPlaceLoading(false) }
    }, 350)
    return () => { if (placeTimer.current) clearTimeout(placeTimer.current) }
  }, [placeQuery])

  const selectPlaceHit = useCallback((hit: GeocodeHit) => {
    setDraft({ lat: hit.lat, lng: hit.lng, label: hit.label })
    setFlyTo({ lat: hit.lat, lng: hit.lng, zoom: 12 })
    setPlaceHits([])
    setPlaceQuery('')
    setPickMode(false)
  }, [])

  const onMapClickPick = useCallback((lat: number, lng: number) => {
    if (!pickMode) return
    setDraft({ lat, lng, label: `${lat.toFixed(4)}, ${lng.toFixed(4)}` })
    setFlyTo({ lat, lng, zoom: Math.max(8, 12) })
    setPickMode(false)
  }, [pickMode])

  const saveDraftPin = useCallback(() => {
    if (!draft || !draftNote.trim()) return
    const id = `user-${Date.now()}`
    const pin: MapCoordinate = {
      id,
      lat: draft.lat,
      lng: draft.lng,
      noteId: id,
      type: 'text',
      notePreview: draftNote.trim(),
      locationLabel: draft.label.slice(0, 120),
      domain: MY_PLACES_DOMAIN,
      color: getDomainColor(MY_PLACES_DOMAIN),
    }
    setUserPins(prev => [...prev, pin])
    setSelectedId(id)
    setDraft(null)
    setDraftNote('')
  }, [draft, draftNote])

  const handleSelectId = useCallback((id: string | null) => {
    setSelectedId(id)
    if (id) {
      requestAnimationFrame(() => {
        const el = cardRefs.current.get(id)
        if (el) el.scrollIntoView({ behavior: 'smooth', inline: 'center', block: 'nearest' })
      })
    }
  }, [])

  const handleCardClick = useCallback((coord: MapCoordinate) => {
    setSelectedId(coord.id)
    setFlyTo({ lat: coord.lat, lng: coord.lng, zoom: 10 })
  }, [])

  const openSearch = useCallback(() => {
    setSearchOpen(true)
    requestAnimationFrame(() => searchInputRef.current?.focus())
  }, [])

  const closeSearch = useCallback(() => {
    setSearchOpen(false)
    setPlaceQuery('')
    setPlaceHits([])
    setPickMode(false)
    setDraft(null)
    setDraftNote('')
  }, [])

  return (
    <div className="relative h-full w-full overflow-x-hidden">
      {/* Full-bleed map — overflow-hidden only on the map layer so card shadows/scale aren't clipped */}
      <div className="absolute inset-0 overflow-hidden">
        {mounted && (
          <LeafletMap
            coordinates={allCoordinates}
            tileUrl={tileUrl}
            tileAttribution={tileAttribution}
            selectedId={selectedId}
            hoveredDomain={hoveredDomain}
            onSelectId={handleSelectId}
            mapClickEnabled={pickMode}
            onMapClick={onMapClickPick}
            flyTo={flyTo}
          />
        )}
      </div>

      {/* ── Back button (top-left) ── */}
      <Link
        href={backHref}
        className="absolute left-4 top-4 z-700 flex h-10 w-10 items-center justify-center rounded-full bg-white shadow-md transition-all hover:shadow-lg"
        title="Back"
      >
        <ArrowLeft className="h-4 w-4 text-[#222]" />
      </Link>

      <div className="absolute left-16 top-4 z-700 hidden max-w-xs overflow-hidden rounded-2xl border border-stone-200/80 bg-white/95 shadow-[0_16px_40px_-24px_rgba(28,30,38,0.42)] backdrop-blur-sm md:block">
        <div className="px-4 py-3">
          <p className="text-sm font-semibold text-[#222]">Places</p>
          <p className="mt-0.5 text-xs leading-relaxed text-[#666]">
            Locations connected to saved captures, page context, and pins you add yourself.
          </p>
        </div>
        <div className="grid grid-cols-2 border-t border-stone-200/70 text-xs">
          <div className="px-4 py-2">
            <p className="font-semibold text-[#222]">{allCoordinates.length}</p>
            <p className="text-[#777]">Saved places</p>
          </div>
          <div className="border-l border-stone-200/70 px-4 py-2">
            <p className="font-semibold text-[#222]">{domainCount}</p>
            <p className="text-[#777]">Sources</p>
          </div>
        </div>
      </div>

      {/* ── Floating search bar (top-center) ── */}
      <div className="absolute left-1/2 top-4 z-700 -translate-x-1/2">
        <div
          className="flex items-center gap-2 rounded-full bg-white shadow-md transition-[width,padding] duration-300 ease-[cubic-bezier(0.22,1,0.36,1)]"
          style={{ width: searchOpen ? 420 : 170, padding: searchOpen ? '8px 16px' : '8px 12px' }}
        >
          <Search className="h-4 w-4 shrink-0 text-[#666]" />

          {searchOpen ? (
            <>
              <input
                ref={searchInputRef}
                value={placeQuery}
                onChange={e => setPlaceQuery(e.target.value)}
                placeholder="Search a city, address, or place..."
                className="min-w-0 flex-1 border-none bg-transparent text-sm text-[#222] outline-none placeholder:text-[#999]"
              />
              <button
                type="button"
                onClick={() => {
                  setPickMode(p => !p)
                  setDraft(null)
                  setDraftNote('')
                }}
                className={cn(
                  'flex h-7 w-7 shrink-0 cursor-pointer items-center justify-center rounded-full transition-colors',
                  pickMode ? 'bg-[#222] text-white' : 'bg-[#f0f0f0] text-[#666] hover:bg-[#e0e0e0]',
                )}
                title={pickMode ? 'Cancel pin drop' : 'Drop a pin'}
              >
                <MapPinPlus className="h-3.5 w-3.5" />
              </button>
              <button
                type="button"
                onClick={closeSearch}
                className="flex h-7 w-7 shrink-0 cursor-pointer items-center justify-center rounded-full text-[#999] transition-colors hover:bg-[#f0f0f0] hover:text-[#222]"
              >
                <X className="h-3.5 w-3.5" />
              </button>
            </>
          ) : (
            <button
              type="button"
              onClick={openSearch}
              className="cursor-pointer whitespace-nowrap text-sm text-[#666]"
            >
              Search places
            </button>
          )}
        </div>

        {/* Geocode results dropdown */}
        {searchOpen && placeHits.length > 0 && (
          <div className="scrollbar-overlay mt-2 max-h-52 overflow-y-auto rounded-2xl bg-white shadow-lg">
            {placeHits.map((hit, i) => (
              <button
                key={`${hit.lat}-${hit.lng}-${i}`}
                type="button"
                onClick={() => selectPlaceHit(hit)}
                className="block w-full cursor-pointer border-b border-[#f0f0f0] px-4 py-2.5 text-left text-sm text-[#222] transition-colors last:border-b-0 hover:bg-[#f8f8f8]"
              >
                {hit.label}
              </button>
            ))}
          </div>
        )}

        {searchOpen && placeLoading && (
          <div className="mt-2 rounded-2xl bg-white px-4 py-3 text-center text-xs text-[#999] shadow-lg">
            Searching…
          </div>
        )}

        {/* Draft pin note input */}
        {draft && (
          <div className="mt-2 w-[420px] rounded-2xl bg-white p-4 shadow-lg">
            <p className="mb-2 text-xs font-medium text-[#999] line-clamp-1">{draft.label}</p>
            <textarea
              value={draftNote}
              onChange={e => setDraftNote(e.target.value)}
              placeholder="Add a note for this place..."
              rows={2}
              className="w-full resize-none rounded-xl border border-[#e5e5e5] bg-white px-3 py-2 text-sm text-[#222] outline-none placeholder:text-[#999] focus:border-[#ccc]"
            />
            <div className="mt-2 flex gap-2">
              <button
                type="button"
                onClick={saveDraftPin}
                disabled={!draftNote.trim()}
                className="flex-1 cursor-pointer rounded-full bg-[#222] px-4 py-2 text-xs font-semibold text-white transition-opacity disabled:opacity-30"
              >
                Save pin
              </button>
              <button
                type="button"
                onClick={() => { setDraft(null); setDraftNote('') }}
                className="cursor-pointer rounded-full border border-[#e5e5e5] px-4 py-2 text-xs text-[#666] transition-colors hover:bg-[#f5f5f5]"
              >
                Cancel
              </button>
            </div>
          </div>
        )}
      </div>

      {/* ── View mode pills (top-right) ── */}
      <div className="absolute right-4 top-4 z-700 flex overflow-hidden rounded-full bg-white p-1 shadow-md">
        {VIEW_MODES.map(v => {
          const Icon = v.icon
          const active = viewMode === v.id
          return (
            <button
              key={v.id}
              type="button"
              onClick={() => setViewMode(v.id)}
              className={cn(
                'flex cursor-pointer items-center gap-1.5 rounded-full px-3 py-1.5 text-xs font-medium transition-all',
                active
                  ? 'bg-[#222] text-white'
                  : 'text-[#666] hover:bg-[#f0f0f0] hover:text-[#222]',
              )}
            >
              <Icon className="h-3.5 w-3.5" />
              {v.label}
            </button>
          )
        })}
      </div>

      {/* ── Bottom card carousel ── */}
      {allCoordinates.length > 0 && (
        <div className="pointer-events-none absolute bottom-0 left-0 right-0 z-700 pt-16"
          style={{ background: 'linear-gradient(to top, rgba(255,255,255,0.90) 65%, rgba(255,255,255,0) 100%)' }}
        >
          <div
            ref={carouselRef}
            className="scrollbar-none pointer-events-auto flex items-end gap-4 overflow-x-auto overflow-y-visible px-4 pb-5 snap-x snap-mandatory"
            style={{ scrollbarWidth: 'none' }}
          >
            {allCoordinates.map(coord => {
              const isSelected = selectedId === coord.id
              const color = getDomainColor(coord.domain)

              return (
                <div
                  key={coord.id}
                  ref={el => { if (el) cardRefs.current.set(coord.id, el) }}
                  onClick={() => handleCardClick(coord)}
                  onMouseEnter={() => setHoveredDomain(coord.domain)}
                  onMouseLeave={() => setHoveredDomain(null)}
                  className={cn(
                    'shrink-0 snap-start cursor-pointer rounded-xl bg-white p-2 w-[240px] shadow-md',
                    isSelected && 'ring-1 shadow-lg',
                  )}
                  style={isSelected ? { '--tw-ring-color': color } as React.CSSProperties : undefined}
                >
                  <div className="relative h-[160px] w-full overflow-hidden rounded-lg bg-[#eee]">
                    <LocationThumb coord={coord} color={color} />
                  </div>

                  <div className="px-1 pb-1 pt-2.5">
                    <p className="text-[11px] font-medium capitalize text-[#888]">
                      {coord.type.replace('-', ' ')}
                    </p>
                    <p className="mt-0.5 text-[13px] font-semibold leading-snug text-[#222] line-clamp-1">
                      {coord.locationLabel}
                    </p>
                    <div className="mt-1 flex items-center justify-between">
                      <p className="text-xs font-medium text-[#222]">{coord.domain}</p>
                      <p className="text-[11px] text-[#666] line-clamp-1 max-w-[100px] text-right">
                        {coord.notePreview}
                      </p>
                    </div>
                  </div>
                </div>
              )
            })}
          </div>
        </div>
      )}

      {allCoordinates.length === 0 && (
        <div className="absolute left-1/2 top-1/2 z-700 w-[min(420px,calc(100vw-40px))] -translate-x-1/2 -translate-y-1/2 rounded-2xl border border-stone-200 bg-white p-5 text-center shadow-[0_16px_40px_-24px_rgba(28,30,38,0.42)]">
          <p className="text-sm font-semibold text-[#222]">No places yet</p>
          <p className="mx-auto mt-1 max-w-sm text-xs leading-relaxed text-[#666]">
            Search for a place or drop a pin to start building a map from this workspace.
          </p>
          <button
            type="button"
            onClick={openSearch}
            className="mt-4 inline-flex h-9 cursor-pointer items-center justify-center rounded-full bg-[#222] px-4 text-xs font-semibold text-white transition-opacity hover:opacity-90"
          >
            Add first place
          </button>
        </div>
      )}

      {/* ── Selected note detail (above carousel) ── */}
      {selectedCoord && (
        <div className="absolute bottom-[310px] right-4 z-700 w-72 overflow-hidden rounded-2xl bg-white shadow-lg">
          <div className="h-1" style={{ backgroundColor: getDomainColor(selectedCoord.domain) }} />
          <div className="p-4">
            <div className="flex items-start justify-between">
              <div className="min-w-0 flex-1">
                <p className="text-xs font-medium text-[#999]">{selectedCoord.domain}</p>
                <p className="mt-0.5 text-sm font-semibold text-[#222]">{selectedCoord.locationLabel}</p>
              </div>
              <button
                type="button"
                onClick={() => setSelectedId(null)}
                className="flex h-6 w-6 shrink-0 cursor-pointer items-center justify-center rounded-full text-[#999] transition-colors hover:bg-[#f0f0f0] hover:text-[#222]"
              >
                <X className="h-3 w-3" />
              </button>
            </div>
            <div className="mt-2.5 rounded-xl bg-[#f8f8f8] p-2.5">
              <p className="text-xs leading-relaxed text-[#333]">{selectedCoord.notePreview}</p>
            </div>
            <div className="mt-2 flex items-center justify-between">
              <span className="font-mono text-[10px] text-[#bbb]">
                {selectedCoord.lat.toFixed(4)}, {selectedCoord.lng.toFixed(4)}
              </span>
              <button
                type="button"
                className="flex cursor-pointer items-center gap-1 text-[10px] font-medium text-[#666] transition-colors hover:text-[#222]"
              >
                <ExternalLink className="h-2.5 w-2.5" />
                View note
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
