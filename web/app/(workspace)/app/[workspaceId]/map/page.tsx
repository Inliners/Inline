import type { Metadata } from 'next'
import SpatialMap from '@/components/map/SpatialMap'
import { fetchMapCoordinates } from '@/lib/data'

export const metadata: Metadata = { title: 'Map' }

export default async function WorkspaceMapPage({
  params,
}: {
  params: Promise<{ workspaceId: string }>
}) {
  const { workspaceId } = await params
  const coordinates = await fetchMapCoordinates(workspaceId)

  return (
    <div className="relative h-screen w-full overflow-hidden">
      <SpatialMap
        coordinates={coordinates}
        storageKey={`inline-map-pins-${workspaceId}`}
        backHref={`/app/${workspaceId}/dashboard`}
      />
    </div>
  )
}
