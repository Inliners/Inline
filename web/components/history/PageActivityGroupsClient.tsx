'use client'

/**
 * Client wrapper around PageActivityGroups that also kicks off local recap
 * document generation for each page. Uses the localStorage-backed library so
 * it works whether or not the Supabase `public.documents` migration has been
 * applied.
 */

import { useEffect, useMemo, useState } from 'react'
import PageActivityGroups from './PageActivityGroups'
import type { Note } from '@/lib/types'
import { ensurePageRecaps } from '@/lib/auto-recap'

interface Props {
  notes: Note[]
  workspaceId: string
  workspaceName: string
  /** Server-side recap map (Supabase). Local recaps extend this. */
  serverRecapByPageUrl?: Record<string, { id: string; title: string; updatedAt: string }>
}

export default function PageActivityGroupsClient({
  notes,
  workspaceId,
  workspaceName,
  serverRecapByPageUrl = {},
}: Props) {
  const [localRecaps, setLocalRecaps] = useState<
    Record<string, { id: string; title: string; updatedAt: string }>
  >({})

  useEffect(() => {
    if (typeof window === 'undefined') return
    const map = ensurePageRecaps(workspaceId, workspaceName, notes)
    setLocalRecaps(map)
  }, [workspaceId, workspaceName, notes])

  const combined = useMemo(
    () => ({ ...localRecaps, ...serverRecapByPageUrl }),
    [localRecaps, serverRecapByPageUrl],
  )

  return (
    <PageActivityGroups
      notes={notes}
      workspaceId={workspaceId}
      recapByPageUrl={combined}
    />
  )
}
