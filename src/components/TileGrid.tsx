import { useState } from 'react'
import type { Todo } from '../types'
import { TodoTile } from './TodoTile'

interface Props {
  todos: Todo[]
  subProgress: Map<number, { total: number; done: number }>
  onToggle: (id: number) => void
  onDelete: (id: number) => void
}

export function TileGrid({ todos, subProgress, onToggle, onDelete }: Props) {
  const [dragId, setDragId] = useState<number | null>(null)

  const handleDragStart = (id: number) => setDragId(id)

  const handleDragOver = (e: React.DragEvent, targetId: number) => {
    e.preventDefault()
    if (dragId === null || dragId === targetId) return
    const ids = todos.map(t => t.id)
    const from = ids.indexOf(dragId)
    const to = ids.indexOf(targetId)
    if (from === -1 || to === -1) return
    ids.splice(from, 1)
    ids.splice(to, 0, dragId)
    window.api.reorderTodos(ids)
    setDragId(null)
  }

  return (
    <div className="tile-grid">
      {todos.map((todo) => (
        <div
          key={todo.id}
          draggable
          onDragStart={() => handleDragStart(todo.id)}
          onDragOver={(e) => handleDragOver(e, todo.id)}
          style={{ cursor: 'grab' }}
        >
          <TodoTile
            todo={todo}
            subProgress={subProgress.get(todo.id) || null}
            onToggle={onToggle}
            onDelete={onDelete}
          />
        </div>
      ))}
    </div>
  )
}
