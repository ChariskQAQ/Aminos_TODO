import { useState, useEffect, useCallback } from 'react'
import type { Todo, TodoUpdate } from '../types'

export function useTodos() {
  const [todos, setTodos] = useState<Todo[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  const loadTodos = useCallback(async () => {
    try {
      if (!window.api) {
        setError('API not ready')
        setLoading(false)
        return
      }
      const data = await window.api.getTodos()
      setTodos(data)
      setError(null)
    } catch (e: any) {
      setError(e.message || String(e))
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => {
    loadTodos()
    if (window.api) {
      const unsub = window.api.onTodosUpdated(() => loadTodos())
      return unsub
    }
  }, [loadTodos])

  const add = useCallback(async (
    title: string, description: string, category: string,
    priority: number, startDate: string | null, dueDate: string | null,
    repeatType: string, repeatDays: string,
    durationMinutes: number | null,
    remindMinutes: number | null
  ) => {
    await window.api.addTodo(title, description, category, priority, startDate, dueDate, repeatType, repeatDays, durationMinutes, remindMinutes)
    await loadTodos()
  }, [loadTodos])

  const update = useCallback(async (id: number, upd: TodoUpdate) => {
    await window.api.updateTodo(id, upd)
    await loadTodos()
  }, [loadTodos])

  const reorder = useCallback(async (ids: number[]) => {
    await window.api.reorderTodos(ids)
    setTodos((prev) => {
      const map = new Map(prev.map((t) => [t.id, t]))
      return ids.map((id) => map.get(id)!).filter(Boolean)
    })
  }, [])

  const remove = useCallback(async (id: number) => {
    await window.api.deleteTodo(id)
    await loadTodos()
  }, [loadTodos])

  const toggle = useCallback(async (id: number) => {
    await window.api.toggleTodo(id)
    await loadTodos()
  }, [loadTodos])

  const addSubtask = useCallback(async (parentId: number, title: string) => {
    await window.api.addSubtask(parentId, title)
    await loadTodos()
  }, [loadTodos])

  // Separate top-level from subtasks
  const topLevelTodos = todos.filter((t) => t.parent_id === null)
  const activeTodos = topLevelTodos.filter((t) => !t.completed)
  const completedTodos = topLevelTodos.filter((t) => t.completed)

  // Build subtask map: parent_id → subtask list
  const subsMap = new Map<number, Todo[]>()
  for (const t of todos) {
    if (t.parent_id !== null) {
      const list = subsMap.get(t.parent_id) || []
      list.push(t)
      subsMap.set(t.parent_id, list)
    }
  }

  return { todos, activeTodos, completedTodos, subsMap, loading, error, add, update, remove, toggle, reorder, addSubtask }
}
