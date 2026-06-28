'use client'

import { useState, useEffect, useTransition, useMemo, Suspense } from 'react'
import { usePathname, useRouter, useSearchParams } from 'next/navigation'
import Link from 'next/link'
import SettingsShell, { SettingsRow, SettingsSection, type SettingsNavGroup } from '@/components/settings/SettingsShell'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { cn } from '@/lib/utils'
import { getWorkspaceName, getWorkspaceColor, DEFAULT_WORKSPACES } from '@/lib/workspaces'
import { resolveWorkspaceIdFromBrowserPath, workspacePath } from '@/lib/workspace-routes'
import { exportWorkspaceNotes } from '@/lib/actions/export'
import { createClient } from '@/lib/supabase/client'
import {
  loadWorkspaceFolders,
  getRootFolders,
  getChildFolders,
  type WorkspaceFolder,
} from '@/lib/workspace-folders'
import { restartInlineGuide } from '@/lib/inline-guide-context'
import {
  Check, Download, Loader2, AlertTriangle,
  Crown, ArrowRight, Folder, ArchiveRestore,
  UserRound, FolderTree, UsersRound, Bell, Database, Trash2,
  Palette, MessageCircle, Puzzle,
} from 'lucide-react'

// ---------------------------------------------------------------------------
// Types & constants
// ---------------------------------------------------------------------------
type Tab = 'identity' | 'library' | 'members' | 'notifications' | 'data' | 'danger'

const SECTION_DESCRIPTIONS: Record<Tab, string> = {
  identity: 'Customize your workspace name, icon, and accent color.',
  library: 'Review folders and documents stored in this workspace.',
  members: 'Manage who has access to this workspace.',
  notifications: 'Choose which workspace events trigger notifications.',
  data: 'Export captures or import data into this workspace.',
  danger: 'Archive or permanently delete this workspace.',
}

function SaveBadge({ saved }: { saved: boolean }) {
  return saved ? (
    <span className="inline-flex items-center gap-1 text-xs text-accent font-medium">
      <Check className="w-3 h-3" /> Saved
    </span>
  ) : null
}

// ---------------------------------------------------------------------------
// Identity Tab
// ---------------------------------------------------------------------------
function IdentityTab({ workspaceId, initialName, initialColor }: { workspaceId: string; initialName: string; initialColor: string }) {
  const [wsName, setWsName] = useState(initialName)
  const [color,  setColor]  = useState(initialColor)
  const [saved,  setSaved]  = useState(false)
  const [pending, startTrans] = useTransition()

  function handleSave() {
    startTrans(async () => {
      // Persist locally (until Supabase workspace table is connected)
      const raw = localStorage.getItem('inline-workspaces')
      const workspaces = (raw ? JSON.parse(raw) : [...DEFAULT_WORKSPACES]) as { id: string; label?: string; color?: string; icon?: string }[]
      const updated = workspaces.map(w => (w.id === workspaceId ? { ...w, label: wsName, color } : w))
      localStorage.setItem('inline-workspaces', JSON.stringify(updated))
      setSaved(true)
      setTimeout(() => setSaved(false), 2500)
    })
  }

  const PALETTE = ['#6C91C2','#5FA8A1','#f59e0b','#ef4444','#a855f7','#ec4899','#22c55e','#f97316']

  return (
    <div className="space-y-8">
      <SettingsSection title="Workspace Identity" description="Customize your workspace name and color.">
        <SettingsRow label="Icon" hint="Workspaces use a colored monogram of the first letter.">
          <div
            className="w-14 h-14 rounded-2xl flex items-center justify-center text-white font-bold text-xl shrink-0"
            style={{ backgroundColor: color }}
            aria-hidden
          >
            {wsName.charAt(0).toUpperCase()}
          </div>
        </SettingsRow>

        <SettingsRow label="Name">
          <Input value={wsName} onChange={e => setWsName(e.target.value)} placeholder="Workspace name" />
        </SettingsRow>

        <SettingsRow label="Color" hint="Used for sidebar indicators and icons.">
          <div className="flex flex-wrap gap-2">
            {PALETTE.map(c => (
              <button
                key={c} onClick={() => setColor(c)}
                className={cn('w-7 h-7 rounded-full border-2 transition-all cursor-pointer hover:scale-110',
                  color === c ? 'border-foreground scale-110' : 'border-transparent'
                )}
                style={{ backgroundColor: c }}
              />
            ))}
          </div>
        </SettingsRow>

        <div className="flex items-center justify-between pt-1">
          <SaveBadge saved={saved} />
          <Button size="sm" onClick={handleSave} disabled={pending} className="cursor-pointer ml-auto">
            {pending ? <Loader2 className="w-3.5 h-3.5 animate-spin mr-1.5" /> : null}
            Save Changes
          </Button>
        </div>
      </SettingsSection>

      <SettingsSection title="Product tour" description="Replay the workspace walkthrough anytime.">
        <SettingsRow
          label="Walkthrough"
          hint="A short guided tour of sidebar features, documents, and Ask Inline chat."
        >
          <Button
            type="button"
            variant="outline"
            size="sm"
            className="cursor-pointer"
            onClick={() => restartInlineGuide()}
          >
            Restart product tour
          </Button>
        </SettingsRow>
      </SettingsSection>
    </div>
  )
}

// ---------------------------------------------------------------------------
// Members Tab — honest single-user version. Shows the real signed-in owner;
// multi-user invites are visibly unavailable rather than simulated.
// ---------------------------------------------------------------------------
function MembersTab() {
  const [owner, setOwner] = useState<{ name: string; email: string } | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    if (!process.env.NEXT_PUBLIC_SUPABASE_URL) { setLoading(false); return }
    const supabase = createClient()
    supabase.auth.getUser().then(({ data: { user } }) => {
      if (user) {
        const name = user.user_metadata?.full_name || user.user_metadata?.name || user.email?.split('@')[0] || 'You'
        setOwner({ name, email: user.email ?? '' })
      }
      setLoading(false)
    })
  }, [])

  return (
    <div className="space-y-8">
      <SettingsSection title="Members" description="People with access to this workspace.">
        {loading ? (
          <div className="flex items-center gap-2 py-2 text-sm text-muted-foreground">
            <Loader2 className="w-3.5 h-3.5 animate-spin" /> Loading…
          </div>
        ) : owner ? (
          <div className="flex items-center gap-3 py-1">
            <div className="w-8 h-8 rounded-full bg-[#6C91C2] flex items-center justify-center text-white text-xs font-bold shrink-0">
              {(owner.name.charAt(0) || 'Y').toUpperCase()}
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-sm font-medium truncate">{owner.name}</p>
              <p className="text-xs text-muted-foreground truncate">{owner.email}</p>
            </div>
            <span className="inline-flex items-center gap-1 text-xs px-2 py-0.5 rounded-full font-medium"
              style={{ background: 'rgba(108,145,194,.12)', color: '#6C91C2' }}>
              <Crown className="w-2.5 h-2.5" /> Owner
            </span>
          </div>
        ) : (
          <p className="text-sm text-muted-foreground py-1">
            Sign in to see workspace membership.
          </p>
        )}
      </SettingsSection>

      <SettingsSection
        title="Invites"
        description="Shared workspaces with roles aren't available yet."
      >
        <div className="flex items-center justify-between gap-4">
          <p className="text-sm text-muted-foreground leading-relaxed">
            Inline workspaces are currently personal. Email invites and role
            management will appear here when shared workspaces ship.
          </p>
          <Button size="sm" disabled className="shrink-0" title="Shared workspaces aren't available yet">
            Invite
          </Button>
        </div>
      </SettingsSection>
    </div>
  )
}

// ---------------------------------------------------------------------------
// Data Management Tab
// ---------------------------------------------------------------------------
function DataTab({ workspaceId }: { workspaceId: string }) {
  const [exporting, setExporting] = useState(false)
  const [exported,  setExported]  = useState(false)

  async function handleExport() {
    setExporting(true)
    try {
      const { csv, filename } = await exportWorkspaceNotes(workspaceId)
      const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' })
      const url  = URL.createObjectURL(blob)
      const link = document.createElement('a')
      link.href     = url
      link.download = filename
      document.body.appendChild(link)
      link.click()
      document.body.removeChild(link)
      URL.revokeObjectURL(url)
      setExported(true)
      setTimeout(() => setExported(false), 3000)
    } catch (err) {
      console.error('Export failed', err)
    } finally {
      setExporting(false)
    }
  }

  return (
    <div className="space-y-8">
      <SettingsSection title="Export Data" description="Download all notes, extractions, and metadata as a CSV file.">
        <div className="flex items-center justify-between">
          <div>
            <p className="text-sm font-medium">Notes Export</p>
            <p className="text-xs text-muted-foreground mt-0.5">All captured notes for this workspace as <code className="font-mono text-[11px] bg-muted px-1 rounded">workspace_export.csv</code></p>
          </div>
          <Button variant="outline" size="sm" onClick={handleExport} disabled={exporting} className="cursor-pointer gap-2">
            {exporting
              ? <><Loader2 className="w-3.5 h-3.5 animate-spin" /> Exporting…</>
              : exported
              ? <><Check className="w-3.5 h-3.5 text-accent" /> Downloaded</>
              : <><Download className="w-3.5 h-3.5" /> Export CSV</>
            }
          </Button>
        </div>
      </SettingsSection>

      <SettingsSection title="Import Data" description="Bring notes from external sources into this workspace.">
        <div className="flex items-center justify-between gap-4">
          <div>
            <p className="text-sm font-medium">Import from CSV / JSON</p>
            <p className="text-xs text-muted-foreground mt-0.5">
              Import isn&apos;t available yet — it will support Inline export CSVs when it ships.
            </p>
          </div>
          <Button variant="outline" size="sm" disabled title="Import isn't available yet">
            Browse File
          </Button>
        </div>
      </SettingsSection>
    </div>
  )
}

// ---------------------------------------------------------------------------
// Danger Zone Tab
// ---------------------------------------------------------------------------
type StoredWorkspace = { id: string; label?: string; color?: string; icon?: string }

function readStoredWorkspaces(): StoredWorkspace[] {
  try {
    const raw = localStorage.getItem('inline-workspaces')
    return raw ? (JSON.parse(raw) as StoredWorkspace[]) : [...DEFAULT_WORKSPACES]
  } catch {
    return [...DEFAULT_WORKSPACES]
  }
}

function readArchivedWorkspaces(): StoredWorkspace[] {
  try {
    const raw = localStorage.getItem('inline-archived-workspaces')
    return raw ? (JSON.parse(raw) as StoredWorkspace[]) : []
  } catch {
    return []
  }
}

function DangerTab({ workspaceId, workspaceName }: { workspaceId: string; workspaceName: string }) {
  const router = useRouter()
  const [showDeleteModal, setShowDeleteModal] = useState(false)
  const [confirmText,     setConfirmText]     = useState('')
  const [deleting,        setDeleting]        = useState(false)
  const [archived,        setArchived]        = useState<StoredWorkspace[]>([])

  useEffect(() => { setArchived(readArchivedWorkspaces()) }, [])

  function notifyWorkspacesChanged() {
    window.dispatchEvent(new Event('inline-workspaces-changed'))
  }

  function handleArchive() {
    const workspaces = readStoredWorkspaces()
    const target = workspaces.find(w => w.id === workspaceId)
      ?? { id: workspaceId, label: workspaceName }
    localStorage.setItem('inline-workspaces', JSON.stringify(workspaces.filter(w => w.id !== workspaceId)))
    localStorage.setItem('inline-archived-workspaces', JSON.stringify([...readArchivedWorkspaces().filter(w => w.id !== workspaceId), target]))
    notifyWorkspacesChanged()
    router.push('/app')
  }

  function handleRestore(id: string) {
    const archivedList = readArchivedWorkspaces()
    const target = archivedList.find(w => w.id === id)
    if (!target) return
    localStorage.setItem('inline-archived-workspaces', JSON.stringify(archivedList.filter(w => w.id !== id)))
    const workspaces = readStoredWorkspaces()
    localStorage.setItem('inline-workspaces', JSON.stringify([...workspaces.filter(w => w.id !== id), target]))
    setArchived(archivedList.filter(w => w.id !== id))
    notifyWorkspacesChanged()
  }

  async function handleDelete() {
    if (confirmText !== workspaceName) return
    setDeleting(true)
    try {
      const workspaces = readStoredWorkspaces()
      localStorage.setItem('inline-workspaces', JSON.stringify(workspaces.filter(w => w.id !== workspaceId)))
      notifyWorkspacesChanged()
      router.push('/app')
    } catch { setDeleting(false) }
  }

  return (
    <div className="space-y-8">
      <SettingsSection title="Danger Zone" description="Archiving hides the workspace; deleting removes it from your list.">
        <div className="flex items-center justify-between py-1">
          <div>
            <p className="text-sm font-medium">Archive workspace</p>
            <p className="text-xs text-muted-foreground mt-0.5">Hide from sidebar. Notes are preserved and the workspace can be restored below.</p>
          </div>
          <Button
            size="sm" variant="outline"
            className="cursor-pointer border-amber-300 text-amber-600 hover:bg-amber-50"
            onClick={handleArchive}
          >
            Archive
          </Button>
        </div>
        <div className="h-px bg-border" />
        <div className="flex items-center justify-between py-1">
          <div>
            <p className="text-sm font-medium text-destructive">Delete workspace</p>
            <p className="text-xs text-muted-foreground mt-0.5">Permanently deletes all notes, drawings, and data.</p>
          </div>
          <Button size="sm" variant="destructive" className="cursor-pointer" onClick={() => setShowDeleteModal(true)}>
            Delete
          </Button>
        </div>
      </SettingsSection>

      {archived.length > 0 && (
        <SettingsSection title="Archived workspaces" description="Restore a previously archived workspace to the sidebar.">
          <ul className="space-y-1">
            {archived.map((w, i) => (
              <li key={w.id}>
                {i > 0 && <div className="h-px bg-border mb-1" />}
                <div className="flex items-center justify-between gap-3 py-1.5">
                  <div className="flex items-center gap-2.5 min-w-0">
                    <span
                      className="w-2.5 h-2.5 rounded-full shrink-0"
                      style={{ backgroundColor: w.color ?? '#6C91C2' }}
                      aria-hidden
                    />
                    <span className="text-sm font-medium truncate">{w.label ?? w.id}</span>
                  </div>
                  <Button size="sm" variant="outline" className="cursor-pointer gap-1.5" onClick={() => handleRestore(w.id)}>
                    <ArchiveRestore className="w-3.5 h-3.5" /> Restore
                  </Button>
                </div>
              </li>
            ))}
          </ul>
        </SettingsSection>
      )}

      {/* ── Delete confirmation modal ── */}
      {showDeleteModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4" onClick={() => setShowDeleteModal(false)}>
          <div className="absolute inset-0 bg-black/40" />
          <div className="relative w-full max-w-sm space-y-4 rounded-2xl border border-border bg-card p-6 text-card-foreground dark:border-sidebar-border dark:bg-secondary"
            onClick={e => e.stopPropagation()}>
            <div className="flex items-start gap-3">
              <div className="w-9 h-9 rounded-xl bg-destructive/10 flex items-center justify-center shrink-0">
                <AlertTriangle className="w-4.5 h-4.5 text-destructive" />
              </div>
              <div>
                <h3 className="font-semibold text-sm">Delete &ldquo;{workspaceName}&rdquo;?</h3>
                <p className="text-xs text-muted-foreground mt-1">This action is irreversible. All notes and data will be permanently deleted.</p>
              </div>
            </div>

            <div className="space-y-1.5">
              <p className="text-xs text-muted-foreground">Type <strong className="text-foreground font-mono">{workspaceName}</strong> to confirm:</p>
              <Input
                value={confirmText}
                onChange={e => setConfirmText(e.target.value)}
                placeholder={workspaceName}
                className="font-mono text-sm"
                autoFocus
              />
            </div>

            <div className="flex gap-2 pt-1">
              <Button variant="outline" size="sm" className="flex-1 cursor-pointer" onClick={() => { setShowDeleteModal(false); setConfirmText('') }}>
                Cancel
              </Button>
              <Button variant="destructive" size="sm" className="flex-1 cursor-pointer"
                disabled={confirmText !== workspaceName || deleting}
                onClick={handleDelete}>
                {deleting ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : 'Delete workspace'}
              </Button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}

// ---------------------------------------------------------------------------
// Library (folders & documents)
// ---------------------------------------------------------------------------
function LibraryFolderTreeItem({
  folder,
  workspaceId,
  allFolders,
  depth,
}: {
  folder: WorkspaceFolder
  workspaceId: string
  allFolders: WorkspaceFolder[]
  depth: number
}) {
  const children = getChildFolders(allFolders, workspaceId, folder.id)
  return (
    <li className="space-y-2">
      <Link
        href={workspacePath(workspaceId, 'folder', folder.id)}
        className="flex items-center gap-3 rounded-xl border border-border/80 px-4 py-3 hover:border-primary/30 hover:bg-primary/5 transition-colors cursor-pointer"
        style={{ marginLeft: depth * 12 }}
      >
        <div className="w-10 h-10 rounded-lg bg-primary/10 flex items-center justify-center shrink-0">
          <Folder className="w-5 h-5 text-primary" />
        </div>
        <div className="flex-1 min-w-0">
          <p className="font-medium text-foreground">{folder.name}</p>
          <p className="text-xs text-muted-foreground">Open folder library & documents</p>
        </div>
        <ArrowRight className="w-4 h-4 text-muted-foreground shrink-0" />
      </Link>
      {children.length > 0 && (
        <ul className="space-y-2 ml-3 pl-3 border-l border-border/50">
          {children.map(c => (
            <LibraryFolderTreeItem
              key={c.id}
              folder={c}
              workspaceId={workspaceId}
              allFolders={allFolders}
              depth={depth + 1}
            />
          ))}
        </ul>
      )}
    </li>
  )
}

function LibraryTab({ workspaceId }: { workspaceId: string }) {
  const [folders, setFolders] = useState<WorkspaceFolder[]>([])

  function refreshFolders() {
    setFolders(loadWorkspaceFolders().filter(f => f.workspaceId === workspaceId))
  }

  useEffect(() => {
    refreshFolders()
    const onFolders = () => refreshFolders()
    window.addEventListener('inline-folders-changed', onFolders)
    const onStorage = (e: StorageEvent) => {
      if (e.key === 'inline-folders') refreshFolders()
    }
    window.addEventListener('storage', onStorage)
    return () => {
      window.removeEventListener('inline-folders-changed', onFolders)
      window.removeEventListener('storage', onStorage)
    }
  }, [workspaceId])

  const roots = useMemo(() => getRootFolders(folders, workspaceId), [folders, workspaceId])

  return (
    <div className="space-y-8">
      <SettingsSection
        title="Workspace library"
        description="Folders belong only to this workspace. Nest subfolders from the sidebar; each folder can hold documents and more folders."
      >
        <div className="flex flex-wrap gap-2">
          <Link
            href={workspacePath(workspaceId, 'dashboard')}
            className="inline-flex items-center gap-1.5 text-sm font-medium text-primary hover:underline cursor-pointer"
          >
            <ArrowRight className="w-4 h-4 rotate-180" /> Back to dashboard
          </Link>
        </div>
        {roots.length === 0 ? (
          <p className="text-sm text-muted-foreground mt-4">No folders yet. Use the sidebar → Workspaces → folder icon to create one.</p>
        ) : (
          <ul className="mt-4 space-y-2">
            {roots.map(f => (
              <LibraryFolderTreeItem
                key={f.id}
                folder={f}
                workspaceId={workspaceId}
                allFolders={folders}
                depth={0}
              />
            ))}
          </ul>
        )}
      </SettingsSection>
    </div>
  )
}

// ---------------------------------------------------------------------------
// Notifications Tab
// ---------------------------------------------------------------------------
function NotificationsTab() {
  return (
    <div className="space-y-8">
      <SettingsSection
        title="Email Notifications"
        description="Email notifications aren't available yet."
      >
        <p className="text-sm text-muted-foreground leading-relaxed">
          Inline doesn&apos;t send emails today. When notifications ship, you&apos;ll be
          able to opt into a weekly capture digest and workspace activity alerts
          from this page.
        </p>
      </SettingsSection>
    </div>
  )
}

// ---------------------------------------------------------------------------
// Page
// ---------------------------------------------------------------------------
function WorkspaceSettingsPageInner() {
  const pathname = usePathname()
  const searchParams = useSearchParams()
  const workspaceId = resolveWorkspaceIdFromBrowserPath(pathname)
  const [workspaceName,  setWorkspaceName]  = useState(() => getWorkspaceName(workspaceId))
  const workspaceColor = getWorkspaceColor(workspaceId)

  const [activeTab, setActiveTab] = useState<Tab>('identity')

  useEffect(() => { setWorkspaceName(getWorkspaceName(workspaceId)) }, [workspaceId])

  useEffect(() => {
    const t = searchParams.get('tab')
    const valid: Tab[] = ['identity', 'library', 'members', 'notifications', 'data', 'danger']
    if (t && valid.includes(t as Tab)) setActiveTab(t as Tab)
  }, [searchParams])

  const TabContent: Record<Tab, React.ReactNode> = {
    identity:      <IdentityTab workspaceId={workspaceId} initialName={workspaceName} initialColor={workspaceColor} />,
    library:       <LibraryTab workspaceId={workspaceId} />,
    members:       <MembersTab />,
    notifications: <NotificationsTab />,
    data:          <DataTab workspaceId={workspaceId} />,
    danger:        <DangerTab workspaceId={workspaceId} workspaceName={workspaceName} />,
  }

  const settingsGroups: SettingsNavGroup[] = [
    {
      label: 'Personal',
      items: [
        { id: 'personal-profile', label: 'Profile', icon: UserRound, href: '/app/settings?tab=general' },
        { id: 'personal-appearance', label: 'Appearance', icon: Palette, href: '/app/settings?tab=appearance' },
        { id: 'personal-notifications', label: 'Notifications', icon: Bell, href: '/app/settings?tab=notifications' },
        { id: 'personal-ai', label: 'AI and voice', icon: MessageCircle, href: '/app/settings?tab=ai-voice' },
        { id: 'personal-extension', label: 'Extension', icon: Puzzle, href: '/app/settings?tab=extension' },
      ],
    },
    {
      label: 'Workspace',
      items: [
        { id: 'identity', label: 'General', icon: UserRound },
        { id: 'library', label: 'Folders and documents', icon: FolderTree },
        { id: 'members', label: 'Members', icon: UsersRound },
      ],
    },
    {
      label: 'Data',
      items: [
        { id: 'notifications', label: 'Workspace notifications', icon: Bell },
        { id: 'data', label: 'Export and import', icon: Database },
      ],
    },
    {
      label: 'Advanced',
      items: [
        { id: 'danger', label: 'Archive and delete', icon: Trash2, danger: true },
      ],
    },
  ]

  return (
    <SettingsShell
      groups={settingsGroups}
      activeId={activeTab}
      onSelect={id => setActiveTab(id as Tab)}
      sectionDescriptions={SECTION_DESCRIPTIONS}
      exitHref={workspacePath(workspaceId, 'dashboard')}
    >
      {TabContent[activeTab]}
    </SettingsShell>
  )
}

export default function WorkspaceSettingsPage() {
  return (
    <Suspense fallback={<div className="flex h-full items-center justify-center bg-background text-sm text-muted-foreground">Loading settings…</div>}>
      <WorkspaceSettingsPageInner />
    </Suspense>
  )
}
