import { useState, useEffect, useRef } from 'react'
import Home from '../components/Home'
import { wrapRangeWithHighlight } from './highlightWrap'
import { onDockPanelOpen } from './inlineUiCoordinator'

/**
 * PanelHost bridges the content script world with the panel components.
 * It captures the current text selection and range so panels (Rewrite, AI)
 * can operate on the user's highlighted text.
 *
 * The captured Range lives in React state (not a ref) so that when the user
 * opens Rewrite or AI, the child Home tree re-renders with a fresh
 * `originalRange` prop, letting Rewrite/AI Insert write back into the correct
 * spot in the DOM.
 */
export default function PanelHost() {
  const [selectedText, setSelectedText] = useState('')
  const [originalRange, setOriginalRange] = useState<Range | null>(null)
  const originalRangeRef = useRef<Range | null>(null)
  const selectedTextRef = useRef('')

  useEffect(() => {
    originalRangeRef.current = originalRange
  }, [originalRange])

  useEffect(() => {
    selectedTextRef.current = selectedText
  }, [selectedText])

  useEffect(() => {
    function capture() {
      const sel = window.getSelection()
      if (!sel) return
      // Collapsed selection (e.g. after clicking the dock) — keep the last
      // captured range so Rewrite/AI still target the highlighted paragraph.
      if (sel.isCollapsed || !sel.toString().trim()) return
      try {
        const range = sel.getRangeAt(0).cloneRange()
        setSelectedText(sel.toString())
        setOriginalRange(range)
      } catch {
        /* ignore invalid selection */
      }
    }
    document.addEventListener('mouseup', capture)
    document.addEventListener('keyup', capture)
    return () => {
      document.removeEventListener('mouseup', capture)
      document.removeEventListener('keyup', capture)
    }
  }, [])

  useEffect(() => {
    return onDockPanelOpen((panel) => {
      if (panel !== 'rewrite' && panel !== 'ai') return

      const range = originalRangeRef.current
      const text = selectedTextRef.current.trim()
      if (!range || !text) return

      try {
        const wrapped = wrapRangeWithHighlight(range, 'selection-hold')
        if (!wrapped) return
        originalRangeRef.current = wrapped.range
        selectedTextRef.current = wrapped.text
        setOriginalRange(wrapped.range)
        setSelectedText(wrapped.text)
      } catch {
        /* range may be detached */
      }
    })
  }, [])

  return (
    <div data-panel-host="">
      <Home selectedText={selectedText} originalRange={originalRange} />
    </div>
  )
}
