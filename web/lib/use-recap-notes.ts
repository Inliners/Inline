'use client'

import { useEffect, useState } from 'react'
import type { Note } from '@/lib/types'

export function useRecapNotes(workspaceId: string, pageUrl: string | undefined) {
  const [notes, setNotes] = useState<Note[]>([])
  const [loading, setLoading] = useState(!!pageUrl)

  useEffect(() => {
    if (!pageUrl || !workspaceId) {
      setNotes([])
      setLoading(false)
      return
    }

    let cancelled = false
    setLoading(true)

    const url = `/api/notes?workspaceId=${encodeURIComponent(workspaceId)}&pageUrl=${encodeURIComponent(pageUrl)}`

    fetch(url)
      .then(r => (r.ok ? r.json() : Promise.reject(new Error('fetch failed'))))
      .then((data: { notes?: Note[] }) => {
        if (!cancelled) setNotes(data.notes ?? [])
      })
      .catch(() => {
        if (!cancelled) setNotes([])
      })
      .finally(() => {
        if (!cancelled) setLoading(false)
      })

    return () => { cancelled = true }
  }, [workspaceId, pageUrl])

  return { notes, loading }
}
