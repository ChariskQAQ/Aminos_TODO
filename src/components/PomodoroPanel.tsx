import type { PomodoroState } from '../hooks/usePomodoro'

interface Props {
  state: PomodoroState
  progress: number
  onStart: () => void
  onPause: () => void
  onResume: () => void
  onStop: () => void
}

function fmtTime(seconds: number): string {
  const m = Math.floor(seconds / 60)
  const s = seconds % 60
  return `${String(m).padStart(2, '0')}:${String(s).padStart(2, '0')}`
}

const CIRCLE_R = 64
const CIRCUMFERENCE = 2 * Math.PI * CIRCLE_R

export function PomodoroPanel({ state, progress, onStart, onPause, onResume, onStop }: Props) {
  const isRunning = state.phase !== 'idle'
  const dashOffset = CIRCUMFERENCE * (1 - progress)

  return (
    <div className="pomodoro-panel">
      <div className="pomodoro-ring-wrap">
        <svg className="pomodoro-ring" viewBox="0 0 144 144">
          <circle
            className="pomodoro-ring-bg"
            cx="72" cy="72" r={CIRCLE_R}
            fill="none"
            strokeWidth="6"
          />
          <circle
            className={`pomodoro-ring-fg ${state.phase === 'break' ? 'break' : ''}`}
            cx="72" cy="72" r={CIRCLE_R}
            fill="none"
            strokeWidth="6"
            strokeLinecap="round"
            strokeDasharray={CIRCUMFERENCE}
            strokeDashoffset={dashOffset}
            transform="rotate(-90 72 72)"
          />
        </svg>
        <div className="pomodoro-time">
          <span className="pomodoro-time-text">{fmtTime(state.remaining)}</span>
          <span className="pomodoro-phase-label">
            {state.phase === 'work' ? '专注' : state.phase === 'break' ? '休息' : '就绪'}
          </span>
        </div>
      </div>

      {state.todoTitle && (
        <div className="pomodoro-todo-label">
          正在专注：{state.todoTitle}
        </div>
      )}

      {state.sessionCount > 0 && (
        <div className="pomodoro-sessions">
          已完成 {state.sessionCount} 个番茄
        </div>
      )}

      <div className="pomodoro-controls">
        {state.phase === 'idle' ? (
          <button className="pomodoro-btn primary" onClick={onStart}>
            ▶ 开始
          </button>
        ) : (
          <>
            {state.remaining > 0 && (
              isRunning ? (
                <button className="pomodoro-btn" onClick={onPause}>
                  ⏸ 暂停
                </button>
              ) : (
                <button className="pomodoro-btn primary" onClick={onResume}>
                  ▶ 继续
                </button>
              )
            )}
            <button className="pomodoro-btn danger" onClick={onStop}>
              ■ 结束
            </button>
          </>
        )}
      </div>
    </div>
  )
}
