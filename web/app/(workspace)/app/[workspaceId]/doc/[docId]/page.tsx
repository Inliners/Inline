'use client'

import { useEffect, useRef, useState } from 'react'
import { useParams, useRouter } from 'next/navigation'
import {
  MoreHorizontal, Share2, Loader2, ChevronRight,
  ExternalLink, Trash2, Copy, ArrowLeft,
} from 'lucide-react'
import { getDocumentById, upsertFolderDocument, deleteFolderDocument, type FolderDocument } from '@/lib/workspace-library'
import { loadWorkspaceFolders } from '@/lib/workspace-folders'
import { getWorkspaceName } from '@/lib/workspaces'
import FolderDocumentEditor from '@/components/documents/FolderDocumentEditor'
import { cn } from '@/lib/utils'
import { motion, AnimatePresence } from 'framer-motion'

export default function DocPage() {
  const { workspaceId, docId } = useParams<{ workspaceId: string; docId: string }>()
  const router = useRouter()

  const [doc,       setDoc]       = useState<FolderDocument | null>(null)
  const [title,     setTitle]     = useState('')
  const [saved,     setSaved]     = useState(false)
  const [loading,   setLoading]   = useState(true)
  const [menuOpen,  setMenuOpen]  = useState(false)
  const [copied,    setCopied]    = useState(false)
  const [folderName, setFolderName] = useState('Folder')
  const menuRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    const d = getDocumentById(docId)
    if (!d) { router.replace(`/app/${workspaceId}/dashboard`); return }
    setDoc(d); setTitle(d.title); setLoading(false)
    const folders = loadWorkspaceFolders()
    const folder = folders.find(f => f.id === d.folderId)
    if (folder) setFolderName(folder.name)
  }, [docId, workspaceId, router])

  useEffect(() => {
    function onDown(e: MouseEvent) {
      if (menuRef.current && !menuRef.current.contains(e.target as Node)) setMenuOpen(false)
    }
    document.addEventListener('mousedown', onDown)
    return () => document.removeEventListener('mousedown', onDown)
  }, [])

  function persist(nextTitle: string, nextContent: string) {
    if (!doc) return
    const updated: FolderDocument = { ...doc, title: nextTitle.trim() || 'Untitled', content: nextContent, updatedAt: Date.now() }
    setDoc(updated); upsertFolderDocument(updated)
    setSaved(true); setTimeout(() => setSaved(false), 1400)
  }

  function handleContentChange(html: string) { persist(title, html) }
  function handleTitleBlur()                  { persist(title, doc?.content ?? '') }

  function handleDelete() {
    if (!doc) return
    deleteFolderDocument(doc.id)
    router.replace(`/app/${workspaceId}/folder/${doc.folderId}`)
  }

  function handleDuplicate() {
    if (!doc) return
    const now = Date.now()
    const copy: FolderDocument = { ...doc, id: `doc-${now}-${Math.random().toString(36).slice(2, 7)}`, title: doc.title + ' (copy)', createdAt: now, updatedAt: now }
    upsertFolderDocument(copy)
    router.push(`/app/${workspaceId}/doc/${copy.id}`)
  }

  if (loading) return (
    <div className="flex items-center justify-center h-40">
      <Loader2 className="w-5 h-5 animate-spin text-muted-foreground" />
    </div>
  )
  if (!doc) return null

  const displayTitle   = title.trim() || 'Untitled'
  const workspaceName  = getWorkspaceName(workspaceId)

  return (
    <div className="min-h-full bg-background">

      {/* ── Floating actions (top-right, no sticky bar) ── */}
      <div className="fixed top-3 right-4 flex items-center gap-1.5 z-30">
        <span className={cn('text-[11px] text-slate-400 transition-opacity duration-300 mr-1', saved ? 'opacity-100' : 'opacity-0')}>
          Saved
        </span>
        <button
          type="button"
          className="h-7 px-3 rounded-lg text-xs font-medium text-slate-500 border border-slate-200 hover:border-slate-300 hover:text-slate-900 transition-colors cursor-pointer flex items-center gap-1.5"
          onClick={async () => {
            try {
              await navigator.clipboard.writeText(window.location.href)
              setCopied(true)
              setTimeout(() => setCopied(false), 1800)
            } catch { /* clipboard unavailable */ }
          }}
        >
          <Share2 className="w-3 h-3" />
          {copied ? 'Copied' : 'Share'}
        </button>
        <div className="relative" ref={menuRef}>
          <button
            type="button"
            onClick={() => setMenuOpen(v => !v)}
            className={cn(
              'w-7 h-7 flex items-center justify-center rounded-lg border transition-colors cursor-pointer',
              menuOpen
                ? 'bg-slate-100 border-slate-300 text-slate-900'
                : 'border-slate-200 text-slate-500 hover:text-slate-900 hover:border-slate-300 hover:bg-slate-50',
            )}
          >
            <MoreHorizontal className="w-3.5 h-3.5" />
          </button>
          <AnimatePresence>
            {menuOpen && (
              <motion.div
                initial={{ opacity: 0, scale: 0.96, y: -4 }}
                animate={{ opacity: 1, scale: 1, y: 0 }}
                exit={{ opacity: 0, scale: 0.96, y: -4 }}
                transition={{ duration: 0.1 }}
                className="absolute top-full right-0 mt-1.5 w-48 rounded-xl border border-slate-200 bg-white py-1 z-50"
              >
                {[
                  { icon: ExternalLink, label: 'Open in folder', action: () => router.push(`/app/${workspaceId}/folder/${doc.folderId}`) },
                  { icon: Copy,         label: 'Duplicate',      action: handleDuplicate },
                  { icon: Trash2,       label: 'Delete',         action: handleDelete, danger: true },
                ].map(item => (
                  <button
                    key={item.label}
                    type="button"
                    onClick={() => { item.action(); setMenuOpen(false) }}
                    className={cn(
                      'w-full flex items-center gap-2.5 px-3 py-2 text-sm transition-colors cursor-pointer text-left',
                      item.danger ? 'text-red-500 hover:bg-red-50' : 'text-slate-700 hover:bg-slate-50',
                    )}
                  >
                    <item.icon className="w-3.5 h-3.5 shrink-0" />
                    {item.label}
                  </button>
                ))}
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      </div>

      {/* ── Content ── */}
      <div className="overflow-y-auto scrollbar-minimal">
        <div className="max-w-3xl mx-auto pt-14 pb-40" style={{ paddingLeft: 80, paddingRight: 80 }}>

          {/* 1. Breadcrumb */}
          <div className="flex items-center gap-2 mb-2">
            <span className="text-sm font-medium text-slate-400">{workspaceName}</span>
            <ChevronRight className="w-3.5 h-3.5 text-slate-300 shrink-0" />
            <span className="text-sm font-medium text-slate-400">{folderName}</span>
            <ChevronRight className="w-3.5 h-3.5 text-slate-300 shrink-0" />
            <span className="text-sm font-medium text-slate-600">{displayTitle}</span>
          </div>

          {/* 2. Main Title — editable */}
          <input
            value={title}
            onChange={e => setTitle(e.target.value)}
            onBlur={handleTitleBlur}
            className="w-full text-3xl font-semibold text-slate-900 tracking-tight leading-none mb-2 bg-transparent border-none outline-none placeholder:text-slate-200"
            placeholder="Untitled"
          />

          {/* 3. Back navigation */}
          <button
            type="button"
            onClick={() => router.push(`/app/${workspaceId}/folder/${doc.folderId}`)}
            className="inline-flex items-center gap-1.5 text-sm font-medium text-slate-500 hover:text-slate-900 transition-colors mt-3 mb-8 cursor-pointer w-max"
          >
            <ArrowLeft className="w-3.5 h-3.5" />
            All documents in {folderName}
          </button>

          {/* TipTap editor — borderless */}
          <FolderDocumentEditor
            content={doc.content}
            onChange={handleContentChange}
          />
        </div>
      </div>
    </div>
  )
}
