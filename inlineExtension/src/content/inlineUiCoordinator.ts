/**
 * Cross-component UI focus coordination between SmartOverlay (selection UI)
 * and Home (dock panels). Uses document custom events so siblings in the
 * shadow-DOM React tree can negotiate mutual exclusion without shared state.
 */

export type SelectionUiSource = 'toolbar' | 'contextMenu'

export type DockPanelId =
  | 'rewrite' | 'ai' | 'notes' | 'settings' | 'highlighter' | 'draw'
  | 'layers' | 'stamps' | 'search' | 'screenshot' | 'laser' | 'handwriting'

export const INLINE_UI_EVENTS = {
  selectionUiActive: 'inline:selectionUiActive',
  selectionUiDismiss: 'inline:selectionUiDismiss',
  dockPanelDismiss: 'inline:dockPanelDismiss',
  dockPanelOpen: 'inline:dockPanelOpen',
  dockPanelClosed: 'inline:dockPanelClosed',
} as const

export function emitSelectionUiActive(source: SelectionUiSource): void {
  document.dispatchEvent(
    new CustomEvent(INLINE_UI_EVENTS.selectionUiActive, { detail: { source } }),
  )
}

/** Ask SmartOverlay to hide toolbar/context menu without clearing selection refs. */
export function emitSelectionUiDismiss(): void {
  document.dispatchEvent(new CustomEvent(INLINE_UI_EVENTS.selectionUiDismiss))
}

/** Ask Home to collapse the dock panel and flyouts (rail stays open). */
export function emitDockPanelDismiss(): void {
  document.dispatchEvent(new CustomEvent(INLINE_UI_EVENTS.dockPanelDismiss))
}

/** Ask SmartOverlay to hide selection chrome while a dock panel is open. */
export function emitDockPanelOpen(panel: DockPanelId): void {
  document.dispatchEvent(
    new CustomEvent(INLINE_UI_EVENTS.dockPanelOpen, { detail: { panel } }),
  )
}

/** Lift selection-chrome suppression after the dock panel closes. */
export function emitDockPanelClosed(): void {
  document.dispatchEvent(new CustomEvent(INLINE_UI_EVENTS.dockPanelClosed))
}

export function onSelectionUiActive(handler: (source: SelectionUiSource) => void): () => void {
  const listener = (e: Event) => {
    const source = (e as CustomEvent<{ source: SelectionUiSource }>).detail?.source
    if (source) handler(source)
  }
  document.addEventListener(INLINE_UI_EVENTS.selectionUiActive, listener)
  return () => document.removeEventListener(INLINE_UI_EVENTS.selectionUiActive, listener)
}

export function onSelectionUiDismiss(handler: () => void): () => void {
  document.addEventListener(INLINE_UI_EVENTS.selectionUiDismiss, handler)
  return () => document.removeEventListener(INLINE_UI_EVENTS.selectionUiDismiss, handler)
}

export function onDockPanelDismiss(handler: () => void): () => void {
  document.addEventListener(INLINE_UI_EVENTS.dockPanelDismiss, handler)
  return () => document.removeEventListener(INLINE_UI_EVENTS.dockPanelDismiss, handler)
}

export function onDockPanelOpen(handler: (panel: DockPanelId) => void): () => void {
  const listener = (e: Event) => {
    const panel = (e as CustomEvent<{ panel: DockPanelId }>).detail?.panel
    if (panel) handler(panel)
  }
  document.addEventListener(INLINE_UI_EVENTS.dockPanelOpen, listener)
  return () => document.removeEventListener(INLINE_UI_EVENTS.dockPanelOpen, listener)
}

export function onDockPanelClosed(handler: () => void): () => void {
  document.addEventListener(INLINE_UI_EVENTS.dockPanelClosed, handler)
  return () => document.removeEventListener(INLINE_UI_EVENTS.dockPanelClosed, handler)
}
