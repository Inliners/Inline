'use client'

import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
  type ReactNode,
} from 'react'
import { usePathname, useRouter } from 'next/navigation'
import {
  GUIDE_RESTART_EVENT,
  GUIDE_STEPS,
  completeGuide,
  guideStepByIndex,
  isDashboardPath,
  loadGuideState,
  patchGuideState,
  resetGuide,
  resolveGuideDocumentHref,
  type GuideStep,
} from '@/lib/inline-guide'
import { isDocumentEditorPath } from '@/lib/document-editor-view'
import { resolveWorkspaceIdFromBrowserPath, workspacePath } from '@/lib/workspace-routes'
import { useSidebar } from '@/lib/sidebar-context'
import { useChatPanel } from '@/lib/chat-panel-context'

type InlineGuideContextValue = {
  active: boolean
  paused: boolean
  stepIndex: number
  step: GuideStep | undefined
  workspaceId: string
  totalSteps: number
  next: () => void
  back: () => void
  pause: () => void
  resume: () => void
  skipTour: () => void
  dismissGuide: () => void
  start: () => void
  openChatPanel: () => void
}

const InlineGuideContext = createContext<InlineGuideContextValue | null>(null)

function routeForStep(workspaceId: string, step: GuideStep): string | null {
  if (step.navigateToGuideDoc) {
    return resolveGuideDocumentHref(workspaceId)
  }
  switch (step.route) {
    case 'dashboard':
      return workspacePath(workspaceId, 'dashboard')
    case 'history':
      return workspacePath(workspaceId, 'history')
    case 'analytics':
      return workspacePath(workspaceId, 'analytics')
    case 'settings':
      return workspacePath(workspaceId, 'settings')
    default:
      return null
  }
}

export function InlineGuideProvider({ children }: { children: ReactNode }) {
  const pathname = usePathname()
  const router = useRouter()
  const workspaceId = resolveWorkspaceIdFromBrowserPath(pathname)
  const { collapsed, setCollapsed } = useSidebar()
  const { setOpen: setChatOpen } = useChatPanel()

  const [active, setActive] = useState(false)
  const [paused, setPaused] = useState(false)
  const [stepIndex, setStepIndex] = useState(0)
  const [hydrated, setHydrated] = useState(false)

  const step = guideStepByIndex(stepIndex)

  const syncFromStorage = useCallback(() => {
    const state = loadGuideState(workspaceId)
    setPaused(!!state.guidePaused)
    setStepIndex(state.guideStepIndex ?? 0)
    if (state.guideCompleted) {
      setActive(false)
    }
  }, [workspaceId])

  useEffect(() => {
    syncFromStorage()
    setHydrated(true)
  }, [syncFromStorage, workspaceId])

  const start = useCallback(() => {
    resetGuide(workspaceId)
    setStepIndex(0)
    setPaused(false)
    setActive(true)
    router.push(workspacePath(workspaceId, 'dashboard'))
  }, [router, workspaceId])

  useEffect(() => {
    const onRestart = () => start()
    window.addEventListener(GUIDE_RESTART_EVENT, onRestart)
    return () => window.removeEventListener(GUIDE_RESTART_EVENT, onRestart)
  }, [start])

  useEffect(() => {
    if (!hydrated) return
    const state = loadGuideState(workspaceId)
    if (state.guideCompleted || state.guidePaused) return

    const idx = state.guideStepIndex ?? 0
    if (idx === 0 && !isDashboardPath(pathname)) return

    setActive(true)
    setPaused(false)
    setStepIndex(idx)
  }, [hydrated, pathname, workspaceId])

  useEffect(() => {
    if (!active || paused || !step) return
    if (step.id === 'auto-recap' || step.id === 'ask-inline') return
    if (isDocumentEditorPath(pathname)) {
      setPaused(true)
      setActive(false)
      patchGuideState(workspaceId, { guidePaused: true, guideStepIndex: stepIndex })
    }
  }, [active, paused, pathname, step, stepIndex, workspaceId])

  useEffect(() => {
    if (!hydrated || step?.id !== 'ask-inline') return
    const state = loadGuideState(workspaceId)
    if (!state.guidePaused) return
    if (isDashboardPath(pathname)) {
      setPaused(false)
      setActive(true)
      patchGuideState(workspaceId, { guidePaused: false })
    }
  }, [hydrated, pathname, step?.id, workspaceId])

  useEffect(() => {
    if (!active || paused || !step?.target) return
    if (!step.target.startsWith('nav-') && step.target !== 'settings-page') return
    if (collapsed) setCollapsed(false)
  }, [active, collapsed, paused, setCollapsed, step?.target])

  const navigateForStep = useCallback((targetStep: GuideStep) => {
    const href = routeForStep(workspaceId, targetStep)
    if (href && pathname !== href) {
      router.push(href)
    }
  }, [pathname, router, workspaceId])

  const goToStep = useCallback((index: number) => {
    const clamped = Math.max(0, Math.min(index, GUIDE_STEPS.length - 1))
    const targetStep = guideStepByIndex(clamped)
    if (!targetStep) return

    if (targetStep.id === 'auto-recap' && !resolveGuideDocumentHref(workspaceId)) {
      const skipTo = GUIDE_STEPS.findIndex(s => s.id === 'ask-inline')
      const nextIdx = skipTo >= 0 ? skipTo : clamped
      const askStep = guideStepByIndex(skipTo)
      if (askStep) {
        setChatOpen(false)
        navigateForStep(askStep)
      }
      setStepIndex(nextIdx)
      patchGuideState(workspaceId, { guideStepIndex: nextIdx })
      return
    }

    if (targetStep.id === 'ask-inline') {
      setChatOpen(false)
    }
    navigateForStep(targetStep)
    setStepIndex(clamped)
    patchGuideState(workspaceId, { guideStepIndex: clamped })
  }, [navigateForStep, setChatOpen, workspaceId])

  const next = useCallback(() => {
    const current = guideStepByIndex(stepIndex)
    if (current?.id === 'finish') {
      completeGuide(workspaceId)
      setActive(false)
      setPaused(false)
      router.push(workspacePath(workspaceId, 'dashboard'))
      return
    }

    const nextIndex = stepIndex + 1
    if (nextIndex >= GUIDE_STEPS.length) {
      completeGuide(workspaceId)
      setActive(false)
      return
    }

    goToStep(nextIndex)
  }, [goToStep, router, stepIndex, workspaceId])

  useEffect(() => {
    if (!active || paused || step?.id !== 'ask-inline') return
    setChatOpen(false)
  }, [active, paused, setChatOpen, step?.id])

  const back = useCallback(() => {
    if (stepIndex > 0) goToStep(stepIndex - 1)
  }, [goToStep, stepIndex])

  const pause = useCallback(() => {
    setPaused(true)
    setActive(false)
    patchGuideState(workspaceId, { guidePaused: true, guideStepIndex: stepIndex })
  }, [stepIndex, workspaceId])

  const resume = useCallback(() => {
    setPaused(false)
    setActive(true)
    patchGuideState(workspaceId, { guidePaused: false, guideStepIndex: stepIndex })
    const current = guideStepByIndex(stepIndex)
    if (current) navigateForStep(current)
  }, [navigateForStep, stepIndex, workspaceId])

  const skipTour = useCallback(() => {
    pause()
  }, [pause])

  const dismissGuide = useCallback(() => {
    completeGuide(workspaceId)
    setPaused(false)
    setActive(false)
  }, [workspaceId])

  const openChatPanel = useCallback(() => {
    setChatOpen(true)
  }, [setChatOpen])

  const value = useMemo(
    () => ({
      active,
      paused,
      stepIndex,
      step,
      workspaceId,
      totalSteps: GUIDE_STEPS.length,
      next,
      back,
      pause,
      resume,
      skipTour,
      dismissGuide,
      start,
      openChatPanel,
    }),
    [
      active,
      back,
      dismissGuide,
      next,
      openChatPanel,
      pause,
      resume,
      skipTour,
      start,
      step,
      stepIndex,
      workspaceId,
    ],
  )

  return (
    <InlineGuideContext.Provider value={value}>
      {children}
    </InlineGuideContext.Provider>
  )
}

export function useInlineGuide() {
  const ctx = useContext(InlineGuideContext)
  if (!ctx) {
    throw new Error('useInlineGuide must be used within InlineGuideProvider')
  }
  return ctx
}

export function useInlineGuideOptional() {
  return useContext(InlineGuideContext)
}

export function restartInlineGuide() {
  if (typeof window === 'undefined') return
  window.dispatchEvent(new CustomEvent(GUIDE_RESTART_EVENT))
}
