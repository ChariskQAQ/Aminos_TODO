import { useState, useEffect } from 'react'
import { useTheme } from '../hooks/useTheme'

interface Props {
  onBack: () => void
}

const themeOptions = [
  { value: 'dark', label: '深色模式' },
  { value: 'light', label: '浅色模式' },
  { value: 'system', label: '跟随系统' },
] as const

const widgetModeOptions = [
  { value: 'always_on_top', label: '显示在最顶层' },
  { value: 'desktop', label: '仅显示在桌面' },
] as const

export function SettingsPage({ onBack }: Props) {
  const { theme, setTheme } = useTheme()
  const [autoStart, setAutoStart] = useState(false)
  const [widgetEnabled, setWidgetEnabled] = useState(true)
  const [widgetMode, setWidgetMode] = useState('always_on_top')
  const [notifyEnabled, setNotifyEnabled] = useState(true)
  const [closeBehavior, setCloseBehavior] = useState('tray')
  const [defaultRemind, setDefaultRemind] = useState('null')
  const [dndStart, setDndStart] = useState('')
  const [dndEnd, setDndEnd] = useState('')
  const [categories, setCategories] = useState<string[]>([])
  const [newCat, setNewCat] = useState('')

  useEffect(() => {
    window.api.getAutoStart().then(setAutoStart)
    window.api.getWidgetEnabled().then(setWidgetEnabled)
    window.api.getWidgetMode().then(setWidgetMode)
    window.api.getNotifyEnabled().then(setNotifyEnabled)
    window.api.getCloseBehavior().then(setCloseBehavior)
    window.api.getSetting('default_remind_minutes').then((v) => setDefaultRemind(v || 'null'))
    window.api.getSetting('dnd_start').then((v) => setDndStart(v || ''))
    window.api.getSetting('dnd_end').then((v) => setDndEnd(v || ''))
    window.api.getCategories().then(setCategories)
  }, [])

  useEffect(() => {
    const handleKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onBack()
    }
    window.addEventListener('keydown', handleKey)
    return () => window.removeEventListener('keydown', handleKey)
  }, [onBack])

  return (
    <div className="settings-page">
      <button className="btn-back" onClick={onBack}>
        ← 返回
      </button>
      <h2>设置</h2>

      {/* Theme */}
      <div className="setting-section">
        <h3 className="setting-section-title">主题</h3>
        {themeOptions.map((opt) => (
          <label
            key={opt.value}
            className={`setting-radio ${theme === opt.value ? 'selected' : ''}`}
            onClick={() => setTheme(opt.value)}
          >
            <span className="radio-circle">
              {theme === opt.value && <span className="radio-dot" />}
            </span>
            <span>{opt.label}</span>
          </label>
        ))}
      </div>

      {/* Widget */}
      <div className="setting-section">
        <h3 className="setting-section-title">桌面磁贴</h3>
        <div className="setting-item">
          <div className="setting-label">
            <span>启用桌面磁贴</span>
          </div>
          <label className="toggle-switch">
            <input
              type="checkbox"
              checked={widgetEnabled}
              onChange={async () => {
                const v = !widgetEnabled
                setWidgetEnabled(v)
                await window.api.setWidgetEnabled(v)
              }}
            />
            <span className="toggle-slider"></span>
          </label>
        </div>
        <div className="setting-item" style={{ flexDirection: 'column', alignItems: 'stretch', gap: 8 }}>
          <div className="setting-label">
            <span>默认提醒</span>
            <span className="setting-hint">新建待办时的默认提前提醒时间</span>
          </div>
          <select
            className="detail-select"
            value={defaultRemind}
            onChange={async (e) => {
              const v = e.target.value
              setDefaultRemind(v)
              if (v === 'null') await window.api.setSetting('default_remind_minutes', '')
              else await window.api.setSetting('default_remind_minutes', v)
            }}
          >
            <option value="null">不提醒</option>
            <option value="0">准时</option>
            <option value="10">提前10分钟</option>
            <option value="30">提前30分钟</option>
            <option value="60">提前1小时</option>
            <option value="1440">提前1天</option>
          </select>
        </div>
        <div className="setting-item" style={{ flexDirection: 'column', alignItems: 'stretch', gap: 8 }}>
          <div className="setting-label">
            <span>勿扰时段</span>
            <span className="setting-hint">在此时段内不发送任何提醒通知</span>
          </div>
          <div style={{ display: 'flex', gap: 8, alignItems: 'center' }}>
            <input
              type="time"
              className="detail-select"
              value={dndStart}
              onChange={async (e) => {
                setDndStart(e.target.value)
                await window.api.setSetting('dnd_start', e.target.value)
              }}
            />
            <span style={{ color: 'var(--text-muted)' }}>至</span>
            <input
              type="time"
              className="detail-select"
              value={dndEnd}
              onChange={async (e) => {
                setDndEnd(e.target.value)
                await window.api.setSetting('dnd_end', e.target.value)
              }}
            />
          </div>
        </div>
        <div className="setting-item">
          <div className="setting-label">
            <span>到期提醒</span>
            <span className="setting-hint">有逾期待办时发送系统通知</span>
          </div>
          <label className="toggle-switch">
            <input
              type="checkbox"
              checked={notifyEnabled}
              onChange={async () => {
                const v = !notifyEnabled
                setNotifyEnabled(v)
                await window.api.setNotifyEnabled(v)
              }}
            />
            <span className="toggle-slider"></span>
          </label>
        </div>
        <div className="setting-item">
          <div className="setting-label">
            <span>开机自启动</span>
            <span className="setting-hint">系统启动时自动运行 Todo</span>
          </div>
          <label className="toggle-switch">
            <input
              type="checkbox"
              checked={autoStart}
              onChange={async () => {
                const v = !autoStart
                await window.api.setAutoStart(v)
                setAutoStart(v)
              }}
            />
            <span className="toggle-slider"></span>
          </label>
        </div>
        <div className="setting-item">
          <div className="setting-label">
            <span>关闭主窗口时</span>
            <span className="setting-hint">
              {closeBehavior === 'tray' ? '隐藏到托盘，后台继续运行' : '直接退出程序'}
            </span>
          </div>
          <label className="toggle-switch">
            <input
              type="checkbox"
              checked={closeBehavior === 'quit'}
              onChange={async () => {
                const v = closeBehavior === 'tray' ? 'quit' : 'tray'
                setCloseBehavior(v)
                await window.api.setCloseBehavior(v)
              }}
            />
            <span className="toggle-slider"></span>
          </label>
        </div>
      </div>

      {/* Backup */}
      <div className="setting-section">
        <h3 className="setting-section-title">数据</h3>
        <button
          className="btn-backup"
          onClick={async () => {
            const r = await window.api.exportData()
            if (r.success) {
              alert('数据已导出到:\n' + r.path)
            }
          }}
        >
          导出数据备份
        </button>
        <button
          className="btn-backup"
          onClick={async () => {
            if (!confirm('导入将覆盖当前所有数据，确定继续？')) return
            const r = await window.api.importData()
            if (r.success) {
              window.location.reload()
            } else if (r.error !== 'cancelled') {
              alert('导入失败: ' + r.error)
            }
          }}
        >
          导入数据恢复
        </button>
        <button
          className="btn-backup"
          onClick={async () => {
            try {
              const { save } = await import('@tauri-apps/plugin-dialog')
              const filePath = await save({
                defaultPath: 'aminos-todo.md',
                filters: [{ name: 'Markdown', extensions: ['md'] }],
              })
              if (filePath) {
                const r = await window.api.exportMarkdown(filePath)
                alert(r)
              }
            } catch (e: any) {
              alert('导出失败: ' + (e?.message || String(e)))
            }
          }}
        >
          导出 Markdown
        </button>
      </div>

      {/* Category management */}
      <div className="setting-section">
        <h3 className="setting-section-title">分类管理</h3>
        <div style={{ display: 'flex', gap: 8, marginBottom: 12 }}>
          <input
            type="text"
            className="detail-select"
            placeholder="新分类名称"
            value={newCat}
            onChange={(e) => setNewCat(e.target.value)}
            onKeyDown={async (e) => {
              if (e.key === 'Enter' && newCat.trim()) {
                await window.api.addCategory(newCat.trim())
                setCategories(await window.api.getCategories())
                setNewCat('')
              }
            }}
          />
          <button
            className="batch-btn"
            onClick={async () => {
              if (!newCat.trim()) return
              await window.api.addCategory(newCat.trim())
              setCategories(await window.api.getCategories())
              setNewCat('')
            }}
          >
            添加
          </button>
        </div>
        {categories.map((c) => (
          <div key={c} className="setting-item">
            <span style={{ fontSize: 14 }}>{c}</span>
            <button
              className="batch-btn danger"
              style={{ fontSize: 11, padding: '3px 10px' }}
              onClick={async () => {
                if (!confirm(`确定删除分类「${c}」？`)) return
                await window.api.deleteCategory(c)
                setCategories(await window.api.getCategories())
              }}
            >
              删除
            </button>
          </div>
        ))}
      </div>
    </div>
  )
}
