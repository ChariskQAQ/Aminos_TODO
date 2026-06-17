import { useState, useEffect, useRef, useCallback } from 'react'
import { emit } from '@tauri-apps/api/event'

export type PomodoroPhase = 'idle' | 'work' | 'break'

export interface PomodoroState {
  phase: PomodoroPhase
  remaining: number
  total: number
  startedAt: number
  todoId: number | null
  todoTitle: string
  sessionCount: number
}

const WORK_DURATION = 25 * 60
const BREAK_DURATION = 5 * 60

export function usePomodoro() {
  const [state, setState] = useState<PomodoroState>({
    phase: 'idle',
    remaining: WORK_DURATION,
    total: WORK_DURATION,
    startedAt: 0,
    todoId: null,
    todoTitle: '',
    sessionCount: 0,
  })
  const startTimeRef = useRef<number>(0)
  const durationRef = useRef<number>(WORK_DURATION)
  const timerRef = useRef<ReturnType<typeof setInterval> | null>(null)
  const onEndRef = useRef<((phase: PomodoroPhase) => void) | null>(null)

  const clearTimer = useCallback(() => {
    if (timerRef.current) {
      clearInterval(timerRef.current)
      timerRef.current = null
    }
  }, [])

  const tick = useCallback(() => {
    const elapsed = (Date.now() - startTimeRef.current) / 1000
    const remaining = Math.max(0, durationRef.current - elapsed)
    setState((prev) => ({ ...prev, remaining: Math.ceil(remaining) }))
    if (remaining <= 0) {
      clearTimer()
      setState((prev) => {
        const isWork = prev.phase === 'work'
        const endedPhase = prev.phase
        const nextPhase: PomodoroPhase = isWork ? 'break' : 'work'
        const nextTotal = isWork ? BREAK_DURATION : WORK_DURATION
        const nextSession = isWork ? prev.sessionCount + 1 : prev.sessionCount
        durationRef.current = nextTotal
        startTimeRef.current = Date.now()
        timerRef.current = setInterval(tick, 200)
        onEndRef.current?.(endedPhase)
        return {
          ...prev,
          phase: nextPhase,
          remaining: nextTotal,
          total: nextTotal,
          startedAt: Date.now(),
          sessionCount: nextSession,
        }
      })
    }
  }, [clearTimer])

  const start = useCallback((todoId: number, todoTitle: string) => {
    clearTimer()
    const total = WORK_DURATION
    durationRef.current = total
    startTimeRef.current = Date.now()
    setState({
      phase: 'work',
      remaining: total,
      total,
      startedAt: Date.now(),
      todoId,
      todoTitle,
      sessionCount: 0,
    })
    timerRef.current = setInterval(tick, 200)
  }, [clearTimer, tick])

  const pause = useCallback(() => {
    clearTimer()
    setState((prev) => {
      durationRef.current = prev.remaining
      return prev
    })
  }, [clearTimer])

  const resume = useCallback(() => {
    if (state.phase === 'idle') return
    startTimeRef.current = Date.now()
    timerRef.current = setInterval(tick, 200)
  }, [state.phase, tick])

  const stop = useCallback(() => {
    clearTimer()
    setState({
      phase: 'idle',
      remaining: WORK_DURATION,
      total: WORK_DURATION,
      startedAt: 0,
      todoId: null,
      todoTitle: '',
      sessionCount: 0,
    })
  }, [clearTimer])

  const setOnEnd = useCallback((fn: (phase: PomodoroPhase) => void) => {
    onEndRef.current = fn
  }, [])

  useEffect(() => {
    emit('pomodoro-state', state).catch(() => {})
  }, [state.phase, state.remaining, state.total, state.startedAt, state.todoId, state.sessionCount])

  // Progress 0-1
  const progress = state.total > 0 ? 1 - state.remaining / state.total : 0

  return { state, progress, start, pause, resume, stop, setOnEnd }
}
