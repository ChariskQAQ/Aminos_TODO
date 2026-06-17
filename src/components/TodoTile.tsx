import type { Todo } from '../types'
import { useCountdown } from '../hooks/useCountdown'

interface Props {
  todo: Todo
  subProgress: { total: number; done: number } | null
  onToggle: (id: number) => void
  onDelete: (id: number) => void
}

const categoryColors: Record<string, string> = {
  '工作': '#4a9eff',
  '个人': '#4ec9b0',
  '学习': '#ce9178',
  '其他': '#c586c0',
}

function getDueInfo(dueDate: string | null): { text: string; urgent: string } {
  if (!dueDate) return { text: '', urgent: '' }
  const now = new Date()
  const today = new Date(now.getFullYear(), now.getMonth(), now.getDate())
  const due = new Date(dueDate)
  if (isNaN(due.getTime())) return { text: dueDate, urgent: '' }
  const dueDay = new Date(due.getFullYear(), due.getMonth(), due.getDate())
  const diff = dueDay.getTime() - today.getTime()
  const days = diff / (1000 * 60 * 60 * 24)
  if (days < 0) return { text: '已过期', urgent: 'overdue' }
  if (days === 0) return { text: '今天到期', urgent: 'today' }
  if (days <= 2) return { text: dueDate, urgent: 'soon' }
  return { text: dueDate, urgent: '' }
}

export function TodoTile({ todo, subProgress, onToggle, onDelete }: Props) {
  const countdown = useCountdown(todo.countdown_started_at, todo.duration_minutes)
  const accent = categoryColors[todo.category] || null
  const dueInfo = getDueInfo(todo.due_date)
  const subDone = subProgress?.done ?? 0
  const subTotal = subProgress?.total ?? 0

  const handleContextMenu = (e: React.MouseEvent) => {
    e.preventDefault()
    onDelete(todo.id)
  }

  return (
    <div
      className={`todo-tile priority-${todo.priority}`}
      style={accent ? { borderLeftColor: accent } : undefined}
      onClick={() => onToggle(todo.id)}
      onContextMenu={handleContextMenu}
    >
      <div className="tile-body">
        <span className="tile-title">{todo.title}</span>
        <div className="tile-meta">
          {subTotal > 0 && (
            <span className="tile-sub-progress">
              {subDone}/{subTotal}
            </span>
          )}
          {todo.category && (
            <span className="tile-category" style={{ color: accent! }}>
              {todo.category}
            </span>
          )}
          {todo.priority > 0 && (
            <span className={`tile-priority-dot p${todo.priority}`} />
          )}
          {countdown.remaining !== null && (
            <span className={`tile-countdown ${countdown.remaining === 0 ? 'done' : ''}`}>
              {countdown.remaining === 0 ? '⏰' : countdown.display}
            </span>
          )}
        </div>
      </div>
      {dueInfo.text && (
        <span className={`tile-due ${dueInfo.urgent}`}>{dueInfo.text}</span>
      )}
    </div>
  )
}
