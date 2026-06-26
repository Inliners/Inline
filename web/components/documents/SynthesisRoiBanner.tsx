'use client'

import { motion } from 'framer-motion'
import type { Note } from '@/lib/types'
import { computeSynthesisRoi, formatSynthesisRoiMessage } from '@/lib/synthesis-roi'
import AiFeedbackBar from '@/components/ai/AiFeedbackBar'

interface Props {
  workspaceId: string
  docId: string
  notes: Note[]
  recapHtml: string
}

export default function SynthesisRoiBanner({ workspaceId, docId, notes, recapHtml }: Props) {
  const roi = computeSynthesisRoi(notes, recapHtml)
  if (!roi) return null

  return (
    <motion.div
      initial={{ opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.35, ease: [0.22, 1, 0.36, 1] }}
      className="mb-6 rounded-xl border border-emerald-200/80 bg-emerald-50/80 px-4 py-3"
    >
      <p className="text-sm leading-relaxed text-emerald-900">
        {formatSynthesisRoiMessage(roi)}
      </p>
      <AiFeedbackBar
        workspaceId={workspaceId}
        surface="roi"
        targetId={docId}
        className="mt-2"
      />
    </motion.div>
  )
}
