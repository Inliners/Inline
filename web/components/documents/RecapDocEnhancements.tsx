'use client'

import type { Note } from '@/lib/types'
import SynthesisRoiBanner from './SynthesisRoiBanner'
import KnowledgeCardDeck from './KnowledgeCardDeck'

function stripHtml(html: string): string {
  return html.replace(/<[^>]+>/g, ' ').replace(/\s+/g, ' ').trim()
}

interface Props {
  workspaceId: string
  docId: string
  notes: Note[]
  recapHtml: string
}

export default function RecapDocEnhancements({ workspaceId, docId, notes, recapHtml }: Props) {
  const notesText = notes.map(n => `${n.content}${n.pageContext ? `\n${n.pageContext}` : ''}`).join('\n\n')
  const recapText = stripHtml(recapHtml)

  return (
    <>
      <SynthesisRoiBanner
        workspaceId={workspaceId}
        docId={docId}
        notes={notes}
        recapHtml={recapHtml}
      />
      <KnowledgeCardDeck
        workspaceId={workspaceId}
        docId={docId}
        recapText={recapText}
        notesText={notesText}
      />
    </>
  )
}
