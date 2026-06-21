/** On-theme domain accents (stone / amber / teal / violet / rose). Red kept for vercel + hn. */
export const DOMAIN_COLORS: Record<string, string> = {
  'github.com': '#57534e',
  'zillow.com': '#b45309',
  'stripe.com': '#7c3aed',
  'linear.app': '#0f766e',
  'vercel.com': '#e11d48',
  'news.ycombinator.com': '#9f1239',
  'my-places': '#e11d48',
}

export function getDomainColor(domain: string): string {
  return DOMAIN_COLORS[domain] ?? '#78716c'
}
