export type SaveToastResponse = {
  ok?: boolean
  queued?: boolean
  storageMode?: 'local' | 'workspace'
}

export function emitSaveToast(response: SaveToastResponse | undefined): void {
  if (!response?.ok && !response?.queued) return
  const synced = response.storageMode === 'workspace'
  document.dispatchEvent(new CustomEvent('inline:toast', {
    detail: synced
      ? { message: 'Saved to Workspace', tone: 'success', action: 'dashboard' }
      : { message: 'Saved to browser.', tone: 'local' },
  }))
}
