import Link from 'next/link'
import { SectionLink, type SectionHref } from '@/components/marketing/SectionLink'
import { DEFAULT_WORKSPACES } from '@/lib/workspaces'
import { workspacePath } from '@/lib/workspace-routes'

const WORKSPACE_HOME = workspacePath(DEFAULT_WORKSPACES[0]!, 'dashboard')

/**
 * Footer with real destinations only — section anchors, the install guide,
 * and auth/app routes. No placeholder links, ratings, or language switchers.
 */
const LINK_COLUMNS: { section: string; items: { label: string; href: string | SectionHref }[] }[] = [
  {
    section: 'Product',
    items: [
      { label: 'Overview',  href: '/#product' },
      { label: 'Extension', href: '/#extension' },
      { label: 'AI search', href: '/#rag' },
      { label: 'FAQ',       href: '/#faq' },
    ],
  },
  {
    section: 'Workspace',
    items: [
      { label: 'Open workspace', href: WORKSPACE_HOME },
      { label: 'Sign in',        href: '/auth/login' },
      { label: 'Create account', href: '/auth/register' },
    ],
  },
  {
    section: 'Get started',
    items: [
      { label: 'Install the extension', href: '/install' },
      { label: 'Privacy', href: '/privacy' },
      { label: 'Terms', href: '/terms' },
    ],
  },
]

export default function MarketingFooter() {
  return (
    <footer className="bg-[#14161C] border-t border-white/15 text-stone-300">
      <div className="max-w-6xl mx-auto px-5 py-12 sm:px-6 sm:py-16 lg:px-10">
        <div className="grid grid-cols-2 gap-8 sm:gap-10 md:grid-cols-5">
          {/* Brand */}
          <div className="col-span-2">
            <div className="flex items-center gap-2 mb-4">
              <div className="w-7 h-7 rounded-lg bg-white/10 flex items-center justify-center ring-1 ring-white/10" aria-hidden>
                <span className="block h-4 w-1 rounded-full bg-white -rotate-12" />
              </div>
              <span className="font-semibold text-sm text-white">inline</span>
            </div>
            <p className="text-xs text-stone-400 leading-relaxed max-w-[240px]">
              Capture context directly on the web. Turn highlights, notes,
              rewrites, and recaps into a searchable AI workspace.
            </p>
          </div>

          {LINK_COLUMNS.map(col => (
            <div key={col.section}>
              <p className="text-xs font-semibold text-white mb-4">{col.section}</p>
              <ul className="space-y-2.5">
                {col.items.map(item => (
                  <li key={item.label}>
                    {item.href.startsWith('/#') ? (
                      <SectionLink
                        href={item.href as SectionHref}
                        className="text-xs text-stone-300 hover:text-white transition-colors"
                      >
                        {item.label}
                      </SectionLink>
                    ) : (
                      <Link
                        href={item.href}
                        className="text-xs text-stone-300 hover:text-white transition-colors"
                      >
                        {item.label}
                      </Link>
                    )}
                  </li>
                ))}
              </ul>
            </div>
          ))}
        </div>

        <div className="mt-16 pt-8 border-t border-white/15 flex flex-col sm:flex-row items-center justify-between gap-4">
          <p className="text-xs text-stone-400">Built with curiosity and coffee.</p>
          <p className="text-xs text-stone-400">&copy;{new Date().getFullYear()} Inline</p>
        </div>
      </div>
    </footer>
  )
}
