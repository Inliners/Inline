/** Workspace or account settings — full-page mode without the main app sidebar. */
export function isStandaloneSettingsPath(pathname: string): boolean {
  const path = pathname.split('?')[0] ?? pathname
  if (path === '/app/settings') return true
  return /^\/app\/[^/]+\/settings\/?$/.test(path)
}
