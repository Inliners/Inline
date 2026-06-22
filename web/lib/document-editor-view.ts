/** True when the user is in a full document editor (recap or folder doc). */
export function isDocumentEditorPath(pathname: string): boolean {
  return (
    /\/app\/[^/]+\/doc\/[^/]+$/.test(pathname) ||
    /\/app\/[^/]+\/folder\/[^/]+\/doc\/[^/]+$/.test(pathname)
  )
}
