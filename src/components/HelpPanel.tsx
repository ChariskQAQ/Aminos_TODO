import { useEffect } from 'react'

interface Props {
  onClose: () => void
}

const shortcuts = [
  { key: 'Ctrl + N', desc: '聚焦添加输入框' },
  { key: 'Ctrl + F', desc: '聚焦搜索框' },
  { key: 'Esc', desc: '关闭面板 / 返回主页' },
  { key: 'Ctrl + Enter', desc: '保存编辑' },
  { key: 'Ctrl + Shift + N', desc: '全局 — 打开主窗口并聚焦输入' },
  { key: 'Ctrl + Shift + M', desc: '全局 — 切换主窗口显示' },
  { key: '?', desc: '显示此快捷键面板' },
]

export function HelpPanel({ onClose }: Props) {
  useEffect(() => {
    const h = (e: KeyboardEvent) => {
      if (e.key === 'Escape' || e.key === '?') onClose()
    }
    window.addEventListener('keydown', h)
    return () => window.removeEventListener('keydown', h)
  }, [onClose])

  return (
    <div className="detail-overlay" onClick={onClose} style={{ alignItems: 'center' }}>
      <div className="help-panel" onClick={(e) => e.stopPropagation()}>
        <div className="help-header">
          <h3>快捷键</h3>
          <button className="btn-icon" onClick={onClose}>×</button>
        </div>
        <div className="help-body">
          {shortcuts.map((s) => (
            <div key={s.key} className="help-row">
              <kbd className="help-kbd">{s.key}</kbd>
              <span className="help-desc">{s.desc}</span>
            </div>
          ))}
        </div>
      </div>
    </div>
  )
}
