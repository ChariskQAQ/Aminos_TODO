import { useState, useEffect, useRef } from 'react'
import { listen } from '@tauri-apps/api/event'

interface PomodoroState {
  phase: string
  total: number
  startedAt: number
  todoTitle: string
  sessionCount: number
}

function fmtTime(seconds: number): string {
  const m = Math.floor(seconds / 60)
  const s = seconds % 60
  return `${String(m).padStart(2, '0')}:${String(s).padStart(2, '0')}`
}

const CIRCLE_R = 48
const CIRCUMFERENCE = 2 * Math.PI * CIRCLE_R

export function PomodoroTile() {
  const [sync, setSync] = useState<PomodoroState | null>(null)
  const [display, setDisplay] = useState(0)
  const isActive = sync && sync.phase !== 'idle'

  useEffect(() => {
    const u = listen<any>('pomodoro-state', (e) => {
      setSync({
        phase: e.payload.phase,
        total: e.payload.total,
        startedAt: e.payload.startedAt,
        todoTitle: e.payload.todoTitle || '',
        sessionCount: e.payload.sessionCount || 0,
      })
    })
    return () => { u.then((f) => f()) }
  }, [])

  useEffect(() => {
    if (!isActive || !sync || sync.startedAt === 0) { setDisplay(0); return }
    const tick = () => {
      const elapsed = (Date.now() - sync.startedAt) / 1000
      setDisplay(Math.max(0, Math.ceil(sync.total - elapsed)))
    }
    tick()
    const timer = setInterval(tick, 200)
    return () => clearInterval(timer)
  }, [sync?.phase, sync?.total, sync?.startedAt])

  if (!isActive) return null

  const progress = sync.total > 0 ? 1 - display / sync.total : 0
  const dashOffset = CIRCUMFERENCE * (1 - Math.min(1, progress))

  return (
    <div className="pw-tile">
      <div className="pw-tile-ring">
        <svg viewBox="0 0 108 108">
          <circle cx="54" cy="54" r={CIRCLE_R} fill="none"
            stroke="rgba(255,255,255,0.06)" strokeWidth="4" />
          <circle cx="54" cy="54" r={CIRCLE_R} fill="none"
            className={sync.phase === 'break' ? 'pw-break' : 'pw-work'}
            strokeWidth="4" strokeLinecap="round"
            strokeDasharray={CIRCUMFERENCE}
            strokeDashoffset={dashOffset}
            transform="rotate(-90 54 54)" />
        </svg>
        <div className="pw-tile-time">
          <span>{fmtTime(display)}</span>
          <span className="pw-tile-label">{sync.phase === 'work' ? '🍅' : '☕'}</span>
        </div>
      </div>
      {sync.todoTitle && <div className="pw-tile-title">{sync.todoTitle}</div>}
    </div>
  )
}
