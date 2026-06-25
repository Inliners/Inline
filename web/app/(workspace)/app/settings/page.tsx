'use client'

import { useState, useEffect, useTransition, useRef, Suspense } from 'react'
import Link from 'next/link'
import { useRouter, useSearchParams } from 'next/navigation'
import SettingsShell, { SettingsRow, SettingsSection, type SettingsNavGroup } from '@/components/settings/SettingsShell'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { cn } from '@/lib/utils'
import { signOut } from '@/lib/actions/auth'
import { createClient } from '@/lib/supabase/client'
import { DEFAULT_WORKSPACES } from '@/lib/workspaces'
import { workspacePath } from '@/lib/workspace-routes'
import { useConfirm, useToast } from '@/components/ui/notifications'
import {
  DEFAULT_INLINE_VOICE_ID,
  INLINE_VOICE_PRESETS,
  normalizeInlineVoiceId,
} from '@/lib/inlineVoicePresets'
import {
  Check, Mail,
  Play, Loader2, Plus, X, Globe, Shield,
  AlertTriangle, LogOut, UserRound, Bell, Palette, MessageCircle, Puzzle, Trash2, Settings2,
  FolderTree, UsersRound, Database,
} from 'lucide-react'

const SECTION_DESCRIPTIONS: Record<Tab, string> = {
  general: 'Your name, icon, and email.',
  security: 'Password, sessions, and sign out.',
  notifications: 'Choose how Inline communicates with you.',
  appearance: 'Light, dark, or system appearance.',
  'ai-voice': 'Voice selection, tuning, and AI copilot behavior.',
  extension: 'Domains, permissions, and extension preferences.',
  danger: 'Permanently delete your account and data.',
}

// ---------------------------------------------------------------------------
// Types & navigation (same shell pattern as workspace settings)
// ---------------------------------------------------------------------------
type Tab = 'general' | 'security' | 'notifications' | 'appearance' | 'ai-voice' | 'extension' | 'danger'

const PROFILE_TABS: { id: Tab; label: string; danger?: boolean }[] = [
  { id: 'general', label: 'General' },
  { id: 'security', label: 'Security' },
  { id: 'notifications', label: 'Notifications' },
  { id: 'appearance', label: 'Themes' },
  { id: 'ai-voice', label: 'AI & Voice' },
  { id: 'extension', label: 'Extension' },
  { id: 'danger', label: 'Delete account', danger: true },
]

// ---------------------------------------------------------------------------
// Layout helpers
// ---------------------------------------------------------------------------
function ToggleRow({ label, description, checked, onChange }: { label: string; description: string; checked: boolean; onChange: (v: boolean) => void }) {
  return (
    <div className="flex items-start justify-between gap-4">
      <div>
        <p className="text-sm font-medium text-foreground">{label}</p>
        <p className="text-xs text-muted-foreground mt-0.5">{description}</p>
      </div>
      <button
        type="button"
        onClick={() => onChange(!checked)}
        className={cn('relative shrink-0 w-9 h-5 rounded-full transition-colors duration-200 cursor-pointer', checked ? 'bg-toggle-active' : 'bg-muted-foreground/30')}
      >
        <span className={cn('absolute top-0.5 left-0.5 w-4 h-4 rounded-full bg-background ring-1 ring-border/60 transition-transform duration-200', checked && 'translate-x-4')} />
      </button>
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
// General (identity only — mirrors workspace “General” → Workspace Identity)
// ---------------------------------------------------------------------------
const PROFILE_ACCENT = '#6C91C2'

function GeneralTab() {
  const [name, setName] = useState('')
  const [email, setEmail] = useState('')
  const [saved, setSaved] = useState(false)
  const [pending, start] = useTransition()
  const fileRef = useRef<HTMLInputElement>(null)
  const [avatar, setAvatar] = useState<string | null>(null)

  useEffect(() => {
    if (!process.env.NEXT_PUBLIC_SUPABASE_URL) return
    const supabase = createClient()
    void supabase.auth.getUser().then(({ data: { user } }) => {
      if (!user) return
      setName(user.user_metadata?.full_name || user.user_metadata?.name || '')
      setEmail(user.email ?? '')
      setAvatar(user.user_metadata?.avatar_url ?? null)
    })
  }, [])

  function handleSave() {
    start(async () => {
      if (!process.env.NEXT_PUBLIC_SUPABASE_URL) return
      const supabase = createClient()
      await supabase.auth.updateUser({
        data: { full_name: name, avatar_url: avatar },
      })
      setSaved(true)
      setTimeout(() => setSaved(false), 2500)
    })
  }

  function handleFile(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0]
    if (!file) return
    const reader = new FileReader()
    reader.onload = ev => setAvatar(ev.target?.result as string)
    reader.readAsDataURL(file)
  }

  const initial = (name || email || 'U').charAt(0).toUpperCase()

  return (
    <div className="space-y-8">
      <SettingsSection title="Profile Identity" description="Customize your name and icon.">
        <SettingsRow label="Icon / Logo">
          <div className="flex items-center gap-4">
            <div
              onClick={() => fileRef.current?.click()}
              className="flex h-14 w-14 shrink-0 cursor-pointer items-center justify-center overflow-hidden rounded-2xl text-xl font-bold text-white transition-opacity hover:opacity-80"
              style={{ backgroundColor: PROFILE_ACCENT }}
            >
              {avatar
                ? <img src={avatar} alt="avatar" className="h-full w-full object-cover" />
                : initial}
            </div>
            <div>
              <Button variant="outline" size="sm" className="cursor-pointer" onClick={() => fileRef.current?.click()}>
                Upload Icon
              </Button>
              <p className="mt-1.5 text-xs text-muted-foreground">PNG, SVG, JPG</p>
              <input ref={fileRef} type="file" accept="image/*" className="hidden" onChange={handleFile} />
            </div>
          </div>
        </SettingsRow>

        <SettingsRow label="Name" hint="How your name appears across Inline.">
          <Input value={name} onChange={e => setName(e.target.value)} placeholder="Your name" />
        </SettingsRow>

        <SettingsRow label="Email" hint="Your login email address. Managed by your auth provider.">
          <div className="flex items-center gap-2 pt-1.5">
            <Mail className="h-4 w-4 shrink-0 text-muted-foreground" />
            <span className="text-sm text-muted-foreground">{email || 'Not set'}</span>
          </div>
        </SettingsRow>

        <div className="flex items-center justify-between pt-1">
          <SaveBadge saved={saved} />
          <Button size="sm" onClick={handleSave} disabled={pending} className="ml-auto cursor-pointer">
            {pending ? <Loader2 className="mr-1.5 h-3.5 w-3.5 animate-spin" /> : null}
            Save Changes
          </Button>
        </div>
      </SettingsSection>
    </div>
  )
}

// ---------------------------------------------------------------------------
// Security (password + session)
// ---------------------------------------------------------------------------
function SecurityTab() {
  return (
    <div className="space-y-8">
      <SettingsSection title="Password" description="Update your password to keep your account secure.">
        <SettingsRow label="Password">
          <a
            href="/auth/reset-password"
            className="inline-flex h-9 cursor-pointer items-center justify-center gap-1.5 rounded-md border border-border bg-background px-3 text-sm font-medium transition-colors hover:bg-accent/30"
          >
            Change password
          </a>
        </SettingsRow>
      </SettingsSection>

      <SettingsSection title="Session" description="Sign out of Inline on this device.">
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
      </SettingsSection>
    </div>
  )
}

// ---------------------------------------------------------------------------
// Danger zone (mirrors workspace Delete workspace tab)
// ---------------------------------------------------------------------------
function AccountDangerTab() {
  const router = useRouter()
  const [showDeleteModal, setShowDeleteModal] = useState(false)
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
      <SettingsSection title="Danger Zone" description="These actions are permanent and cannot be undone.">
        <div className="flex items-center justify-between py-1">
          <div>
            <p className="text-sm font-medium text-destructive">Delete account</p>
            <p className="text-xs text-muted-foreground mt-0.5">Permanently deletes your account and all personal data.</p>
          </div>
          <Button size="sm" variant="destructive" className="cursor-pointer" onClick={() => setShowDeleteModal(true)}>
            Delete
          </Button>
        </div>
      </SettingsSection>

      {showDeleteModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4" onClick={() => setShowDeleteModal(false)}>
          <div className="absolute inset-0 bg-black/40" />
          <div
            className="relative w-full max-w-sm space-y-4 rounded-2xl border border-border bg-card p-6 text-card-foreground dark:border-sidebar-border dark:bg-secondary"
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
                  setShowDeleteModal(false)
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

// ---------------------------------------------------------------------------
// Appearance / Themes
// ---------------------------------------------------------------------------
function AppearanceTab() {
  const [textSize, setTextSize] = useState(14)
  const [saved, setSaved] = useState(false)
  const [uiTheme, setUiTheme] = useState<'light' | 'dark'>('light')

  useEffect(() => {
    const sz = parseInt(localStorage.getItem('inline_text_size') || '14')
    setTextSize(sz)
    document.documentElement.style.setProperty('--font-size-base', `${sz}px`)

    // Source of truth is the same `inline-theme` key the ThemeScript reads
    // before first paint, so the picker stays in sync with the instant toggle.
    const stored = (localStorage.getItem('inline-theme') as 'light' | 'dark' | null) ?? 'light'
    setUiTheme(stored)
  }, [])

  function pickTheme(id: 'light' | 'dark') {
    setUiTheme(id)
    localStorage.setItem('inline-theme', id)
    if (id === 'dark') document.documentElement.classList.add('dark')
    else document.documentElement.classList.remove('dark')
    // Notify other components (e.g. the sidebar toggle) listening for theme changes.
    window.dispatchEvent(new CustomEvent('inline-theme-changed', { detail: id }))
    setSaved(true)
    setTimeout(() => setSaved(false), 1800)
  }

  function changeTextSize(v: number) {
    setTextSize(v)
    document.documentElement.style.setProperty('--font-size-base', `${v}px`)
    localStorage.setItem('inline_text_size', String(v))
    setSaved(true)
    setTimeout(() => setSaved(false), 1800)
  }

  const THEMES = [
    { id: 'light' as const, name: 'Light', desc: 'Warm cream workspace', cls: 'bg-[#FDFBF7] border-stone-200' },
    { id: 'dark' as const,  name: 'Dark',  desc: 'Deep navy, easier on the eyes', cls: 'bg-[#0B1735] border-[#1C3666]' },
  ]

  return (
    <div className="space-y-8">
      <SettingsSection title="Select theme" description="Switches the dashboard between warm-cream light and dark charcoal." action={<SaveBadge saved={saved} />}>
        <div className="grid grid-cols-2 gap-3">
          {THEMES.map(t => (
            <button key={t.id} type="button" onClick={() => pickTheme(t.id)}
              className={cn('flex flex-col rounded-xl border-2 p-3 text-left transition-all cursor-pointer',
                uiTheme === t.id ? 'border-primary ring-2 ring-primary/20' : 'border-border hover:border-primary/30'
              )}>
              <div className={cn('h-20 rounded-lg border mb-3', t.cls)} />
              <div className="flex items-center gap-2">
                <span className={cn('w-3.5 h-3.5 rounded-full border-2 shrink-0', uiTheme === t.id ? 'border-primary bg-primary' : 'border-muted-foreground/40')} />
                <div>
                  <p className="text-xs font-semibold">{t.name}</p>
                  <p className="text-[10px] text-muted-foreground">{t.desc}</p>
                </div>
              </div>
            </button>
          ))}
        </div>
      </SettingsSection>

      <SettingsSection title="Text size" description="Scales typography instantly across the dashboard.">
        <SettingsRow label="Size" hint={`Current: ${textSize}px`}>
          <div className="space-y-3">
            <input type="range" min={12} max={18} step={1} value={textSize}
              onChange={e => changeTextSize(Number(e.target.value))}
              className="w-full accent-primary cursor-pointer" />
            <div className="flex flex-wrap gap-1.5">
              {[12, 13, 14, 15, 16, 17, 18].map(s => (
                <button key={s} type="button" onClick={() => changeTextSize(s)}
                  className={cn('text-xs px-2.5 py-1 rounded-lg transition-colors cursor-pointer font-medium',
                    textSize === s ? 'bg-primary text-primary-foreground' : 'text-muted-foreground hover:bg-muted'
                  )}>{s}px</button>
              ))}
            </div>
          </div>
        </SettingsRow>
      </SettingsSection>
    </div>
  )
}

// ---------------------------------------------------------------------------
// Notifications
// ---------------------------------------------------------------------------
function NotificationsTab() {
  return (
    <div className="space-y-8">
      <SettingsSection
        title="Notifications"
        description="Email notifications aren't available yet."
      >
        <p className="text-sm leading-relaxed text-muted-foreground">
          Inline doesn&apos;t send emails today. When notifications ship, you&apos;ll be
          able to opt into product updates, weekly digests, and security alerts
          from this page.
        </p>
      </SettingsSection>
    </div>
  )
}

// ---------------------------------------------------------------------------
// AI & Voice
// ---------------------------------------------------------------------------
function syncVoiceToChromeExtension(payload: {
  voiceId: string
  stability: string
  similarity: string
}) {
  const extId = process.env.NEXT_PUBLIC_CHROME_EXTENSION_ID
  if (!extId || typeof window === 'undefined') return
  const w = window as unknown as {
    chrome?: { runtime?: { sendMessage: (extensionId: string, message: unknown, responseCallback?: () => void) => void } }
  }
  try {
    w.chrome?.runtime?.sendMessage(extId, {
      type: 'INLINE_SYNC_VOICE_SETTINGS',
      payload,
    }, () => { /* optional: ignore lastError */ })
  } catch {
    /* not Chrome or extension unavailable */
  }
}

function AIVoiceTab() {
  const [voiceId,   setVoiceId]   = useState(DEFAULT_INLINE_VOICE_ID)
  const [saved,     setSaved]     = useState(false)
  const [, start]                 = useTransition()
  const [testState, setTest]      = useState<'idle' | 'playing'>('idle')
  const [autocomp,  setAutocomp]  = useState(true)
  const [voiceChat, setVoiceChat] = useState(false)
  const [screenReader, setScreenReader] = useState(false)
  const [stability, setStability] = useState(0.5)
  const [similarity, setSimilarity] = useState(0.75)

  useEffect(() => {
    // Legacy cleanup: API keys are server-managed now and must never live in
    // browser storage.
    localStorage.removeItem('inline_openai_key')
    localStorage.removeItem('inline_elevenlabs_key')
    const rawVoice = localStorage.getItem('inline_voice_id')
    const normVoice = normalizeInlineVoiceId(rawVoice)
    setVoiceId(normVoice)
    if (rawVoice !== normVoice) localStorage.setItem('inline_voice_id', normVoice)
    setAutocomp(localStorage.getItem('inline_autocomplete') !== 'false')
    setVoiceChat(localStorage.getItem('inline_voice_chat') === 'true')
    setScreenReader(localStorage.getItem('inline_screen_reader') === 'true')
    setStability(parseFloat(localStorage.getItem('inline_voice_stability') || '0.5'))
    setSimilarity(parseFloat(localStorage.getItem('inline_voice_similarity') || '0.75'))
  }, [])

  function handleSave() {
    start(async () => {
      const vid = normalizeInlineVoiceId(voiceId)
      setVoiceId(vid)
      localStorage.setItem('inline_voice_id', vid)
      localStorage.setItem('inline_autocomplete', String(autocomp))
      localStorage.setItem('inline_voice_chat', String(voiceChat))
      localStorage.setItem('inline_screen_reader', String(screenReader))
      localStorage.setItem('inline_voice_stability', String(stability))
      localStorage.setItem('inline_voice_similarity', String(similarity))
      const _chrome = (typeof window !== 'undefined' ? (window as unknown as Record<string, unknown>).chrome : undefined) as (undefined | { storage?: { local?: { set: (v: Record<string, unknown>) => void } } })
      if (_chrome?.storage?.local) {
        _chrome.storage.local.set({
          inlineVoiceId: vid,
          inlineScreenReader: String(screenReader),
          inlineVoiceStability: String(stability),
          inlineVoiceSimilarity: String(similarity),
        })
      }
      syncVoiceToChromeExtension({
        voiceId: vid,
        stability: String(stability),
        similarity: String(similarity),
      })
      await new Promise(r => setTimeout(r, 400))
      setSaved(true)
      setTimeout(() => setSaved(false), 2500)
    })
  }

  /** Play a preview of the selected voice.
   *
   * Resolution order — identical philosophy to the extension's
   * `speakWithElevenLabs`:
   *
   *   1. POST `/api/tts` — the authenticated server proxy holds the only
   *      ElevenLabs key (server env). No keys ever pass through the browser.
   *   2. `window.speechSynthesis` — always-available browser voice, no
   *      keys, no network. Guarantees the "Test voice" button never goes
   *      silent.
   */
  async function testVoice() {
    setTest('playing')
    const sampleText = 'Hello, this is your Inline voice assistant.'

    try {
      const res = await fetch('/api/tts', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          text: sampleText,
          voiceId,
          stability,
          similarityBoost: similarity,
        }),
      })

      if (res.ok) {
        const blob = await res.blob()
        const url = URL.createObjectURL(blob)
        const audio = new Audio(url)
        audio.onended = () => { URL.revokeObjectURL(url); setTest('idle') }
        audio.onerror = () => { URL.revokeObjectURL(url); setTest('idle') }
        void audio.play()
        return
      }

      // Proxy failed (ElevenLabs rejected the key, server unreachable,
      // etc.). Fall back to the browser's built-in voice so the user
      // still hears a sample.
      if (typeof window !== 'undefined' && window.speechSynthesis) {
        const utter = new SpeechSynthesisUtterance(sampleText)
        utter.onend = () => setTest('idle')
        utter.onerror = () => setTest('idle')
        window.speechSynthesis.cancel()
        window.speechSynthesis.speak(utter)
        return
      }

      setTest('idle')
    } catch {
      // Network or parse error — try browser synth as a last resort.
      if (typeof window !== 'undefined' && window.speechSynthesis) {
        const utter = new SpeechSynthesisUtterance(sampleText)
        utter.onend = () => setTest('idle')
        utter.onerror = () => setTest('idle')
        window.speechSynthesis.cancel()
        window.speechSynthesis.speak(utter)
      } else {
        setTest('idle')
      }
    }
  }

  return (
    <div className="space-y-8">
      <SettingsSection title="Voice selection" description="The voice used for AI read-aloud across the dashboard and extension." action={<SaveBadge saved={saved} />}>
        <div className="space-y-2">
          {INLINE_VOICE_PRESETS.map(v => (
            <button key={v.id} type="button" onClick={() => setVoiceId(v.id)}
              className={cn('w-full flex items-center justify-between px-3 py-2 rounded-lg border text-sm transition-colors cursor-pointer',
                voiceId === v.id ? 'border-primary bg-primary/5' : 'border-border hover:border-primary/30'
              )}>
              <span className="text-left">
                <span className="font-medium text-foreground">{v.name}</span>
                <span className="block text-xs text-muted-foreground mt-0.5">
                  {v.gender === 'female' ? 'Female' : 'Male'} · {v.subtitle}
                </span>
              </span>
              {voiceId === v.id && <Check className="w-3.5 h-3.5 text-primary shrink-0" />}
            </button>
          ))}
        </div>
        <div className="flex items-center gap-3 pt-2">
          <Button variant="outline" size="sm" onClick={testVoice} disabled={testState === 'playing'} className="cursor-pointer gap-2">
            {testState === 'playing' ? <><Loader2 className="w-3.5 h-3.5 animate-spin" />Playing…</> : <><Play className="w-3.5 h-3.5" />Test voice</>}
          </Button>
          <Button size="sm" onClick={handleSave} className="cursor-pointer">Save voice</Button>
        </div>
      </SettingsSection>

      <SettingsSection title="Voice tuning" description="Adjust voice characteristics for ElevenLabs TTS.">
        <SettingsRow label="Stability" hint="Higher = more consistent, lower = more expressive.">
          <div className="flex items-center gap-3">
            <input type="range" min="0" max="1" step="0.05" value={stability}
              onChange={e => { const v = parseFloat(e.target.value); setStability(v); localStorage.setItem('inline_voice_stability', String(v)) }}
              className="flex-1 accent-primary cursor-pointer" />
            <span className="w-8 text-right text-xs font-mono text-muted-foreground">{stability.toFixed(2)}</span>
          </div>
        </SettingsRow>
        <SettingsRow label="Similarity boost" hint="Higher = closer to original voice, lower = more variation.">
          <div className="flex items-center gap-3">
            <input type="range" min="0" max="1" step="0.05" value={similarity}
              onChange={e => { const v = parseFloat(e.target.value); setSimilarity(v); localStorage.setItem('inline_voice_similarity', String(v)) }}
              className="flex-1 accent-primary cursor-pointer" />
            <span className="w-8 text-right text-xs font-mono text-muted-foreground">{similarity.toFixed(2)}</span>
          </div>
        </SettingsRow>
      </SettingsSection>

      <SettingsSection title="Voice behavior">
        <ToggleRow
          label="Voice replies in chat"
          description="Automatically speak AI responses in the workspace chat panel."
          checked={voiceChat}
          onChange={v => { setVoiceChat(v); localStorage.setItem('inline_voice_chat', String(v)) }}
        />
        <ToggleRow
          label="Extension screen reader"
          description="Auto-read AI results aloud in the browser extension."
          checked={screenReader}
          onChange={v => {
            setScreenReader(v)
            localStorage.setItem('inline_screen_reader', String(v))
            const _chrome = (typeof window !== 'undefined' ? (window as unknown as Record<string, unknown>).chrome : undefined) as (undefined | { storage?: { local?: { set: (v: Record<string, unknown>) => void } } })
            if (_chrome?.storage?.local) _chrome.storage.local.set({ inlineScreenReader: String(v) })
          }}
        />
      </SettingsSection>

      <SettingsSection title="AI Copilot">
        <ToggleRow
          label="Context autocomplete"
          description="Ghost-text suggestions in sticky notes."
          checked={autocomp}
          onChange={v => { setAutocomp(v); localStorage.setItem('inline_autocomplete', String(v)) }}
        />
      </SettingsSection>
    </div>
  )
}

// ---------------------------------------------------------------------------
// Extension Config
// ---------------------------------------------------------------------------
function syncBlocklistToChromeExtension(blockedDomains: string[]): void {
  const extId = process.env.NEXT_PUBLIC_CHROME_EXTENSION_ID
  if (!extId || typeof window === 'undefined') return
  const w = window as unknown as {
    chrome?: { runtime?: { sendMessage: (extensionId: string, message: unknown, responseCallback?: () => void) => void } }
  }
  try {
    w.chrome?.runtime?.sendMessage(extId, {
      type: 'INLINE_SYNC_BLOCKLIST',
      payload: { blockedDomains },
    }, () => { /* ignore lastError */ })
  } catch {
    /* not Chrome or extension unavailable */
  }
}

function ExtensionTab() {
  const [blocklist, setBlocklist] = useState<string[]>([])
  const [newDomain, setNewDomain] = useState('')
  const [saved, setSaved] = useState(false)
  const [cleared, setCleared] = useState(false)
  const confirm = useConfirm()
  const toast = useToast()
  const extensionConfigured = Boolean(process.env.NEXT_PUBLIC_CHROME_EXTENSION_ID)

  useEffect(() => {
    try {
      const r = localStorage.getItem('inline_blocklist')
      setBlocklist(r ? JSON.parse(r) : [])
    } catch { setBlocklist([]) }
  }, [])

  function persist(list: string[]) {
    localStorage.setItem('inline_blocklist', JSON.stringify(list))
    syncBlocklistToChromeExtension(list)
    setSaved(true)
    setTimeout(() => setSaved(false), 1800)
  }

  function add() {
    const d = newDomain.trim().toLowerCase().replace(/^https?:\/\//, '').replace(/\/.*$/, '')
    if (!d || blocklist.includes(d)) return
    const next = [...blocklist, d]
    setBlocklist(next); setNewDomain(''); persist(next)
  }

  async function clearLocalData() {
    const ok = await confirm({
      title: 'Clear local Inline preferences?',
      description: 'This clears theme, voice, blocklist, and pins stored in this browser. Your captures on the server are not affected.',
      confirmLabel: 'Clear preferences',
      destructive: true,
    })
    if (!ok) return
    const keys: string[] = []
    for (let i = 0; i < localStorage.length; i++) {
      const k = localStorage.key(i)
      if (k && (k.startsWith('inline_') || k.startsWith('inline-') || k.startsWith('wf-'))) keys.push(k)
    }
    keys.forEach(k => localStorage.removeItem(k))
    setBlocklist([])
    setCleared(true)
    toast.success('Local preferences cleared')
    setTimeout(() => setCleared(false), 2500)
  }

  return (
    <div className="space-y-8">
      <SettingsSection
        title="Domain blocklist"
        description={extensionConfigured
          ? 'Inline disables itself on these domains. Synced to the extension automatically.'
          : 'Inline disables itself on these domains. Set NEXT_PUBLIC_CHROME_EXTENSION_ID to sync this list to the extension, or manage it from the extension panel directly.'}
        action={<SaveBadge saved={saved} />}
      >
        <SettingsRow label="Add domain">
          <div className="flex gap-2">
            <Input value={newDomain} onChange={e => setNewDomain(e.target.value)}
              placeholder="internal.company.com" onKeyDown={e => e.key === 'Enter' && add()} />
            <Button size="sm" onClick={add} className="cursor-pointer gap-1 shrink-0">
              <Plus className="w-3.5 h-3.5" />Add
            </Button>
          </div>
        </SettingsRow>
        {blocklist.map(d => (
          <div key={d} className="flex items-center justify-between px-3 py-2 rounded-lg bg-muted/40 border border-border">
            <div className="flex items-center gap-2 text-sm">
              <Globe className="w-3.5 h-3.5 text-muted-foreground" />
              <span className="font-mono">{d}</span>
            </div>
            <button type="button" onClick={() => { const n = blocklist.filter(b => b !== d); setBlocklist(n); persist(n) }}
              className="text-muted-foreground hover:text-destructive cursor-pointer" aria-label={`Remove ${d}`}>
              <X className="w-3.5 h-3.5" />
            </button>
          </div>
        ))}
        {blocklist.length === 0 && (
          <p className="text-xs text-muted-foreground text-center py-3">No domains blocked.</p>
        )}
      </SettingsSection>

      <SettingsSection title="Extension info">
        <div className="space-y-2 text-sm">
          {[{ label: 'Version', value: '1.1' }, { label: 'Manifest', value: 'MV3' }, { label: 'Storage', value: 'IndexedDB + chrome.storage.local' }].map(r => (
            <div key={r.label} className="flex justify-between">
              <span className="text-muted-foreground">{r.label}</span>
              <span className="font-medium">{r.value}</span>
            </div>
          ))}
        </div>
        <div className="pt-2 flex items-center gap-3">
          <Button
            variant="outline" size="sm"
            className="cursor-pointer gap-2 text-destructive border-destructive/30 hover:bg-destructive/5"
            onClick={clearLocalData}
          >
            <Shield className="w-3.5 h-3.5" />Clear all local data
          </Button>
          {cleared && <span className="text-xs font-medium text-accent">Local preferences cleared</span>}
        </div>
      </SettingsSection>
    </div>
  )
}

// ---------------------------------------------------------------------------
// Page
// ---------------------------------------------------------------------------
function PersonalSettingsPageInner() {
  const searchParams = useSearchParams()
  const [activeTab, setActiveTab] = useState<Tab>('general')
  const workspaceSettingsBase = workspacePath(DEFAULT_WORKSPACES[0]!, 'settings')

  useEffect(() => {
    const t = searchParams.get('tab')
    if (t && PROFILE_TABS.some(x => x.id === t)) setActiveTab(t as Tab)
  }, [searchParams])

  const content: Record<Tab, React.ReactNode> = {
    general:       <GeneralTab />,
    security:      <SecurityTab />,
    appearance:    <AppearanceTab />,
    notifications: <NotificationsTab />,
    'ai-voice':    <AIVoiceTab />,
    extension:     <ExtensionTab />,
    danger:        <AccountDangerTab />,
  }

  const settingsGroups: SettingsNavGroup[] = [
    {
      label: 'Personal',
      items: [
        { id: 'general', label: 'Profile', icon: UserRound },
        { id: 'appearance', label: 'Appearance', icon: Palette },
        { id: 'notifications', label: 'Notifications', icon: Bell },
        { id: 'security', label: 'Security', icon: Shield },
      ],
    },
    {
      label: 'Workspace',
      items: [
        { id: 'ws-general', label: 'General', icon: Settings2, href: workspaceSettingsBase },
        { id: 'ws-library', label: 'Folders and documents', icon: FolderTree, href: `${workspaceSettingsBase}?tab=library` },
        { id: 'ws-members', label: 'Members', icon: UsersRound, href: `${workspaceSettingsBase}?tab=members` },
        { id: 'ws-data', label: 'Export and import', icon: Database, href: `${workspaceSettingsBase}?tab=data` },
      ],
    },
    {
      label: 'Tools',
      items: [
        { id: 'ai-voice', label: 'AI and voice', icon: MessageCircle },
        { id: 'extension', label: 'Extension', icon: Puzzle },
      ],
    },
    {
      label: 'Advanced',
      items: [
        { id: 'danger', label: 'Delete account', icon: Trash2, danger: true },
      ],
    },
  ]

  return (
    <SettingsShell
      groups={settingsGroups}
      activeId={activeTab}
      onSelect={id => setActiveTab(id as Tab)}
      sectionDescriptions={SECTION_DESCRIPTIONS}
      exitHref={workspacePath(DEFAULT_WORKSPACES[0]!, 'dashboard')}
    >
      {content[activeTab]}
    </SettingsShell>
  )
}

export default function PersonalSettingsPage() {
  return (
    <Suspense fallback={<div className="flex h-full items-center justify-center bg-background text-sm text-muted-foreground">Loading settings…</div>}>
      <PersonalSettingsPageInner />
    </Suspense>
  )
}
