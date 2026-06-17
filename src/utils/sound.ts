let _ctx: AudioContext | null = null

function ctx(): AudioContext {
  if (!_ctx) _ctx = new AudioContext()
  return _ctx
}

function beep(freq: number, duration: number, startTime: number, volume = 0.15) {
  const c = ctx()
  const osc = c.createOscillator()
  const gain = c.createGain()
  osc.type = 'sine'
  osc.frequency.value = freq
  gain.gain.setValueAtTime(volume, startTime)
  gain.gain.exponentialRampToValueAtTime(0.001, startTime + duration)
  osc.connect(gain)
  gain.connect(c.destination)
  osc.start(startTime)
  osc.stop(startTime + duration)
}

export function playWorkDone() {
  const c = ctx()
  const t = c.currentTime
  beep(523, 0.15, t, 0.15)
  beep(659, 0.15, t + 0.12, 0.15)
  beep(784, 0.15, t + 0.24, 0.15)
  beep(1047, 0.3, t + 0.36, 0.18)
}

export function playBreakDone() {
  const c = ctx()
  const t = c.currentTime
  beep(784, 0.15, t, 0.12)
  beep(659, 0.15, t + 0.12, 0.12)
  beep(523, 0.3, t + 0.24, 0.15)
}
