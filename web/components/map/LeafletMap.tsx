'use client'

import { useEffect, useRef, useCallback, useState } from 'react'
import type { MapCoordinate } from '@/lib/types'
import { getDomainColor } from '@/lib/map-theme'
import { cn } from '@/lib/utils'
import 'leaflet/dist/leaflet.css'

interface LeafletMapProps {
  coordinates: MapCoordinate[]
  tileUrl: string
  tileAttribution: string
  selectedId: string | null
  hoveredDomain: string | null
  onSelectId: (id: string | null) => void
  mapClickEnabled?: boolean
  onMapClick?: (lat: number, lng: number) => void
  flyTo?: { lat: number; lng: number; zoom?: number } | null
}

function pillMarkerHtml(label: string, color: string, isSelected: boolean): string {
  const maxLen = 18
  const truncated = label.length > maxLen ? label.slice(0, maxLen) + '…' : label

  if (isSelected) {
    return `<div class="inline-pill-marker inline-pill-selected" style="--pill-color:${color}">
      <span class="inline-pill-text">${truncated}</span>
    </div>`
  }
  return `<div class="inline-pill-marker" style="--pill-color:${color}">
    <span class="inline-pill-text">${truncated}</span>
  </div>`
}

export default function LeafletMap({
  coordinates,
  tileUrl,
  tileAttribution,
  selectedId,
  hoveredDomain,
  onSelectId,
  mapClickEnabled = false,
  onMapClick,
  flyTo,
}: LeafletMapProps) {
  const containerRef = useRef<HTMLDivElement>(null)
  const [mapReady, setMapReady] = useState(false)
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const mapRef = useRef<any>(null)
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const tileLayerRef = useRef<any>(null)
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const markersRef = useRef<Map<string, any>>(new Map())
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const linesRef = useRef<any[]>([])
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const LRef = useRef<any>(null)
  const onMapClickRef = useRef(onMapClick)
  onMapClickRef.current = onMapClick
  const hasInitialFitRef = useRef(false)
  const tileUrlInitRef = useRef(tileUrl)
  tileUrlInitRef.current = tileUrl

  const drawConnectionLines = useCallback(() => {
    const L = LRef.current
    const map = mapRef.current
    if (!L || !map) return

    linesRef.current.forEach(l => map.removeLayer(l))
    linesRef.current = []

    const domainGroups = new Map<string, MapCoordinate[]>()
    for (const c of coordinates) {
      if (!domainGroups.has(c.domain)) domainGroups.set(c.domain, [])
      domainGroups.get(c.domain)!.push(c)
    }

    domainGroups.forEach((items, domain) => {
      if (items.length < 2) return
      const color = getDomainColor(domain)
      const isHovered = hoveredDomain === domain

      for (let i = 0; i < items.length - 1; i++) {
        const a = items[i]
        const b = items[i + 1]
        const line = L.polyline(
          [
            [a.lat, a.lng],
            [b.lat, b.lng],
          ],
          {
            color,
            weight: isHovered ? 2.5 : 1,
            opacity: isHovered ? 0.5 : 0.2,
            dashArray: isHovered ? undefined : '6 4',
            className: 'map-connection-line',
          },
        ).addTo(map)
        linesRef.current.push(line)
      }
    })
  }, [coordinates, hoveredDomain])

  const rebuildMarkers = useCallback(() => {
    const L = LRef.current
    const map = mapRef.current
    if (!L || !map) return

    markersRef.current.forEach(m => map.removeLayer(m))
    markersRef.current.clear()

    coordinates.forEach(coord => {
      const color = getDomainColor(coord.domain)
      const isSelected = selectedId === coord.id
      const label = coord.locationLabel || coord.domain

      const html = pillMarkerHtml(label, color, isSelected)

      const icon = L.divIcon({
        className: 'inline-pill-wrapper',
        html,
        iconSize: [0, 0],
        iconAnchor: [0, 16],
      })

      const marker = L.marker([coord.lat, coord.lng], { icon }).addTo(map)
      markersRef.current.set(coord.id, marker)
      marker.on('click', () => onSelectId(coord.id))
    })

    drawConnectionLines()
  }, [coordinates, selectedId, drawConnectionLines, onSelectId])

  useEffect(() => {
    if (!containerRef.current) return
    let cancelled = false

    import('leaflet').then(L => {
      if (cancelled || !containerRef.current) return
      LRef.current = L

      const map = L.map(containerRef.current, {
        center: [37.8, -96],
        zoom: 4,
        minZoom: 3,
        maxBoundsViscosity: 0.8,
        zoomControl: false,
        attributionControl: true,
      })
      mapRef.current = map

      tileLayerRef.current = L.tileLayer(tileUrlInitRef.current, {
        attribution: tileAttribution,
        subdomains: 'abcd',
        maxZoom: 19,
      }).addTo(map)

      L.control.zoom({ position: 'bottomright' }).addTo(map)
      setMapReady(true)
    })

    return () => {
      cancelled = true
      setMapReady(false)
      hasInitialFitRef.current = false
      if (mapRef.current) {
        mapRef.current.remove()
        mapRef.current = null
        markersRef.current.clear()
        linesRef.current = []
      }
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  useEffect(() => {
    if (!mapReady || !tileLayerRef.current) return
    tileLayerRef.current.setUrl(tileUrl)
  }, [mapReady, tileUrl])

  useEffect(() => {
    if (!mapReady) return
    rebuildMarkers()
  }, [mapReady, rebuildMarkers])

  useEffect(() => {
    if (!mapReady || coordinates.length === 0 || hasInitialFitRef.current) return
    const map = mapRef.current
    const L = LRef.current
    if (!map || !L) return
    try {
      if (coordinates.length === 1) {
        map.setView([coordinates[0].lat, coordinates[0].lng], 6)
      } else {
        const bounds = L.latLngBounds(coordinates.map((c: MapCoordinate) => [c.lat, c.lng]))
        if (bounds.isValid()) {
          map.fitBounds(bounds, { padding: [80, 80], maxZoom: 12 })
        } else {
          map.setView([coordinates[0].lat, coordinates[0].lng], 6)
        }
      }
    } catch {
      map.setView([37.8, -96], 4)
    }
    hasInitialFitRef.current = true
  }, [mapReady, coordinates])

  useEffect(() => {
    const map = mapRef.current
    if (!mapReady || !map) return

    const handler = (e: { latlng: { lat: number; lng: number } }) => {
      if (mapClickEnabled) onMapClickRef.current?.(e.latlng.lat, e.latlng.lng)
    }
    map.on('click', handler)
    return () => {
      map.off('click', handler)
    }
  }, [mapReady, mapClickEnabled])

  useEffect(() => {
    const map = mapRef.current
    if (!mapReady || !map || !flyTo) return
    map.flyTo([flyTo.lat, flyTo.lng], flyTo.zoom ?? Math.max(map.getZoom(), 6), { duration: 0.6 })
  }, [mapReady, flyTo])

  useEffect(() => {
    const L = LRef.current
    const map = mapRef.current
    if (!L || !map) return

    coordinates.forEach(coord => {
      const marker = markersRef.current.get(coord.id)
      if (!marker) return
      const color = getDomainColor(coord.domain)
      const isSelected = selectedId === coord.id
      const label = coord.locationLabel || coord.domain

      const icon = L.divIcon({
        className: 'inline-pill-wrapper',
        html: pillMarkerHtml(label, color, isSelected),
        iconSize: [0, 0],
        iconAnchor: [0, 16],
      })
      marker.setIcon(icon)
    })

    if (selectedId) {
      const coord = coordinates.find(c => c.id === selectedId)
      if (coord) {
        map.flyTo([coord.lat, coord.lng], Math.max(map.getZoom(), 6), {
          duration: 0.8,
        })
      }
    }
  }, [selectedId, coordinates])

  useEffect(() => {
    drawConnectionLines()
  }, [drawConnectionLines])

  return (
    <>
      <style>{`
        @keyframes map-pulse {
          0% { transform: scale(1); opacity: 0.35; }
          100% { transform: scale(2.2); opacity: 0; }
        }
        .map-connection-line { pointer-events: none; }

        /* Pill marker */
        .inline-pill-wrapper {
          overflow: visible !important;
        }
        .inline-pill-marker {
          position: absolute;
          transform: translate(-50%, -100%);
          white-space: nowrap;
          padding: 6px 12px;
          border-radius: 20px;
          background: #fff;
          color: #222;
          font-size: 12px;
          font-weight: 600;
          font-family: -apple-system, system-ui, 'Inter', sans-serif;
          box-shadow: 0 2px 8px rgba(0,0,0,0.12), 0 1px 3px rgba(0,0,0,0.08);
          cursor: pointer;
          transition: transform 0.15s ease, box-shadow 0.15s ease, background 0.15s ease, color 0.15s ease;
          border: 1.5px solid rgba(0,0,0,0.06);
          line-height: 1;
        }
        .inline-pill-marker::after {
          content: '';
          position: absolute;
          bottom: -6px;
          left: 50%;
          transform: translateX(-50%);
          width: 0;
          height: 0;
          border-left: 6px solid transparent;
          border-right: 6px solid transparent;
          border-top: 6px solid #fff;
          filter: drop-shadow(0 1px 1px rgba(0,0,0,0.06));
        }
        .inline-pill-marker:hover {
          transform: translate(-50%, -100%) scale(1.06);
          box-shadow: 0 4px 16px rgba(0,0,0,0.18), 0 2px 6px rgba(0,0,0,0.1);
          z-index: 999 !important;
        }
        .inline-pill-selected {
          background: var(--pill-color, #222);
          color: #fff;
          border-color: var(--pill-color, #222);
          transform: translate(-50%, -100%) scale(1.1);
          box-shadow: 0 4px 20px rgba(0,0,0,0.22), 0 2px 8px rgba(0,0,0,0.12);
          z-index: 1000 !important;
        }
        .inline-pill-selected::after {
          border-top-color: var(--pill-color, #222);
        }
        .inline-pill-selected:hover {
          transform: translate(-50%, -100%) scale(1.12);
        }
        .inline-pill-text {
          position: relative;
          z-index: 1;
        }

        /* Zoom controls */
        .leaflet-control-zoom {
          border: 1px solid rgba(0,0,0,0.08) !important;
          border-radius: 12px !important;
          overflow: hidden;
          box-shadow: 0 2px 8px rgba(0,0,0,0.1) !important;
        }
        .leaflet-control-zoom a {
          background: #fff !important;
          color: #333 !important;
          border-bottom: 1px solid rgba(0,0,0,0.06) !important;
          font-size: 16px !important;
          width: 36px !important;
          height: 36px !important;
          line-height: 36px !important;
        }
        .leaflet-control-zoom a:hover {
          background: #f5f5f5 !important;
          color: #111 !important;
        }
        .leaflet-control-zoom-in { border-radius: 12px 12px 0 0 !important; }
        .leaflet-control-zoom-out { border-radius: 0 0 12px 12px !important; border-bottom: none !important; }
        .leaflet-attribution-flag { display: none !important; }
        .leaflet-control-attribution {
          background: rgba(255,255,255,0.85) !important;
          color: #999 !important;
          font-size: 9px !important;
          backdrop-filter: blur(4px);
        }
        .leaflet-container {
          background: #f8f8f8;
          font-family: -apple-system, system-ui, 'Inter', sans-serif;
        }
        .leaflet-container.map-cursor-crosshair {
          cursor: crosshair !important;
        }
      `}</style>
      <div
        ref={containerRef}
        className={cn('h-full w-full', mapClickEnabled && 'map-cursor-crosshair')}
      />
    </>
  )
}
