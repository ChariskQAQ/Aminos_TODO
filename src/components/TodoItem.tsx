import { useState, useEffect, memo } from 'react'
import type { Todo, TodoUpdate } from '../types'
import { Markdown } from './Markdown'
import { Highlight } from './Highlight'
import { useCountdown } from '../hooks/useCountdown'

interface Props {
  todo: Todo
  subs: Todo[]
  subsMap: Map<number, Todo[]>
  depth?: number
  onToggle: (id: number) => void
  onDelete: (id: number) => void
  onUpdate: (id: number, update: TodoUpdate) => void
  onAddSubtask: (parentId: number, title: string) => void
  onStartPomodoro: (id: number, title: string) => void
  searchQuery: string
  categories: string[]
}

const priorityLabels = ['', '重要', '紧急']
const priorityColors = ['', 'priority-important', 'priority-urgent']

const weekDayNames = ['', '周一', '周二', '周三', '周四', '周五', '周六', '周日']

const CATEGORY_COLORS: Record<string, string> = {
  工作: '#4a9eff', 个人: '#4ec9b0', 学习: '#ce9178', 其他: '#c586c0',
}

const weekDays = ['周一', '周二', '周三', '周四', '周五', '周六', '周日']

function formatRepeat(repeatType: string, repeatDays: string): string {
  if (repeatType === 'daily') return '每天'
  if (repeatType === 'weekly' && repeatDays) {
    const days = repeatDays.split(',').map(Number)
    return '每' + days.map((d) => weekDayNames[d] || '').filter(Boolean).join('·')
  }
  return ''
}

function getDueStatus(dueDate: string | null): { text: string; className: string } {
  if (!dueDate) return { text: '', className: '' }
  const now = new Date()
  const today = new Date(now.getFullYear(), now.getMonth(), now.getDate())
  const due = new Date(dueDate)
  if (isNaN(due.getTime())) return { text: dueDate, className: '' }
  const dueDay = new Date(due.getFullYear(), due.getMonth(), due.getDate())
  const diff = dueDay.getTime() - today.getTime()
  const days = diff / (1000 * 60 * 60 * 24)
  if (days < 0) return { text: '已过期 ' + dueDate, className: 'due-overdue' }
  if (days === 0) return { text: '今天到期 ' + dueDate, className: 'due-today' }
  if (days <= 2) return { text: '即将到期 ' + dueDate, className: 'due-soon' }
  return { text: dueDate, className: '' }
}

export const TodoItem = memo(TodoItemInner)

function TodoItemInner({ todo, subs, subsMap, depth = 0, onToggle, onDelete, onUpdate, onAddSubtask, onStartPomodoro, searchQuery, categories }: Props) {
  const dueStatus = getDueStatus(todo.due_date)
  const countdown = useCountdown(todo.countdown_started_at, todo.duration_minutes)
  const [editing, setEditing] = useState(false)
  const [subExpanded, setSubExpanded] = useState(false)
  const [subInput, setSubInput] = useState('')
  const [addingSub, setAddingSub] = useState(false)

  // Edit form state
  const [editTitle, setEditTitle] = useState('')
  const [editDesc, setEditDesc] = useState('')
  const [editCategory, setEditCategory] = useState('')
  const [editPriority, setEditPriority] = useState(0)
  const [editStartDate, setEditStartDate] = useState('')
  const [editDueDate, setEditDueDate] = useState('')
  const [editRepeatType, setEditRepeatType] = useState('none')
  const [editRepeatDays, setEditRepeatDays] = useState<number[]>([])
  const [editDurationPreset, setEditDurationPreset] = useState('none')
  const [editCustomMinutes, setEditCustomMinutes] = useState('')
  const [editRemindMinutes, setEditRemindMinutes] = useState<number | null>(null)

  const openEdit = () => {
    setEditTitle(todo.title)
    setEditDesc(todo.description)
    setEditCategory(todo.category)
    setEditPriority(todo.priority)
    setEditStartDate(todo.start_date || '')
    setEditDueDate(todo.due_date || '')
    setEditRepeatType(todo.repeat_type)
    setEditRepeatDays(todo.repeat_days ? todo.repeat_days.split(',').map(Number) : [])
    if (todo.duration_minutes === 60) setEditDurationPreset('1h')
    else if (todo.duration_minutes === 120) setEditDurationPreset('2h')
    else if (todo.duration_minutes) {
      setEditDurationPreset('custom')
      setEditCustomMinutes(String(todo.duration_minutes))
    } else {
      setEditDurationPreset('none')
    }
    setEditRemindMinutes(todo.remind_minutes ?? null)
    setEditing(true)
  }

  const getDurationMinutes = (): number | null => {
    if (editDurationPreset === '1h') return 60
    if (editDurationPreset === '2h') return 120
    if (editDurationPreset === 'custom') {
      const m = parseInt(editCustomMinutes, 10)
      return m > 0 ? m : null
    }
    return null
  }

  const saveEdit = () => {
    if (!editTitle.trim()) return
    onUpdate(todo.id, {
      title: editTitle.trim(),
      description: editDesc.trim(),
      category: editCategory,
      priority: editPriority,
      start_date: editStartDate || null,
      due_date: editDueDate || null,
      repeat_type: editRepeatType,
      repeat_days: editRepeatDays.join(','),
      duration_minutes: getDurationMinutes(),
      remind_minutes: editRemindMinutes,
    })
    setEditing(false)
  }

  const toggleDay = (day: number) => {
    setEditRepeatDays((prev) =>
      prev.includes(day) ? prev.filter((d) => d !== day) : [...prev, day].sort()
    )
  }

  useEffect(() => {
    if (!editing) return
    const handleKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') { setEditing(false); return }
      if (e.ctrlKey && e.key === 'Enter') { saveEdit() }
    }
    window.addEventListener('keydown', handleKey)
    return () => window.removeEventListener('keydown', handleKey)
  }, [editing, editTitle, editDesc, editCategory, editPriority, editStartDate, editDueDate, editRepeatType, editRepeatDays, editRemindMinutes])

  const handleSubSubmit = async (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && subInput.trim()) {
      await onAddSubtask(todo.id, subInput.trim())
      setSubInput('')
      setSubExpanded(true)
    }
  }

  const subsCompleted = subs.filter(s => s.completed).length
  const subsTotal = subs.length
  const hasSubs = subsTotal > 0

  const repeatStr = formatRepeat(todo.repeat_type, todo.repeat_days)

  return (
    <>
      <li className={`todo-item ${todo.completed ? 'completed' : ''} priority-${todo.priority}`}>
        <button
          className={`checkbox ${todo.completed ? 'checked' : ''}`}
          onClick={() => onToggle(todo.id)}
        >
          {todo.completed ? '✓' : ''}
        </button>
        <div className="todo-content" onClick={openEdit}>
          <span className="todo-title">
            <Highlight text={todo.title} query={searchQuery} />
          </span>
          {todo.description && (
            <Markdown text={todo.description} />
          )}
          <div className="todo-meta">
            {todo.category && (
              <span
                className="badge badge-category"
                style={{ color: CATEGORY_COLORS[todo.category] || '#888', borderColor: CATEGORY_COLORS[todo.category] || '#888' }}
              >
                {todo.category}
              </span>
            )}
            {repeatStr && (
              <span className="badge badge-repeat">{repeatStr}</span>
            )}
            {todo.priority > 0 && (
              <span className={`badge ${priorityColors[todo.priority]}`}>
                {priorityLabels[todo.priority]}
              </span>
            )}
            {todo.remind_minutes !== null && todo.due_date && (
              <span className="badge badge-remind">
                {todo.remind_minutes === 0 ? '⏰ 准时' :
                 todo.remind_minutes < 60 ? `⏰ ${todo.remind_minutes}分` :
                 todo.remind_minutes < 1440 ? `⏰ ${todo.remind_minutes / 60}时` :
                 `⏰ ${todo.remind_minutes / 1440}天`}
              </span>
            )}
            {hasSubs && (
              <span className="badge badge-subtask" onClick={(e) => { e.stopPropagation(); setSubExpanded(!subExpanded) }}>
                {subExpanded ? '▲' : '▶'} {subsCompleted}/{subsTotal}
              </span>
            )}
          </div>
        </div>
        {(todo.start_date || todo.due_date) && (
          <span className="todo-start">
            {todo.start_date && todo.due_date
              ? `${todo.start_date} ~ ${todo.due_date}`
              : todo.start_date || todo.due_date}
          </span>
        )}
        {!todo.start_date && dueStatus.text && (
          <span className={`todo-time ${dueStatus.className}`}>{dueStatus.text}</span>
        )}
        {countdown.remaining !== null && (
          <span className={`todo-countdown ${countdown.remaining === 0 ? 'countdown-done' : ''}`}>
            {countdown.remaining === 0 ? '⏰' : countdown.display}
          </span>
        )}
        {hasSubs && subsCompleted === subsTotal && subsTotal > 0 && (
          <span className="todo-sub-done" title="子任务全部完成">✅</span>
        )}
        <button
          className="btn-sub-add"
          onClick={(e) => { e.stopPropagation(); setAddingSub(!addingSub); setSubExpanded(true) }}
          title="添加子任务"
        >
          ＋
        </button>
        {!todo.completed && (
          <button
            className="btn-pomodoro"
            onClick={(e) => {
              e.stopPropagation()
              onStartPomodoro(todo.id, todo.title)
            }}
            title="开始番茄钟"
          >
            🍅
          </button>
        )}
        <button className="btn-edit" onClick={openEdit} title="编辑">
          ✎
        </button>
        <button className="btn-delete" onClick={() => onDelete(todo.id)} title="删除">
          ×
        </button>
      </li>

      {/* Subtask input */}
      {addingSub && (
        <div className="sub-input-row">
          <input
            type="text"
            className="sub-input"
            placeholder="输入子任务后回车..."
            value={subInput}
            onChange={(e) => setSubInput(e.target.value)}
            onKeyDown={handleSubSubmit}
            autoFocus
            onBlur={() => { if (!subInput.trim()) setAddingSub(false) }}
          />
        </div>
      )}

      {/* Subtask list */}
      {subExpanded && hasSubs && (
        <ul className="sub-list">
          {subs.map((s) => (
            <SubItem
              key={s.id}
              todo={s}
              subsMap={subsMap}
              depth={depth + 1}
              onToggle={onToggle}
              onDelete={onDelete}
              onAddSubtask={onAddSubtask}
            />
          ))}
        </ul>
      )}

      {/* Edit panel */}
      {editing && (
        <div className="detail-overlay" onClick={() => setEditing(false)}>
          <div className="detail-panel" onClick={(e) => e.stopPropagation()}>
            <div className="detail-header">
              <h3>编辑待办</h3>
              <button type="button" className="btn-icon" onClick={() => setEditing(false)}>
                ×
              </button>
            </div>

            <div className="detail-body">
              <label className="detail-field">
                <span className="detail-label">标题</span>
                <input
                  type="text"
                  className="detail-select"
                  value={editTitle}
                  onChange={(e) => setEditTitle(e.target.value)}
                  autoFocus
                />
              </label>

              <label className="detail-field">
                <span className="detail-label">备注描述</span>
                <textarea
                  className="desc-input"
                  placeholder="添加备注..."
                  value={editDesc}
                  onChange={(e) => setEditDesc(e.target.value)}
                  rows={3}
                />
              </label>

              <div className="detail-row">
                <label className="detail-field">
                  <span className="detail-label">优先级</span>
                  <select
                    className="detail-select"
                    value={editPriority}
                    onChange={(e) => setEditPriority(Number(e.target.value))}
                  >
                    <option value={0}>普通</option>
                    <option value={1}>重要</option>
                    <option value={2}>紧急</option>
                  </select>
                </label>

                <label className="detail-field">
                  <span className="detail-label">分类</span>
                  <select
                    className="detail-select"
                    value={editCategory}
                    onChange={(e) => setEditCategory(e.target.value)}
                  >
                    <option value="">无分类</option>
                    {categories.map((c) => (
                      <option key={c} value={c}>
                        {c}
                      </option>
                    ))}
                  </select>
                </label>
              </div>

              <div className="detail-row">
                <label className="detail-field">
                  <span className="detail-label">开始日期</span>
                  <div className="date-input-wrap">
                    <input
                      type="text"
                      className="detail-select"
                      value={editStartDate}
                      onChange={(e) => setEditStartDate(e.target.value)}
                      placeholder="年/月/日"
                    />
                    <input
                      type="date"
                      className="date-picker-overlay"
                      value={editStartDate}
                      onChange={(e) => setEditStartDate(e.target.value)}
                    />
                  </div>
                </label>
                <label className="detail-field">
                  <span className="detail-label">截止日期</span>
                  <div className="date-input-wrap">
                    <input
                      type="text"
                      className="detail-select"
                      value={editDueDate}
                      onChange={(e) => setEditDueDate(e.target.value)}
                      placeholder="年/月/日"
                    />
                    <input
                      type="date"
                      className="date-picker-overlay"
                      value={editDueDate}
                      onChange={(e) => setEditDueDate(e.target.value)}
                    />
                  </div>
                </label>
              </div>

              <div className="detail-field">
                <span className="detail-label">重复提醒</span>
                <div className="repeat-options">
                  <button
                    type="button"
                    className={`repeat-btn ${editRepeatType === 'none' ? 'active' : ''}`}
                    onClick={() => { setEditRepeatType('none'); setEditRepeatDays([]) }}
                  >
                    不重复
                  </button>
                  <button
                    type="button"
                    className={`repeat-btn ${editRepeatType === 'daily' ? 'active' : ''}`}
                    onClick={() => { setEditRepeatType('daily'); setEditRepeatDays([]) }}
                  >
                    每天
                  </button>
                  <button
                    type="button"
                    className={`repeat-btn ${editRepeatType === 'weekly' ? 'active' : ''}`}
                    onClick={() => setEditRepeatType('weekly')}
                  >
                    每周
                  </button>
                </div>
                {editRepeatType === 'weekly' && (
                  <div className="weekday-picker">
                    {weekDays.map((day, i) => {
                      const d = i + 1
                      return (
                        <button
                          key={d}
                          type="button"
                          className={`weekday-btn ${editRepeatDays.includes(d) ? 'active' : ''}`}
                          onClick={() => toggleDay(d)}
                        >
                          {day}
                        </button>
                      )
                    })}
                  </div>
                )}
              </div>

              <div className="detail-field">
                <span className="detail-label">倒计时</span>
                <div className="repeat-options">
                  <button
                    type="button"
                    className={`repeat-btn ${editDurationPreset === 'none' ? 'active' : ''}`}
                    onClick={() => { setEditDurationPreset('none'); setEditCustomMinutes('') }}
                  >
                    不设置
                  </button>
                  <button
                    type="button"
                    className={`repeat-btn ${editDurationPreset === '1h' ? 'active' : ''}`}
                    onClick={() => { setEditDurationPreset('1h'); setEditCustomMinutes('') }}
                  >
                    1小时
                  </button>
                  <button
                    type="button"
                    className={`repeat-btn ${editDurationPreset === '2h' ? 'active' : ''}`}
                    onClick={() => { setEditDurationPreset('2h'); setEditCustomMinutes('') }}
                  >
                    2小时
                  </button>
                  <button
                    type="button"
                    className={`repeat-btn ${editDurationPreset === 'custom' ? 'active' : ''}`}
                    onClick={() => setEditDurationPreset('custom')}
                  >
                    自选
                  </button>
                </div>
                {editDurationPreset === 'custom' && (
                  <div style={{ marginTop: 8 }}>
                    <input
                      type="number"
                      className="detail-select"
                      placeholder="输入分钟数..."
                      value={editCustomMinutes}
                      onChange={(e) => setEditCustomMinutes(e.target.value)}
                      min={1}
                      autoFocus
                    />
                  </div>
                )}
              </div>

              <div className="detail-field">
                <span className="detail-label">截止提醒</span>
                <div className="repeat-options">
                  <button
                    type="button"
                    className={`repeat-btn ${editRemindMinutes === null ? 'active' : ''}`}
                    onClick={() => setEditRemindMinutes(null)}
                  >
                    不提醒
                  </button>
                  <button
                    type="button"
                    className={`repeat-btn ${editRemindMinutes === 0 ? 'active' : ''}`}
                    onClick={() => setEditRemindMinutes(0)}
                  >
                    准时
                  </button>
                  <button
                    type="button"
                    className={`repeat-btn ${editRemindMinutes === 10 ? 'active' : ''}`}
                    onClick={() => setEditRemindMinutes(10)}
                  >
                    10分
                  </button>
                  <button
                    type="button"
                    className={`repeat-btn ${editRemindMinutes === 30 ? 'active' : ''}`}
                    onClick={() => setEditRemindMinutes(30)}
                  >
                    30分
                  </button>
                </div>
                <div className="repeat-options" style={{ marginTop: 6 }}>
                  <button
                    type="button"
                    className={`repeat-btn ${editRemindMinutes === 60 ? 'active' : ''}`}
                    onClick={() => setEditRemindMinutes(60)}
                  >
                    1小时
                  </button>
                  <button
                    type="button"
                    className={`repeat-btn ${editRemindMinutes === 1440 ? 'active' : ''}`}
                    onClick={() => setEditRemindMinutes(1440)}
                  >
                    1天
                  </button>
                </div>
              </div>
            </div>

            <div className="detail-footer">
              <button
                type="button"
                className="btn-detail-cancel"
                onClick={() => setEditing(false)}
              >
                取消
              </button>
              <button
                type="button"
                className="btn-detail-add"
                onClick={saveEdit}
                disabled={!editTitle.trim()}
              >
                保存
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  )
}

function SubItem({ todo, subsMap, depth, onToggle, onDelete, onAddSubtask }: {
  todo: Todo
  subsMap: Map<number, Todo[]>
  depth: number
  onToggle: (id: number) => void
  onDelete: (id: number) => void
  onAddSubtask: (parentId: number, title: string) => void
}) {
  const [expanded, setExpanded] = useState(false)
  const [adding, setAdding] = useState(false)
  const [title, setTitle] = useState('')
  const children = subsMap.get(todo.id) || []
  const hasChildren = children.length > 0

  const handleSubmit = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && title.trim()) {
      onAddSubtask(todo.id, title.trim())
      setTitle('')
      setAdding(false)
      setExpanded(true)
    }
    if (e.key === 'Escape') {
      setAdding(false)
      setTitle('')
    }
  }

  const indent = 24 + depth * 20

  return (
    <>
      <li className={`sub-item ${todo.completed ? 'sub-completed' : ''}`} style={{ paddingLeft: indent }}>
        <button className="sub-checkbox" onClick={() => onToggle(todo.id)}>
          {todo.completed ? '✓' : ''}
        </button>
        {hasChildren && (
          <button className="sub-expand" onClick={() => setExpanded(!expanded)}>
            {expanded ? '▾' : '▸'}
          </button>
        )}
        <span className="sub-title">{todo.title}</span>
        <button className="sub-add-sm" onClick={() => { setAdding(true); setExpanded(true) }} title="添加子任务">
          ＋
        </button>
        <button className="sub-delete" onClick={() => onDelete(todo.id)} title="删除">
          ×
        </button>
      </li>
      {adding && (
        <li className="sub-input-row" style={{ paddingLeft: indent + 20 }}>
          <input
            type="text"
            className="sub-input"
            placeholder="添加子任务..."
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            onKeyDown={handleSubmit}
            autoFocus
          />
        </li>
      )}
      {expanded && hasChildren && (
        children.map((child) => (
          <SubItem
            key={child.id}
            todo={child}
            subsMap={subsMap}
            depth={depth + 1}
            onToggle={onToggle}
            onDelete={onDelete}
            onAddSubtask={onAddSubtask}
          />
        ))
      )}
    </>
  )
}
