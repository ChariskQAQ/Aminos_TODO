import { invoke } from '@tauri-apps/api/core'
import { listen, type UnlistenFn } from '@tauri-apps/api/event'
import type { Api, Todo, TodoUpdate } from './types'

function createApi(): Api {
  return {
    getTodos: () => invoke<Todo[]>('get_todos'),

    addTodo: (title, description, category, priority, startDate, dueDate, repeatType, repeatDays, durationMinutes, remindMinutes) =>
      invoke<Todo>('add_todo', { title, description, category, priority, startDate, dueDate, repeatType, repeatDays, durationMinutes, remindMinutes }),

    updateTodo: (id, update) =>
      invoke<Todo | null>('update_todo', { id, update }),

    deleteTodo: (id) => invoke<void>('delete_todo', { id }),

    toggleTodo: (id) => invoke<Todo | null>('toggle_todo', { id }),

    reorderTodos: (ids) => invoke<void>('reorder_todos', { orderedIds: ids }),

    getSetting: (key) => invoke<string | null>('get_setting', { key }),

    setSetting: (key, value) => invoke<void>('set_setting', { key, value }),

    getAutoStart: () => invoke<boolean>('plugin:autostart|is_enabled'),

    setAutoStart: (enable) =>
      enable
        ? invoke<void>('plugin:autostart|enable')
        : invoke<void>('plugin:autostart|disable'),

    setTheme: (theme) => invoke<void>('set_theme', { theme }),

    getWidgetEnabled: () => invoke<boolean>('get_widget_enabled'),

    getWidgetMode: () => invoke<string>('get_widget_mode'),

    setWidgetEnabled: (enabled) => invoke<void>('set_widget_enabled', { enabled }),

    setWidgetMode: (mode) => invoke<void>('set_widget_mode', { mode }),

    showMainWindow: () => invoke<void>('show_main_window'),

    showWidget: () => invoke<void>('toggle_widget'),

    hideWidget: () => invoke<void>('toggle_widget'),

    toggleWidget: () => invoke<void>('toggle_widget'),

    addTodoQuick: (title) => invoke<void>('add_todo_quick', { title }),

    addSubtask: (parentId, title) => invoke<Todo>('add_subtask', { parentId, title }),

    getSubtasks: (parentId) => invoke<Todo[]>('get_subtasks', { parentId }),

    getCategories: () => invoke<string[]>('get_categories'),

    addCategory: (name) => invoke<void>('add_category', { name }),

    deleteCategory: (name) => invoke<void>('delete_category', { name }),

    openCalendar: () => invoke<void>('open_calendar'),

    getCloseBehavior: () =>
      invoke<string | null>('get_setting', { key: 'close_behavior' }).then((v) => v || 'tray'),

    setCloseBehavior: (behavior) =>
      invoke<void>('set_setting', { key: 'close_behavior', value: behavior }),

    getNotifyEnabled: () =>
      invoke<string | null>('get_setting', { key: 'notify_enabled' }).then((v) => v !== 'false'),

    setNotifyEnabled: (enabled) =>
      invoke<void>('set_setting', { key: 'notify_enabled', value: String(enabled) }),

    exportData: () => invoke<{ success: boolean; path?: string; error?: string }>('export_data'),

    importData: () => invoke<{ success: boolean; error?: string }>('import_data'),

    exportMarkdown: (path) => invoke<string>('export_markdown', { path }),

    onTodosUpdated: (callback: () => void): (() => void) => {
      let unlisten: UnlistenFn | null = null
      listen('todos-updated', () => callback()).then((u) => { unlisten = u })
      return () => { unlisten?.() }
    },

    onThemeChanged: (callback: (theme: string) => void): (() => void) => {
      let unlisten: UnlistenFn | null = null
      listen<string>('theme-changed', (e) => callback(e.payload)).then((u) => { unlisten = u })
      return () => { unlisten?.() }
    },
  }
}

export function initTauriApi() {
  window.api = createApi()
}
