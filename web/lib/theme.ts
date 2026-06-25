/** Marketing routes always render in light mode, regardless of workspace theme. */
const MARKETING_PATHS = new Set(['/', '/install', '/privacy', '/terms'])

export type InlineTheme = 'light' | 'dark'

export function isMarketingPath(pathname: string): boolean {
  return MARKETING_PATHS.has(pathname)
}

export function getStoredTheme(): InlineTheme {
  try {
    return (localStorage.getItem('inline-theme') as InlineTheme | null) ?? 'light'
  } catch {
    return 'light'
  }
}

export function applyTheme(theme: InlineTheme) {
  if (theme === 'dark') document.documentElement.classList.add('dark')
  else document.documentElement.classList.remove('dark')
}

/** Apply or strip `.dark` on <html> based on route and stored preference. */
export function syncThemeForPath(pathname: string) {
  if (isMarketingPath(pathname)) applyTheme('light')
  else applyTheme(getStoredTheme())
}
