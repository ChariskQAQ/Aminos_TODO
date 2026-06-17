export interface Todo {
  id: number
  title: string
  description: string
  category: string
  completed: number
  priority: number
  start_date: string | null
  due_date: string | null
  repeat_type: string
  repeat_days: string
  duration_minutes: number | null
  countdown_started_at: string | null
  sort_order: number
  created_at: string
  completed_at: string | null
  parent_id: number | null
  remind_minutes: number | null
}

export interface TodoUpdate {
  title?: string
  description?: string
  category?: string
  priority?: number
  start_date?: string | null
  due_date?: string | null
  repeat_type?: string
  repeat_days?: string
  duration_minutes?: number | null
  parent_id?: number | null
  remind_minutes?: number | null
}

export interface Api {
  getTodos: () => Promise<Todo[]>
  addTodo: (title: string, description: string, category: string, priority: number, startDate: string | null, dueDate: string | null, repeatType: string, repeatDays: string, durationMinutes: number | null, remindMinutes: number | null) => Promise<Todo>
  updateTodo: (id: number, update: TodoUpdate) => Promise<Todo | null>
  deleteTodo: (id: number) => Promise<void>
  reorderTodos: (ids: number[]) => Promise<void>
  toggleTodo: (id: number) => Promise<Todo | null>
  getSetting: (key: string) => Promise<string | null>
  setSetting: (key: string, value: string) => Promise<void>
  getAutoStart: () => Promise<boolean>
  setAutoStart: (enable: boolean) => Promise<void>
  setTheme: (theme: string) => Promise<void>
  getWidgetEnabled: () => Promise<boolean>
  getWidgetMode: () => Promise<string>
  setWidgetEnabled: (enabled: boolean) => Promise<void>
  setWidgetMode: (mode: string) => Promise<void>
  showMainWindow: () => Promise<void>
  showWidget: () => Promise<void>
  hideWidget: () => Promise<void>
  toggleWidget: () => Promise<void>
  getNotifyEnabled: () => Promise<boolean>
  setNotifyEnabled: (enabled: boolean) => Promise<void>
  exportData: () => Promise<{ success: boolean; path?: string; error?: string }>
  importData: () => Promise<{ success: boolean; error?: string }>
  exportMarkdown: (path: string) => Promise<string>
  addTodoQuick: (title: string) => Promise<void>
  addSubtask: (parentId: number, title: string) => Promise<Todo>
  getSubtasks: (parentId: number) => Promise<Todo[]>
  getCategories: () => Promise<string[]>
  addCategory: (name: string) => Promise<void>
  deleteCategory: (name: string) => Promise<void>
  openCalendar: () => Promise<void>
  getCloseBehavior: () => Promise<string>
  setCloseBehavior: (behavior: string) => Promise<void>
  onTodosUpdated: (callback: () => void) => () => void
  onThemeChanged: (callback: (theme: string) => void) => () => void
}

declare global {
  interface Window {
    api: Api
  }
}
