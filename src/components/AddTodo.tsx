import { useState, useRef, useEffect } from 'react'

interface Props {
  onAdd: (title: string, description: string, category: string, priority: number, startDate: string | null, dueDate: string | null, repeatType: string, repeatDays: string, durationMinutes: number | null, remindMinutes: number | null) => void
  inputRef?: React.MutableRefObject<HTMLInputElement | null>
  onDetailOpen?: (open: boolean) => void
  categories: string[]
  initialDueDate?: string
}

const weekDays = ['周一', '周二', '周三', '周四', '周五', '周六', '周日']

export function AddTodo({ onAdd, inputRef, onDetailOpen, categories, initialDueDate }: Props) {
  const [title, setTitle] = useState('')
  const [description, setDescription] = useState('')
  const [category, setCategory] = useState('')
  const [priority, setPriority] = useState(0)
  const [startDate, setStartDate] = useState('')
  const [dueDate, setDueDate] = useState('')
  const [repeatType, setRepeatType] = useState('none')
  const [repeatDays, setRepeatDays] = useState<number[]>([])
  const [durationPreset, setDurationPreset] = useState('none')
  const [customMinutes, setCustomMinutes] = useState('')
  const [remindMinutes, setRemindMinutes] = useState<number | null>(null)
  const [showDetail, setShowDetail] = useState(false)

  const toggleDetail = (open: boolean) => {
    setShowDetail(open)
    onDetailOpen?.(open)
  }

  useEffect(() => {
    window.api.getSetting('default_remind_minutes').then((v) => {
      if (v) setRemindMinutes(parseInt(v, 10))
    })
  }, [showDetail])

  useEffect(() => {
    if (!showDetail) return
    const handleKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        toggleDetail(false)
      }
    }
    window.addEventListener('keydown', handleKey)
    return () => window.removeEventListener('keydown', handleKey)
  }, [showDetail])

  useEffect(() => {
    if (initialDueDate) {
      setDueDate(initialDueDate)
      toggleDetail(true)
    }
  }, [initialDueDate])

  const getDurationMinutes = (): number | null => {
    if (durationPreset === '1h') return 60
    if (durationPreset === '2h') return 120
    if (durationPreset === 'custom') {
      const m = parseInt(customMinutes, 10)
      return m > 0 ? m : null
    }
    return null
  }

  const [submitting, setSubmitting] = useState(false)

  const doSubmit = async () => {
    if (!title.trim() || submitting) return
    setSubmitting(true)
    try {
      await onAdd(
        title.trim(), description.trim(), category, priority,
        startDate || null,
        dueDate || null,
        repeatType, repeatDays.join(','),
        getDurationMinutes(),
        remindMinutes
      )
      setTitle('')
      setDescription('')
      setCategory('')
      setPriority(0)
      setStartDate('')
      setDueDate('')
      setRepeatType('none')
      setRepeatDays([])
      setDurationPreset('none')
      setCustomMinutes('')
      setRemindMinutes(null)
      toggleDetail(false)
      inputRef?.current?.focus()
    } catch (e) {
      console.error('添加待办失败:', e)
    } finally {
      setSubmitting(false)
    }
  }

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    doSubmit()
  }

  const toggleDay = (day: number) => {
    setRepeatDays((prev) =>
      prev.includes(day) ? prev.filter((d) => d !== day) : [...prev, day].sort()
    )
  }

  const hasDetail = description || category || startDate || dueDate || priority > 0 || repeatType !== 'none' || durationPreset !== 'none' || remindMinutes !== null

  const summaryParts: string[] = []
  if (category) summaryParts.push(category)
  summaryParts.push(['普通', '重要', '紧急'][priority])
  if (repeatType !== 'none') {
    if (repeatType === 'daily') summaryParts.push('每天')
    else if (repeatType === 'weekly' && repeatDays.length > 0) {
      summaryParts.push('每' + repeatDays.map((d) => weekDays[d - 1]).join('·'))
    } else if (repeatType === 'weekly') {
      summaryParts.push('每周')
    }
  }
  if (startDate) summaryParts.push(startDate)
  if (dueDate) summaryParts.push('→' + dueDate)
  if (durationPreset === '1h') summaryParts.push('1h倒计时')
  else if (durationPreset === '2h') summaryParts.push('2h倒计时')
  else if (durationPreset === 'custom' && customMinutes) summaryParts.push(customMinutes + '分钟倒计时')
  if (remindMinutes === 0) summaryParts.push('准时提醒')
  else if (remindMinutes === 10) summaryParts.push('提前10分')
  else if (remindMinutes === 30) summaryParts.push('提前30分')
  else if (remindMinutes === 60) summaryParts.push('提前1小时')
  else if (remindMinutes === 1440) summaryParts.push('提前1天')

  return (
    <>
      <form className="add-todo" onSubmit={handleSubmit}>
        <div className="add-todo-row">
          <input
            ref={inputRef}
            type="text"
            className="add-todo-input"
            placeholder="添加新的待办事项..."
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            autoFocus
          />
          <button type="submit" className="btn-add" disabled={!title.trim()}>
            添加
          </button>
        </div>

        <button
          type="button"
          className={`btn-detail-toggle ${hasDetail ? 'has-detail' : ''}`}
          onClick={() => toggleDetail(true)}
        >
          {hasDetail
            ? summaryParts.join(' · ')
            : '+ 详细待办'}
        </button>
      </form>

      {showDetail && (
        <div className="detail-overlay" onClick={() => toggleDetail(false)}>
          <div className="detail-panel" onClick={(e) => e.stopPropagation()}>
            <div className="detail-header">
              <h3>待办详情</h3>
              <button
                type="button"
                className="btn-icon"
                onClick={() => toggleDetail(false)}
              >
                ×
              </button>
            </div>

            <div className="detail-body">
              <label className="detail-field">
                <span className="detail-label">待办标题</span>
                <input
                  type="text"
                  className="detail-select"
                  placeholder="输入待办事项..."
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                  autoFocus
                />
              </label>

              <label className="detail-field">
                <span className="detail-label">备注描述</span>
                <textarea
                  className="desc-input"
                  placeholder="添加备注…（支持 Markdown）"
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  rows={3}
                  autoFocus
                />
              </label>

              <div className="detail-row">
                <label className="detail-field">
                  <span className="detail-label">优先级</span>
                  <select
                    className="detail-select"
                    value={priority}
                    onChange={(e) => setPriority(Number(e.target.value))}
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
                    value={category}
                    onChange={(e) => setCategory(e.target.value)}
                  >
                    <option value="">无分类</option>
                    {categories.map((c) => (
                      <option key={c} value={c}>{c}</option>
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
                      value={startDate}
                      onChange={(e) => setStartDate(e.target.value)}
                      placeholder="年/月/日"
                    />
                    <input
                      type="date"
                      className="date-picker-overlay"
                      value={startDate}
                      onChange={(e) => setStartDate(e.target.value)}
                    />
                  </div>
                </label>
                <label className="detail-field">
                  <span className="detail-label">截止日期</span>
                  <div className="date-input-wrap">
                    <input
                      type="text"
                      className="detail-select"
                      value={dueDate}
                      onChange={(e) => setDueDate(e.target.value)}
                      placeholder="年/月/日"
                    />
                    <input
                      type="date"
                      className="date-picker-overlay"
                      value={dueDate}
                      onChange={(e) => setDueDate(e.target.value)}
                    />
                  </div>
                </label>
              </div>

              <div className="detail-field">
                <span className="detail-label">重复提醒</span>
                <div className="repeat-options">
                  <button
                    type="button"
                    className={`repeat-btn ${repeatType === 'none' ? 'active' : ''}`}
                    onClick={() => { setRepeatType('none'); setRepeatDays([]) }}
                  >
                    不重复
                  </button>
                  <button
                    type="button"
                    className={`repeat-btn ${repeatType === 'daily' ? 'active' : ''}`}
                    onClick={() => { setRepeatType('daily'); setRepeatDays([]) }}
                  >
                    每天
                  </button>
                  <button
                    type="button"
                    className={`repeat-btn ${repeatType === 'weekly' ? 'active' : ''}`}
                    onClick={() => setRepeatType('weekly')}
                  >
                    每周
                  </button>
                </div>
                {repeatType === 'weekly' && (
                  <div className="weekday-picker">
                    {weekDays.map((day, i) => {
                      const d = i + 1
                      return (
                        <button
                          key={d}
                          type="button"
                          className={`weekday-btn ${repeatDays.includes(d) ? 'active' : ''}`}
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
                    className={`repeat-btn ${durationPreset === 'none' ? 'active' : ''}`}
                    onClick={() => { setDurationPreset('none'); setCustomMinutes('') }}
                  >
                    不设置
                  </button>
                  <button
                    type="button"
                    className={`repeat-btn ${durationPreset === '1h' ? 'active' : ''}`}
                    onClick={() => { setDurationPreset('1h'); setCustomMinutes('') }}
                  >
                    1小时
                  </button>
                  <button
                    type="button"
                    className={`repeat-btn ${durationPreset === '2h' ? 'active' : ''}`}
                    onClick={() => { setDurationPreset('2h'); setCustomMinutes('') }}
                  >
                    2小时
                  </button>
                  <button
                    type="button"
                    className={`repeat-btn ${durationPreset === 'custom' ? 'active' : ''}`}
                    onClick={() => setDurationPreset('custom')}
                  >
                    自选
                  </button>
                </div>
                {durationPreset === 'custom' && (
                  <div style={{ marginTop: 8 }}>
                    <input
                      type="number"
                      className="detail-select"
                      placeholder="输入分钟数..."
                      value={customMinutes}
                      onChange={(e) => setCustomMinutes(e.target.value)}
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
                    className={`repeat-btn ${remindMinutes === null ? 'active' : ''}`}
                    onClick={() => setRemindMinutes(null)}
                  >
                    不提醒
                  </button>
                  <button
                    type="button"
                    className={`repeat-btn ${remindMinutes === 0 ? 'active' : ''}`}
                    onClick={() => setRemindMinutes(0)}
                  >
                    准时
                  </button>
                  <button
                    type="button"
                    className={`repeat-btn ${remindMinutes === 10 ? 'active' : ''}`}
                    onClick={() => setRemindMinutes(10)}
                  >
                    10分
                  </button>
                  <button
                    type="button"
                    className={`repeat-btn ${remindMinutes === 30 ? 'active' : ''}`}
                    onClick={() => setRemindMinutes(30)}
                  >
                    30分
                  </button>
                </div>
                <div className="repeat-options" style={{ marginTop: 6 }}>
                  <button
                    type="button"
                    className={`repeat-btn ${remindMinutes === 60 ? 'active' : ''}`}
                    onClick={() => setRemindMinutes(60)}
                  >
                    1小时
                  </button>
                  <button
                    type="button"
                    className={`repeat-btn ${remindMinutes === 1440 ? 'active' : ''}`}
                    onClick={() => setRemindMinutes(1440)}
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
                onClick={() => toggleDetail(false)}
              >
                取消
              </button>
              <button
                type="button"
                className="btn-detail-add"
                onClick={doSubmit}
                disabled={!title.trim() || submitting}
              >
                {submitting ? '添加中...' : '添加待办'}
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  )
}
