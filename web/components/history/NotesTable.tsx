'use client'

import { useState, useTransition } from 'react'
import { useRouter } from 'next/navigation'
import {
  useReactTable,
  getCoreRowModel,
  getFilteredRowModel,
  getSortedRowModel,
  getPaginationRowModel,
  flexRender,
  createColumnHelper,
  type ColumnFiltersState,
  type SortingState,
} from '@tanstack/react-table'
import {
  ChevronUp, ChevronDown, ChevronsUpDown, ExternalLink,
  Trash2, ChevronLeft, ChevronRight, Loader2,
} from 'lucide-react'
import { formatDistanceToNow } from 'date-fns'
import type { Note, NoteType } from '@/lib/types'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { cn } from '@/lib/utils'
import { deleteNote } from '@/lib/actions/notes'
import { prettyNotePreview } from '@/lib/note-preview'

const TYPE_COLORS: Record<NoteType, string> = {
  text: 'bg-primary/15 text-primary border-primary/20',
  canvas: 'bg-violet-500/15 text-violet-400 border-violet-500/20',
  'ai-summary': 'bg-emerald-500/15 text-emerald-400 border-emerald-500/20',
  sticky: 'bg-yellow-500/15 text-yellow-600 border-yellow-500/20',
  anchor: 'bg-amber-500/15 text-amber-600 border-amber-500/20',
  drawing: 'bg-violet-500/15 text-violet-400 border-violet-500/20',
  handwriting: 'bg-fuchsia-500/15 text-fuchsia-500 border-fuchsia-500/20',
  highlight: 'bg-lime-500/15 text-lime-600 border-lime-500/20',
  clip: 'bg-sky-500/15 text-sky-500 border-sky-500/20',
  stamp: 'bg-rose-500/15 text-rose-500 border-rose-500/20',
  'paper-note': 'bg-orange-500/15 text-orange-500 border-orange-500/20',
}

const TYPE_LABELS: Record<NoteType, string> = {
  text: 'Text',
  canvas: 'Drawing',
  'ai-summary': 'AI Summary',
  sticky: 'Sticky',
  anchor: 'Anchor',
  drawing: 'Drawing',
  handwriting: 'Handwriting',
  highlight: 'Highlight',
  clip: 'Clip',
  stamp: 'Stamp',
  'paper-note': 'Paper note',
}

const col = createColumnHelper<Note>()

interface NotesTableProps {
  notes:       Note[]
  workspaceId: string
  highlightNoteId?: string | null
}

export default function NotesTable({ notes, workspaceId, highlightNoteId: _ }: NotesTableProps) {
  const router = useRouter()
  const [sorting, setSorting] = useState<SortingState>([{ id: 'createdAt', desc: true }])
  const [columnFilters, setColumnFilters] = useState<ColumnFiltersState>([])
  const [globalFilter, setGlobalFilter] = useState('')
  const [isPending, startTransition] = useTransition()

  const columns = [
    col.accessor('content', {
      header: 'Preview',
      cell: ({ row }) => {
        const note = row.original
        return (
          <button
            className="text-left w-full"
            onClick={() => router.push(`/app/${workspaceId}/history/${note.id}`)}
          >
            <div className="flex items-start gap-3 min-w-0">
              <div
                className="w-1 h-12 rounded-full shrink-0 mt-0.5"
                style={{ backgroundColor: note.color }}
              />
              <div className="min-w-0">
                <p className="text-sm font-medium truncate max-w-[280px] text-foreground group-hover:text-primary transition-colors">
                  {prettyNotePreview(note)}
                </p>
                <p className="text-xs text-muted-foreground truncate max-w-[280px] mt-0.5">
                  {note.pageContext}
                </p>
              </div>
            </div>
          </button>
        )
      },
      size: 320,
    }),
    col.accessor('type', {
      header: 'Type',
      cell: ({ getValue }) => {
        const type = getValue()
        return (
          <Badge className={cn('border text-xs font-medium', TYPE_COLORS[type])}>
            {TYPE_LABELS[type]}
          </Badge>
        )
      },
      size: 100,
    }),
    col.accessor('domain', {
      header: 'Domain',
      cell: ({ row }) => (
        <a
          href={row.original.pageUrl}
          target="_blank"
          rel="noopener noreferrer"
          className="flex items-center gap-1.5 text-xs text-muted-foreground hover:text-foreground transition-colors group"
          onClick={e => e.stopPropagation()}
        >
          <span className="truncate max-w-[140px]">{row.original.domain}</span>
          <ExternalLink className="w-3 h-3 shrink-0 opacity-0 group-hover:opacity-100 transition-opacity" />
        </a>
      ),
      size: 160,
    }),
    col.accessor('tags', {
      header: 'Tags',
      cell: ({ getValue }) => (
        <div className="flex flex-wrap gap-1 max-w-[160px]">
          {getValue().slice(0, 2).map(tag => (
            <span key={tag} className="text-[10px] px-1.5 py-0.5 bg-muted text-muted-foreground rounded">
              #{tag}
            </span>
          ))}
          {getValue().length > 2 && (
            <span className="text-[10px] text-muted-foreground">+{getValue().length - 2}</span>
          )}
        </div>
      ),
      size: 160,
    }),
    col.accessor('createdAt', {
      header: 'Captured',
      cell: ({ getValue }) => (
        <span className="text-xs text-muted-foreground whitespace-nowrap">
          {formatDistanceToNow(new Date(getValue()), { addSuffix: true })}
        </span>
      ),
      size: 120,
    }),
    col.display({
      id: 'actions',
      header: '',
      cell: ({ row }) => (
        <Button
          variant="ghost"
          size="icon-sm"
          className="opacity-0 group-hover:opacity-100 transition-opacity text-muted-foreground hover:text-red-400"
          onClick={e => {
            e.stopPropagation()
            startTransition(async () => { await deleteNote(row.original.id) })
          }}
        >
          {isPending ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Trash2 className="w-3.5 h-3.5" />}
        </Button>
      ),
      size: 40,
    }),
  ]

  const table = useReactTable({
    data: notes,
    columns,
    state: { sorting, columnFilters, globalFilter },
    onSortingChange: setSorting,
    onColumnFiltersChange: setColumnFilters,
    onGlobalFilterChange: setGlobalFilter,
    getCoreRowModel: getCoreRowModel(),
    getFilteredRowModel: getFilteredRowModel(),
    getSortedRowModel: getSortedRowModel(),
    getPaginationRowModel: getPaginationRowModel(),
    initialState: { pagination: { pageSize: 15 } },
  })

  return (
    <>
      {/* Toolbar */}
      <div className="flex items-center justify-between gap-3 mb-4">
        <div className="flex items-center gap-2 flex-1">
          <Input
            placeholder="Search notes…"
            value={globalFilter}
            onChange={e => setGlobalFilter(e.target.value)}
            className="h-8 max-w-xs text-sm"
          />
          <Select
            value={(columnFilters.find(f => f.id === 'type')?.value as string) ?? 'all'}
            onValueChange={v => {
              setColumnFilters(v === 'all' ? [] : [{ id: 'type', value: v }])
            }}
          >
            <SelectTrigger className="h-8 w-36 text-xs">
              <SelectValue placeholder="All types" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All types</SelectItem>
              <SelectItem value="text">Text</SelectItem>
              <SelectItem value="canvas">Drawing</SelectItem>
              <SelectItem value="ai-summary">AI Summary</SelectItem>
            </SelectContent>
          </Select>
        </div>

        <p className="text-xs text-muted-foreground shrink-0">
          {table.getFilteredRowModel().rows.length} of {notes.length} notes
        </p>
      </div>

      {/* Table */}
      <div className="rounded-xl border border-border overflow-hidden">
        <table className="w-full text-sm">
          <thead className="border-b border-border bg-card">
            {table.getHeaderGroups().map(hg => (
              <tr key={hg.id}>
                {hg.headers.map(header => (
                  <th
                    key={header.id}
                    className="px-4 py-3 text-left text-xs font-medium text-muted-foreground"
                    style={{ width: header.getSize() }}
                  >
                    {header.isPlaceholder ? null : (
                      <button
                        className={cn(
                          'flex items-center gap-1 hover:text-foreground transition-colors',
                          header.column.getCanSort() ? 'cursor-pointer' : 'cursor-default',
                        )}
                        onClick={header.column.getToggleSortingHandler()}
                      >
                        {flexRender(header.column.columnDef.header, header.getContext())}
                        {header.column.getCanSort() && (
                          <span className="text-muted-foreground/50">
                            {header.column.getIsSorted() === 'asc' ? (
                              <ChevronUp className="w-3 h-3" />
                            ) : header.column.getIsSorted() === 'desc' ? (
                              <ChevronDown className="w-3 h-3" />
                            ) : (
                              <ChevronsUpDown className="w-3 h-3" />
                            )}
                          </span>
                        )}
                      </button>
                    )}
                  </th>
                ))}
              </tr>
            ))}
          </thead>
          <tbody>
            {table.getRowModel().rows.length === 0 ? (
              <tr>
                <td colSpan={columns.length} className="py-16 text-center text-sm text-muted-foreground">
                  No notes match your filters.
                </td>
              </tr>
            ) : (
              table.getRowModel().rows.map(row => (
                <tr
                  key={row.id}
                  className="border-b border-border last:border-0 hover:bg-card/60 transition-colors group cursor-pointer"
                  onClick={() => router.push(`/app/${workspaceId}/history/${row.original.id}`)}
                >
                  {row.getVisibleCells().map(cell => (
                    <td key={cell.id} className="px-4 py-3" style={{ width: cell.column.getSize() }}>
                      {flexRender(cell.column.columnDef.cell, cell.getContext())}
                    </td>
                  ))}
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>

      {/* Pagination */}
      <div className="flex items-center justify-between mt-4">
        <p className="text-xs text-muted-foreground">
          Page {table.getState().pagination.pageIndex + 1} of {table.getPageCount()}
        </p>
        <div className="flex items-center gap-2">
          <Button
            variant="outline"
            size="icon-sm"
            onClick={() => table.previousPage()}
            disabled={!table.getCanPreviousPage()}
          >
            <ChevronLeft className="w-3.5 h-3.5" />
          </Button>
          <Button
            variant="outline"
            size="icon-sm"
            onClick={() => table.nextPage()}
            disabled={!table.getCanNextPage()}
          >
            <ChevronRight className="w-3.5 h-3.5" />
          </Button>
        </div>
      </div>
    </>
  )
}
