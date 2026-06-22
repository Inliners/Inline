'use client'

import { AnimatePresence } from 'framer-motion'
import { usePathname } from 'next/navigation'
import { useSidebar } from '@/lib/sidebar-context'
import { isDocumentEditorPath } from '@/lib/document-editor-view'
import { ChatPanelProvider } from '@/lib/chat-panel-context'
import Sidebar from './Sidebar'
import WorkspaceMainContent from './WorkspaceMainContent'
import CommandPalette from './CommandPalette'
import RightContextPanel from './RightContextPanel'
import WorkspaceChatPanel from './WorkspaceChatPanel'
import WorkspaceActivityPanelToggle from './WorkspaceActivityPanelToggle'
import DocumentEditorChrome from '@/components/documents/DocumentEditorChrome'
import ExtensionAuthSync from './ExtensionAuthSync'

export default function WorkspaceShell({ children }: { children: React.ReactNode }) {
  const { rightPanelOpen } = useSidebar()
  const pathname = usePathname()
  const onDocumentEditor = isDocumentEditorPath(pathname)

  return (
    <ChatPanelProvider>
      <div className="flex h-screen overflow-hidden bg-white">
        <Sidebar />
        <div className="relative flex min-w-0 flex-1 flex-col overflow-hidden">
          {!onDocumentEditor && <WorkspaceActivityPanelToggle />}
          <DocumentEditorChrome />
          <main className="min-h-0 flex-1 min-w-0 overflow-y-auto scrollbar-minimal">
            <WorkspaceMainContent>{children}</WorkspaceMainContent>
          </main>
        </div>

        <AnimatePresence mode="sync">
          {rightPanelOpen && !onDocumentEditor && <RightContextPanel key="right-panel" />}
        </AnimatePresence>

        <CommandPalette />
        <WorkspaceChatPanel />
        <ExtensionAuthSync />
      </div>
    </ChatPanelProvider>
  )
}
