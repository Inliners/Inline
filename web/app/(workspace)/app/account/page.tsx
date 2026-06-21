'use client'

import { useState, useEffect, useRef, useTransition } from 'react'
import { useRouter } from 'next/navigation'
import PageHeader from '@/components/shell/PageHeader'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { cn } from '@/lib/utils'
import { signOut } from '@/lib/actions/auth'
import { createClient } from '@/lib/supabase/client'
import {
  Mail, Key, Check, Loader2, LogOut,
  AlertTriangle,
} from 'lucide-react'

// ---------------------------------------------------------------------------
// Shell matches workspace settings: breadcrumb → title → horizontal tabs → content
// ---------------------------------------------------------------------------
type Tab = 'general' | 'security' | 'notifications' | 'appearance' | 'danger'

const ACCOUNT_TABS: { id: Tab; label: string; danger?: boolean }[] = [
  { id: 'general', label: 'General' },
  { id: 'security', label: 'Security' },
  { id: 'notifications', label: 'Notifications' },
  { id: 'appearance', label: 'Themes' },
  { id: 'danger', label: 'Delete account', danger: true },
]

const TAB_DESCRIPTIONS: Partial<Record<Tab, string>> = {
  general: 'Your name, icon, and email.',
  security: 'Password, sessions, and sign out.',
  notifications: 'Choose how Inline communicates with you.',
  appearance: 'Light, dark, or system appearance.',
  danger: 'Permanently delete your account and data.',
}

const PROFILE_ACCENT = '#6C91C2'

function SectionCard({ title, description, children, action }: { title: string; description?: string; children: React.ReactNode; action?: React.ReactNode }) {
  return (
    <div className="space-y-4">
      <div className="flex items-start justify-between gap-3">
        <div>
          <h3 className="text-base font-semibold tracking-tight text-foreground">{title}</h3>
          {description && <p className="mt-1 max-w-xl text-sm leading-relaxed text-muted-foreground">{description}</p>}
        </div>
        {action}
      </div>
      <div className="space-y-5 rounded-2xl border border-border bg-card p-6">
        {children}
      </div>
    </div>
  )
}

function Row({ label, hint, children }: { label: string; hint?: string; children: React.ReactNode }) {
  return (
    <div className="grid grid-cols-[1fr_1.8fr] items-start gap-6">
      <div className="pt-0.5">
        <p className="text-sm font-medium text-foreground">{label}</p>
        {hint && <p className="mt-0.5 text-xs leading-snug text-muted-foreground">{hint}</p>}
      </div>
      <div>{children}</div>
    </div>
  )
}

function SaveBadge({ saved }: { saved: boolean }) {
  return saved ? (
    <span className="inline-flex items-center gap-1 text-xs font-medium text-accent">
      <Check className="h-3 w-3" /> Saved
    </span>
  ) : null
}

function GeneralTab() {
  const [fullName, setFullName] = useState('')
  const [email, setEmail] = useState('')
  const [avatar, setAvatar] = useState<string | null>(null)
  const [saved, setSaved] = useState(false)
  const [pending, startTrans] = useTransition()
  const fileRef = useRef<HTMLInputElement>(null)

  useEffect(() => {
    if (!process.env.NEXT_PUBLIC_SUPABASE_URL) return
    const supabase = createClient()
    void supabase.auth.getUser().then(({ data: { user } }) => {
      if (!user) return
      setFullName(user.user_metadata?.full_name || user.user_metadata?.name || '')
      setEmail(user.email ?? '')
      setAvatar(user.user_metadata?.avatar_url ?? null)
    })
  }, [])

  function handleFileChange(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0]
    if (!file) return
    const reader = new FileReader()
    reader.onload = ev => setAvatar(ev.target?.result as string)
    reader.readAsDataURL(file)
  }

  function handleSave() {
    startTrans(async () => {
      if (!process.env.NEXT_PUBLIC_SUPABASE_URL) return
      const supabase = createClient()
      await supabase.auth.updateUser({
        data: { full_name: fullName, avatar_url: avatar },
      })
      setSaved(true)
      setTimeout(() => setSaved(false), 2500)
    })
  }

  const initial = (fullName || email || 'U').charAt(0).toUpperCase()

  return (
    <div className="space-y-8">
      <SectionCard title="Profile Identity" description="Customize your name, icon, and email.">
        <Row label="Icon / Logo">
          <div className="flex items-center gap-4">
            <div
              onClick={() => fileRef.current?.click()}
              className="flex h-14 w-14 shrink-0 cursor-pointer items-center justify-center overflow-hidden rounded-2xl text-xl font-bold text-white transition-opacity hover:opacity-80"
              style={{ backgroundColor: PROFILE_ACCENT }}
            >
              {avatar ? <img src={avatar} alt="" className="h-full w-full object-cover" /> : initial}
            </div>
            <div>
              <Button variant="outline" size="sm" className="cursor-pointer" onClick={() => fileRef.current?.click()}>
                Upload Icon
              </Button>
              <p className="mt-1.5 text-xs text-muted-foreground">PNG, SVG, JPG</p>
              <input ref={fileRef} type="file" accept="image/*" className="hidden" onChange={handleFileChange} />
            </div>
          </div>
        </Row>

        <Row label="Name" hint="How your name appears across Inline.">
          <Input value={fullName} onChange={e => setFullName(e.target.value)} placeholder="Your name" />
        </Row>

        <Row label="Email" hint="Your login email address. Managed by your auth provider.">
          <div className="flex items-center gap-2">
            <Mail className="h-4 w-4 shrink-0 text-muted-foreground" />
            <span className="text-sm text-muted-foreground">{email || 'Not set'}</span>
          </div>
        </Row>

        <div className="flex items-center justify-between pt-1">
          <SaveBadge saved={saved} />
          <Button size="sm" onClick={handleSave} disabled={pending} className="ml-auto cursor-pointer">
            {pending ? <Loader2 className="mr-1.5 h-3.5 w-3.5 animate-spin" /> : null}
            Save Changes
          </Button>
        </div>
      </SectionCard>
    </div>
  )
}

function SecurityTab() {
  const [newPw, setNewPw] = useState('')
  const [confirmPw, setConfirmPw] = useState('')
  const [saved, setSaved] = useState(false)
  const [pending, startTrans] = useTransition()

  function handleChangePassword() {
    if (!newPw || newPw !== confirmPw) return
    startTrans(async () => {
      if (!process.env.NEXT_PUBLIC_SUPABASE_URL) return
      const supabase = createClient()
      await supabase.auth.updateUser({ password: newPw })
      setNewPw('')
      setConfirmPw('')
      setSaved(true)
      setTimeout(() => setSaved(false), 2500)
    })
  }

  return (
    <div className="space-y-8">
      <SectionCard title="Change Password" description="Update your password to keep your account secure.">
        <Row label="New Password">
          <Input type="password" value={newPw} onChange={e => setNewPw(e.target.value)} placeholder="••••••••" />
        </Row>
        <Row label="Confirm New Password">
          <Input type="password" value={confirmPw} onChange={e => setConfirmPw(e.target.value)} placeholder="••••••••" />
        </Row>
        <div className="flex items-center justify-between pt-1">
          <SaveBadge saved={saved} />
          <Button
            size="sm"
            onClick={handleChangePassword}
            disabled={pending || newPw !== confirmPw || !newPw}
            className="ml-auto cursor-pointer"
          >
            {pending ? <Loader2 className="mr-1.5 h-3.5 w-3.5 animate-spin" /> : <Key className="mr-1.5 h-3.5 w-3.5" />}
            Update Password
          </Button>
        </div>
      </SectionCard>

      <SectionCard title="Active Sessions" description="Devices where you are signed in.">
        <div className="flex items-center justify-between">
          <div>
            <p className="text-sm font-medium text-foreground">Current session</p>
            <p className="mt-0.5 text-xs text-muted-foreground">This browser · active now</p>
          </div>
          <span className="rounded-full bg-accent/10 px-2 py-0.5 text-xs font-medium text-accent">Active</span>
        </div>
      </SectionCard>

      <SectionCard title="Session" description="Sign out of Inline on this device.">
        <div className="flex items-center justify-between gap-4 py-0.5">
          <div>
            <p className="text-sm font-medium text-foreground">Sign out</p>
            <p className="mt-0.5 text-xs text-muted-foreground">You will need to sign in again to access your workspace.</p>
          </div>
          <form action={signOut}>
            <Button type="submit" variant="outline" size="sm" className="cursor-pointer gap-1.5">
              <LogOut className="h-3.5 w-3.5" />
              Sign out
            </Button>
          </form>
        </div>
      </SectionCard>
    </div>
  )
}

function NotificationsTab() {
  return (
    <div className="space-y-8">
      <SectionCard
        title="Notifications"
        description="Email notifications aren't available yet."
      >
        <p className="text-sm leading-relaxed text-muted-foreground">
          Inline doesn&apos;t send emails today. When notifications ship, you&apos;ll be
          able to opt into product updates and security alerts from this page.
        </p>
      </SectionCard>
    </div>
  )
}

function AppearanceTab() {
  // Reads and writes the same `inline-theme` key used by ThemeScript and the
  // sidebar ThemeToggle, so the choice applies immediately and persists.
  const [theme, setTheme] = useState<'light' | 'dark'>('light')

  useEffect(() => {
    const stored = (localStorage.getItem('inline-theme') as 'light' | 'dark' | null) ?? 'light'
    setTheme(stored)
  }, [])

  function applyTheme(t: 'light' | 'dark') {
    setTheme(t)
    localStorage.setItem('inline-theme', t)
    if (t === 'dark') document.documentElement.classList.add('dark')
    else document.documentElement.classList.remove('dark')
    window.dispatchEvent(new CustomEvent('inline-theme-changed', { detail: t }))
  }

  return (
    <div className="space-y-8">
      <SectionCard title="Theme" description="Select your preferred appearance. Applies immediately across the workspace.">
        <div className="flex gap-3">
          {(['light', 'dark'] as const).map(t => (
            <button
              key={t}
              type="button"
              onClick={() => applyTheme(t)}
              aria-pressed={theme === t}
              className={cn(
                'flex-1 cursor-pointer rounded-xl border-2 py-3 text-sm font-medium capitalize transition-all',
                theme === t
                  ? 'border-primary bg-primary/5 text-primary'
                  : 'border-border text-muted-foreground hover:border-primary/30',
              )}
            >
              {t}
            </button>
          ))}
        </div>
      </SectionCard>
    </div>
  )
}

function DangerTab() {
  const router = useRouter()
  const [showModal, setShowModal] = useState(false)
  const [confirmText, setConfirmText] = useState('')
  const [deleting, setDeleting] = useState(false)
  const [deleteError, setDeleteError] = useState<string | null>(null)

  async function handleDelete() {
    if (confirmText !== 'DELETE') return
    setDeleting(true)
    setDeleteError(null)
    try {
      const res = await fetch('/api/account/delete', { method: 'POST' })
      if (!res.ok) {
        const body = await res.json().catch(() => null) as { error?: string } | null
        throw new Error(body?.error ?? 'Failed to delete account.')
      }
      router.push('/')
    } catch (err) {
      setDeleteError((err as Error).message)
      setDeleting(false)
    }
  }

  return (
    <div className="space-y-8">
      <SectionCard title="Danger Zone" description="These actions are permanent and cannot be undone.">
        <div className="flex items-center justify-between py-1">
          <div>
            <p className="text-sm font-medium text-destructive">Delete account</p>
            <p className="mt-0.5 text-xs text-muted-foreground">Permanently deletes your account and all personal data.</p>
          </div>
          <Button size="sm" variant="destructive" className="cursor-pointer" onClick={() => setShowModal(true)}>
            Delete
          </Button>
        </div>
      </SectionCard>

      {showModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4" onClick={() => setShowModal(false)}>
          <div className="absolute inset-0 bg-black/40" />
          <div
            className="relative w-full max-w-sm space-y-4 rounded-2xl border border-border bg-card p-6 text-card-foreground"
            onClick={e => e.stopPropagation()}
          >
            <div className="flex items-start gap-3">
              <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-destructive/10">
                <AlertTriangle className="h-4 w-4 text-destructive" />
              </div>
              <div>
                <h3 className="text-sm font-semibold">Delete your account?</h3>
                <p className="mt-1 text-xs text-muted-foreground">
                  This action is irreversible. All workspaces you own and all personal data will be deleted.
                </p>
              </div>
            </div>
            <div className="space-y-1.5">
              <p className="text-xs text-muted-foreground">
                Type <strong className="font-mono text-foreground">DELETE</strong> to confirm:
              </p>
              <Input
                value={confirmText}
                onChange={e => setConfirmText(e.target.value)}
                placeholder="DELETE"
                className="font-mono text-sm"
                autoFocus
              />
            </div>
            {deleteError && (
              <p className="rounded-lg bg-destructive/10 px-3 py-2 text-xs text-destructive" role="alert">
                {deleteError}
              </p>
            )}
            <div className="flex gap-2 pt-1">
              <Button
                variant="outline"
                size="sm"
                className="flex-1 cursor-pointer"
                onClick={() => {
                  setShowModal(false)
                  setConfirmText('')
                }}
              >
                Cancel
              </Button>
              <Button
                variant="destructive"
                size="sm"
                className="flex-1 cursor-pointer"
                disabled={confirmText !== 'DELETE' || deleting}
                onClick={handleDelete}
              >
                {deleting ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : 'Delete account'}
              </Button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}

export default function AccountSettingsPage() {
  const [activeTab, setActiveTab] = useState<Tab>('general')

  const TabContent: Record<Tab, React.ReactNode> = {
    general:       <GeneralTab />,
    security:      <SecurityTab />,
    notifications: <NotificationsTab />,
    appearance:    <AppearanceTab />,
    danger:        <DangerTab />,
  }

  return (
    <>
      <PageHeader crumbs={[{ label: 'Account', href: '/app/ws-1/dashboard' }, { label: 'Settings' }]} />

      <div className="px-6 pb-12">
        <h1 className="mt-4 text-2xl font-semibold tracking-tight text-foreground">Account Settings</h1>

        <nav
          className="mt-6 flex gap-1 overflow-x-auto border-b border-border pb-px scrollbar-minimal -mb-px"
          aria-label="Account settings sections"
        >
          {ACCOUNT_TABS.map(tab => {
            const active = activeTab === tab.id
            return (
              <button
                key={tab.id}
                type="button"
                onClick={() => setActiveTab(tab.id)}
                className={cn(
                  '-mb-px shrink-0 cursor-pointer whitespace-nowrap border-b-2 px-3 py-2.5 text-sm font-medium transition-colors',
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
            {ACCOUNT_TABS.find(t => t.id === activeTab)?.label}
          </h2>
          {TAB_DESCRIPTIONS[activeTab] && (
            <p className="text-sm text-muted-foreground">{TAB_DESCRIPTIONS[activeTab]}</p>
          )}
        </div>

        <div className="mt-6 w-full space-y-8">{TabContent[activeTab]}</div>
      </div>
    </>
  )
}
