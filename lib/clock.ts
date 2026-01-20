// Shared clock module: single timer that notifies subscribers at a conservative interval.
// Using a 1s interval avoids running a requestAnimationFrame loop per tab and
// reduces JS work when many Countdown components subscribe.
const subscribers = new Set<(now: number) => void>()
let intervalId: ReturnType<typeof setInterval> | null = null
let lastNow = Date.now()

function tick() {
  lastNow = Date.now()
  for (const s of subscribers) {
    try { s(lastNow) } catch {}
  }
}

export function subscribeClock(cb: (now: number) => void) {
  if (subscribers.size === 0) {
    // start a 1s timer (conservative; Countdown components internally debounce updates)
    intervalId = setInterval(tick, 1000)
  }
  subscribers.add(cb)
  // immediately notify with current time
  try { cb(lastNow) } catch {}
  return () => {
    subscribers.delete(cb)
    if (subscribers.size === 0 && intervalId != null) {
      clearInterval(intervalId)
      intervalId = null
    }
  }
}

export function nowMs() {
  return lastNow
}
