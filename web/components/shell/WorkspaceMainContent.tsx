'use client'

/**
 * Wrapper for main workspace content. Individual pages control their own
 * max-width so this is intentionally a minimal pass-through to avoid
 * introducing gaps between the sidebar and content.
 */
export default function WorkspaceMainContent({ children }: { children: React.ReactNode }) {
  return (
    <div className="w-full min-w-0">
      {children}
    </div>
  )
}
