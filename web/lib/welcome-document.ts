import {
  createFolderDocument,
  getDocumentsForFolder,
  loadFolderDocuments,
  upsertFolderDocument,
  type FolderDocument,
} from '@/lib/workspace-library'
import {
  getRootFolders,
  loadWorkspaceFolders,
  type WorkspaceFolder,
} from '@/lib/workspace-folders'
import { patchOnboarding, loadOnboarding } from '@/lib/onboarding'

const WELCOME_TITLE = 'Welcome to Inline'
const WELCOME_DOC_MARKER = 'inline-welcome-doc'

const WELCOME_HTML = `<h2>Welcome — here&apos;s how Inline works</h2>
<p>You opened a workspace. This short guide walks you through turning scattered reading into something you can actually use.</p>
<h3>1. Install the extension</h3>
<p>Add Inline to Chrome from the <strong>Install</strong> page, then pin it to your toolbar. The extension is how captures land while you read.</p>
<h3>2. Highlight your first page</h3>
<p>Visit any article, select text, and highlight or add a sticky note. Your capture syncs here automatically when you&apos;re signed in.</p>
<h3>3. Open your Auto-Recap</h3>
<p>Inline composes a source-backed brief for each page you annotate. Find it under <strong>Captures</strong> or in your library.</p>
<h3>4. Ask a question</h3>
<p>Use <strong>Ask Inline</strong> at the bottom of your workspace. Every answer cites the highlights and notes you saved — not the open web.</p>
<p data-inline-welcome="true"><em>You can delete this document anytime. It&apos;s just here to get you started.</em></p>`

function findWelcomeDoc(workspaceId: string): FolderDocument | undefined {
  return loadFolderDocuments().find(
    d => d.workspaceId === workspaceId && d.content.includes('data-inline-welcome'),
  )
}

function ensureRootFolder(workspaceId: string): WorkspaceFolder {
  const folders = loadWorkspaceFolders()
  const roots = getRootFolders(folders, workspaceId)
  if (roots[0]) return roots[0]
  const id = `folder-welcome-${workspaceId}`
  const folder: WorkspaceFolder = { id, workspaceId, name: 'Library', parentId: null }
  const next = [...folders, folder]
  localStorage.setItem('inline-folders', JSON.stringify(next))
  window.dispatchEvent(new CustomEvent('inline-folders-changed'))
  return folder
}

/** Seed a one-time welcome document in the user's workspace library. */
export function ensureWelcomeDocument(workspaceId: string): void {
  if (typeof window === 'undefined') return
  const state = loadOnboarding(workspaceId)
  if (state.welcomeSeeded || findWelcomeDoc(workspaceId)) {
    if (!state.welcomeSeeded) patchOnboarding(workspaceId, { welcomeSeeded: true })
    return
  }

  const folder = ensureRootFolder(workspaceId)
  const existing = getDocumentsForFolder(workspaceId, folder.id).find(d => d.title === WELCOME_TITLE)
  if (existing) {
    patchOnboarding(workspaceId, { welcomeSeeded: true })
    return
  }

  const doc = createFolderDocument(workspaceId, folder.id, WELCOME_TITLE)
  doc.content = WELCOME_HTML
  doc.updatedAt = Date.now()
  upsertFolderDocument(doc)
  patchOnboarding(workspaceId, { welcomeSeeded: true })
}

export { WELCOME_TITLE, WELCOME_DOC_MARKER }
