/**
 * Tiny shared flag so the floating-panel host (Home) knows when it must NOT
 * close a panel on an outside click — e.g. while an AI response is actively
 * generating. Panels call `setAiBusy(true)` before a long request and
 * `setAiBusy(false)` in their `finally`.
 */
let aiBusy = false

export function setAiBusy(busy: boolean): void {
  aiBusy = busy
}

export function isAiBusy(): boolean {
  return aiBusy
}
