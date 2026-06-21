'use client'

import { useState, useEffect, useTransition, useMemo } from 'react'
import { useParams, useRouter } from 'next/navigation'
import Link from 'next/link'
import PageHeader from '@/components/shell/PageHeader'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { cn } from '@/lib/utils'
import { getWorkspaceName, getWorkspaceColor, DEFAULT_WORKSPACES } from '@/lib/workspaces'
import { exportWorkspaceNotes } from '@/lib/actions/export'
import { createClient } from '@/lib/supabase/client'
import {
  loadWorkspaceFolders,
  getRootFolders,
  getChildFolders,
  type WorkspaceFolder,
} from '@/lib/workspace-folders'
import {
  Check, Download, Loader2, AlertTriangle,
  Crown, ArrowRight, Folder, ArchiveRestore,
} from 'lucide-react'

// ---------------------------------------------------------------------------
// Types & constants
// ---------------------------------------------------------------------------
type Tab = 'identity' | 'library' | 'members' | 'notifications' | 'data' | 'danger'

/** Flat tab list for horizontal nav (order preserved) */
const WS_TABS: { id: Tab; label: string; danger?: boolean }[] = [
  { id: 'identity', label: 'General' },
  { id: 'library', label: 'Folders & documents' },
  { id: 'members', label: 'Members' },
  { id: 'notifications', label: 'Notifications' },
  { id: 'data', label: 'Data' },
  { id: 'danger', label: 'Archive & delete', danger: true },
]

// ---------------------------------------------------------------------------
// Layout helpers
// ---------------------------------------------------------------------------
function SectionCard({ title, description, children, action }: { title: string; description?: string; children: React.ReactNode; action?: React.ReactNode }) {
  return (
    <div className="space-y-4">
      <div className="flex items-start justify-between gap-3">
        <div>
          <h3 className="text-base font-semibold text-foreground tracking-tight">{title}</h3>
          {description && <p className="text-sm text-muted-foreground mt-1 leading-relaxed max-w-xl">{description}</p>}
        </div>
        {action}
      </div>
      <div className="bg-card border border-border rounded-2xl p-6 space-y-5">
        {children}
      </div>
    </div>
  )
}

function Row({ label, hint, children }: { label: string; hint?: string; children: React.ReactNode }) {
  return (
    <div className="grid grid-cols-[1fr_1.8fr] gap-6 items-start">
      <div className="pt-0.5">
        <p className="text-sm font-medium text-foreground">{label}</p>
        {hint && <p className="text-xs text-muted-foreground mt-0.5 leading-snug">{hint}</p>}
      </div>
      <div>{children}</div>
    </div>
  )
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
      <SectionCard title="Workspace Identity" description="Customize your workspace name and color.">
        <Row label="Icon" hint="Workspaces use a colored monogram of the first letter.">
          <div
            className="w-14 h-14 rounded-2xl flex items-center justify-center text-white font-bold text-xl shrink-0"
            style={{ backgroundColor: color }}
            aria-hidden
          >
            {wsName.charAt(0).toUpperCase()}
          </div>
        </Row>

        <Row label="Name">
          <Input value={wsName} onChange={e => setWsName(e.target.value)} placeholder="Workspace name" />
        </Row>

        <Row label="Color" hint="Used for sidebar indicators and icons.">
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
        </Row>

        <div className="flex items-center justify-between pt-1">
          <SaveBadge saved={saved} />
          <Button size="sm" onClick={handleSave} disabled={pending} className="cursor-pointer ml-auto">
            {pending ? <Loader2 className="w-3.5 h-3.5 animate-spin mr-1.5" /> : null}
            Save Changes
          </Button>
        </div>
      </SectionCard>
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
      <SectionCard title="Members" description="People with access to this workspace.">
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
      </SectionCard>

      <SectionCard
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
      </SectionCard>
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
      <SectionCard title="Export Data" description="Download all notes, extractions, and metadata as a CSV file.">
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
      </SectionCard>

      <SectionCard title="Import Data" description="Bring notes from external sources into this workspace.">
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
      </SectionCard>
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
      <SectionCard title="Danger Zone" description="Archiving hides the workspace; deleting removes it from your list.">
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
      </SectionCard>

      {archived.length > 0 && (
        <SectionCard title="Archived workspaces" description="Restore a previously archived workspace to the sidebar.">
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
        </SectionCard>
      )}

      {/* ── Delete confirmation modal ── */}
      {showDeleteModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4" onClick={() => setShowDeleteModal(false)}>
          <div className="absolute inset-0 bg-black/40" />
          <div className="relative bg-card text-card-foreground rounded-2xl border border-border p-6 w-full max-w-sm space-y-4"
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
        href={`/app/${workspaceId}/folder/${folder.id}`}
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
      <SectionCard
        title="Workspace library"
        description="Folders belong only to this workspace. Nest subfolders from the sidebar; each folder can hold documents and more folders."
      >
        <div className="flex flex-wrap gap-2">
          <Link
            href={`/app/${workspaceId}/dashboard`}
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
      </SectionCard>
    </div>
  )
}

// ---------------------------------------------------------------------------
// Notifications Tab
// ---------------------------------------------------------------------------
function NotificationsTab() {
  return (
    <div className="space-y-8">
      <SectionCard
        title="Email Notifications"
        description="Email notifications aren't available yet."
      >
        <p className="text-sm text-muted-foreground leading-relaxed">
          Inline doesn&apos;t send emails today. When notifications ship, you&apos;ll be
          able to opt into a weekly capture digest and workspace activity alerts
          from this page.
        </p>
      </SectionCard>
    </div>
  )
}

// ---------------------------------------------------------------------------
// Page
// ---------------------------------------------------------------------------
export default function WorkspaceSettingsPage() {
  const params      = useParams()
  const workspaceId = Array.isArray(params.workspaceId) ? params.workspaceId[0] : (params.workspaceId as string) ?? 'ws-1'
  const [workspaceName,  setWorkspaceName]  = useState(() => getWorkspaceName(workspaceId))
  const workspaceColor = getWorkspaceColor(workspaceId)

  const [activeTab, setActiveTab] = useState<Tab>('identity')

  useEffect(() => { setWorkspaceName(getWorkspaceName(workspaceId)) }, [workspaceId])

  const TabContent: Record<Tab, React.ReactNode> = {
    identity:      <IdentityTab workspaceId={workspaceId} initialName={workspaceName} initialColor={workspaceColor} />,
    library:       <LibraryTab workspaceId={workspaceId} />,
    members:       <MembersTab />,
    notifications: <NotificationsTab />,
    data:          <DataTab workspaceId={workspaceId} />,
    danger:        <DangerTab workspaceId={workspaceId} workspaceName={workspaceName} />,
  }

  const tabDescriptions: Partial<Record<Tab, string>> = {
    identity: 'Workspace name and color.',
    library: 'Folders and documents in this workspace.',
    members: 'Who has access to this workspace.',
    notifications: 'Email and activity alerts.',
    data: 'Export and import workspace data.',
    danger: 'Archive or permanently delete this workspace.',
  }

  return (
    <>
      <PageHeader
        crumbs={[{ label: workspaceName, href: `/app/${workspaceId}/dashboard` }, { label: 'Settings' }]}
      />

      <div className="px-6 pb-12">
        <h1 className="text-2xl font-semibold tracking-tight text-foreground mt-4">
          {workspaceName} Settings
        </h1>

        <p className="mt-4 rounded-xl border border-border bg-muted/50 px-4 py-3 text-sm leading-relaxed text-muted-foreground">
          <span className="font-medium text-foreground">AI &amp; Voice, ElevenLabs, and the browser extension</span>{' '}
          are configured in{' '}
          <Link
            href="/app/settings?tab=ai-voice"
            className="font-medium text-primary underline decoration-primary/40 underline-offset-2 hover:decoration-primary"
          >
            Account settings → AI &amp; Voice
          </Link>
          . This page only covers options for <em>this workspace</em> (folders, members, etc.).
        </p>

        <nav
          className="mt-6 flex gap-1 overflow-x-auto scrollbar-minimal border-b border-border -mb-px pb-px"
          aria-label="Workspace settings sections"
        >
          {WS_TABS.map(tab => {
            const active = activeTab === tab.id
            return (
              <button
                key={tab.id}
                type="button"
                onClick={() => setActiveTab(tab.id)}
                className={cn(
                  'shrink-0 px-3 py-2.5 text-sm font-medium border-b-2 -mb-px transition-colors cursor-pointer whitespace-nowrap',
                  tab.danger
                    ? active
                      ? 'border-destructive text-destructive'
                      : 'border-transparent text-destructive/80 hover:text-destructive'
                    : active
                      ? 'border-primary text-primary'
                      : 'border-transparent text-muted-foreground hover:text-foreground',
                )}
              >
                {tab.label}
              </button>
            )
          })}
        </nav>

        <div className="mt-8 w-full space-y-2">
          <h2 className="text-base font-semibold text-foreground">
            {WS_TABS.find(t => t.id === activeTab)?.label}
          </h2>
          {tabDescriptions[activeTab] && (
            <p className="text-sm text-muted-foreground">{tabDescriptions[activeTab]}</p>
          )}
        </div>

        <div className="mt-6 w-full space-y-8">{TabContent[activeTab]}</div>
      </div>
    </>
  )
}
