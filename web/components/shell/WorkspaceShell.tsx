'use client'

import { AnimatePresence } from 'framer-motion'
import { useSidebar } from '@/lib/sidebar-context'
import { ChatPanelProvider } from '@/lib/chat-panel-context'
import Sidebar from './Sidebar'
import WorkspaceMainContent from './WorkspaceMainContent'
import CommandPalette from './CommandPalette'
import RightContextPanel from './RightContextPanel'
import WorkspaceChatPanel from './WorkspaceChatPanel'
import WorkspaceActivityPanelToggle from './WorkspaceActivityPanelToggle'
import ExtensionAuthSync from './ExtensionAuthSync'

export default function WorkspaceShell({ children }: { children: React.ReactNode }) {
  const { rightPanelOpen } = useSidebar()

  return (
    <ChatPanelProvider>
      <div className="flex h-screen overflow-hidden bg-white">
        <Sidebar />
        <div className="relative flex min-w-0 flex-1 flex-col overflow-hidden">
          <WorkspaceActivityPanelToggle />
          <main className="min-h-0 flex-1 min-w-0 overflow-y-auto scrollbar-minimal">
            <WorkspaceMainContent>{children}</WorkspaceMainContent>
          </main>
        </div>

        <AnimatePresence mode="sync">
          {rightPanelOpen && <RightContextPanel key="right-panel" />}
        </AnimatePresence>

        <CommandPalette />
        <WorkspaceChatPanel />
        <ExtensionAuthSync />
      </div>
    </ChatPanelProvider>
  )
}
