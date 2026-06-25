'use client'

import { Sheet, SheetContent } from '@/components/ui/sheet'
import { ExternalLink, Clock, Globe, Tag, MapPin, FileText, PenTool, BrainCircuit, X, StickyNote, Anchor, Highlighter, Paperclip, Stamp, NotebookPen, PenLine } from 'lucide-react'
import type { Note, NoteType } from '@/lib/types'
import { formatDistanceToNow, format } from 'date-fns'
import { prettyNotePreview } from '@/lib/note-preview'
import { formatDisplayTitle, truncateDisplayUrl } from '@/lib/utils'

const TYPE_META: Record<NoteType, { label: string; icon: React.ElementType; color: string; bg: string }> = {
  text:         { label: 'Text Note',   icon: FileText,     color: '#6C91C2', bg: '#DCE6F4' },
  canvas:       { label: 'Drawing',     icon: PenTool,      color: '#a855f7', bg: '#f3e8ff' },
  'ai-summary': { label: 'AI Summary',  icon: BrainCircuit, color: '#5FA8A1', bg: '#E6F4F2' },
  sticky:       { label: 'Sticky Note', icon: StickyNote,   color: '#B45309', bg: '#FEF3C7' },
  anchor:       { label: 'Anchor Note', icon: Anchor,       color: '#6C91C2', bg: '#DCE6F4' },
  drawing:      { label: 'Drawing',     icon: PenTool,      color: '#a855f7', bg: '#f3e8ff' },
  handwriting:  { label: 'Handwriting', icon: PenLine,      color: '#a855f7', bg: '#f3e8ff' },
  highlight:    { label: 'Highlight',   icon: Highlighter,  color: '#B45309', bg: '#FEF3C7' },
  clip:         { label: 'Clip',        icon: Paperclip,    color: '#0F7B6C', bg: '#E6F4F2' },
  stamp:        { label: 'Stamp',       icon: Stamp,        color: '#9065B0', bg: '#EFEAF5' },
  'paper-note': { label: 'Paper Note',  icon: NotebookPen,  color: '#B45309', bg: '#F5EDE3' },
}

interface MetaRowProps {
  icon:     React.ElementType
  label:    string
  children: React.ReactNode
}

function MetaRow({ icon: Icon, label, children }: MetaRowProps) {
  return (
    <div className="flex items-start gap-3 py-3">
      <div className="w-7 h-7 rounded-lg bg-slate-100 flex items-center justify-center shrink-0 mt-0.5">
        <Icon className="w-3.5 h-3.5 text-slate-400" />
      </div>
      <div className="flex-1 min-w-0">
        <p className="text-[10.5px] font-semibold uppercase tracking-wider text-slate-400 mb-0.5">{label}</p>
        <div className="text-[13px] text-slate-700 leading-relaxed">{children}</div>
      </div>
    </div>
  )
}

interface NoteDetailSheetProps {
  note:    Note | null
  onClose: () => void
}

export default function NoteDetailSheet({ note, onClose }: NoteDetailSheetProps) {
  const meta = note ? (TYPE_META[note.type] ?? TYPE_META.text) : TYPE_META.text

  return (
    <Sheet open={!!note} onOpenChange={open => !open && onClose()}>
      <SheetContent className="w-[420px] sm:max-w-[420px] p-0 overflow-hidden flex flex-col gap-0">
        {note && (
          <>
            {/* ── Frosted header ── */}
            <div className="shrink-0 px-5 py-4 border-b border-slate-200 bg-white backdrop-blur-sm">
              <div className="flex items-start justify-between gap-3">
                <div className="flex items-center gap-3 min-w-0">
                  {/* Type icon badge */}
                  <div
                    className="w-10 h-10 rounded-xl flex items-center justify-center shrink-0"
                    style={{ backgroundColor: meta.bg }}
                  >
                    <meta.icon className="w-5 h-5" style={{ color: meta.color }} />
                  </div>
                  <div className="min-w-0">
                    <div className="flex items-center gap-2 mb-0.5">
                      <span
                        className="text-[10px] font-semibold uppercase tracking-wider px-2 py-0.5 rounded-full"
                        style={{ color: meta.color, backgroundColor: meta.bg }}
                      >
                        {meta.label}
                      </span>
                    </div>
                    <p className="text-[13px] font-semibold text-slate-700 truncate leading-tight">
                      {note.domain}
                    </p>
                  </div>
                </div>
                <button
                  onClick={onClose}
                  className="w-7 h-7 rounded-lg flex items-center justify-center text-slate-400 hover:text-slate-700 hover:bg-slate-100 transition-colors shrink-0 cursor-pointer"
                >
                  <X className="w-3.5 h-3.5" />
                </button>
              </div>

              {/* URL */}
              <a
                href={note.pageUrl}
                target="_blank"
                rel="noopener noreferrer"
                title={note.pageUrl}
                className="mt-3 flex items-center gap-1.5 text-[11px] text-[#37352F] hover:text-[#4B83C4] transition-colors truncate cursor-pointer group"
              >
                <Globe className="w-3 h-3 shrink-0 text-slate-400 group-hover:text-[#4B83C4] transition-colors" />
                <span className="truncate">{truncateDisplayUrl(note.pageUrl)}</span>
                <ExternalLink className="w-3 h-3 shrink-0" />
              </a>
            </div>

            {/* ── Scrollable body ── */}
            <div className="flex-1 overflow-y-auto px-5 pb-6 scrollbar-minimal">

              {/* Note content preview */}
              <div className="mt-4 mb-2">
                <p className="text-[10.5px] font-semibold uppercase tracking-wider text-slate-400 mb-2">Content</p>
                <div
                  className="rounded-xl px-4 py-3 text-[13px] leading-relaxed font-medium text-zinc-800 min-h-[72px] border border-transparent whitespace-pre-wrap"
                  style={{ backgroundColor: note.color ?? '#fef9c3' }}
                >
                  {prettyNotePreview(note) || <span className="text-slate-400 italic">No content</span>}
                </div>
              </div>

              {/* Page context blockquote */}
              {note.pageContext && (
                <div className="mt-4 mb-1">
                  <p className="text-[10.5px] font-semibold uppercase tracking-wider text-slate-400 mb-2">Selected Text</p>
                  <blockquote className="rounded-r-lg border border-border border-l-[3px] border-l-primary/40 bg-secondary py-2 pl-3 pr-3 text-[12.5px] italic leading-relaxed text-muted-foreground">
                    {note.pageContext}
                  </blockquote>
                </div>
              )}

              {/* Divider */}
              <div className="h-px bg-border my-4" />

              {/* Structured metadata — macOS inspector style */}
              <div className="divide-y divide-slate-100">
                <MetaRow icon={Globe} label="Page Title">
                  <span className="font-medium">{formatDisplayTitle(note.pageTitle)}</span>
                </MetaRow>

                <MetaRow icon={Clock} label="Captured">
                  <span className="font-medium">{format(new Date(note.createdAt), 'MMM d, yyyy · h:mm a')}</span>
                  <span className="text-slate-400 text-xs ml-2">
                    {formatDistanceToNow(new Date(note.createdAt), { addSuffix: true })}
                  </span>
                </MetaRow>

                {note.tags.length > 0 && (
                  <MetaRow icon={Tag} label="Tags">
                    <div className="flex flex-wrap gap-1.5 mt-0.5">
                      {note.tags.map(tag => (
                        <span
                          key={tag}
                          className="px-2.5 py-0.5 bg-[#F1F1EF] text-[#37352F] rounded-full text-[11px] font-semibold"
                        >
                          #{tag}
                        </span>
                      ))}
                    </div>
                  </MetaRow>
                )}

                {(note.lat !== undefined && note.lng !== undefined) && (
                  <MetaRow icon={MapPin} label="Geo-coordinates">
                    <span className="font-mono text-[12px]">{note.lat.toFixed(5)}, {note.lng.toFixed(5)}</span>
                  </MetaRow>
                )}
              </div>

              {/* Note type chip */}
              <div className="mt-5 pt-4 border-t border-slate-200 flex items-center justify-between">
                <span className="text-[10.5px] text-slate-400">Note ID</span>
                <span className="font-mono text-[10px] text-slate-400 bg-slate-100 px-2 py-1 rounded-md">{note.id.slice(0, 8)}…</span>
              </div>
            </div>
          </>
        )}
      </SheetContent>
    </Sheet>
  )
}
