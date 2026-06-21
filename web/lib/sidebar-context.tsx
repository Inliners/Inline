'use client'

import { createContext, useContext, useState, useCallback, type ReactNode } from 'react'

interface SidebarContextType {
  collapsed:        boolean
  setCollapsed:     (v: boolean) => void
  toggle:           () => void
  rightPanelOpen:   boolean
  setRightPanelOpen:(v: boolean) => void
  toggleRightPanel: () => void
}

const SidebarContext = createContext<SidebarContextType>({
  collapsed:        false,
  setCollapsed:     () => {},
  toggle:           () => {},
  rightPanelOpen:   false,
  setRightPanelOpen:() => {},
  toggleRightPanel: () => {},
})

export function SidebarProvider({ children }: { children: ReactNode }) {
  const [collapsed, setCollapsedState] = useState(false)
  const [rightPanelOpen, setRightPanelOpenState] = useState(false)

  const setCollapsed = useCallback((v: boolean) => setCollapsedState(v), [])
  const toggle = useCallback(() => setCollapsedState(c => !c), [])
  const setRightPanelOpen = useCallback((v: boolean) => setRightPanelOpenState(v), [])
  const toggleRightPanel = useCallback(() => setRightPanelOpenState(c => !c), [])

  return (
    <SidebarContext.Provider value={{ collapsed, setCollapsed, toggle, rightPanelOpen, setRightPanelOpen, toggleRightPanel }}>
      {children}
    </SidebarContext.Provider>
  )
}

export function useSidebar() {
  return useContext(SidebarContext)
}
