import { useState, useEffect } from 'react'
import Home from '../components/Home'

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

  useEffect(() => {
    function capture() {
      const sel = window.getSelection()
      if (!sel) return
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

  return (
    <div data-panel-host="">
      <Home selectedText={selectedText} originalRange={originalRange} />
    </div>
  )
}
