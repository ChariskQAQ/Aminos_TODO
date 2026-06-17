import { useState, useEffect } from 'react'

function formatRemaining(ms: number): string {
  const totalSeconds = Math.floor(ms / 1000)
  const hours = Math.floor(totalSeconds / 3600)
  const minutes = Math.floor((totalSeconds % 3600) / 60)
  const seconds = totalSeconds % 60
  if (hours > 0) {
    return `${hours}:${String(minutes).padStart(2, '0')}:${String(seconds).padStart(2, '0')}`
  }
  return `${minutes}:${String(seconds).padStart(2, '0')}`
}

export function useCountdown(
  startedAt: string | null,
  durationMinutes: number | null
): { remaining: number | null; display: string } {
  const [now, setNow] = useState(Date.now())

  useEffect(() => {
    if (!startedAt || !durationMinutes) return
    const timer = setInterval(() => setNow(Date.now()), 1000)
    return () => clearInterval(timer)
  }, [startedAt, durationMinutes])

  if (!startedAt || !durationMinutes) {
    return { remaining: null, display: '' }
  }

  const endTime = new Date(startedAt).getTime() + durationMinutes * 60 * 1000
  const remaining = Math.max(0, endTime - now)

  return { remaining, display: formatRemaining(remaining) }
}
