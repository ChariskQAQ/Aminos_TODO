import { useTodos } from './hooks/useTodos'
import { TileGrid } from './components/TileGrid'
import { PomodoroTile } from './components/PomodoroTile'

export default function WidgetApp() {
  const { activeTodos, todos, loading, toggle, remove } = useTodos()

  // Build subtask progress map: parentId -> { total, done }
  const subProgress = new Map<number, { total: number; done: number }>()
  for (const t of todos) {
    if (t.parent_id !== null) {
      const entry = subProgress.get(t.parent_id) || { total: 0, done: 0 }
      entry.total++
      if (t.completed) entry.done++
      subProgress.set(t.parent_id, entry)
    }
  }

  const today = new Date()
  today.setHours(0, 0, 0, 0)
  const availableTodos = activeTodos.filter((t) => {
    if (!t.start_date) return true
    return new Date(t.start_date) <= today
  })

  if (loading) {
    return (
      <div className="widget-loading">
        <span>...</span>
      </div>
    )
  }

  return (
    <div className="widget">
      <div className="widget-drag-area" />
      <div className="widget-title">待办事项</div>
      <div className="resize-edge resize-n" />
      <div className="resize-edge resize-s" />
      <div className="resize-edge resize-e" />
      <div className="resize-edge resize-w" />
      <div className="resize-edge resize-nw" />
      <div className="resize-edge resize-ne" />
      <div className="resize-edge resize-sw" />
      <div className="resize-edge resize-se" />
      <PomodoroTile />
      <TileGrid todos={availableTodos} subProgress={subProgress} onToggle={toggle} onDelete={remove} />
      {availableTodos.length === 0 && (
        <div className="widget-empty">
          <span>✨ 全部完成</span>
        </div>
      )}
    </div>
  )
}
