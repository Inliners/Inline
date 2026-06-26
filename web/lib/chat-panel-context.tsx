'use client'

import {
  createContext,
  useCallback,
  useContext,
  useMemo,
  useState,
  type ReactNode,
} from 'react'

type ChatPanelContextValue = {
  open: boolean
  setOpen: (v: boolean) => void
  toggle: () => void
  dockLeading: ReactNode
  setDockLeading: (node: ReactNode) => void
  /** Recap document pages embed chat in the right document rail. */
  documentChatMode: boolean
  setDocumentChatMode: (v: boolean) => void
  chatHost: HTMLDivElement | null
  registerChatHost: (el: HTMLDivElement | null) => void
}

const ChatPanelContext = createContext<ChatPanelContextValue | null>(null)

export function ChatPanelProvider({ children }: { children: ReactNode }) {
  const [open, setOpen] = useState(false)
  const [dockLeading, setDockLeadingState] = useState<ReactNode>(null)
  const [documentChatMode, setDocumentChatMode] = useState(false)
  const [chatHost, setChatHost] = useState<HTMLDivElement | null>(null)

  const toggle = useCallback(() => setOpen(o => !o), [])
  const setDockLeading = useCallback((node: ReactNode) => {
    setDockLeadingState(node)
  }, [])
  const registerChatHost = useCallback((el: HTMLDivElement | null) => {
    setChatHost(el)
  }, [])

  const value = useMemo(
    () => ({
      open,
      setOpen,
      toggle,
      dockLeading,
      setDockLeading,
      documentChatMode,
      setDocumentChatMode,
      chatHost,
      registerChatHost,
    }),
    [open, toggle, dockLeading, setDockLeading, documentChatMode, chatHost, registerChatHost],
  )

  return (
    <ChatPanelContext.Provider value={value}>
      {children}
    </ChatPanelContext.Provider>
  )
}

export function useChatPanel() {
  const ctx = useContext(ChatPanelContext)
  if (!ctx) {
    throw new Error('useChatPanel must be used within ChatPanelProvider')
  }
  return ctx
}
