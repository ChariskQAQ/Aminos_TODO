import { useState, useRef, memo } from 'react'
import type { Todo, TodoUpdate } from '../types'
import { TodoItem } from './TodoItem'

interface Props {
  todos: Todo[]
  subsMap: Map<number, Todo[]>
  onToggle: (id: number) => void
  onDelete: (id: number) => void
  onUpdate: (id: number, update: TodoUpdate) => void
  onReorder?: (ids: number[]) => void
  onAddSubtask: (parentId: number, title: string) => void
  onStartPomodoro: (id: number, title: string) => void
  searchQuery: string
  categories: string[]
  title: string
  collapsed?: boolean
}

export const TodoList = memo(TodoListInner)

function TodoListInner({ todos, subsMap, onToggle, onDelete, onUpdate, onReorder, onAddSubtask, onStartPomodoro, searchQuery, categories, title, collapsed = false }: Props) {
  const [isCollapsed, setIsCollapsed] = useState(collapsed)
  const dragId = useRef<number | null>(null)

  const handleDragStart = (id: number) => {
    dragId.current = id
  }

  const handleDragOver = (e: React.DragEvent, targetId: number) => {
    e.preventDefault()
    if (dragId.current === null || dragId.current === targetId) return
    const ids = todos.map((t) => t.id)
    const fromIdx = ids.indexOf(dragId.current)
    const toIdx = ids.indexOf(targetId)
    if (fromIdx === -1 || toIdx === -1) return
    ids.splice(fromIdx, 1)
    ids.splice(toIdx, 0, dragId.current)
    onReorder?.(ids)
    dragId.current = targetId
  }

  const handleDragEnd = () => {
    dragId.current = null
  }

  return (
    <div className="todo-section">
      <h2 className="section-title" onClick={() => setIsCollapsed(!isCollapsed)}>
        <span className="collapse-arrow">{isCollapsed ? '▶' : '▼'}</span>
        {title}
        <span className="section-count">{todos.length}</span>
      </h2>
      {!isCollapsed && (
        <ul className="todo-list">
          {todos.map((todo) => (
            <div
              key={todo.id}
              className="todo-item-wrapper"
              draggable
              onDragStart={() => handleDragStart(todo.id)}
              onDragOver={(e) => handleDragOver(e, todo.id)}
              onDragEnd={handleDragEnd}
            >
              <TodoItem
                todo={todo}
                subs={subsMap.get(todo.id) || []}
                subsMap={subsMap}
                onToggle={onToggle}
                onDelete={onDelete}
                onUpdate={onUpdate}
                onAddSubtask={onAddSubtask}
                onStartPomodoro={onStartPomodoro}
                searchQuery={searchQuery}
                categories={categories}
              />
            </div>
          ))}
        </ul>
      )}
    </div>
  )
}
