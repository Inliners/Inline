import { redirect } from 'next/navigation'

/**
 * Workspace Home — the default landing surface for a workspace.
 *
 * The dashboard already serves as the polished home experience (greeting,
 * captures, library, stats), so /home routes there. Keeping a dedicated
 * /home route means sidebar workspace rows navigate to a stable "Home"
 * destination and any future home-specific surface can live here.
 */
export default async function WorkspaceHomePage({
  params,
}: {
  params: Promise<{ workspaceId: string }>
}) {
  const { workspaceId } = await params
  redirect(`/app/${workspaceId}/dashboard`)
}
