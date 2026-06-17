import { useState, useEffect } from 'react'
import type { Todo } from './types'
import './styles/calendar.css'

const WEEKDAYS = ['一', '二', '三', '四', '五', '六', '日']
const COLORS = ['#5ea3f0', '#e0a450', '#e0556a', '#4ec9b0', '#c586c0', '#16a085']

interface Props { onClose: () => void; onAddTodo: (date: string) => void }
type Cell = { day: number; dateStr: string; isToday: boolean; inMonth: boolean }

export function CalendarApp({ onClose, onAddTodo }: Props) {
  const [todos, setTodos] = useState<Todo[]>([])
  const [ready, setReady] = useState(false)
  const [error, setError] = useState('')
  const [year, setYear] = useState(new Date().getFullYear())
  const [month, setMonth] = useState(new Date().getMonth() + 1)
  const [animDir, setAnimDir] = useState<'left' | 'right' | null>(null)

  useEffect(() => {
    let cancelled = false
    async function init() {
      try {
        if (!window.api) { if (!cancelled) setError('API未初始化'); return }
        const all = await window.api.getTodos()
        if (!cancelled) { setTodos(all.filter((t: Todo) => !t.completed)); setReady(true) }
      } catch (e: any) { if (!cancelled) setError(e.message || String(e)) }
    }
    init()
    const cleanup = window.api?.onTodosUpdated?.(async () => {
      try { const all = await window.api.getTodos(); setTodos(all.filter((t: Todo) => !t.completed)) } catch (_) {}
    })
    return () => { cleanup?.() }
  }, [])

  useEffect(() => {
    const handleKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose()
    }
    window.addEventListener('keydown', handleKey)
    return () => window.removeEventListener('keydown', handleKey)
  }, [onClose])

  const goToToday = () => {
    const n = new Date()
    setYear(n.getFullYear())
    setMonth(n.getMonth() + 1)
  }

  const prevMonth = () => {
    setAnimDir('right')
    if (month === 1) { setYear(y => y - 1); setMonth(12) } else setMonth(m => m - 1)
  }
  const nextMonth = () => {
    setAnimDir('left')
    if (month === 12) { setYear(y => y + 1); setMonth(1) } else setMonth(m => m + 1)
  }

  const todayStr = new Date().toISOString().slice(0, 10)
  const todayDate = new Date()
  const todayWeekNum = (() => {
    const firstDay = new Date(todayDate.getFullYear(), todayDate.getMonth(), 1)
    const startDow = firstDay.getDay() || 7
    return Math.floor((todayDate.getDate() + startDow - 2) / 7)
  })()

  const inRange = (t: Todo, ds: string) => {
    if (!t.start_date && !t.due_date) return false
    if (t.start_date && t.due_date) return ds >= t.start_date && ds <= t.due_date
    return t.start_date === ds || t.due_date === ds
  }

  const buildWeeks = (): Cell[][] => {
    const firstDay = new Date(year, month - 1, 1)
    const startDow = firstDay.getDay() || 7
    const daysInMonth = new Date(year, month, 0).getDate()
    const cells: Cell[] = []
    const prevEnd = new Date(year, month - 1, 0).getDate()
    for (let i = startDow - 2; i >= 0; i--) {
      const pm = month === 1 ? 12 : month - 1
      const py = month === 1 ? year - 1 : year
      cells.push({ day: prevEnd - i, dateStr: `${py}-${String(pm).padStart(2,'0')}-${String(prevEnd - i).padStart(2,'0')}`, isToday: false, inMonth: false })
    }
    for (let d = 1; d <= daysInMonth; d++) {
      const ds = `${year}-${String(month).padStart(2,'0')}-${String(d).padStart(2,'0')}`
      cells.push({ day: d, dateStr: ds, isToday: ds === todayStr, inMonth: true })
    }
    const rem = 42 - cells.length
    for (let d = 1; d <= rem; d++) {
      const nm = month === 12 ? 1 : month + 1; const ny = month === 12 ? year + 1 : year
      cells.push({ day: d, dateStr: `${ny}-${String(nm).padStart(2,'0')}-${String(d).padStart(2,'0')}`, isToday: false, inMonth: false })
    }
    const weeks: Cell[][] = []
    for (let i = 0; i < cells.length; i += 7) weeks.push(cells.slice(i, i + 7))
    return weeks
  }

  const spanTodos = todos.filter(t => t.start_date && t.due_date && t.start_date !== t.due_date)
  const pointTodos = todos.filter(t => !(t.start_date && t.due_date && t.start_date !== t.due_date))

  if (error) {
    return <div className="calendar-loading"><p className="calendar-error">加载失败: {error}</p></div>
  }
  if (!ready) {
    return <div className="calendar-loading"><p className="calendar-loading-text">加载中...</p></div>
  }

  const weeks = buildWeeks()

  const isCurrentMonth = year === todayDate.getFullYear() && month === todayDate.getMonth() + 1

  const spanColorMap = new Map<number, string>()
  spanTodos.forEach((t, i) => spanColorMap.set(t.id, COLORS[i % COLORS.length]))

  return (
    <div className="calendar-app">
      <div className="calendar-header">
        <button className="cal-close-btn" onClick={onClose}>✕</button>
        <div className="calendar-nav">
          <button className="cal-nav-btn" onClick={prevMonth}>
            <svg width="20" height="20" viewBox="0 0 20 20"><path d="M12 4l-6 6 6 6" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/></svg>
          </button>
          <h2 className="cal-title" onClick={goToToday}>
            <span className="cal-year">{year}年</span>
            <span className="cal-month">{month}月</span>
          </h2>
          <button className="cal-nav-btn" onClick={nextMonth}>
            <svg width="20" height="20" viewBox="0 0 20 20"><path d="M8 4l6 6-6 6" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/></svg>
          </button>
        </div>
        {!isCurrentMonth && (
          <button className="cal-today-btn" onClick={goToToday}>今天</button>
        )}
      </div>

      <div className="calendar-grid">
        <div className="cal-weekday-row">
          {WEEKDAYS.map((d, i) => (
            <div key={d} className={`cal-weekday ${i >= 5 ? 'cal-weekend' : ''}`}>{d}</div>
          ))}
        </div>

        <div className="cal-weeks-container" key={`${year}-${month}`}>
          {weeks.map((week, wi) => {
            const isCurrentWeek = isCurrentMonth && wi === todayWeekNum

            const spans: { todo: Todo; startCol: number; endCol: number }[] = []
            spanTodos.forEach(t => {
              let startCol = -1, endCol = -1
              week.forEach((cell, ci) => {
                if (inRange(t, cell.dateStr)) {
                  if (startCol === -1) startCol = ci
                  endCol = ci
                }
              })
              if (startCol >= 0) spans.push({ todo: t, startCol, endCol })
            })

            spans.sort((a, b) => (b.endCol - b.startCol) - (a.endCol - a.startCol) || b.todo.priority - a.todo.priority)

            const rows: { todo: Todo; startCol: number; endCol: number; row: number }[] = []
            spans.forEach(sp => {
              let row = 0
              while (rows.some(r => r.row === row && !(sp.endCol < r.startCol || sp.startCol > r.endCol))) {
                row++
              }
              rows.push({ ...sp, row })
            })

            return (
              <div key={wi} className={`cal-week-row ${isCurrentWeek ? 'cal-current-week' : ''}`}>
                {week.map((cell, ci) => {
                  const pt = pointTodos.filter(t => inRange(t, cell.dateStr))
                  const isWeekend = ci >= 5
                  return (
                    <div key={ci} className={`cal-day ${!cell.inMonth ? 'cal-other-month' : ''} ${cell.isToday ? 'cal-today' : ''} ${isWeekend ? 'cal-weekend-day' : ''}`}
                      onClick={() => cell.inMonth && onAddTodo(cell.dateStr)}
                      title={cell.inMonth ? '点击添加待办' : ''}
                    >
                      <span className="cal-day-num">{cell.day}</span>
                      {cell.inMonth && <span className="cal-day-plus">＋</span>}
                      <div className="cal-todos">
                        {pt.slice(0, 3).map(t => {
                          const pc = t.priority === 2 ? 'cal-urgent' : t.priority === 1 ? 'cal-important' : ''
                          return (
                            <div key={t.id} className={`cal-todo ${pc}`} title={t.title}>
                              {t.title.length > 6 ? t.title.slice(0, 6) + '…' : t.title}
                            </div>
                          )
                        })}
                        {pt.length > 3 && <div className="cal-todo-more">+{pt.length - 3}</div>}
                      </div>
                    </div>
                  )
                })}

                {rows.map((r, ri) => {
                  const leftPct = (r.startCol / 7) * 100
                  const widthPct = ((r.endCol - r.startCol + 1) / 7) * 100
                  const topOffset = 28 + r.row * 22
                  return (
                    <div key={ri} className="cal-span-bar" title={r.todo.title} style={{
                      left: `calc(${leftPct}% + 3px)`,
                      top: topOffset,
                      width: `calc(${widthPct}% - 6px)`,
                      background: `linear-gradient(135deg, ${spanColorMap.get(r.todo.id)}cc, ${spanColorMap.get(r.todo.id)}88)`,
                    }}>
                      {r.todo.title}
                    </div>
                  )
                })}
              </div>
            )
          })}
        </div>
      </div>
    </div>
  )
}
