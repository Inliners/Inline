'use client'

import { useEditor, EditorContent, type Editor } from '@tiptap/react'
import { BubbleMenu } from '@tiptap/react/menus'
import StarterKit from '@tiptap/starter-kit'
import Heading from '@tiptap/extension-heading'
import TaskList from '@tiptap/extension-task-list'
import TaskItem from '@tiptap/extension-task-item'
import { Table } from '@tiptap/extension-table'
import { TableRow } from '@tiptap/extension-table-row'
import { TableCell } from '@tiptap/extension-table-cell'
import { TableHeader } from '@tiptap/extension-table-header'
import { Image } from '@tiptap/extension-image'
import { Underline } from '@tiptap/extension-underline'
import { useEffect, useRef, useState, useCallback, useMemo } from 'react'
import { cn } from '@/lib/utils'
import {
  Heading1, Heading2, Heading3,
  Plus, GripVertical, ChevronRight, Link2,
  ArrowLeft, Search, List, ListOrdered, AlignLeft,
  Quote, Code, Minus, CheckSquare, Type,
  Table as TableIcon, ImageIcon,
  BetweenVerticalStart, BetweenVerticalEnd,
  BetweenHorizontalStart, BetweenHorizontalEnd,
  Trash2,
} from 'lucide-react'
import { motion, AnimatePresence } from 'framer-motion'
import './editor-content.css'
import { RecapParagraph } from './recap-paragraph'
import { RecapBulletList } from './recap-bullet-list'
import { RecapHeading } from './recap-heading'
import { normalizeRecapEntryTimes } from '@/lib/recap-format'

/* ─── Props ─── */
interface Props {
  content:   string
  onChange:  (html: string) => void
  className?: string
  readOnly?: boolean
  /** Preserve recap entry anchor attributes in the editor. */
  recapMode?: boolean
}

/* ─── Handle state ─── */
interface HandleState {
  top:     number
  left:    number
  blockEl: HTMLElement
}

/* ─── Slash command state ─── */
interface SlashState {
  open:    boolean
  query:   string
  top:     number
  left:    number
  fromPos: number
}

/* ─── Menus ─── */
const MENU_MOTION = {
  initial:    { opacity: 0, scale: 0.96, y: -4 },
  animate:    { opacity: 1, scale: 1,    y: 0  },
  exit:       { opacity: 0, scale: 0.96, y: -4 },
  transition: { duration: 0.1, ease: 'easeOut' as const },
}

const MENU_PANEL = 'rounded-xl border border-slate-200 bg-white shadow-sm dark:border-border dark:bg-popover dark:text-popover-foreground'
const MENU_ROW = 'text-foreground hover:bg-slate-50 dark:hover:bg-muted transition-colors cursor-pointer'
const MENU_SEP = 'bg-slate-100 dark:bg-border'
const MENU_HANDLE_BTN = 'w-6 h-6 flex items-center justify-center rounded-md text-slate-400 hover:text-slate-700 hover:bg-slate-100 dark:text-muted-foreground dark:hover:text-foreground dark:hover:bg-muted transition-colors cursor-pointer'
const MENU_ICON_TILE = 'rounded-lg border border-slate-200 flex items-center justify-center shrink-0 bg-white dark:border-border dark:bg-secondary dark:group-hover:border-border'
const MENU_STYLE_TILE = 'flex items-center justify-center w-12 h-11 rounded-lg border border-slate-200 text-muted-foreground hover:bg-slate-50 hover:text-foreground dark:border-border dark:hover:bg-muted transition-colors cursor-pointer'
const MENU_STYLE_TILE_ACTIVE = 'bg-slate-100 border-slate-300 text-foreground dark:bg-muted dark:border-border'
const BUBBLE_BAR = 'flex items-center gap-0.5 rounded-xl border border-slate-200 bg-white px-1.5 py-1 text-sm shadow-sm dark:border-border dark:bg-popover dark:text-popover-foreground'
const BUBBLE_DIVIDER = 'w-px h-4 bg-slate-200 dark:bg-border mx-0.5'
const BUBBLE_BTN = (active: boolean) => cn(
  'w-7 h-7 flex items-center justify-center rounded-lg text-xs transition-colors cursor-pointer',
  active
    ? 'bg-slate-100 text-foreground dark:bg-muted'
    : 'text-muted-foreground hover:bg-slate-50 hover:text-foreground dark:hover:bg-muted dark:hover:text-foreground',
)
const BUBBLE_ICON_BTN = 'w-8 h-8 flex items-center justify-center rounded-lg text-muted-foreground hover:bg-slate-50 hover:text-foreground dark:hover:bg-muted dark:hover:text-foreground cursor-pointer'

function decodeHtmlEntities(value: string): string {
  if (typeof window === 'undefined') return value
  const textarea = document.createElement('textarea')
  textarea.innerHTML = value
  return textarea.value
}

function normalizeEditorContent(value: string, recapMode = false): string {
  const trimmed = value.trim()
  if (!trimmed) return value
  const looksLikeEscapedHtml =
    /&lt;(p|h[1-6]|ul|ol|li|blockquote|pre|table|img|div|br)\b/i.test(trimmed) ||
    /&lt;\/(p|h[1-6]|ul|ol|li|blockquote|pre|table|div)&gt;/i.test(trimmed)
  const decoded = looksLikeEscapedHtml ? decodeHtmlEntities(value) : value
  return recapMode ? normalizeRecapEntryTimes(decoded) : decoded
}

/* ─── Insert-block catalogue ─── */
type InsertItem = {
  section: string
  Icon:    React.ElementType
  label:   string
  desc:    string
  action:  (e: Editor) => void
}

function buildInsertItems(onPickImage: (e: Editor) => void): InsertItem[] {
  return [
    { section: 'Text',    Icon: AlignLeft,    label: 'Paragraph',      desc: 'Plain text',                 action: e => e.chain().focus().setParagraph().run() },
    { section: 'Text',    Icon: Heading1,     label: 'Heading 1',      desc: 'Big section heading',        action: e => e.chain().focus().setHeading({ level: 1 }).run() },
    { section: 'Text',    Icon: Heading2,     label: 'Heading 2',      desc: 'Medium section heading',     action: e => e.chain().focus().setHeading({ level: 2 }).run() },
    { section: 'Text',    Icon: Heading3,     label: 'Heading 3',      desc: 'Small section heading',      action: e => e.chain().focus().setHeading({ level: 3 }).run() },
    { section: 'Lists',   Icon: List,         label: 'Bulleted list',  desc: 'Unordered bullet list',      action: e => e.chain().focus().toggleBulletList().run() },
    { section: 'Lists',   Icon: ListOrdered,  label: 'Numbered list',  desc: 'Ordered numbered list',      action: e => e.chain().focus().toggleOrderedList().run() },
    { section: 'Lists',   Icon: Minus,        label: 'Dash list',      desc: 'List with dash markers',     action: e => e.chain().focus().toggleBulletList().run() },
    { section: 'Lists',   Icon: CheckSquare,  label: 'Task list',      desc: 'Checkbox to-do list',        action: e => e.chain().focus().toggleTaskList().run() },
    { section: 'Media',   Icon: TableIcon,    label: 'Table',          desc: 'Insert a data table',        action: e => e.chain().focus().insertTable({ rows: 3, cols: 3, withHeaderRow: true }).run() },
    { section: 'Media',   Icon: ImageIcon,    label: 'Image',          desc: 'Upload or paste an image',   action: onPickImage },
    { section: 'Quote',   Icon: Quote,        label: 'Quote block',    desc: 'Highlighted blockquote',     action: e => e.chain().focus().toggleBlockquote().run() },
    { section: 'Quote',   Icon: Code,         label: 'Code block',     desc: 'Multi-line code snippet',    action: e => e.chain().focus().toggleCodeBlock().run() },
    { section: 'Quote',   Icon: Type,         label: 'Inline code',    desc: 'Monospace inline code',      action: e => e.chain().focus().toggleCode().run() },
    { section: 'Quote',   Icon: Minus,        label: 'Divider',        desc: 'Horizontal rule',            action: e => e.chain().focus().setHorizontalRule().run() },
  ]
}

/* ─── Style options (for Paragraph style submenu) ─── */
const STYLE_OPTS = [
  { Icon: AlignLeft,  label: 'T',  title: 'Text',      action: (e: Editor) => e.chain().focus().setParagraph().run(),             active: (e: Editor) => e.isActive('paragraph') && !e.isActive('heading') },
  { Icon: Heading1,   label: 'H₁', title: 'Heading 1', action: (e: Editor) => e.chain().focus().setHeading({ level: 1 }).run(), active: (e: Editor) => e.isActive('heading', { level: 1 }) },
  { Icon: Heading2,   label: 'H₂', title: 'Heading 2', action: (e: Editor) => e.chain().focus().setHeading({ level: 2 }).run(), active: (e: Editor) => e.isActive('heading', { level: 2 }) },
  { Icon: Heading3,   label: 'H₃', title: 'Heading 3', action: (e: Editor) => e.chain().focus().setHeading({ level: 3 }).run(), active: (e: Editor) => e.isActive('heading', { level: 3 }) },
]
const LIST_OPTS = [
  { Icon: List,        label: '•=',  title: 'Bullet',  action: (e: Editor) => e.chain().focus().toggleBulletList().run() },
  { Icon: ListOrdered, label: '1=',  title: 'Number',  action: (e: Editor) => e.chain().focus().toggleOrderedList().run() },
  { Icon: CheckSquare, label: '☐=',  title: 'Task',    action: (e: Editor) => e.chain().focus().toggleTaskList().run() },
]
const QUOTE_OPTS = [
  { Icon: Quote,  label: '"',  title: 'Quote', action: (e: Editor) => e.chain().focus().toggleBlockquote().run() },
  { Icon: Code,   label: '<>', title: 'Code',  action: (e: Editor) => e.chain().focus().toggleCodeBlock().run() },
  { Icon: Minus,  label: '—',  title: 'Rule',  action: (e: Editor) => e.chain().focus().setHorizontalRule().run() },
]

/** Move selection into the hovered block so block-menu commands target the right node. */
function focusSelectionInBlock(editor: Editor, blockEl: HTMLElement | null) {
  if (!blockEl) {
    editor.chain().focus().run()
    return
  }
  try {
    const view = editor.view
    const pos = view.posAtDOM(blockEl, 0)
    if (pos == null || pos < 0) {
      editor.chain().focus().run()
      return
    }
    const $pos = editor.state.doc.resolve(pos)
    let d = $pos.depth
    while (d > 0 && !$pos.node(d).isTextblock) d--
    const start = d > 0 ? $pos.start(d) : pos
    const end = d > 0 ? $pos.end(d) : pos + 1
    /* Empty block: use start; otherwise place caret after first character */
    const anchor = end <= start + 1 ? start : Math.min(start + 1, end - 1)
    editor.chain().focus().setTextSelection(anchor).run()
  } catch {
    editor.chain().focus().run()
  }
}

/* ─────────────────────────────────────────────────────────────────────────── */
export default function FolderDocumentEditor({ content, onChange, className, readOnly = false, recapMode = false }: Props) {
  const wrapperRef      = useRef<HTMLDivElement>(null)
  const lastContent     = useRef(normalizeEditorContent(content, recapMode))
  const hoverTimer      = useRef<ReturnType<typeof setTimeout> | null>(null)
  const editorRef       = useRef<Editor | null>(null)
  const imageInputRef   = useRef<HTMLInputElement>(null)

  const [handle,       setHandle]       = useState<HandleState | null>(null)
  const [insertOpen,   setInsertOpen]   = useState(false)
  const [blockMenu,    setBlockMenu]    = useState<{ open: boolean; sub: 'style' | 'insert' | null }>({ open: false, sub: null })
  const [slash,        setSlash]        = useState<SlashState | null>(null)

  const triggerImagePick = useCallback((ed: Editor) => {
    ed.chain().focus().run()
    requestAnimationFrame(() => imageInputRef.current?.click())
  }, [])

  const insertItems = useMemo(() => buildInsertItems(triggerImagePick), [triggerImagePick])
  const insertSections = useMemo(() => [...new Set(insertItems.map(i => i.section))], [insertItems])
  const slashCmds = useMemo(
    () =>
      insertItems.map(item => ({
        ...item,
        keys: [item.label.toLowerCase().replace(/ /g, ''), item.section.toLowerCase()],
      })),
    [insertItems],
  )

  /* ─── Handle positions (derived from handle state) ─── */
  const insertPos  = handle ? { top: handle.top + 28, left: handle.left } : null
  const blockMenuPos = handle ? { top: handle.top, left: handle.left + 60 } : null

  /* ─── Editor ─── */
  const editor = useEditor({
    immediatelyRender: false,
    editable: !readOnly,
    extensions: [
      StarterKit.configure({
        heading: false,
        ...(recapMode ? { paragraph: false, bulletList: false } : {}),
      }),
      ...(recapMode ? [RecapParagraph, RecapBulletList] : []),
      (recapMode ? RecapHeading : Heading).configure({ levels: [1, 2, 3] }),
      TaskList,
      TaskItem.configure({ nested: true }),
      Table.configure({ resizable: true }),
      TableRow,
      TableCell,
      TableHeader,
      Image.configure({ inline: false, allowBase64: true }),
      Underline,
    ],
    content: normalizeEditorContent(content, recapMode),
    onUpdate({ editor }) {
      const html = editor.getHTML()
      if (html !== lastContent.current) {
        lastContent.current = html
        onChange(html)
      }

      /* Slash detection */
      const { state }  = editor
      const { $from }  = state.selection
      if ($from.parent.type.name !== 'paragraph') { setSlash(null); return }

      const text     = $from.parent.textContent
      const offset   = $from.parentOffset
      const slashIdx = text.lastIndexOf('/', offset)
      if (slashIdx === -1) { setSlash(null); return }

      const between = text.slice(slashIdx + 1, offset)
      if (between.includes(' ')) { setSlash(null); return }

      const absPos = state.selection.from - between.length - 1
      const coords = editor.view.coordsAtPos(absPos)
      setSlash({ open: true, query: between.toLowerCase(), top: coords.bottom + 8, left: coords.left, fromPos: absPos })
    },
    editorProps: {
      attributes: {
        class: 'outline-none min-h-[320px] max-w-none focus:outline-none prose-li:my-0 folder-doc-prosemirror',
      },
      handlePaste(_view, event) {
        const ed = editorRef.current
        if (!ed) return false
        const items = event.clipboardData?.items
        if (!items?.length) return false
        for (const item of Array.from(items)) {
          if (item.kind === 'file' && item.type.startsWith('image/')) {
            const file = item.getAsFile()
            if (file) {
              event.preventDefault()
              const reader = new FileReader()
              reader.onload = () => {
                ed.chain().focus().setImage({ src: reader.result as string }).run()
              }
              reader.readAsDataURL(file)
              return true
            }
          }
        }
        return false
      },
      handleKeyDown(_view, event) {
        if (event.key === 'Escape') { setSlash(null); setInsertOpen(false); setBlockMenu(m => ({ ...m, open: false })); return false }
        return false
      },
    },
  })

  useEffect(() => {
    editorRef.current = editor
  }, [editor])

  const onImageFileChange = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    e.target.value = ''
    if (!file?.type.startsWith('image/')) return
    const ed = editorRef.current
    if (!ed) return
    const reader = new FileReader()
    reader.onload = () => ed.chain().focus().setImage({ src: reader.result as string }).run()
    reader.readAsDataURL(file)
  }, [])

  /* Sync external content */
  useEffect(() => {
    if (!editor) return
    const normalized = normalizeEditorContent(content, recapMode)
    if (normalized !== lastContent.current) {
      lastContent.current = normalized
      editor.commands.setContent(normalized)
    }
  }, [editor, content, recapMode])

  /* ─── Block handle mouse tracking ─── */
  const onMouseMove = useCallback((e: React.MouseEvent) => {
    if (insertOpen || blockMenu.open) return
    const pm = wrapperRef.current?.querySelector('.ProseMirror') as HTMLElement | null
    if (!pm) return

    const children = Array.from(pm.children) as HTMLElement[]
    const hovered  = children.find(child => {
      const r = child.getBoundingClientRect()
      return e.clientY >= r.top - 6 && e.clientY <= r.bottom + 6
    })

    if (hoverTimer.current) { clearTimeout(hoverTimer.current); hoverTimer.current = null }

    if (hovered) {
      const r   = hovered.getBoundingClientRect()
      const pmR = pm.getBoundingClientRect()
      const lineHeight = parseFloat(getComputedStyle(hovered).lineHeight) || 24
      const verticalCenter = r.top + Math.min(lineHeight / 2, r.height / 2) - 12
      setHandle({ top: verticalCenter, left: pmR.left - 60, blockEl: hovered })
    } else {
      hoverTimer.current = setTimeout(() => { setHandle(null); hoverTimer.current = null }, 300)
    }
  }, [insertOpen, blockMenu.open])

  const onMouseLeave = useCallback(() => {
    if (!insertOpen && !blockMenu.open) setHandle(null)
  }, [insertOpen, blockMenu.open])

  /* Close all menus on outside click */
  useEffect(() => {
    function down(e: MouseEvent) {
      const t = e.target as HTMLElement
      if (!t.closest('[data-editor-menu]')) {
        setInsertOpen(false)
        setBlockMenu({ open: false, sub: null })
        setSlash(null)
      }
    }
    document.addEventListener('mousedown', down)
    return () => document.removeEventListener('mousedown', down)
  }, [])

  /* ─── Insert block of a given type BELOW the current hovered block ─── */
  function insertBlockOfType(action?: (e: Editor) => void) {
    if (!editor || !handle) return
    const view = editor.view
    try {
      const domPos   = view.posAtDOM(handle.blockEl, 0)
      const $pos     = editor.state.doc.resolve(domPos)
      const afterPos = $pos.after($pos.depth)
      editor.chain().focus().insertContentAt(afterPos, { type: 'paragraph' }).run()
      if (action) requestAnimationFrame(() => action(editor))
    } catch {
      // Fallback: just focus
      editor.commands.focus()
    }
    setInsertOpen(false)
    setHandle(null)
  }

  /* ─── Slash execute ─── */
  function execSlash(cmd: (typeof slashCmds)[number]) {
    if (!editor || !slash) return
    const to = editor.state.selection.from
    editor.chain().focus().deleteRange({ from: slash.fromPos, to }).run()
    cmd.action(editor)
    setSlash(null)
  }

  /* ─── Slash filtered ─── */
  const filteredSlash = slash
    ? slashCmds.filter(c =>
        c.label.toLowerCase().includes(slash.query) ||
        c.keys.some(k => k.includes(slash.query)) ||
        slash.query === '')
    : []
  const slashGroups = [...new Set(filteredSlash.map(c => c.section))]

  if (!editor) return null

  if (readOnly) {
    return (
      <div className={cn('relative folder-document-editor folder-document-editor--readonly', className)} data-inline-guide="document-editor">
        <EditorContent editor={editor} />
      </div>
    )
  }

  return (
    <div
      ref={wrapperRef}
      className={cn('relative folder-document-editor', className)}
      data-inline-guide="document-editor"
      onMouseMove={onMouseMove}
      onMouseLeave={onMouseLeave}
    >
      <input
        ref={imageInputRef}
        type="file"
        accept="image/*"
        className="sr-only"
        aria-hidden
        tabIndex={-1}
        onChange={onImageFileChange}
      />

      {/* ── Bubble menu on text selection (hidden inside tables) ── */}
      <BubbleMenu
        editor={editor}
        pluginKey="inlineFormatBubble"
        shouldShow={({ editor: ed, state }) => {
          if (ed.isActive('table')) return false
          return state.selection.from !== state.selection.to
        }}
        className={BUBBLE_BAR}
      >
        {[
          { label: 'B', active: editor.isActive('bold'),      action: () => editor.chain().focus().toggleBold().run(),      cls: 'font-bold'   },
          { label: 'I', active: editor.isActive('italic'),    action: () => editor.chain().focus().toggleItalic().run(),    cls: 'italic' },
          { label: 'U', active: editor.isActive('underline'), action: () => editor.chain().focus().toggleUnderline().run(), cls: 'underline' },
        ].map(b => (
          <button key={b.label} type="button" onMouseDown={e => { e.preventDefault(); b.action() }}
            className={cn(BUBBLE_BTN(b.active), b.cls)}>
            {b.label}
          </button>
        ))}
        <div className={BUBBLE_DIVIDER} />
        {([1, 2, 3] as const).map(l => {
          const Icons = [Heading1, Heading2, Heading3]
          const Icon  = Icons[l - 1]
          return (
            <button key={l} type="button"
              onMouseDown={e => { e.preventDefault(); editor.chain().focus().setHeading({ level: l }).run() }}
              className={BUBBLE_BTN(editor.isActive('heading', { level: l }))}>
              <Icon className="w-3.5 h-3.5" />
            </button>
          )
        })}
        <div className={BUBBLE_DIVIDER} />
        <button type="button"
          onMouseDown={e => { e.preventDefault(); editor.chain().focus().toggleBulletList().run() }}
          className={BUBBLE_BTN(editor.isActive('bulletList'))}>
          <List className="w-3.5 h-3.5" />
        </button>
      </BubbleMenu>

      {/* ── Table structure toolbar ── */}
      <BubbleMenu
        editor={editor}
        pluginKey="tableStructureBubble"
        shouldShow={({ editor: ed }) => ed.isActive('table')}
        className={cn(BUBBLE_BAR, 'flex-wrap max-w-[min(100vw-2rem,28rem)]')}
      >
        <button type="button" title="Row above"
          onMouseDown={e => { e.preventDefault(); editor.chain().focus().addRowBefore().run() }}
          className={BUBBLE_ICON_BTN}>
          <BetweenVerticalStart className="w-4 h-4" />
        </button>
        <button type="button" title="Row below"
          onMouseDown={e => { e.preventDefault(); editor.chain().focus().addRowAfter().run() }}
          className={BUBBLE_ICON_BTN}>
          <BetweenVerticalEnd className="w-4 h-4" />
        </button>
        <button type="button" title="Delete row"
          onMouseDown={e => { e.preventDefault(); editor.chain().focus().deleteRow().run() }}
          className={cn(BUBBLE_ICON_BTN, 'hover:text-red-600 dark:hover:text-red-400')}>
          <Trash2 className="w-4 h-4" />
        </button>
        <div className={BUBBLE_DIVIDER} />
        <button type="button" title="Column left"
          onMouseDown={e => { e.preventDefault(); editor.chain().focus().addColumnBefore().run() }}
          className={BUBBLE_ICON_BTN}>
          <BetweenHorizontalStart className="w-4 h-4" />
        </button>
        <button type="button" title="Column right"
          onMouseDown={e => { e.preventDefault(); editor.chain().focus().addColumnAfter().run() }}
          className={BUBBLE_ICON_BTN}>
          <BetweenHorizontalEnd className="w-4 h-4" />
        </button>
        <button type="button" title="Delete column"
          onMouseDown={e => { e.preventDefault(); editor.chain().focus().deleteColumn().run() }}
          className={cn(BUBBLE_ICON_BTN, 'hover:text-red-600 dark:hover:text-red-400')}>
          <Trash2 className="w-4 h-4" />
        </button>
        <div className={BUBBLE_DIVIDER} />
        <button type="button" title="Delete table"
          onMouseDown={e => { e.preventDefault(); editor.chain().focus().deleteTable().run() }}
          className="px-2 h-8 flex items-center justify-center rounded-lg text-xs font-medium text-red-600 hover:bg-red-50 dark:text-red-400 dark:hover:bg-red-950/40 cursor-pointer">
          Remove table
        </button>
      </BubbleMenu>

      {/* ── Block handles (+  ⋮) ── */}
      <AnimatePresence>
        {handle && (
          <motion.div
            key="block-handle"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.08 }}
            className="flex items-center gap-0.5"
            style={{ position: 'fixed', top: handle.top, left: handle.left, zIndex: 40, pointerEvents: 'auto' }}
            data-editor-menu
          >
            {/* + : insert new block */}
            <button
              type="button"
              onMouseDown={e => { e.preventDefault(); e.stopPropagation(); setBlockMenu({ open: false, sub: null }); setInsertOpen(v => !v) }}
              title="Insert block"
              className={MENU_HANDLE_BTN}
            >
              <Plus className="w-3.5 h-3.5" />
            </button>

            {/* ⋮ : block options */}
            <button
              type="button"
              onMouseDown={e => { e.preventDefault(); e.stopPropagation(); setInsertOpen(false); setBlockMenu(m => ({ open: !m.open, sub: null })) }}
              title="Block options"
              className={MENU_HANDLE_BTN}
            >
              <GripVertical className="w-3.5 h-3.5" />
            </button>
          </motion.div>
        )}
      </AnimatePresence>

      {/* ════════════════════════════════════════════════
          INSERT BLOCK PANEL  (from +)
          ════════════════════════════════════════════════ */}
      <AnimatePresence>
        {insertOpen && insertPos && (
          <motion.div
            data-editor-menu
            key="insert-panel"
            {...MENU_MOTION}
            style={{ position: 'fixed', top: insertPos.top, left: insertPos.left, zIndex: 50 }}
            className={cn(MENU_PANEL, 'w-64 py-2 overflow-hidden max-h-[420px] overflow-y-auto scrollbar-minimal')}
          >
            {insertSections.map((section, si) => (
              <div key={section}>
                {si > 0 && <div className={cn('h-px my-1.5 mx-3', MENU_SEP)} />}
                <p className={cn('text-[10px] font-semibold uppercase tracking-wider px-3 pt-1.5 pb-1 text-muted-foreground/60')}>
                  {section}
                </p>
                {insertItems.filter(i => i.section === section).map(item => (
                  <button
                    key={item.label}
                    type="button"
                    onMouseDown={e => { e.preventDefault(); insertBlockOfType(item.action) }}
                    className={cn('w-full flex items-center gap-3 px-3 py-2 text-sm text-left group', MENU_ROW)}
                  >
                    <div className={cn('w-8 h-8', MENU_ICON_TILE)}>
                      <item.Icon className="w-4 h-4 text-slate-500 dark:text-muted-foreground" />
                    </div>
                    <div className="min-w-0">
                      <p className="font-medium text-[13px] leading-tight">{item.label}</p>
                      <p className="text-[11px] text-muted-foreground/70 leading-tight mt-0.5 truncate">{item.desc}</p>
                    </div>
                  </button>
                ))}
              </div>
            ))}
          </motion.div>
        )}
      </AnimatePresence>

      {/* ════════════════════════════════════════════════
          BLOCK OPTIONS MENU  (from ⋮)
          ════════════════════════════════════════════════ */}
      <AnimatePresence>
        {blockMenu.open && blockMenuPos && (
          <motion.div
            data-editor-menu
            key="block-menu"
            {...MENU_MOTION}
            style={{ position: 'fixed', top: blockMenuPos.top, left: blockMenuPos.left, zIndex: 50 }}
            className={cn(MENU_PANEL, 'w-52 py-1.5')}
          >
            {/* Paragraph style → */}
            <div className="relative">
              <button type="button"
                onMouseEnter={() => setBlockMenu(m => ({ ...m, sub: 'style' }))}
                className={cn('w-full flex items-center gap-2.5 px-3 py-2 text-sm', MENU_ROW)}
              >
                <AlignLeft className="w-3.5 h-3.5 text-muted-foreground shrink-0" />
                <span className="flex-1 text-left">Paragraph style</span>
                <ChevronRight className="w-3.5 h-3.5 text-muted-foreground/50" />
              </button>

              <AnimatePresence>
                {blockMenu.sub === 'style' && (
                  <motion.div
                    data-editor-menu
                    {...MENU_MOTION}
                    onMouseEnter={() => setBlockMenu(m => ({ ...m, sub: 'style' }))}
                    onMouseLeave={() => setBlockMenu(m => ({ ...m, sub: null }))}
                    className={cn(MENU_PANEL, 'absolute left-full top-0 ml-1 w-60 py-3 px-3')}
                    style={{ zIndex: 51 }}
                  >
                    {/* Text */}
                    <p className="text-[10px] font-semibold text-muted-foreground/60 uppercase tracking-wider mb-2">Text</p>
                    <div className="flex items-center gap-1.5 mb-3">
                      {STYLE_OPTS.map(opt => (
                        <button key={opt.label} type="button"
                          onMouseDown={e => {
                            e.preventDefault()
                            focusSelectionInBlock(editor, handle?.blockEl ?? null)
                            opt.action(editor)
                            setBlockMenu({ open: false, sub: null })
                          }}
                          title={opt.title}
                          className={cn('flex flex-col items-center justify-center w-12 h-11 rounded-lg border text-xs font-bold transition-colors cursor-pointer gap-0.5',
                            opt.active(editor) ? MENU_STYLE_TILE_ACTIVE : MENU_STYLE_TILE
                          )}
                        >
                          <opt.Icon className="w-4 h-4" />
                          <span className="text-[9px] font-normal">{opt.label}</span>
                        </button>
                      ))}
                    </div>
                    <div className={cn('h-px mb-2', MENU_SEP)} />
                    {/* Lists */}
                    <p className="text-[10px] font-semibold text-muted-foreground/60 uppercase tracking-wider mb-2">Lists</p>
                    <div className="flex items-center gap-1.5 mb-3">
                      {LIST_OPTS.map(opt => (
                        <button key={opt.label} type="button"
                          onMouseDown={e => {
                            e.preventDefault()
                            focusSelectionInBlock(editor, handle?.blockEl ?? null)
                            opt.action(editor)
                            setBlockMenu({ open: false, sub: null })
                          }}
                          title={opt.title}
                          className={MENU_STYLE_TILE}
                        >
                          <opt.Icon className="w-4 h-4" />
                        </button>
                      ))}
                    </div>
                    <div className={cn('h-px mb-2', MENU_SEP)} />
                    {/* Quote */}
                    <p className="text-[10px] font-semibold text-muted-foreground/60 uppercase tracking-wider mb-2">Quote</p>
                    <div className="flex items-center gap-1.5">
                      {QUOTE_OPTS.map(opt => (
                        <button key={opt.label} type="button"
                          onMouseDown={e => {
                            e.preventDefault()
                            focusSelectionInBlock(editor, handle?.blockEl ?? null)
                            opt.action(editor)
                            setBlockMenu({ open: false, sub: null })
                          }}
                          title={opt.title}
                          className={MENU_STYLE_TILE}
                        >
                          <opt.Icon className="w-4 h-4" />
                        </button>
                      ))}
                    </div>
                  </motion.div>
                )}
              </AnimatePresence>
            </div>

            {/* Insert line → */}
            <div className="relative">
              <button type="button"
                onMouseEnter={() => setBlockMenu(m => ({ ...m, sub: 'insert' }))}
                className={cn('w-full flex items-center gap-2.5 px-3 py-2 text-sm', MENU_ROW)}
              >
                <Plus className="w-3.5 h-3.5 text-muted-foreground shrink-0" />
                <span className="flex-1 text-left">Insert line</span>
                <ChevronRight className="w-3.5 h-3.5 text-muted-foreground/50" />
              </button>

              <AnimatePresence>
                {blockMenu.sub === 'insert' && (
                  <motion.div
                    data-editor-menu
                    {...MENU_MOTION}
                    onMouseEnter={() => setBlockMenu(m => ({ ...m, sub: 'insert' }))}
                    onMouseLeave={() => setBlockMenu(m => ({ ...m, sub: null }))}
                    className={cn(MENU_PANEL, 'absolute left-full top-0 ml-1 w-44 py-1.5')}
                    style={{ zIndex: 51 }}
                  >
                    {['Insert above', 'Insert below'].map(label => (
                      <button key={label} type="button"
                        onMouseDown={e => { e.preventDefault(); insertBlockOfType(); setBlockMenu({ open: false, sub: null }) }}
                        className={cn('w-full flex items-center gap-2.5 px-3 py-2 text-sm text-left', MENU_ROW)}
                      >
                        {label}
                      </button>
                    ))}
                  </motion.div>
                )}
              </AnimatePresence>
            </div>

            <div className={cn('h-px my-1', MENU_SEP)} />

            {/* Return to block */}
            <button type="button"
              onMouseDown={e => { e.preventDefault(); editor.chain().focus().run(); setBlockMenu({ open: false, sub: null }) }}
              className={cn('w-full flex items-center gap-2.5 px-3 py-2 text-sm', MENU_ROW)}
            >
              <ArrowLeft className="w-3.5 h-3.5 text-muted-foreground shrink-0" />
              Return to block
            </button>

            {/* Copy link */}
            <button type="button"
              onMouseDown={e => { e.preventDefault(); void navigator.clipboard.writeText(window.location.href); setBlockMenu({ open: false, sub: null }) }}
              className={cn('w-full flex items-center gap-2.5 px-3 py-2 text-sm', MENU_ROW)}
            >
              <Link2 className="w-3.5 h-3.5 text-muted-foreground shrink-0" />
              Copy link
            </button>
          </motion.div>
        )}
      </AnimatePresence>

      {/* ════════════════════════════════════════════════
          SLASH COMMAND PALETTE  (/ trigger)
          ════════════════════════════════════════════════ */}
      <AnimatePresence>
        {slash?.open && filteredSlash.length > 0 && (
          <motion.div
            data-editor-menu
            key="slash-menu"
            {...MENU_MOTION}
            style={{ position: 'fixed', top: slash.top, left: slash.left, zIndex: 50 }}
            className={cn(MENU_PANEL, 'w-60 py-1.5 max-h-80 overflow-y-auto scrollbar-minimal')}
          >
            <div className="flex items-center gap-2 px-3 py-1.5 border-b border-slate-200 dark:border-border mb-1">
              <Search className="w-3 h-3 text-muted-foreground/50" />
              <span className="text-xs text-muted-foreground/50">/{slash.query || 'Search…'}</span>
            </div>
            {slashGroups.map(group => (
              <div key={group}>
                <p className="text-[10px] font-semibold text-muted-foreground/50 uppercase tracking-wider px-3 pt-2 pb-1">{group}</p>
                {filteredSlash.filter(c => c.section === group).map(cmd => (
                  <button key={cmd.label} type="button"
                    onMouseDown={e => { e.preventDefault(); execSlash(cmd) }}
                    className={cn('w-full flex items-center gap-2.5 px-3 py-2 text-sm', MENU_ROW)}
                  >
                    <div className={cn('w-7 h-7', MENU_ICON_TILE)}>
                      <cmd.Icon className="w-3.5 h-3.5 text-slate-500 dark:text-muted-foreground" />
                    </div>
                    {cmd.label}
                  </button>
                ))}
              </div>
            ))}
          </motion.div>
        )}
      </AnimatePresence>

      {/* ── Editor (no border, no card) ── */}
      <EditorContent editor={editor} />
    </div>
  )
}
