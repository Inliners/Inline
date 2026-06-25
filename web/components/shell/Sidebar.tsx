'use client'

import Link from 'next/link'
import { usePathname, useRouter } from 'next/navigation'
import { motion } from 'framer-motion'
import {
  LayoutDashboard, Clock, Settings, LogOut,
  Search, Plus, UserPlus, Zap, Megaphone, Package, TrendingUp,
  FolderKanban, Lightbulb, Star, X, Check, PanelLeftClose,
  ChevronDown, BarChart2, Folder, FolderPlus, ChevronRight,
  FileText, FilePlus, GripVertical, RefreshCw,
} from 'lucide-react'
import { useState, useEffect, useRef } from 'react'
import { cn } from '@/lib/utils'
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'
import { DEFAULT_WORKSPACES, withWorkspaceSlugs, slugifyWorkspaceLabel } from '@/lib/workspaces'
import {
  ensureUniqueWorkspaceSlug,
  getWorkspaceSlugFromPath,
  resolveWorkspaceId,
  workspacePath,
} from '@/lib/workspace-routes'
import { useSidebar } from '@/lib/sidebar-context'
import { signOut } from '@/lib/actions/auth'
import { createClient } from '@/lib/supabase/client'
import {
  loadFolderDocuments,
  createFolderDocument,
  deleteDocumentsInFolders,
  type FolderDocument,
} from '@/lib/workspace-library'
import {
  type WorkspaceFolder,
  loadWorkspaceFolders,
  saveWorkspaceFolders,
  getRootFolders,
  getChildFolders,
  removeFolderSubtree,
  collectSubtreeFolderIds,
} from '@/lib/workspace-folders'
import ThemeToggle from '@/components/shell/ThemeToggle'

// ---------------------------------------------------------------------------
// Types & constants
// ---------------------------------------------------------------------------
interface WorkspaceItem { id: string; label: string; slug: string; color: string; icon: string }

const ICON_MAP: Record<string, React.ElementType> = {
  Megaphone, Package, TrendingUp, FolderKanban, Lightbulb, Zap,
}
const DEFAULT_ICON_KEYS = ['Megaphone', 'Package', 'TrendingUp', 'FolderKanban', 'Lightbulb']
const DEFAULT_COLORS    = ['#f43f5e', '#6C91C2', '#f59e0b', '#5FA8A1', '#a855f7']

const FEATURES = [
  { href: (ws: WorkspaceItem) => workspacePath(ws, 'dashboard'), icon: LayoutDashboard, label: 'Home' },
  { href: (ws: WorkspaceItem) => workspacePath(ws, 'history'), icon: Clock, label: 'Captures' },
  { href: (ws: WorkspaceItem) => workspacePath(ws, 'analytics'), icon: BarChart2, label: 'Analytics' },
  { href: (ws: WorkspaceItem) => workspacePath(ws, 'settings'), icon: Settings, label: 'Settings' },
]

// ---------------------------------------------------------------------------
// localStorage helpers
// ---------------------------------------------------------------------------
function loadWorkspaces(): WorkspaceItem[] {
  if (typeof window === 'undefined') return DEFAULT_WORKSPACES
  try {
    const r = localStorage.getItem('inline-workspaces')
    const parsed = r ? (JSON.parse(r) as WorkspaceItem[]) : DEFAULT_WORKSPACES
    return withWorkspaceSlugs(parsed.length ? parsed : DEFAULT_WORKSPACES) as WorkspaceItem[]
  } catch {
    return DEFAULT_WORKSPACES
  }
}
function saveWorkspaces(ws: WorkspaceItem[]) {
  const migrated = withWorkspaceSlugs(ws) as WorkspaceItem[]
  localStorage.setItem('inline-workspaces', JSON.stringify(migrated))
}
function loadFavorites(): string[] {
  if (typeof window === 'undefined') return []
  try { const r = localStorage.getItem('inline-favorites'); return r ? JSON.parse(r) : [] } catch { return [] }
}
function saveFavorites(favs: string[]) { localStorage.setItem('inline-favorites', JSON.stringify(favs)) }

function getActiveWorkspaceId(pathname: string, workspaces: WorkspaceItem[]): string {
  return resolveWorkspaceId(getWorkspaceSlugFromPath(pathname), workspaces)
}

function isMacPlatform() {
  if (typeof navigator === 'undefined') return true
  return /Mac|iPhone|iPad|iPod/.test(navigator.platform)
}

function workspaceShortcutLabel(index: number) {
  return isMacPlatform() ? `⌘${index + 1}` : `Ctrl+${index + 1}`
}

function WorkspaceIcon({ ws, size = 'md' }: { ws: WorkspaceItem; size?: 'sm' | 'md' }) {
  const Icon = ICON_MAP[ws.icon] ?? Zap
  const box = size === 'sm' ? 'h-5 w-5' : 'h-6 w-6'
  const icon = size === 'sm' ? 'h-2.5 w-2.5' : 'h-3 w-3'
  return (
    <span
      className={cn(box, 'flex shrink-0 items-center justify-center rounded-md')}
      style={{ background: `${ws.color}22` }}
    >
      <Icon className={cn(icon, 'shrink-0')} style={{ color: ws.color }} />
    </span>
  )
}

// ---------------------------------------------------------------------------
// NavRow
// ---------------------------------------------------------------------------
function NavRow({ href, icon: Icon, label, collapsed, active, dotColor, onStar, starred, onGear }: {
  href: string; icon: React.ElementType; label: string; collapsed: boolean; active: boolean
  dotColor?: string; onStar?: () => void; starred?: boolean; onGear?: () => void
}) {
  return (
    <div className="group/row relative flex items-center">
      <Link
        href={href}
        title={collapsed ? label : undefined}
        className={cn(
          collapsed
            ? 'w-10 h-10 aspect-square rounded-md flex items-center justify-center transition-all cursor-pointer shrink-0'
            : 'flex flex-1 items-center gap-2.5 px-2.5 py-[7px] rounded-lg text-sm transition-all cursor-pointer min-w-0',
          active
            ? 'bg-[#F1F1EF] text-[#37352F] font-semibold dark:bg-sidebar-accent dark:text-foreground'
            : 'text-stone-400 hover:text-stone-700 hover:bg-stone-100 dark:text-muted-foreground dark:hover:text-foreground dark:hover:bg-sidebar-accent',
        )}
      >
        {dotColor ? (
          <span className="w-4 h-4 rounded-md flex items-center justify-center shrink-0" style={{ background: dotColor + '22' }}>
            <Icon className="w-3 h-3 shrink-0" style={{ color: dotColor }} />
          </span>
        ) : (
          <Icon className={cn('w-4 h-4 shrink-0', active ? 'text-[#37352F] dark:text-white' : '')} />
        )}
        <span
          className="flex-1 overflow-hidden whitespace-nowrap truncate min-w-0 transition-[opacity,max-width] duration-[220ms] ease-[cubic-bezier(.4,0,.2,1)]"
          style={{ maxWidth: collapsed ? 0 : 160, opacity: collapsed ? 0 : 1 }}
        >
          {label}
        </span>
      </Link>
      {!collapsed && (onStar || onGear) && (
        <div className="flex items-center gap-0.5 opacity-0 group-hover/row:opacity-100 transition-opacity pr-1 shrink-0">
          {onGear && (
            <button onClick={e => { e.preventDefault(); e.stopPropagation(); onGear() }}
              className="w-5 h-5 flex items-center justify-center rounded text-stone-400 hover:text-stone-700 hover:bg-stone-100 transition-colors cursor-pointer" title="Workspace settings">
              <Settings className="w-3 h-3" />
            </button>
          )}
          {onStar && (
            <button onClick={e => { e.preventDefault(); e.stopPropagation(); onStar() }}
              className="w-5 h-5 flex items-center justify-center rounded transition-colors cursor-pointer"
              title={starred ? 'Unpin' : 'Pin to Favorites'}>
              <Star className={cn('w-3 h-3 transition-colors', starred ? 'fill-amber-400 text-amber-400' : 'text-stone-400 hover:text-amber-400')} />
            </button>
          )}
        </div>
      )}
    </div>
  )
}

// ---------------------------------------------------------------------------
// Collapsible section label
// ---------------------------------------------------------------------------
function SectionLabel({ label, collapsed, expanded, onToggle, action }: {
  label: string; collapsed: boolean; expanded: boolean; onToggle: () => void; action?: React.ReactNode
}) {
  if (collapsed) return null
  return (
    <div className="flex items-center justify-between px-2.5 pt-4 pb-1">
      <button onClick={onToggle} className="flex items-center gap-1 cursor-pointer hover:text-stone-700 transition-colors dark:hover:text-foreground">
        <span className="text-[10.5px] font-semibold uppercase tracking-wider text-stone-400 select-none dark:text-muted-foreground">
          {label}
        </span>
        <ChevronDown className={cn('w-3 h-3 text-stone-300 transition-transform duration-200 dark:text-muted-foreground', !expanded && '-rotate-90')} />
      </button>
      {action}
    </div>
  )
}

// ---------------------------------------------------------------------------
// Share / Invite Modal — honest version. Workspaces are single-user today, so
// instead of pretending to email invites, this offers two real actions:
// copy a link to Inline and open a pre-filled email in the user's mail client.
// ---------------------------------------------------------------------------
function InviteModal({ open, onClose }: { open: boolean; onClose: () => void }) {
  const [copied, setCopied] = useState(false)

  const shareUrl = typeof window !== 'undefined' ? window.location.origin : ''
  const mailto = `mailto:?subject=${encodeURIComponent('Try Inline — a memory layer for the web')}&body=${encodeURIComponent(
    `I've been using Inline to capture highlights and notes directly on webpages and ask AI across them. You can set it up here: ${shareUrl}`,
  )}`

  async function copyLink() {
    try {
      await navigator.clipboard.writeText(shareUrl)
      setCopied(true)
      setTimeout(() => setCopied(false), 1800)
    } catch {
      /* clipboard unavailable (insecure context) — selection fallback below */
      setCopied(false)
    }
  }

  return (
    <Dialog open={open} onOpenChange={v => { if (!v) onClose() }}>
      <DialogContent className="max-w-sm">
        <DialogHeader>
          <DialogTitle className="text-sm font-semibold">Share Inline</DialogTitle>
        </DialogHeader>
        <div className="space-y-3 mt-1">
          <p className="text-xs leading-relaxed text-stone-500">
            Workspaces are currently personal — shared workspaces with roles
            aren&apos;t available yet. You can still send someone a link so they can
            set up their own Inline.
          </p>
          <div className="flex items-center gap-1.5">
            <input
              readOnly
              value={shareUrl}
              onFocus={e => e.currentTarget.select()}
              aria-label="Inline link"
              className="flex-1 h-8 px-3 text-xs rounded-lg border border-stone-200 bg-stone-50 text-stone-600 focus:outline-none focus:ring-2 focus:ring-[#C4D4E4] min-w-0"
            />
            <button
              type="button"
              onClick={copyLink}
              className="h-8 px-3 rounded-lg bg-[#1C1E26] text-white text-xs font-medium hover:bg-stone-800 transition-colors cursor-pointer shrink-0"
            >
              {copied ? 'Copied' : 'Copy link'}
            </button>
          </div>
          <a
            href={mailto}
            className="flex h-8 w-full items-center justify-center rounded-lg border border-stone-200 text-xs font-medium text-stone-700 hover:bg-stone-50 transition-colors"
          >
            Compose an email instead
          </a>
        </div>
      </DialogContent>
    </Dialog>
  )
}

function linkForWorkspace(
  workspaces: WorkspaceItem[],
  wsId: string,
  ...segments: string[]
): string {
  const ws = workspaces.find(w => w.id === wsId)
  return workspacePath(ws ?? wsId, ...segments)
}

// ---------------------------------------------------------------------------
// Nested workspace folders (same row UI, indented children)
// ---------------------------------------------------------------------------
function SidebarFolderNode({
  folder,
  wsId,
  workspaces,
  depth,
  allFolders,
  libraryDocs,
  expandedFolders,
  toggleFolderExpand,
  folderDocsOpen,
  newDocumentInFolder,
  deleteFolderCascade,
  addingSubfolderParentId,
  setAddingSubfolderParentId,
  newSubfolderName,
  setNewSubfolderName,
  newSubfolderRef,
  addSubfolder,
  ensureFolderOpen,
}: {
  folder: WorkspaceFolder
  wsId: string
  workspaces: WorkspaceItem[]
  depth: number
  allFolders: WorkspaceFolder[]
  libraryDocs: FolderDocument[]
  expandedFolders: Record<string, boolean>
  toggleFolderExpand: (id: string) => void
  folderDocsOpen: (id: string) => boolean
  newDocumentInFolder: (wsId: string, folderId: string) => void
  deleteFolderCascade: (wsId: string, folderId: string) => void
  addingSubfolderParentId: string | null
  setAddingSubfolderParentId: (id: string | null) => void
  newSubfolderName: string
  setNewSubfolderName: (s: string) => void
  newSubfolderRef: React.RefObject<HTMLInputElement | null>
  addSubfolder: (wsId: string, parentId: string) => void
  ensureFolderOpen: (id: string) => void
}) {
  const childFolders = getChildFolders(allFolders, wsId, folder.id)
  const folderDocs = libraryDocs.filter(d => d.workspaceId === wsId && d.folderId === folder.id)
  const treeOpen = folderDocsOpen(folder.id)

  return (
    <div className="mb-0.5" style={depth > 0 ? { marginLeft: Math.min(depth * 8, 28) } : undefined}>
      <div className="group/folder flex items-center gap-0.5 px-1 py-[4px] rounded-md text-xs hover:bg-stone-50">
        <button
          type="button"
          onClick={() => toggleFolderExpand(folder.id)}
          className="w-5 h-5 flex items-center justify-center rounded text-stone-400 hover:text-stone-700 cursor-pointer shrink-0"
          title={treeOpen ? 'Collapse' : 'Expand'}
        >
          <ChevronRight className={cn('w-3 h-3 transition-transform', treeOpen && 'rotate-90')} />
        </button>
        <Folder className="w-3 h-3 shrink-0 text-stone-400" />
        <Link
          href={linkForWorkspace(workspaces, wsId, 'folder', folder.id)}
          className="flex-1 truncate text-stone-400 hover:text-stone-700 font-medium cursor-pointer min-w-0"
          title="Open folder library"
        >
          {folder.name}
        </Link>
        <button
          type="button"
          onClick={e => {
            e.preventDefault()
            ensureFolderOpen(folder.id)
            setAddingSubfolderParentId(folder.id)
          }}
          className="opacity-0 group-hover/folder:opacity-100 w-5 h-5 flex items-center justify-center rounded text-stone-400 hover:text-stone-700 hover:bg-stone-100 cursor-pointer shrink-0"
          title="New subfolder"
        >
          <FolderPlus className="w-2.5 h-2.5" />
        </button>
        <button
          type="button"
          onClick={e => { e.preventDefault(); newDocumentInFolder(wsId, folder.id) }}
          className="opacity-0 group-hover/folder:opacity-100 w-5 h-5 flex items-center justify-center rounded text-[#37352F] hover:bg-[#F1F1EF] cursor-pointer shrink-0"
          title="New document in folder"
        >
          <FilePlus className="w-3 h-3" />
        </button>
        <button
          type="button"
          onClick={() => deleteFolderCascade(wsId, folder.id)}
          className="opacity-0 group-hover/folder:opacity-100 w-4 h-4 flex items-center justify-center rounded text-stone-400 hover:text-red-500 cursor-pointer shrink-0"
        >
          <X className="w-2.5 h-2.5" />
        </button>
      </div>
      {treeOpen && (
        <div className="ml-4 pl-2 border-l border-stone-300 dark:border-border/60 space-y-0.5 mt-0.5">
          {childFolders.map(child => (
            <SidebarFolderNode
              key={child.id}
              folder={child}
              wsId={wsId}
              workspaces={workspaces}
              depth={depth + 1}
              allFolders={allFolders}
              libraryDocs={libraryDocs}
              expandedFolders={expandedFolders}
              toggleFolderExpand={toggleFolderExpand}
              folderDocsOpen={folderDocsOpen}
              newDocumentInFolder={newDocumentInFolder}
              deleteFolderCascade={deleteFolderCascade}
              addingSubfolderParentId={addingSubfolderParentId}
              setAddingSubfolderParentId={setAddingSubfolderParentId}
              newSubfolderName={newSubfolderName}
              setNewSubfolderName={setNewSubfolderName}
              newSubfolderRef={newSubfolderRef}
              addSubfolder={addSubfolder}
              ensureFolderOpen={ensureFolderOpen}
            />
          ))}
          {addingSubfolderParentId === folder.id && (
            <div className="flex items-center gap-1 px-1 py-0.5">
              <Folder className="w-3 h-3 text-stone-300 shrink-0" />
              <input
                ref={newSubfolderRef}
                className="flex-1 text-xs h-6 px-1.5 rounded border border-[#D3D1CB] bg-white focus:outline-none focus:ring-1 focus:ring-[#C4D4E4] min-w-0"
                placeholder="Subfolder name…"
                value={newSubfolderName}
                onChange={e => setNewSubfolderName(e.target.value)}
                onKeyDown={e => {
                  if (e.key === 'Enter') addSubfolder(wsId, folder.id)
                  if (e.key === 'Escape') {
                    setAddingSubfolderParentId(null)
                    setNewSubfolderName('')
                  }
                }}
                onBlur={() =>
                  setTimeout(() => {
                    setAddingSubfolderParentId(null)
                    setNewSubfolderName('')
                  }, 150)
                }
              />
              <button
                type="button"
                onClick={() => addSubfolder(wsId, folder.id)}
                className="w-5 h-5 flex items-center justify-center rounded text-[#37352F] hover:bg-[#F1F1EF] cursor-pointer shrink-0"
              >
                <Check className="w-2.5 h-2.5" />
              </button>
            </div>
          )}
          {folderDocs.length === 0 && childFolders.length === 0 && addingSubfolderParentId !== folder.id && (
            <p className="text-[10px] text-stone-400 px-1 py-0.5">Empty folder</p>
          )}
          {folderDocs.map(doc => (
            <Link
              key={doc.id}
              href={linkForWorkspace(workspaces, wsId, 'folder', folder.id, 'doc', doc.id)}
              className="flex items-center gap-1.5 px-1.5 py-1 rounded text-[11px] text-stone-400 hover:text-stone-700 hover:bg-stone-50 cursor-pointer truncate"
            >
              <FileText className="w-3 h-3 shrink-0 opacity-70" />
              <span className="truncate">{doc.title}</span>
            </Link>
          ))}
          <button
            type="button"
            onClick={() => newDocumentInFolder(wsId, folder.id)}
            className="flex items-center gap-1 w-full px-1.5 py-1 rounded text-[11px] text-[#4B83C4] hover:bg-[#F1F1EF] cursor-pointer"
          >
            <Plus className="w-3 h-3" /> New document
          </button>
        </div>
      )}
    </div>
  )
}

// ---------------------------------------------------------------------------
// Main Sidebar
// ---------------------------------------------------------------------------
export default function Sidebar() {
  const router = useRouter()
  const { collapsed, setCollapsed } = useSidebar()
  const [workspaces,         setWorkspaces]         = useState<WorkspaceItem[]>(DEFAULT_WORKSPACES)
  const [favorites,          setFavorites]          = useState<string[]>([])
  const [folders,            setFolders]            = useState<WorkspaceFolder[]>([])
  const [newWsName,          setNewWsName]          = useState('')
  const [inviteOpen,         setInviteOpen]         = useState(false)
  const [addingFolderForWs,  setAddingFolderForWs]  = useState<string | null>(null)
  const [newFolderName,      setNewFolderName]      = useState('')
  const [addingSubfolderParentId, setAddingSubfolderParentId] = useState<string | null>(null)
  const [newSubfolderName,   setNewSubfolderName]   = useState('')
  const [expandedFolders,   setExpandedFolders]   = useState<Record<string, boolean>>({})
  const [creatingWorkspaceInMenu, setCreatingWorkspaceInMenu] = useState(false)
  const [libraryDocs,       setLibraryDocs]       = useState<FolderDocument[]>([])
  const [userName,  setUserName]  = useState('User')
  const [userEmail, setUserEmail] = useState('')
  const [userInitial, setUserInitial] = useState('U')
  const newWsRef     = useRef<HTMLInputElement>(null)
  const newFolderRef = useRef<HTMLInputElement>(null)
  const newSubfolderRef = useRef<HTMLInputElement>(null)
  const pathname     = usePathname()
  const activeWsId   = getActiveWorkspaceId(pathname, workspaces)

  // Accordion expanded state per section
  const [expandedSections, setExpandedSections] = useState<Record<string, boolean>>({
    favorites: true, features: true, folders: true,
  })
  function toggleSection(key: string) {
    setExpandedSections(p => ({ ...p, [key]: !p[key] }))
  }

  const activeWorkspace = workspaces.find(ws => ws.id === activeWsId) ?? workspaces[0]

  function switchWorkspace(wsId: string) {
    const ws = workspaces.find(w => w.id === wsId)
    if (!ws || wsId === activeWsId) return
    const segments = pathname.split('/')
    const appIdx = segments.indexOf('app')
    if (appIdx >= 0 && segments[appIdx + 1]) {
      const tail = segments.slice(appIdx + 2)
      router.push(tail.length ? workspacePath(ws, ...tail) : workspacePath(ws, 'dashboard'))
      return
    }
    router.push(workspacePath(ws, 'dashboard'))
  }

  function refreshLibraryDocs() {
    setLibraryDocs(loadFolderDocuments())
  }

  function refreshFolders() {
    setFolders(loadWorkspaceFolders())
  }

  useEffect(() => {
    setWorkspaces(loadWorkspaces())
    setFavorites(loadFavorites())
    refreshFolders()
    refreshLibraryDocs()

    if (process.env.NEXT_PUBLIC_SUPABASE_URL) {
      const supabase = createClient()
      supabase.auth.getUser().then(({ data: { user } }) => {
        if (!user) return
        const name = user.user_metadata?.full_name || user.user_metadata?.name || user.email?.split('@')[0] || 'User'
        setUserName(name)
        setUserEmail(user.email ?? '')
        setUserInitial((name.charAt(0) || 'U').toUpperCase())
      })
    }
  }, [])

  useEffect(() => {
    const onStorage = (e: StorageEvent) => {
      if (e.key === 'inline-folder-documents') refreshLibraryDocs()
      if (e.key === 'inline-folders') refreshFolders()
    }
    const onLib = () => refreshLibraryDocs()
    const onFolders = () => refreshFolders()
    window.addEventListener('storage', onStorage)
    window.addEventListener('inline-folder-docs-changed', onLib)
    window.addEventListener('inline-folders-changed', onFolders)
    return () => {
      window.removeEventListener('storage', onStorage)
      window.removeEventListener('inline-folder-docs-changed', onLib)
      window.removeEventListener('inline-folders-changed', onFolders)
    }
  }, [])
  useEffect(() => {
    if (creatingWorkspaceInMenu) setTimeout(() => newWsRef.current?.focus(), 50)
  }, [creatingWorkspaceInMenu])

  function toggleFavorite(wsId: string) {
    setFavorites(prev => {
      const next = prev.includes(wsId) ? prev.filter(f => f !== wsId) : [...prev, wsId]
      saveFavorites(next)
      return next
    })
  }

  function addWorkspace(andNavigate = false) {
    const name = newWsName.trim()
    if (!name) {
      setCreatingWorkspaceInMenu(false)
      return
    }
    const idx = workspaces.length % DEFAULT_ICON_KEYS.length
    const baseSlug = slugifyWorkspaceLabel(name)
    const slug = ensureUniqueWorkspaceSlug(baseSlug, workspaces)
    const ws: WorkspaceItem = {
      id: `ws-${Date.now()}`,
      label: name,
      slug,
      color: DEFAULT_COLORS[idx],
      icon: DEFAULT_ICON_KEYS[idx],
    }
    const next = withWorkspaceSlugs([...workspaces, ws]) as WorkspaceItem[]
    setWorkspaces(next)
    saveWorkspaces(next)
    setNewWsName('')
    setCreatingWorkspaceInMenu(false)
    if (andNavigate) router.push(workspacePath(ws, 'dashboard'))
  }

  useEffect(() => {
    function onKeyDown(e: KeyboardEvent) {
      if (!(e.metaKey || e.ctrlKey) || e.altKey || e.shiftKey) return
      const num = Number.parseInt(e.key, 10)
      if (num < 1 || num > 9) return
      const ws = workspaces[num - 1]
      if (!ws) return
      e.preventDefault()
      switchWorkspace(ws.id)
    }
    window.addEventListener('keydown', onKeyDown)
    return () => window.removeEventListener('keydown', onKeyDown)
  }, [workspaces, pathname, activeWsId])

  useEffect(() => {
    if (addingFolderForWs) setTimeout(() => newFolderRef.current?.focus(), 50)
  }, [addingFolderForWs])

  useEffect(() => {
    if (addingSubfolderParentId) setTimeout(() => newSubfolderRef.current?.focus(), 50)
  }, [addingSubfolderParentId])

  function addFolder(wsId: string) {
    const name = newFolderName.trim()
    if (!name) { setAddingFolderForWs(null); return }
    const next = [...folders, { id: `folder-${Date.now()}`, workspaceId: wsId, name, parentId: null }]
    setFolders(next); saveWorkspaceFolders(next)
    setNewFolderName(''); setAddingFolderForWs(null)
  }

  function addSubfolder(wsId: string, parentId: string) {
    const name = newSubfolderName.trim()
    if (!name) { setAddingSubfolderParentId(null); return }
    const next = [...folders, { id: `folder-${Date.now()}`, workspaceId: wsId, name, parentId }]
    setFolders(next); saveWorkspaceFolders(next)
    setNewSubfolderName(''); setAddingSubfolderParentId(null)
  }

  function deleteFolderCascade(wsId: string, folderId: string) {
    const subtree = collectSubtreeFolderIds(folders, folderId)
    deleteDocumentsInFolders(wsId, subtree)
    const next = removeFolderSubtree(folders, folderId)
    setFolders(next)
    saveWorkspaceFolders(next)
    refreshLibraryDocs()
  }

  function ensureFolderOpen(folderId: string) {
    setExpandedFolders(p => ({ ...p, [folderId]: true }))
  }

  function toggleFolderExpand(folderId: string) {
    setExpandedFolders(p => {
      const open = p[folderId] !== false
      return { ...p, [folderId]: !open }
    })
  }

  function folderDocsOpen(folderId: string) {
    return expandedFolders[folderId] !== false
  }

  function newDocumentInFolder(wsId: string, folderId: string) {
    const d = createFolderDocument(wsId, folderId, 'Untitled')
    refreshLibraryDocs()
    router.push(linkForWorkspace(workspaces, wsId, 'folder', folderId, 'doc', d.id))
  }

  const favoritedWorkspaces = workspaces.filter(ws => favorites.includes(ws.id))
  const activeRootFolders = getRootFolders(folders, activeWsId)
  const isAddingActiveFolder = addingFolderForWs === activeWsId

  const workspaceMenuContent = (
    <>
      <div className="flex items-center gap-2 px-3 py-2.5">
        <span className="min-w-0 flex-1 truncate text-xs text-muted-foreground">
          {userEmail || 'Signed in'}
        </span>
        <Link
          href="/app/account"
          className="flex h-7 w-7 shrink-0 items-center justify-center rounded-md text-muted-foreground transition-colors hover:bg-muted hover:text-foreground"
          title="Account settings"
        >
          <RefreshCw className="h-3.5 w-3.5" />
        </Link>
      </div>
      <DropdownMenuSeparator className="mx-0" />
      <div className="py-1">
        {workspaces.map((ws, index) => {
          const isActive = ws.id === activeWsId
          return (
            <button
              key={ws.id}
              type="button"
              onClick={() => switchWorkspace(ws.id)}
              className={cn(
                'flex w-full cursor-pointer items-center gap-2 px-2 py-1.5 text-left text-sm transition-colors hover:bg-muted/70',
                isActive && 'bg-muted/50',
              )}
            >
              <GripVertical className="h-3.5 w-3.5 shrink-0 text-stone-300 dark:text-muted-foreground/60" aria-hidden />
              <WorkspaceIcon ws={ws} size="sm" />
              <span className="min-w-0 flex-1 truncate text-foreground">{ws.label}</span>
              {isActive ? (
                <Check className="h-4 w-4 shrink-0 text-foreground" />
              ) : index < 9 ? (
                <kbd className="rounded border border-border bg-muted px-1.5 py-0.5 text-[10px] font-medium text-muted-foreground">
                  {workspaceShortcutLabel(index)}
                </kbd>
              ) : null}
            </button>
          )
        })}
      </div>
      <DropdownMenuSeparator className="mx-0" />
      {creatingWorkspaceInMenu ? (
        <div className="flex items-center gap-1.5 px-2 py-2">
          <input
            ref={newWsRef}
            className="h-8 min-w-0 flex-1 rounded-md border border-border bg-background px-2 text-xs text-foreground focus:outline-none focus:ring-2 focus:ring-primary/20"
            placeholder="Workspace name…"
            value={newWsName}
            onChange={e => setNewWsName(e.target.value)}
            onKeyDown={e => {
              if (e.key === 'Enter') addWorkspace(true)
              if (e.key === 'Escape') {
                setCreatingWorkspaceInMenu(false)
                setNewWsName('')
              }
            }}
          />
          <button
            type="button"
            onClick={() => addWorkspace(true)}
            className="flex h-8 w-8 shrink-0 cursor-pointer items-center justify-center rounded-md text-foreground transition-colors hover:bg-muted"
          >
            <Check className="h-3.5 w-3.5" />
          </button>
        </div>
      ) : (
        <button
          type="button"
          onClick={() => setCreatingWorkspaceInMenu(true)}
          className="flex w-full cursor-pointer items-center gap-2 px-3 py-2 text-left text-sm text-muted-foreground transition-colors hover:bg-muted/70 hover:text-foreground"
        >
          <Plus className="h-4 w-4 shrink-0" />
          <span>New workspace</span>
        </button>
      )}
    </>
  )

  return (
    <>
      <motion.aside
        animate={{ width: collapsed ? 60 : 228 }}
        transition={{ duration: 0.22, ease: [0.4, 0, 0.2, 1] }}
        style={{ willChange: 'width' }}
        className="relative h-screen flex flex-col bg-[#FDFBF7] border-r border-stone-200/60 overflow-hidden shrink-0 select-none dark:bg-sidebar dark:border-sidebar-border"
      >
        {/* ── Workspace switcher + sidebar collapse ── */}
        <div
          className={cn(
            'flex h-[52px] shrink-0 items-center border-b border-stone-200 dark:border-sidebar-border',
            collapsed ? 'justify-center px-0' : 'gap-1.5 px-2',
          )}
        >
          {collapsed ? (
            <button
              type="button"
              onClick={() => setCollapsed(false)}
              className="flex h-10 w-10 cursor-pointer items-center justify-center rounded-md text-stone-400 transition-colors hover:bg-stone-100 hover:text-stone-700 dark:text-muted-foreground dark:hover:bg-sidebar-accent dark:hover:text-foreground"
              title="Expand sidebar"
            >
              <PanelLeftClose className="h-4 w-4 rotate-180" />
            </button>
          ) : (
            <>
              {activeWorkspace && (
                <DropdownMenu onOpenChange={open => { if (!open) setCreatingWorkspaceInMenu(false) }}>
                  <DropdownMenuTrigger
                    className="flex min-w-0 flex-1 cursor-pointer items-center gap-2 rounded-lg px-2 py-1.5 outline-none transition-colors hover:bg-stone-100 dark:hover:bg-sidebar-accent"
                    aria-label="Switch workspace"
                  >
                    <WorkspaceIcon ws={activeWorkspace} />
                    <span className="min-w-0 flex-1 truncate text-left text-sm font-semibold text-stone-800 dark:text-white">
                      {activeWorkspace.label}
                    </span>
                    <ChevronDown className="h-3.5 w-3.5 shrink-0 text-stone-400 dark:text-muted-foreground" />
                  </DropdownMenuTrigger>
                  <DropdownMenuContent
                    align="start"
                    sideOffset={6}
                    className="w-[min(280px,calc(100vw-24px))] rounded-lg border border-border bg-card p-0 shadow-[0_22px_70px_-42px_rgba(28,30,38,0.38)]"
                  >
                    {workspaceMenuContent}
                  </DropdownMenuContent>
                </DropdownMenu>
              )}
              <button
                type="button"
                onClick={() => setCollapsed(true)}
                className="flex h-7 w-7 shrink-0 cursor-pointer items-center justify-center rounded-md text-stone-400 transition-colors hover:bg-stone-100 hover:text-stone-700 dark:text-muted-foreground dark:hover:bg-sidebar-accent dark:hover:text-foreground"
                title="Collapse sidebar"
              >
                <PanelLeftClose className="h-4 w-4" />
              </button>
            </>
          )}
        </div>

        {/* ── Search ── */}
        <div className={cn('px-2 pt-3 pb-1 shrink-0', collapsed && 'flex justify-center')}>
          {collapsed ? (
            <button
              onClick={() => window.dispatchEvent(new CustomEvent('inline-open-cmd'))}
              className="w-10 h-10 aspect-square rounded-md flex items-center justify-center text-stone-400 hover:text-stone-700 hover:bg-stone-100 transition-colors cursor-pointer dark:hover:bg-sidebar-accent dark:hover:text-foreground"
              title="Search (Ctrl+K)"
            >
              <Search className="w-4 h-4" />
            </button>
          ) : (
            <button
              type="button"
              onClick={() => window.dispatchEvent(new CustomEvent('inline-open-cmd'))}
              className="w-full flex items-center gap-2 px-2.5 py-1.5 rounded-lg bg-white border border-stone-300 shadow-[0_1px_2px_rgba(28,30,38,0.08)] cursor-pointer hover:border-stone-400 transition-colors text-left dark:bg-muted dark:border-sidebar-border dark:hover:border-border"
            >
              <Search className="w-3.5 h-3.5 text-stone-400 shrink-0 dark:text-muted-foreground" />
              <span className="flex-1 text-xs text-stone-400 select-none dark:text-muted-foreground">Search…</span>
              <kbd className="text-[9px] text-stone-300 bg-white border border-stone-200/60 rounded px-1 py-0.5 font-sans leading-none dark:bg-background dark:border-sidebar-border dark:text-muted-foreground">/</kbd>
            </button>
          )}
        </div>

        {/* ── Scrollable nav ── */}
        <div className="flex-1 overflow-y-auto overflow-x-hidden px-2 pb-2 scrollbar-minimal">

          {/* Favorites — collapsible */}
          {favoritedWorkspaces.length > 0 && (
            <>
              <SectionLabel label="Favorites" collapsed={collapsed} expanded={expandedSections.favorites} onToggle={() => toggleSection('favorites')} />
              <nav className="flex flex-col gap-0.5 mt-0.5 overflow-hidden transition-[max-height,opacity] duration-[220ms] ease-[cubic-bezier(.4,0,.2,1)]"
                style={{ maxHeight: (!collapsed && expandedSections.favorites) ? 400 : 0, opacity: (!collapsed && expandedSections.favorites) ? 1 : 0 }}>
                {favoritedWorkspaces.map(ws => {
                  const Icon = ICON_MAP[ws.icon] ?? Zap
                  return (
                    <NavRow key={`fav-${ws.id}`} href={workspacePath(ws, 'home')} icon={Icon}
                      label={ws.label} collapsed={collapsed} active={activeWsId === ws.id}
                      dotColor={ws.color} onStar={() => toggleFavorite(ws.id)} starred />
                  )
                })}
              </nav>
            </>
          )}

          {/* Features — collapsible */}
          <SectionLabel label="Features" collapsed={collapsed} expanded={expandedSections.features} onToggle={() => toggleSection('features')} />
          <nav className="flex flex-col gap-0.5 mt-0.5 overflow-hidden transition-[max-height,opacity] duration-[220ms] ease-[cubic-bezier(.4,0,.2,1)]"
            style={{ maxHeight: (collapsed || expandedSections.features) ? 400 : 0, opacity: (collapsed || expandedSections.features) ? 1 : 0 }}>
            {FEATURES.map(item => {
              const href = activeWorkspace ? item.href(activeWorkspace) : '#'
              return (
                <NavRow key={item.label} href={href} icon={item.icon} label={item.label}
                  collapsed={collapsed} active={pathname === href || pathname.startsWith(href + '/')} />
              )
            })}
          </nav>

          {/* Folders — active workspace only */}
          <SectionLabel
            label="Folders"
            collapsed={collapsed}
            expanded={expandedSections.folders}
            onToggle={() => toggleSection('folders')}
            action={
              !collapsed ? (
                <button
                  type="button"
                  className="flex h-5 w-5 cursor-pointer items-center justify-center rounded text-stone-400 transition-colors hover:bg-stone-100 hover:text-stone-700 dark:text-muted-foreground dark:hover:bg-sidebar-accent dark:hover:text-foreground"
                  onClick={() => setAddingFolderForWs(activeWsId)}
                  title="New folder"
                >
                  <FolderPlus className="h-3 w-3" />
                </button>
              ) : undefined
            }
          />
          <div
            className="overflow-hidden transition-[max-height,opacity] duration-[220ms] ease-[cubic-bezier(.4,0,.2,1)]"
            style={{
              maxHeight: (collapsed || expandedSections.folders) ? 900 : 0,
              opacity: (collapsed || expandedSections.folders) ? 1 : 0,
            }}
          >
            {!collapsed && activeRootFolders.map(folder => (
              <SidebarFolderNode
                key={folder.id}
                folder={folder}
                wsId={activeWsId}
                workspaces={workspaces}
                depth={0}
                allFolders={folders}
                libraryDocs={libraryDocs}
                expandedFolders={expandedFolders}
                toggleFolderExpand={toggleFolderExpand}
                folderDocsOpen={folderDocsOpen}
                newDocumentInFolder={newDocumentInFolder}
                deleteFolderCascade={deleteFolderCascade}
                addingSubfolderParentId={addingSubfolderParentId}
                setAddingSubfolderParentId={setAddingSubfolderParentId}
                newSubfolderName={newSubfolderName}
                setNewSubfolderName={setNewSubfolderName}
                newSubfolderRef={newSubfolderRef}
                addSubfolder={addSubfolder}
                ensureFolderOpen={ensureFolderOpen}
              />
            ))}
            {!collapsed && isAddingActiveFolder && (
              <div className="mt-0.5 flex items-center gap-1 px-1 py-0.5">
                <Folder className="h-3 w-3 shrink-0 text-stone-300" />
                <input
                  ref={newFolderRef}
                  className="h-6 flex-1 rounded border border-[#D3D1CB] bg-white px-1.5 text-xs focus:outline-none focus:ring-1 focus:ring-[#C4D4E4]"
                  placeholder="Folder name…"
                  value={newFolderName}
                  onChange={e => setNewFolderName(e.target.value)}
                  onKeyDown={e => {
                    if (e.key === 'Enter') addFolder(activeWsId)
                    if (e.key === 'Escape') {
                      setAddingFolderForWs(null)
                      setNewFolderName('')
                    }
                  }}
                  onBlur={() => setTimeout(() => {
                    setAddingFolderForWs(null)
                    setNewFolderName('')
                  }, 150)}
                />
                <button
                  type="button"
                  onClick={() => addFolder(activeWsId)}
                  className="flex h-5 w-5 cursor-pointer items-center justify-center rounded text-[#37352F] hover:bg-[#F1F1EF]"
                >
                  <Check className="h-2.5 w-2.5" />
                </button>
              </div>
            )}
          </div>
        </div>

        {/* ── Footer ── */}
        <div className="border-t border-stone-200 px-2 pt-2 pb-2 shrink-0 space-y-0.5 dark:border-sidebar-border">
          <div
            className="overflow-hidden transition-[opacity,max-height] duration-[220ms] ease-[cubic-bezier(.4,0,.2,1)]"
            style={{ maxHeight: collapsed ? 0 : 40, opacity: collapsed ? 0 : 1 }}
          >
            <button
              className="w-full flex items-center gap-2.5 px-2.5 py-[7px] rounded-lg text-xs text-stone-400 hover:text-stone-700 hover:bg-stone-100 transition-colors cursor-pointer dark:text-muted-foreground dark:hover:text-foreground dark:hover:bg-sidebar-accent"
              onClick={() => setInviteOpen(true)}
            >
              <UserPlus className="w-3.5 h-3.5 shrink-0" />
              <span>Share Inline</span>
            </button>
          </div>

          <div className={cn('flex items-center w-full rounded-lg', collapsed ? 'justify-center py-[7px]' : 'gap-2.5 px-2.5 py-[7px]')}>
            <Link
              href="/app/account"
              title={collapsed ? `${userName}\n${userEmail}` : undefined}
              className={cn(
                'flex items-center rounded-lg hover:bg-stone-100 transition-colors cursor-pointer dark:hover:bg-sidebar-accent',
                collapsed ? 'w-10 h-10 aspect-square justify-center shrink-0' : 'flex-1 gap-2.5 min-w-0 py-0.5',
              )}
            >
              <div className={cn('bg-[#F0EBE3] border border-stone-300 flex items-center justify-center text-[#37352F] text-[10px] font-bold shrink-0 dark:bg-sidebar-accent dark:border-sidebar-border dark:text-foreground', collapsed ? 'w-10 h-10 aspect-square rounded-md' : 'w-6 h-6 rounded-full')}>
                {userInitial}
              </div>
              {!collapsed && (
              <div className="flex-1 overflow-hidden min-w-0">
                <p className="font-medium text-stone-700 text-xs truncate leading-tight dark:text-white">{userName}</p>
                <p className="text-stone-400 truncate text-[10px] leading-tight dark:text-muted-foreground">{userEmail}</p>
              </div>
              )}
            </Link>
            {!collapsed && (
            <div
              className="flex items-center gap-0.5 overflow-hidden transition-[opacity,max-width] duration-[220ms] ease-[cubic-bezier(.4,0,.2,1)]"
              style={{ maxWidth: 64, opacity: 1 }}
            >
              <ThemeToggle />
              <form action={signOut}>
                <button type="submit"
                  className="w-7 h-7 flex items-center justify-center rounded-lg text-stone-400 hover:text-stone-700 hover:bg-stone-100 transition-colors shrink-0 cursor-pointer dark:text-muted-foreground dark:hover:text-foreground dark:hover:bg-sidebar-accent"
                  title="Sign out">
                  <LogOut className="w-3.5 h-3.5" />
                </button>
              </form>
            </div>
            )}
          </div>
        </div>
      </motion.aside>

      <InviteModal open={inviteOpen} onClose={() => setInviteOpen(false)} />
    </>
  )
}
