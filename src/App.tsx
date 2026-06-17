import { useState, useEffect, useRef, lazy, Suspense } from 'react'
import { listen } from '@tauri-apps/api/event'
import type { Todo } from './types'
import { useTodos } from './hooks/useTodos'
import { usePomodoro } from './hooks/usePomodoro'
import { AddTodo } from './components/AddTodo'
import { TodoList } from './components/TodoList'
import { PomodoroPanel } from './components/PomodoroPanel'
import { playWorkDone, playBreakDone } from './utils/sound'
import { HelpPanel } from './components/HelpPanel'

const SettingsPage = lazy(() => import('./components/SettingsPage').then(m => ({ default: m.SettingsPage })))
const CalendarApp = lazy(() => import('./CalendarApp').then(m => ({ default: m.CalendarApp })))
const StatsPage = lazy(() => import('./StatsPage').then(m => ({ default: m.StatsPage })))

type View = 'main' | 'settings' | 'calendar' | 'stats'

const DEFAULT_CATEGORIES = ['工作', '个人', '学习', '其他']

const loader = <div className="app-loading"><span>加载中...</span></div>

function filterTodos(todos: Todo[], query: string, category: string, priority: number): Todo[] {
  return todos.filter((t) => {
    if (category && t.category !== category) return false
    if (priority > 0 && t.priority !== priority) return false
    if (query) {
      const q = query.toLowerCase()
      return t.title.toLowerCase().includes(q) || t.description.toLowerCase().includes(q)
    }
    return true
  })
}

export default function App() {
  const [view, setView] = useState<View>('main')
  const { todos, activeTodos, completedTodos, subsMap, loading, error, add, update, remove, toggle, reorder, addSubtask } = useTodos()
  const pomodoro = usePomodoro()
  const [pomodoroOpen, setPomodoroOpen] = useState(false)
  const [helpOpen, setHelpOpen] = useState(false)
  const addInputRef = useRef<HTMLInputElement>(null)
  const [detailOpen, setDetailOpen] = useState(false)
  const [searchQuery, setSearchQuery] = useState('')
  const [searchInput, setSearchInput] = useState('')
  const [filterCategory, setFilterCategory] = useState('')
  const [filterPriority, setFilterPriority] = useState(0)
  const [categories, setCategories] = useState<string[]>(DEFAULT_CATEGORIES)
  const [calendarDate, setCalendarDate] = useState('')
  const searchInputRef = useRef<HTMLInputElement>(null)

  const pomodoroTodoRef = useRef<{ id: number; title: string }>({ id: 0, title: '' })

  useEffect(() => {
    pomodoro.setOnEnd((phase) => {
      const info = pomodoroTodoRef.current
      if (phase === 'work') {
        playWorkDone()
        new Notification('🍅 番茄钟完成', {
          body: `「${info.title}」专注结束，休息一下吧！`,
        })
      } else if (phase === 'break') {
        playBreakDone()
        new Notification('☕ 休息结束', {
          body: '休息时间结束，可以开始下一个番茄钟了',
        })
      }
    })
  }, [])

  const startPomodoro = (todoId: number, title: string) => {
    pomodoroTodoRef.current = { id: todoId, title }
    pomodoro.start(todoId, title)
    setPomodoroOpen(true)
  }

  useEffect(() => {
    const unlisten1 = listen('focus-add-input', () => {
      addInputRef.current?.focus()
      window.scrollTo({ top: 0, behavior: 'smooth' })
    })
    const unlisten2 = listen('open-calendar', () => {
      setView('calendar')
      if (typeof window !== 'undefined') {
        const w = window as any
        if (w.__TAURI__) {
          import('@tauri-apps/api/window').then(m => {
            m.getCurrentWindow().show()
            m.getCurrentWindow().setFocus()
          }).catch(() => {})
        }
      }
    })
    return () => { unlisten1.then((u: any) => u()); unlisten2.then((u: any) => u()) }
  }, [])

  useEffect(() => {
    window.api.getCategories().then(setCategories).catch(() => {})
  }, [])

  useEffect(() => {
    const timer = setTimeout(() => setSearchQuery(searchInput), 200)
    return () => clearTimeout(timer)
  }, [searchInput])

  useEffect(() => {
    const handleKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        if (view === 'calendar' || view === 'settings') {
          setView('main')
          return
        }
      }
      if (e.ctrlKey && e.key === 'n') {
        e.preventDefault()
        if (view === 'main') {
          addInputRef.current?.focus()
          window.scrollTo({ top: 0, behavior: 'smooth' })
        }
      }
      if (e.key === '?' && !e.ctrlKey && !e.metaKey) {
        e.preventDefault()
        if (view === 'main') setHelpOpen(true)
      }
      if (e.ctrlKey && e.key === 'f') {
        e.preventDefault()
        if (view === 'main') {
          searchInputRef.current?.focus()
          searchInputRef.current?.select()
        }
      }
    }
    window.addEventListener('keydown', handleKey)
    return () => window.removeEventListener('keydown', handleKey)
  }, [view])

  const today = new Date()
  today.setHours(0, 0, 0, 0)
  const filteredActive = filterTodos(activeTodos, searchQuery, filterCategory, filterPriority)
  const pendingTodos = filteredActive.filter((t) => t.start_date && new Date(t.start_date) > today)
  const availableTodos = filteredActive.filter((t) => !t.start_date || new Date(t.start_date) <= today)
  const filteredCompleted = filterTodos(completedTodos, searchQuery, filterCategory, filterPriority)
  const hasFilter = searchQuery || filterCategory || filterPriority > 0

  if (loading) {
    return (
      <div className="app-loading">
        <span>加载中...</span>
      </div>
    )
  }

  if (error) {
    return (
      <div className="app-loading">
        <span style={{ color: '#f04040' }}>加载失败: {error}</span>
        <button
          style={{ marginTop: 12, padding: '8px 16px', cursor: 'pointer' }}
          onClick={() => window.location.reload()}
        >
          重试
        </button>
      </div>
    )
  }

  if (view === 'settings') {
    return (
      <Suspense fallback={loader}>
        <SettingsPage onBack={() => setView('main')} />
      </Suspense>
    )
  }

  if (view === 'calendar') {
    return (
      <Suspense fallback={loader}>
        <CalendarApp onClose={() => setView('main')} onAddTodo={(date) => {
          setCalendarDate(date)
          setView('main')
        }} />
      </Suspense>
    )
  }

  if (view === 'stats') {
    return (
      <Suspense fallback={loader}>
        <StatsPage onBack={() => setView('main')} />
      </Suspense>
    )
  }

  return (
    <div className="app">
      <header className="app-header">
        <h1>待办事项</h1>
        <div className="header-actions">
          <button className="btn-icon" onClick={() => setView('stats')} title="统计">
            📊
          </button>
          <button className="btn-icon" onClick={() => setView('settings')} title="设置">
            ⚙
          </button>
        </div>
      </header>

      <AddTodo onAdd={add} inputRef={addInputRef} onDetailOpen={setDetailOpen} categories={categories} initialDueDate={calendarDate} />

      {(todos.length > 0 || hasFilter) && (
        <div className="search-bar">
          <input
            ref={searchInputRef}
            type="text"
            className="search-input"
            placeholder={`搜索待办... (Ctrl+F)${searchInput ? ` — ${filteredActive.length + pendingTodos.length + filteredCompleted.length} 条` : ''}`}
            value={searchInput}
            onChange={(e) => setSearchInput(e.target.value)}
          />
          <select
            className="search-filter"
            value={filterCategory}
            onChange={(e) => setFilterCategory(e.target.value)}
          >
            <option value="">全部分类</option>
            {categories.map((c) => (
              <option key={c} value={c}>{c}</option>
            ))}
          </select>
          <select
            className="search-filter"
            value={filterPriority}
            onChange={(e) => setFilterPriority(Number(e.target.value))}
          >
            <option value={0}>全部优先级</option>
            <option value={1}>重要</option>
            <option value={2}>紧急</option>
          </select>
          {hasFilter && (
            <button
              className="btn-clear-filter"
              onClick={() => {
                setSearchQuery('')
                setSearchInput('')
                setFilterCategory('')
                setFilterPriority(0)
                searchInputRef.current?.focus()
              }}
            >
              ✕ 清除
            </button>
          )}
        </div>
      )}

      <main className="app-main">
        {pendingTodos.length > 0 && (
          <TodoList
            todos={pendingTodos}
            subsMap={subsMap}
            onToggle={toggle}
            onDelete={remove}
            onUpdate={update}
            onAddSubtask={addSubtask}
            onStartPomodoro={startPomodoro}
            searchQuery={searchQuery}
            categories={categories}
            title={`未开始 (${pendingTodos.length})`}
            collapsed
          />
        )}
        <TodoList
          todos={availableTodos}
          subsMap={subsMap}
          onToggle={toggle}
          onDelete={remove}
          onUpdate={update}
          onReorder={reorder}
          onAddSubtask={addSubtask}
          onStartPomodoro={startPomodoro}
          searchQuery={searchQuery}
          categories={categories}
          title="进行中"
        />
        {filteredCompleted.length > 0 && (
          <TodoList
            todos={filteredCompleted}
            subsMap={subsMap}
            onToggle={toggle}
            onDelete={remove}
            onUpdate={update}
            onAddSubtask={addSubtask}
            onStartPomodoro={startPomodoro}
            searchQuery={searchQuery}
            categories={categories}
            title={`已完成 (${filteredCompleted.length})`}
            collapsed
          />
        )}
      </main>

      {todos.length === 0 && (
        <div className="empty-state">
          <div className="empty-icon">📝</div>
          <p>还没有待办事项</p>
          <p className="empty-hint">在上方输入框添加你的第一个待办</p>
        </div>
      )}

      {pomodoroOpen && pomodoro.state.phase !== 'idle' && (
        <PomodoroPanel
          state={pomodoro.state}
          progress={pomodoro.progress}
          onStart={() => {}}
          onPause={pomodoro.pause}
          onResume={pomodoro.resume}
          onStop={() => { pomodoro.stop(); setPomodoroOpen(false) }}
        />
      )}

      <footer className="app-footer">
        <span>
          {hasFilter
            ? `筛选 ${availableTodos.length + pendingTodos.length + filteredCompleted.length} 条`
            : `${availableTodos.length} 项待办`}
        </span>
      </footer>

      {!detailOpen && (
        <button
          className="calendar-fab"
          onClick={() => setView('calendar')}
          title="查看月历"
        >
          📅
        </button>
      )}

      {helpOpen && <HelpPanel onClose={() => setHelpOpen(false)} />}
    </div>
  )
}
