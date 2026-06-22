'use client'

import { useEffect, useState, useCallback, useRef } from 'react'
import { useRouter, usePathname } from 'next/navigation'
import {
  Command,
  CommandDialog,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
  CommandSeparator,
} from '@/components/ui/command'
import {
  LayoutDashboard, Clock, Map, Share2, Settings,
  FileText, Loader2, Download, BarChart3, UserRound,
} from 'lucide-react'

const NAV_COMMANDS = [
  { label: 'Home',            icon: LayoutDashboard, path: 'dashboard', shortcut: 'G D' },
  { label: 'Captures',        icon: Clock,           path: 'history',   shortcut: 'G H' },
  { label: 'Analytics',       icon: BarChart3,       path: 'analytics', shortcut: ''    },
  { label: 'Places',          icon: Map,             path: 'map',       shortcut: 'G M' },
  { label: 'Connections',     icon: Share2,          path: 'graph',     shortcut: 'G G' },
  { label: 'Settings',        icon: Settings,        path: 'settings',  shortcut: ''    },
]

const ACTION_COMMANDS = [
  { label: 'Install the extension', icon: Download,  href: '/install'     },
  { label: 'Account settings',      icon: UserRound, href: '/app/account' },
]

type SearchResult = {
  id: string
  page_url: string | null
  page_title: string | null
  content: string
  type: string
  workspace_id: string | null
  created_at: string
}

function getWorkspaceId(pathname: string | null): string {
  const m = pathname?.match(/\/app\/(ws-[^/]+)/)
  return m ? m[1] : 'ws-1'
}

export default function CommandPalette() {
  const [open,  setOpen]  = useState(false)
  const [query, setQuery] = useState('')
  const [results, setResults] = useState<SearchResult[]>([])
  const [searching, setSearching] = useState(false)
  const [searchError, setSearchError] = useState(false)
  const abortRef = useRef<AbortController | null>(null)
  const router = useRouter()
  const pathname = usePathname()
  const workspaceId = getWorkspaceId(pathname)

  useEffect(() => {
    const down = (e: KeyboardEvent) => {
      if (e.key === 'k' && (e.metaKey || e.ctrlKey)) {
        e.preventDefault()
        setOpen(o => !o)
      }
      // Also open on "/" key when not in an input
      if (e.key === '/' && !['INPUT','TEXTAREA'].includes((e.target as HTMLElement).tagName)) {
        e.preventDefault()
        setOpen(true)
      }
    }
    const openFromSidebar = () => setOpen(true)
    document.addEventListener('keydown', down)
    window.addEventListener('inline-open-cmd', openFromSidebar)
    return () => {
      document.removeEventListener('keydown', down)
      window.removeEventListener('inline-open-cmd', openFromSidebar)
    }
  }, [])

  // Live note search against /api/search (debounced 250ms, user-scoped).
  useEffect(() => {
    if (!open || query.trim().length < 2) {
      setResults([])
      setSearching(false)
      setSearchError(false)
      return
    }
    setSearching(true)
    setSearchError(false)
    const t = setTimeout(async () => {
      abortRef.current?.abort()
      const controller = new AbortController()
      abortRef.current = controller
      try {
        const params = new URLSearchParams({ q: query.trim() })
        if (workspaceId) params.set('workspaceId', workspaceId)
        const res = await fetch(`/api/search?${params}`, { signal: controller.signal })
        if (!res.ok) {
          setResults([])
          setSearchError(true)
          return
        }
        const json = (await res.json()) as { results?: SearchResult[] }
        setResults(Array.isArray(json.results) ? json.results.slice(0, 6) : [])
      } catch (err) {
        if ((err as Error)?.name !== 'AbortError') {
          setResults([])
          setSearchError(true)
        }
      } finally {
        setSearching(false)
      }
    }, 250)
    return () => clearTimeout(t)
  }, [open, query, workspaceId])

  const run = useCallback(
    (href: string) => {
      setOpen(false)
      setQuery('')
      router.push(href)
    },
    [router],
  )

  const historyBase = `/app/${workspaceId}/history`

  return (
    <CommandDialog open={open} onOpenChange={v => { setOpen(v); if (!v) setQuery('') }}>
      <Command className="rounded-xl border-border" shouldFilter={false}>
        <CommandInput
          placeholder="Search your captures or type a command…"
          value={query}
          onValueChange={setQuery}
        />
        <CommandList>
          <CommandEmpty>
            {searching ? (
              <span className="flex items-center justify-center gap-2 text-muted-foreground">
                <Loader2 className="h-3.5 w-3.5 animate-spin" /> Searching…
              </span>
            ) : searchError ? (
              'Search is unavailable right now.'
            ) : query.trim().length >= 2 ? (
              'No captures match that search.'
            ) : (
              'Type at least two characters to search your captures.'
            )}
          </CommandEmpty>

          {/* Live note search results */}
          {results.length > 0 && (
            <>
              <CommandGroup heading="Captures">
                {results.map(note => (
                  <CommandItem
                    key={note.id}
                    onSelect={() => run(`${historyBase}?q=${encodeURIComponent(query.trim())}`)}
                    className="flex flex-col items-start gap-0.5 py-2"
                  >
                    <div className="flex items-center gap-2 w-full">
                      <FileText className="w-4 h-4 shrink-0 text-muted-foreground" />
                      <span className="text-sm font-medium truncate flex-1">
                        {(note.content || note.page_title || 'Untitled capture').slice(0, 70)}
                      </span>
                      <span className="text-[10px] text-muted-foreground shrink-0 bg-muted px-1.5 py-0.5 rounded">
                        {note.type}
                      </span>
                    </div>
                    {note.page_title && (
                      <p className="text-xs text-muted-foreground pl-6 truncate w-full">
                        {note.page_title}
                      </p>
                    )}
                  </CommandItem>
                ))}
              </CommandGroup>
              <CommandSeparator />
            </>
          )}

          {/* Navigation */}
          <CommandGroup heading="Navigation">
            {NAV_COMMANDS.map(item => {
              const Icon = item.icon
              return (
                <CommandItem key={item.label} onSelect={() => run(`/app/${workspaceId}/${item.path}`)}>
                  <Icon className="w-4 h-4 mr-2 text-muted-foreground" />
                  <span>{item.label}</span>
                  {item.shortcut && (
                    <kbd className="ml-auto text-[10px] text-muted-foreground bg-muted px-1.5 py-0.5 rounded font-mono">
                      {item.shortcut}
                    </kbd>
                  )}
                </CommandItem>
              )
            })}
          </CommandGroup>

          <CommandSeparator />

          {/* Actions — real destinations only */}
          <CommandGroup heading="Actions">
            {ACTION_COMMANDS.map(item => {
              const Icon = item.icon
              return (
                <CommandItem key={item.label} onSelect={() => run(item.href)}>
                  <Icon className="w-4 h-4 mr-2 text-muted-foreground" />
                  <span>{item.label}</span>
                </CommandItem>
              )
            })}
          </CommandGroup>
        </CommandList>
      </Command>
    </CommandDialog>
  )
}
