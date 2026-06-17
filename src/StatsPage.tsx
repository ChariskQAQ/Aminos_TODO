import { useEffect, useState } from 'react'
import type { Todo } from './types'
import './styles/stats.css'

interface Props { onBack: () => void }

const CATEGORY_COLORS: Record<string, string> = {
  工作: '#4a9eff', 个人: '#4ec9b0', 学习: '#ce9178', 其他: '#c586c0',
}

const DEFAULT_COLORS = ['#e0556a', '#e0a450', '#5ea3f0', '#4ec9b0', '#c586c0', '#16a085']

export function StatsPage({ onBack }: Props) {
  const [todos, setTodos] = useState<Todo[]>([])
  const [ready, setReady] = useState(false)

  useEffect(() => {
    window.api.getTodos().then((all) => { setTodos(all); setReady(true) }).catch(() => setReady(true))
  }, [])

  if (!ready) return <div className="stats-loading">加载中...</div>

  const total = todos.length
  const completed = todos.filter(t => t.completed !== 0).length
  const active = total - completed
  const compRate = total > 0 ? Math.round((completed / total) * 100) : 0

  // --- Category distribution ---
  const catMap = new Map<string, number>()
  for (const t of todos) {
    const c = t.category || '未分类'
    catMap.set(c, (catMap.get(c) || 0) + 1)
  }
  const catEntries = [...catMap.entries()].sort((a, b) => b[1] - a[1])

  // --- Priority distribution ---
  const prioLabels = ['普通', '重要', '紧急']
  const prioCounts = [0, 0, 0]
  for (const t of todos) { prioCounts[t.priority]++ }

  // --- Daily heatmap (last 30 days) ---
  const dayMap = new Map<string, number>()
  for (const t of todos) {
    if (!t.created_at) continue
    const d = t.created_at.slice(0, 10)
    dayMap.set(d, (dayMap.get(d) || 0) + 1)
  }
  const today = new Date()
  const heatDays: { date: string; count: number }[] = []
  for (let i = 29; i >= 0; i--) {
    const d = new Date(today)
    d.setDate(d.getDate() - i)
    const key = d.toISOString().slice(0, 10)
    heatDays.push({ date: key, count: dayMap.get(key) || 0 })
  }
  const maxHeat = Math.max(1, ...heatDays.map(d => d.count))

  // --- SVG helpers ---
  const pieR = 64
  const pieCenter = 76
  const pieViewBox = `0 0 ${pieCenter * 2} ${pieCenter * 2}`

  return (
    <div className="stats-page">
      <button className="btn-back" onClick={onBack}>← 返回</button>
      <h2>数据统计</h2>

      {/* Summary cards */}
      <div className="stats-summary">
        <div className="stat-card">
          <span className="stat-num">{total}</span>
          <span className="stat-label">总计</span>
        </div>
        <div className="stat-card">
          <span className="stat-num active">{active}</span>
          <span className="stat-label">进行中</span>
        </div>
        <div className="stat-card">
          <span className="stat-num done">{completed}</span>
          <span className="stat-label">已完成</span>
        </div>
        <div className="stat-card">
          <span className="stat-num rate">{compRate}%</span>
          <span className="stat-label">完成率</span>
        </div>
      </div>

      {/* Completion ring */}
      <div className="stats-section">
        <h3>完成进度</h3>
        <div className="stat-ring-wrap">
          <svg viewBox={pieViewBox} className="stat-ring">
            <circle cx={pieCenter} cy={pieCenter} r={pieR} fill="none"
              stroke="var(--bg-hover)" strokeWidth="10" />
            {active > 0 && (
              <circle cx={pieCenter} cy={pieCenter} r={pieR} fill="none"
                stroke="#4ec9b0" strokeWidth="10" strokeLinecap="round"
                strokeDasharray={`${2 * Math.PI * pieR}`}
                strokeDashoffset={`${2 * Math.PI * pieR * (1 - completed / total)}`}
                transform={`rotate(-90 ${pieCenter} ${pieCenter})`} />
            )}
          </svg>
          <div className="stat-ring-center">
            <span className="stat-ring-pct">{compRate}%</span>
            <span className="stat-ring-sub">已完成</span>
          </div>
        </div>
      </div>

      {/* Category pie */}
      {catEntries.length > 0 && (
        <div className="stats-section">
          <h3>分类分布</h3>
          <div className="stats-row">
            <svg viewBox="0 0 160 160" className="stat-pie">
              {(() => {
                const totalC = catEntries.reduce((s, [_, n]) => s + n, 0)
                let startAngle = -90
                return catEntries.map(([cat, count], i) => {
                  const share = count / totalC
                  const angle = share * 360
                  const large = angle > 180 ? 1 : 0
                  const endAngle = startAngle + angle
                  const r1 = startAngle * Math.PI / 180
                  const r2 = endAngle * Math.PI / 180
                  const cx = 80, cr = 60
                  const x1 = cx + cr * Math.cos(r1), y1 = cx + cr * Math.sin(r1)
                  const x2 = cx + cr * Math.cos(r2), y2 = cx + cr * Math.sin(r2)
                  const d = `M ${cx} ${cx} L ${x1} ${y1} A ${cr} ${cr} 0 ${large} 1 ${x2} ${y2} Z`
                  startAngle = endAngle
                  return <path key={cat} d={d} fill={CATEGORY_COLORS[cat] || DEFAULT_COLORS[i % DEFAULT_COLORS.length]} />
                })
              })()}
            </svg>
            <div className="stat-legend">
              {catEntries.map(([cat, count], i) => (
                <div key={cat} className="stat-legend-item">
                  <span className="stat-legend-dot" style={{ background: CATEGORY_COLORS[cat] || DEFAULT_COLORS[i % DEFAULT_COLORS.length] }} />
                  <span className="stat-legend-name">{cat}</span>
                  <span className="stat-legend-val">{count}</span>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* Priority bars */}
      <div className="stats-section">
        <h3>优先级分布</h3>
        <div className="stat-bars">
          {prioLabels.map((label, i) => {
            const maxPrio = Math.max(1, ...prioCounts)
            const pct = Math.round((prioCounts[i] / maxPrio) * 100)
            const colors = ['#888', '#e0a450', '#e0556a']
            return (
              <div key={label} className="stat-bar-row">
                <span className="stat-bar-label">{label}</span>
                <div className="stat-bar-track">
                  <div className="stat-bar-fill" style={{ width: `${pct}%`, background: colors[i] }} />
                </div>
                <span className="stat-bar-val">{prioCounts[i]}</span>
              </div>
            )
          })}
        </div>
      </div>

      {/* Daily heatmap */}
      <div className="stats-section">
        <h3>最近30天活跃度</h3>
        <div className="stat-heatmap">
          {heatDays.map((d) => {
            const level = d.count === 0 ? 0 : Math.ceil((d.count / maxHeat) * 4)
            return (
              <div
                key={d.date}
                className={`stat-heat-cell lv${level}`}
                title={`${d.date.slice(5)}: ${d.count} 条`}
              />
            )
          })}
        </div>
        <div className="stat-heat-legend">
          <span>少</span>
          <span className="stat-heat-cell lv0" />
          <span className="stat-heat-cell lv1" />
          <span className="stat-heat-cell lv2" />
          <span className="stat-heat-cell lv3" />
          <span className="stat-heat-cell lv4" />
          <span>多</span>
        </div>
      </div>
    </div>
  )
}
