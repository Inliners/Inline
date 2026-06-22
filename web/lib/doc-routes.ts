/**
 * URL helpers for workspace documents.
 *
 * Document ids must stay path-safe (no slashes, colons, or percent-encoded
 * separators) or Next.js treats extra `/` segments as new path parts → 404.
 */

/** Canonical in-app href for a folder document (flat route). */
export function documentHref(workspaceId: string, docId: string): string {
  return `/app/${workspaceId}/doc/${docId}`
}

/** True when an id would break dynamic `[docId]` / `[documentId]` matching. */
export function isUnsafeDocId(id: string): boolean {
  if (!id) return true
  if (/%2[fF]/.test(id)) return true
  try {
    const decoded = decodeURIComponent(id)
    return /[/:?#]/.test(decoded)
  } catch {
    return true
  }
}

/** Stable, URL-safe id for auto-generated page recaps. */
export function recapDocIdForPageUrl(pageUrl: string, timestamp = Date.now()): string {
  let hash = 0
  for (let i = 0; i < pageUrl.length; i++) {
    hash = (Math.imul(31, hash) + pageUrl.charCodeAt(i)) | 0
  }
  return `doc-recap-${Math.abs(hash).toString(36)}-${timestamp}`
}
