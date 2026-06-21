import { redirect } from 'next/navigation'
import { DEFAULT_WORKSPACES } from '@/lib/workspaces'

export default function LegacyGraphPage() {
  const firstWorkspaceId = DEFAULT_WORKSPACES[0]?.id ?? 'ws-1'
  redirect(`/app/${firstWorkspaceId}/graph`)
}
