'use client'

import { useState, useCallback, useRef, useEffect } from 'react'
import { useParams } from 'next/navigation'
import Link from 'next/link'
import { cn } from '@/lib/utils'
import { getWorkspaceName } from '@/lib/workspaces'
import { motion, AnimatePresence } from 'framer-motion'
import {
  Plus, Play, CheckCircle2, Circle, AlertTriangle,
  Sparkles, StickyNote, ListTodo, Link2, Lightbulb,
  ChevronRight, X, Clock, Users,
  ArrowRight, Trash2, GripVertical,
} from 'lucide-react'

type TaskStatus = 'todo' | 'in-progress' | 'done'
type TaskPriority = 'low' | 'medium' | 'high'

interface WorkflowTask {
  id: string
  title: string
  description: string
  status: TaskStatus
  priority: TaskPriority
  assignee: string
  createdAt: number
  linkedDoc?: string
}

interface IdeaNote {
  id: string
  text: string
  color: string
  author: string
  createdAt: number
}

const PRIORITY_COLORS: Record<TaskPriority, string> = {
  low: 'bg-slate-100 text-slate-600',
  medium: 'bg-amber-100 text-amber-700',
  high: 'bg-red-100 text-red-700',
}

const STATUS_ICONS: Record<TaskStatus, React.ReactNode> = {
  'todo': <Circle className="w-4 h-4 text-slate-400" />,
  'in-progress': <Clock className="w-4 h-4 text-[#4B83C4]" />,
  'done': <CheckCircle2 className="w-4 h-4 text-emerald-500" />,
}

const IDEA_COLORS = ['#ede9fe', '#fef9c3', '#fce7f3', '#dcfce7', '#dbeafe', '#ffedd5']

function storageKey(wsId: string, key: string) {
  return `wf-${wsId}-${key}`
}

export default function WorkflowsPage() {
  const params = useParams()
  const workspaceId = Array.isArray(params.workspaceId) ? params.workspaceId[0]! : (params.workspaceId as string)
  const workspaceName = getWorkspaceName(workspaceId)

  const [tasks, setTasks] = useState<WorkflowTask[]>([])
  const [ideas, setIdeas] = useState<IdeaNote[]>([])
  const [showAddTask, setShowAddTask] = useState(false)
  const [showAddIdea, setShowAddIdea] = useState(false)
  const [newTask, setNewTask] = useState({ title: '', description: '', priority: 'medium' as TaskPriority, assignee: '' })
  const [newIdea, setNewIdea] = useState('')
  const [newIdeaColor, setNewIdeaColor] = useState(IDEA_COLORS[0])
  const [activeTab, setActiveTab] = useState<'board' | 'ideas' | 'insights'>('board')
  const [conflictResult, setConflictResult] = useState<string | null>(null)
  const [checking, setChecking] = useState(false)
  const titleRef = useRef<HTMLInputElement>(null)

  useEffect(() => {
    try {
      const t = localStorage.getItem(storageKey(workspaceId, 'tasks'))
      if (t) setTasks(JSON.parse(t))
      const i = localStorage.getItem(storageKey(workspaceId, 'ideas'))
      if (i) setIdeas(JSON.parse(i))
    } catch { /* ignore */ }
  }, [workspaceId])

  const persistTasks = useCallback((next: WorkflowTask[]) => {
    setTasks(next)
    localStorage.setItem(storageKey(workspaceId, 'tasks'), JSON.stringify(next))
  }, [workspaceId])

  const persistIdeas = useCallback((next: IdeaNote[]) => {
    setIdeas(next)
    localStorage.setItem(storageKey(workspaceId, 'ideas'), JSON.stringify(next))
  }, [workspaceId])

  function addTask() {
    if (!newTask.title.trim()) return
    const task: WorkflowTask = {
      id: crypto.randomUUID(),
      title: newTask.title.trim(),
      description: newTask.description.trim(),
      status: 'todo',
      priority: newTask.priority,
      assignee: newTask.assignee.trim() || 'Unassigned',
      createdAt: Date.now(),
    }
    persistTasks([...tasks, task])
    setNewTask({ title: '', description: '', priority: 'medium', assignee: '' })
    setShowAddTask(false)
  }

  function updateTaskStatus(id: string, status: TaskStatus) {
    persistTasks(tasks.map(t => t.id === id ? { ...t, status } : t))
  }

  function deleteTask(id: string) {
    persistTasks(tasks.filter(t => t.id !== id))
  }

  function addIdea() {
    if (!newIdea.trim()) return
    const idea: IdeaNote = {
      id: crypto.randomUUID(),
      text: newIdea.trim(),
      color: newIdeaColor,
      author: 'You',
      createdAt: Date.now(),
    }
    persistIdeas([...ideas, idea])
    setNewIdea('')
    setShowAddIdea(false)
  }

  function deleteIdea(id: string) {
    persistIdeas(ideas.filter(i => i.id !== id))
  }

  function runConflictCheck() {
    setChecking(true)
    const inProgress = tasks.filter(t => t.status === 'in-progress')
    const assignees = inProgress.map(t => t.assignee)
    const duplicates = assignees.filter((a, i) => assignees.indexOf(a) !== i && a !== 'Unassigned')
    if (duplicates.length > 0) {
      setConflictResult(`Potential conflict: ${[...new Set(duplicates)].join(', ')} ${duplicates.length > 1 ? 'are' : 'is'} working on multiple tasks simultaneously. Consider prioritizing to avoid bottlenecks.`)
    } else if (inProgress.length > 5) {
      setConflictResult('You have more than 5 tasks in progress. Consider completing some before starting new ones to maintain focus.')
    } else {
      setConflictResult('No conflicts detected. Your workflow looks good!')
    }
    setChecking(false)
  }

  const columns: { status: TaskStatus; label: string; color: string }[] = [
    { status: 'todo', label: 'To Do', color: 'border-slate-300' },
    { status: 'in-progress', label: 'In Progress', color: 'border-[#D3D1CB]' },
    { status: 'done', label: 'Done', color: 'border-emerald-300' },
  ]

  useEffect(() => {
    if (showAddTask) setTimeout(() => titleRef.current?.focus(), 100)
  }, [showAddTask])

  return (
    <div className="min-h-full bg-white">
      {/* Header */}
      <div className="border-b border-slate-200 bg-white px-6 py-4">
        <div className="flex w-full min-w-0 items-center justify-between">
          <div>
            <nav className="flex items-center gap-1.5 text-xs text-slate-400 mb-1">
              <Link href={`/app/${workspaceId}/dashboard`} className="hover:text-slate-600 transition-colors">
                {workspaceName}
              </Link>
              <ChevronRight className="w-3 h-3" />
              <span className="text-slate-600 font-medium">Workflows</span>
            </nav>
            <h1 className="text-xl font-bold text-slate-800">Workflows</h1>
          </div>
          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={runConflictCheck}
              disabled={checking}
              className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-amber-50 text-amber-600 text-xs font-medium hover:bg-amber-100 transition-colors cursor-pointer disabled:opacity-60"
            >
              <Play className="w-3.5 h-3.5" />
              {checking ? 'Checking...' : 'Check conflicts'}
            </button>
            <button
              type="button"
              onClick={() => setShowAddTask(true)}
              className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-[#191919] text-white text-xs font-medium hover:bg-[#150C00] transition-colors cursor-pointer"
            >
              <Plus className="w-3.5 h-3.5" />
              New task
            </button>
          </div>
        </div>
      </div>

      {/* Conflict banner */}
      <AnimatePresence>
        {conflictResult && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: 'auto', opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            className="overflow-hidden"
          >
            <div className={cn(
              'px-6 py-3 text-sm flex items-center gap-3',
              conflictResult.includes('No conflicts') ? 'bg-emerald-50 text-emerald-700' : 'bg-amber-50 text-amber-700'
            )}>
              {conflictResult.includes('No conflicts')
                ? <CheckCircle2 className="w-4 h-4 shrink-0" />
                : <AlertTriangle className="w-4 h-4 shrink-0" />
              }
              <span className="flex-1">{conflictResult}</span>
              <button onClick={() => setConflictResult(null)} className="cursor-pointer"><X className="w-4 h-4" /></button>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Tabs */}
      <div className="px-6 pt-4 border-b border-slate-200 bg-white">
        <div className="flex items-center gap-1">
          {[
            { id: 'board' as const, label: 'Task Board', icon: ListTodo },
            { id: 'ideas' as const, label: 'Ideas Wall', icon: Lightbulb },
            { id: 'insights' as const, label: 'Insights', icon: Sparkles },
          ].map(tab => (
            <button
              key={tab.id}
              type="button"
              onClick={() => setActiveTab(tab.id)}
              className={cn(
                'flex items-center gap-1.5 px-4 py-2.5 text-sm font-medium border-b-2 transition-colors cursor-pointer',
                activeTab === tab.id
                  ? 'border-[#4B83C4] text-[#37352F]'
                  : 'border-transparent text-slate-500 hover:text-slate-700'
              )}
            >
              <tab.icon className="w-3.5 h-3.5" />
              {tab.label}
            </button>
          ))}
        </div>
      </div>

      {/* Content */}
      <div className="w-full min-w-0 p-6">
        {/* ── Board tab ── */}
        {activeTab === 'board' && (
          <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
            {columns.map(col => {
              const colTasks = tasks.filter(t => t.status === col.status)
              return (
                <div key={col.status} className={cn('rounded-xl border-2 border-dashed bg-white/50 p-4 min-h-[300px]', col.color)}>
                  <div className="flex items-center justify-between mb-4">
                    <div className="flex items-center gap-2">
                      {STATUS_ICONS[col.status]}
                      <h3 className="text-sm font-semibold text-slate-700">{col.label}</h3>
                      <span className="text-xs text-slate-400 bg-slate-100 rounded-full px-2 py-0.5">{colTasks.length}</span>
                    </div>
                  </div>

                  <div className="space-y-2.5">
                    {colTasks.map(task => (
                      <motion.div
                        key={task.id}
                        layout
                        initial={{ opacity: 0, y: 8 }}
                        animate={{ opacity: 1, y: 0 }}
                        className="bg-white rounded-lg border border-slate-200 p-3 hover:border-slate-300 transition-colors group"
                      >
                        <div className="flex items-start justify-between gap-2">
                          <div className="flex-1 min-w-0">
                            <p className="text-sm font-medium text-slate-800 leading-tight">{task.title}</p>
                            {task.description && (
                              <p className="text-xs text-slate-400 mt-1 line-clamp-2">{task.description}</p>
                            )}
                          </div>
                          <button
                            type="button"
                            onClick={() => deleteTask(task.id)}
                            className="opacity-0 group-hover:opacity-100 text-slate-300 hover:text-red-400 transition-all cursor-pointer shrink-0"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                        </div>

                        <div className="flex items-center gap-2 mt-2.5">
                          <span className={cn('text-[10px] font-medium px-1.5 py-0.5 rounded', PRIORITY_COLORS[task.priority])}>
                            {task.priority}
                          </span>
                          <div className="flex items-center gap-1 text-[10px] text-slate-400">
                            <Users className="w-3 h-3" />
                            {task.assignee}
                          </div>
                          {task.linkedDoc && (
                            <div className="flex items-center gap-1 text-[10px] text-[#4B83C4]">
                              <Link2 className="w-3 h-3" />
                              Linked
                            </div>
                          )}
                        </div>

                        {/* Status quick-change */}
                        <div className="flex items-center gap-1 mt-2.5 pt-2 border-t border-slate-100">
                          {columns.filter(c => c.status !== task.status).map(c => (
                            <button
                              key={c.status}
                              type="button"
                              onClick={() => updateTaskStatus(task.id, c.status)}
                              className="flex items-center gap-1 text-[10px] text-slate-400 hover:text-slate-700 transition-colors cursor-pointer"
                            >
                              <ArrowRight className="w-2.5 h-2.5" />
                              {c.label}
                            </button>
                          ))}
                        </div>
                      </motion.div>
                    ))}

                    {colTasks.length === 0 && (
                      <p className="text-xs text-slate-400 text-center py-6">No tasks here yet</p>
                    )}
                  </div>
                </div>
              )
            })}
          </div>
        )}

        {/* ── Ideas tab ── */}
        {activeTab === 'ideas' && (
          <div>
            <div className="flex items-center justify-between mb-4">
              <p className="text-sm text-slate-500">
                Sticky notes and ideas from the whole team. Drag thoughts out of your head.
              </p>
              <button
                type="button"
                onClick={() => setShowAddIdea(true)}
                className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg border border-slate-200 text-slate-600 text-xs font-medium hover:bg-slate-50 transition-colors cursor-pointer"
              >
                <StickyNote className="w-3.5 h-3.5" />
                Add idea
              </button>
            </div>

            <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-3">
              {ideas.map(idea => (
                <motion.div
                  key={idea.id}
                  layout
                  initial={{ opacity: 0, scale: 0.95 }}
                  animate={{ opacity: 1, scale: 1 }}
                  className="rounded-xl p-4 min-h-[120px] relative group"
                  style={{ background: idea.color, boxShadow: '0 2px 8px rgba(0,0,0,0.06)' }}
                >
                  <button
                    type="button"
                    onClick={() => deleteIdea(idea.id)}
                    className="absolute top-2 right-2 opacity-0 group-hover:opacity-100 text-slate-400 hover:text-red-500 transition-all cursor-pointer"
                  >
                    <X className="w-3.5 h-3.5" />
                  </button>
                  <GripVertical className="w-3.5 h-3.5 text-slate-300 mb-2" />
                  <p className="text-sm text-slate-700 leading-relaxed">{idea.text}</p>
                  <div className="mt-3 flex items-center justify-between">
                    <span className="text-[10px] text-slate-400 font-medium">{idea.author}</span>
                    <span className="text-[10px] text-slate-400">
                      {new Date(idea.createdAt).toLocaleDateString()}
                    </span>
                  </div>
                </motion.div>
              ))}

              {ideas.length === 0 && (
                <div className="col-span-full text-center py-12">
                  <Lightbulb className="w-8 h-8 text-slate-300 mx-auto mb-3" />
                  <p className="text-sm text-slate-400">No ideas yet. Add your first brainstorm!</p>
                </div>
              )}
            </div>
          </div>
        )}

        {/* ── Insights tab ── */}
        {activeTab === 'insights' && (
          <div className="max-w-2xl space-y-4">
            <div className="rounded-xl border border-slate-200 bg-white p-5">
              <div className="flex items-center gap-2 mb-3">
                <Sparkles className="w-4 h-4 text-[#4B83C4]" />
                <h3 className="text-sm font-semibold text-slate-800">Workflow Summary</h3>
              </div>
              <div className="grid grid-cols-3 gap-4 mb-4">
                <div className="text-center p-3 rounded-lg bg-slate-50">
                  <p className="text-2xl font-bold text-slate-800">{tasks.filter(t => t.status === 'todo').length}</p>
                  <p className="text-xs text-slate-400 mt-1">To Do</p>
                </div>
                <div className="text-center p-3 rounded-lg bg-[#EBF1F7]">
                  <p className="text-2xl font-bold text-[#4B83C4]">{tasks.filter(t => t.status === 'in-progress').length}</p>
                  <p className="text-xs text-slate-400 mt-1">In Progress</p>
                </div>
                <div className="text-center p-3 rounded-lg bg-emerald-50">
                  <p className="text-2xl font-bold text-emerald-600">{tasks.filter(t => t.status === 'done').length}</p>
                  <p className="text-xs text-slate-400 mt-1">Completed</p>
                </div>
              </div>
              <div className="border-t border-slate-100 pt-3">
                <p className="text-xs text-slate-500 leading-relaxed">
                  {tasks.length === 0
                    ? 'Add some tasks to get started. Insights will appear here as your workflow grows.'
                    : `You have ${tasks.length} total tasks across your workflow. ${tasks.filter(t => t.status === 'done').length} completed so far. ${ideas.length} ideas on the wall.`
                  }
                </p>
              </div>
            </div>

            <div className="rounded-xl border border-slate-200 bg-white p-5">
              <div className="flex items-center gap-2 mb-3">
                <AlertTriangle className="w-4 h-4 text-amber-500" />
                <h3 className="text-sm font-semibold text-slate-800">Conflict Detection</h3>
              </div>
              <p className="text-xs text-slate-500 mb-3">
                Press &ldquo;Check conflicts&rdquo; above to scan your workflow for overlapping assignments, bottlenecks, or resource issues.
              </p>
              {conflictResult && (
                <div className={cn(
                  'rounded-lg p-3 text-sm',
                  conflictResult.includes('No conflicts') ? 'bg-emerald-50 text-emerald-700' : 'bg-amber-50 text-amber-700'
                )}>
                  {conflictResult}
                </div>
              )}
            </div>

            <div className="rounded-xl border border-slate-200 bg-white p-5">
              <div className="flex items-center gap-2 mb-3">
                <Link2 className="w-4 h-4 text-[#4B83C4]" />
                <h3 className="text-sm font-semibold text-slate-800">Linked Resources</h3>
              </div>
              <p className="text-xs text-slate-500">
                Link documents and sticky notes to tasks for a complete project view. Use the task board to connect resources.
              </p>
            </div>
          </div>
        )}
      </div>

      {/* ── Add task modal ── */}
      <AnimatePresence>
        {showAddTask && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-50 bg-black/30 flex items-center justify-center"
            onClick={() => setShowAddTask(false)}
          >
            <motion.div
              initial={{ scale: 0.95, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.95, opacity: 0 }}
              onClick={e => e.stopPropagation()}
              className="bg-white rounded-2xl border border-slate-200 w-full max-w-md p-6 mx-4"
            >
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-lg font-semibold text-slate-800">New Task</h3>
                <button type="button" onClick={() => setShowAddTask(false)} className="text-slate-400 hover:text-slate-600 cursor-pointer">
                  <X className="w-4 h-4" />
                </button>
              </div>

              <div className="space-y-3">
                <div>
                  <label className="text-xs font-medium text-slate-600">Title</label>
                  <input
                    ref={titleRef}
                    type="text"
                    value={newTask.title}
                    onChange={e => setNewTask(p => ({ ...p, title: e.target.value }))}
                    onKeyDown={e => { if (e.key === 'Enter') addTask() }}
                    placeholder="What needs to be done?"
                    className="w-full mt-1 text-sm border border-slate-200 rounded-lg px-3 py-2.5 outline-none focus:border-[#C4D4E4] transition-colors"
                  />
                </div>
                <div>
                  <label className="text-xs font-medium text-slate-600">Description</label>
                  <textarea
                    value={newTask.description}
                    onChange={e => setNewTask(p => ({ ...p, description: e.target.value }))}
                    placeholder="Add more details..."
                    rows={2}
                    className="w-full mt-1 text-sm border border-slate-200 rounded-lg px-3 py-2.5 outline-none focus:border-[#C4D4E4] transition-colors resize-none"
                  />
                </div>
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="text-xs font-medium text-slate-600">Priority</label>
                    <div className="flex gap-1.5 mt-1">
                      {(['low', 'medium', 'high'] as TaskPriority[]).map(p => (
                        <button
                          key={p}
                          type="button"
                          onClick={() => setNewTask(prev => ({ ...prev, priority: p }))}
                          className={cn(
                            'flex-1 py-1.5 rounded-lg text-xs font-medium border transition-colors cursor-pointer capitalize',
                            newTask.priority === p ? PRIORITY_COLORS[p] + ' border-current' : 'border-slate-200 text-slate-400 hover:border-slate-300'
                          )}
                        >
                          {p}
                        </button>
                      ))}
                    </div>
                  </div>
                  <div>
                    <label className="text-xs font-medium text-slate-600">Assignee</label>
                    <input
                      type="text"
                      value={newTask.assignee}
                      onChange={e => setNewTask(p => ({ ...p, assignee: e.target.value }))}
                      placeholder="Name"
                      className="w-full mt-1 text-sm border border-slate-200 rounded-lg px-3 py-2 outline-none focus:border-[#C4D4E4] transition-colors"
                    />
                  </div>
                </div>
              </div>

              <button
                type="button"
                onClick={addTask}
                disabled={!newTask.title.trim()}
                className="w-full mt-4 py-2.5 rounded-lg bg-[#191919] text-white text-sm font-medium hover:bg-[#150C00] transition-colors cursor-pointer disabled:opacity-40"
              >
                Create task
              </button>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* ── Add idea modal ── */}
      <AnimatePresence>
        {showAddIdea && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-50 bg-black/30 flex items-center justify-center"
            onClick={() => setShowAddIdea(false)}
          >
            <motion.div
              initial={{ scale: 0.95, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.95, opacity: 0 }}
              onClick={e => e.stopPropagation()}
              className="bg-white rounded-2xl border border-slate-200 w-full max-w-sm p-6 mx-4"
            >
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-lg font-semibold text-slate-800">New Idea</h3>
                <button type="button" onClick={() => setShowAddIdea(false)} className="text-slate-400 hover:text-slate-600 cursor-pointer">
                  <X className="w-4 h-4" />
                </button>
              </div>

              <textarea
                value={newIdea}
                onChange={e => setNewIdea(e.target.value)}
                placeholder="What's on your mind?"
                rows={3}
                className="w-full text-sm border border-slate-200 rounded-lg px-3 py-2.5 outline-none focus:border-[#C4D4E4] transition-colors resize-none mb-3"
              />

              <div className="flex items-center gap-2 mb-4">
                <span className="text-xs text-slate-500">Color:</span>
                {IDEA_COLORS.map(c => (
                  <button
                    key={c}
                    type="button"
                    onClick={() => setNewIdeaColor(c)}
                    className={cn(
                      'w-6 h-6 rounded-full border-2 cursor-pointer transition-transform',
                      newIdeaColor === c ? 'border-[#4B83C4] scale-110' : 'border-transparent'
                    )}
                    style={{ background: c }}
                  />
                ))}
              </div>

              <button
                type="button"
                onClick={addIdea}
                disabled={!newIdea.trim()}
                className="w-full py-2.5 rounded-lg bg-[#191919] text-white text-sm font-medium hover:bg-[#150C00] transition-colors cursor-pointer disabled:opacity-40"
              >
                Add to wall
              </button>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  )
}
