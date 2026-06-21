'use client'

/**
 * Custom notification system for the web app — toasts + confirm dialogs.
 *
 * Replaces window.alert / window.confirm with design-system UI so nothing
 * looks browser-default. Mounted once at the root via <NotificationsProvider>.
 *
 *   const { success, error, info, warning } = useToast()
 *   const confirm = useConfirm()
 *   if (await confirm({ title: 'Delete?', confirmLabel: 'Delete', destructive: true })) { ... }
 */

import * as React from 'react'
import { AnimatePresence, motion } from 'framer-motion'
import { CheckCircle2, AlertCircle, AlertTriangle, Info, X } from 'lucide-react'
import { cn } from '@/lib/utils'
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------
type ToastVariant = 'success' | 'error' | 'warning' | 'info'

interface ToastOptions {
  title: string
  description?: string
  variant?: ToastVariant
  /** ms before auto-dismiss; 0 keeps it until manually closed */
  duration?: number
}

interface ToastRecord extends Required<Omit<ToastOptions, 'description' | 'duration'>> {
  id: number
  description?: string
  duration: number
}

interface ConfirmOptions {
  title: string
  description?: string
  confirmLabel?: string
  cancelLabel?: string
  destructive?: boolean
}

interface ToastApi {
  toast: (opts: ToastOptions) => number
  success: (title: string, description?: string) => number
  error: (title: string, description?: string) => number
  warning: (title: string, description?: string) => number
  info: (title: string, description?: string) => number
  dismiss: (id: number) => void
}

const ToastContext = React.createContext<ToastApi | null>(null)
const ConfirmContext = React.createContext<((o: ConfirmOptions) => Promise<boolean>) | null>(null)

// ---------------------------------------------------------------------------
// Hooks
// ---------------------------------------------------------------------------
export function useToast(): ToastApi {
  const ctx = React.useContext(ToastContext)
  if (!ctx) throw new Error('useToast must be used within <NotificationsProvider>')
  return ctx
}

export function useConfirm() {
  const ctx = React.useContext(ConfirmContext)
  if (!ctx) throw new Error('useConfirm must be used within <NotificationsProvider>')
  return ctx
}

// ---------------------------------------------------------------------------
// Variant styling — muted, accessible, solid surfaces
// ---------------------------------------------------------------------------
const VARIANT: Record<ToastVariant, { icon: React.ElementType; accent: string; ring: string }> = {
  success: { icon: CheckCircle2, accent: 'text-emerald-600 dark:text-emerald-400', ring: 'bg-emerald-500' },
  error: { icon: AlertCircle, accent: 'text-red-600 dark:text-red-400', ring: 'bg-red-500' },
  warning: { icon: AlertTriangle, accent: 'text-amber-600 dark:text-amber-400', ring: 'bg-amber-500' },
  info: { icon: Info, accent: 'text-[#4B83C4]', ring: 'bg-[#4B83C4]' },
}

function ToastCard({ t, onClose }: { t: ToastRecord; onClose: () => void }) {
  const { icon: Icon, accent, ring } = VARIANT[t.variant]
  return (
    <motion.div
      layout
      initial={{ opacity: 0, x: 24, scale: 0.98 }}
      animate={{ opacity: 1, x: 0, scale: 1 }}
      exit={{ opacity: 0, x: 24, scale: 0.98, transition: { duration: 0.18 } }}
      transition={{ type: 'spring', stiffness: 420, damping: 34 }}
      role="status"
      aria-live="polite"
      className="pointer-events-auto relative flex w-full items-start gap-3 overflow-hidden rounded-2xl bg-background py-3 pl-4 pr-9 ring-1 ring-foreground/10 shadow-[0_8px_30px_-12px_rgba(11,23,53,0.25)]"
    >
      <span className={cn('absolute inset-y-2 left-0 w-1 rounded-full', ring)} aria-hidden />
      <Icon className={cn('mt-0.5 size-4 shrink-0', accent)} />
      <div className="min-w-0 flex-1">
        <p className="text-[0.8rem] font-semibold leading-snug text-foreground">{t.title}</p>
        {t.description && (
          <p className="mt-0.5 text-xs leading-relaxed text-muted-foreground">{t.description}</p>
        )}
      </div>
      <button
        type="button"
        onClick={onClose}
        aria-label="Dismiss notification"
        className="absolute right-2 top-2 flex size-6 items-center justify-center rounded-md text-muted-foreground transition-colors hover:bg-muted hover:text-foreground focus-visible:outline-2 focus-visible:outline-offset-1 focus-visible:outline-ring"
      >
        <X className="size-3.5" />
      </button>
    </motion.div>
  )
}

// ---------------------------------------------------------------------------
// Provider
// ---------------------------------------------------------------------------
export function NotificationsProvider({ children }: { children: React.ReactNode }) {
  const [toasts, setToasts] = React.useState<ToastRecord[]>([])
  const timers = React.useRef<Map<number, ReturnType<typeof setTimeout>>>(new Map())
  const idRef = React.useRef(0)

  const dismiss = React.useCallback((id: number) => {
    setToasts(prev => prev.filter(t => t.id !== id))
    const timer = timers.current.get(id)
    if (timer) {
      clearTimeout(timer)
      timers.current.delete(id)
    }
  }, [])

  const toast = React.useCallback(
    (opts: ToastOptions) => {
      const id = ++idRef.current
      const variant = opts.variant ?? 'info'
      const duration = opts.duration ?? (variant === 'error' ? 6000 : 4000)
      setToasts(prev => [...prev, { id, title: opts.title, description: opts.description, variant, duration }])
      if (duration > 0) {
        const timer = setTimeout(() => dismiss(id), duration)
        timers.current.set(id, timer)
      }
      return id
    },
    [dismiss],
  )

  const api = React.useMemo<ToastApi>(
    () => ({
      toast,
      success: (title, description) => toast({ title, description, variant: 'success' }),
      error: (title, description) => toast({ title, description, variant: 'error' }),
      warning: (title, description) => toast({ title, description, variant: 'warning' }),
      info: (title, description) => toast({ title, description, variant: 'info' }),
      dismiss,
    }),
    [toast, dismiss],
  )

  React.useEffect(() => {
    const map = timers.current
    return () => {
      map.forEach(clearTimeout)
      map.clear()
    }
  }, [])

  // ── Confirm dialog state ──
  const [confirmState, setConfirmState] = React.useState<
    (ConfirmOptions & { resolve: (v: boolean) => void }) | null
  >(null)

  const confirm = React.useCallback(
    (opts: ConfirmOptions) =>
      new Promise<boolean>(resolve => {
        setConfirmState({ ...opts, resolve })
      }),
    [],
  )

  const closeConfirm = React.useCallback(
    (value: boolean) => {
      setConfirmState(prev => {
        prev?.resolve(value)
        return null
      })
    },
    [],
  )

  return (
    <ToastContext.Provider value={api}>
      <ConfirmContext.Provider value={confirm}>
        {children}

        {/* Toast viewport — fixed bottom-right, consistent across the app */}
        <div className="pointer-events-none fixed bottom-4 right-4 z-120 flex w-[calc(100%-2rem)] max-w-sm flex-col gap-2">
          <AnimatePresence initial={false}>
            {toasts.map(t => (
              <ToastCard key={t.id} t={t} onClose={() => dismiss(t.id)} />
            ))}
          </AnimatePresence>
        </div>

        {/* Confirm dialog */}
        <Dialog open={!!confirmState} onOpenChange={v => { if (!v) closeConfirm(false) }}>
          {confirmState && (
            <DialogContent showCloseButton={false} className="sm:max-w-104">
              <DialogHeader>
                <DialogTitle>{confirmState.title}</DialogTitle>
                {confirmState.description && (
                  <DialogDescription className="leading-relaxed">
                    {confirmState.description}
                  </DialogDescription>
                )}
              </DialogHeader>
              <div className="mt-1 flex flex-col-reverse gap-2 sm:flex-row sm:justify-end">
                <Button variant="outline" size="sm" onClick={() => closeConfirm(false)}>
                  {confirmState.cancelLabel ?? 'Cancel'}
                </Button>
                <Button
                  size="sm"
                  variant={confirmState.destructive ? 'destructive' : 'default'}
                  onClick={() => closeConfirm(true)}
                  autoFocus
                >
                  {confirmState.confirmLabel ?? 'Confirm'}
                </Button>
              </div>
            </DialogContent>
          )}
        </Dialog>
      </ConfirmContext.Provider>
    </ToastContext.Provider>
  )
}
