'use client'

import { useEffect, useState } from 'react'
import Link from 'next/link'
import { motion, AnimatePresence } from 'framer-motion'
import { Check, Chrome, Highlighter, MessageCircle, X } from 'lucide-react'
import { cn } from '@/lib/utils'
import {
  isOnboardingComplete,
  loadOnboarding,
  patchOnboarding,
  workspaceHasUserChat,
} from '@/lib/onboarding'

const EASE = [0.22, 1, 0.36, 1] as const

interface Props {
  workspaceId: string
  captureCount: number
}

type Step = {
  id: string
  label: string
  detail: string
  done: boolean
  href?: string
  onAction?: () => void
}

export default function GettingStartedChecklist({ workspaceId, captureCount }: Props) {
  const [hidden, setHidden] = useState(true)
  const [installClicked, setInstallClicked] = useState(false)
  const [hasChat, setHasChat] = useState(false)

  useEffect(() => {
    const state = loadOnboarding(workspaceId)
    setInstallClicked(!!state.installClicked)
    setHasChat(workspaceHasUserChat(workspaceId))
    setHidden(!!state.dismissed || isOnboardingComplete(workspaceId, captureCount))

    const onStorage = () => {
      setHasChat(workspaceHasUserChat(workspaceId))
      if (isOnboardingComplete(workspaceId, captureCount)) {
        setHidden(true)
      }
    }
    window.addEventListener('storage', onStorage)
    window.addEventListener('inline-folder-docs-changed', onStorage)
    return () => {
      window.removeEventListener('storage', onStorage)
      window.removeEventListener('inline-folder-docs-changed', onStorage)
    }
  }, [workspaceId, captureCount])

  if (hidden) return null

  const steps: Step[] = [
    {
      id: 'install',
      label: 'Install the extension',
      detail: 'Pin Inline to Chrome so captures sync while you read.',
      done: installClicked,
      href: '/install',
      onAction: () => {
        patchOnboarding(workspaceId, { installClicked: true })
        setInstallClicked(true)
      },
    },
    {
      id: 'capture',
      label: 'Highlight your first article',
      detail: 'Save a highlight or sticky note on any page.',
      done: captureCount > 0,
      href: '/install',
    },
    {
      id: 'ask',
      label: 'Ask Inline a question',
      detail: 'Open Ask Inline at the bottom and query your captures.',
      done: hasChat,
    },
  ]

  const completed = steps.filter(s => s.done).length
  const allDone = completed === steps.length

  function dismiss() {
    patchOnboarding(workspaceId, { dismissed: true })
    setHidden(true)
  }

  return (
    <AnimatePresence>
      <motion.div
        initial={{ opacity: 0, y: 12 }}
        animate={{ opacity: 1, y: 0 }}
        exit={{ opacity: 0, y: -8 }}
        transition={{ duration: 0.4, ease: EASE }}
        className="rounded-2xl border border-border bg-card p-5 shadow-sm"
      >
        <div className="flex items-start justify-between gap-3">
          <div>
            <p className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
              Getting started
            </p>
            <h2 className="mt-1 text-lg font-semibold tracking-tight text-foreground">
              {allDone ? 'You\u2019re all set' : 'Turn reading into something you can use'}
            </h2>
            <p className="mt-1 text-sm text-muted-foreground">
              {allDone
                ? 'Your workspace is ready. Keep capturing — briefs and answers compound from here.'
                : `${completed} of ${steps.length} complete`}
            </p>
          </div>
          <button
            type="button"
            onClick={dismiss}
            className="rounded-lg p-1.5 text-muted-foreground hover:bg-accent/50 hover:text-foreground transition-colors cursor-pointer"
            aria-label="Dismiss checklist"
          >
            <X className="h-4 w-4" />
          </button>
        </div>

        <ul className="mt-5 space-y-3">
          {steps.map((step, i) => {
            const Icon = step.id === 'install' ? Chrome : step.id === 'capture' ? Highlighter : MessageCircle
            const row = (
              <div className="flex items-start gap-3">
                <span
                  className={cn(
                    'mt-0.5 flex h-6 w-6 shrink-0 items-center justify-center rounded-full border text-xs font-semibold transition-colors',
                    step.done
                      ? 'border-primary bg-primary text-primary-foreground'
                      : 'border-border bg-muted text-muted-foreground',
                  )}
                >
                  {step.done ? <Check className="h-3.5 w-3.5" /> : i + 1}
                </span>
                <div className="min-w-0 flex-1">
                  <p className={cn('text-sm font-medium', step.done ? 'text-muted-foreground line-through' : 'text-foreground')}>
                    {step.label}
                  </p>
                  <p className="mt-0.5 text-xs text-muted-foreground">{step.detail}</p>
                </div>
                <Icon className="h-4 w-4 shrink-0 text-muted-foreground/60" aria-hidden />
              </div>
            )

            return (
              <motion.li
                key={step.id}
                initial={{ opacity: 0, y: 6 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: i * 0.06, duration: 0.35, ease: EASE }}
              >
                {step.href && !step.done ? (
                  <Link
                    href={step.href}
                    onClick={step.onAction}
                    className="block rounded-xl border border-transparent px-2 py-2 -mx-2 hover:border-border hover:bg-accent/30 transition-colors"
                  >
                    {row}
                  </Link>
                ) : (
                  <div className="px-2 py-2 -mx-2">{row}</div>
                )}
              </motion.li>
            )
          })}
        </ul>

        {allDone && (
          <motion.button
            type="button"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            onClick={dismiss}
            className="mt-4 text-sm font-medium text-primary hover:underline cursor-pointer"
          >
            Dismiss checklist
          </motion.button>
        )}
      </motion.div>
    </AnimatePresence>
  )
}
