import { sendSession } from './api/client'

// How long the page stays visible, for the admin's visit length. No timer: the running total
// is sent once each time the page is hidden or closed, and the server keeps the largest.
export function trackVisit() {
  const id = typeof crypto.randomUUID === 'function' ? crypto.randomUUID() : null
  if (!id) return
  let since: number | null = document.visibilityState === 'visible' ? performance.now() : null
  let total = 0
  let sent = 0
  const flush = () => {
    if (since !== null) total += performance.now() - since
    since = null
    const seconds = Math.round(total / 1000)
    if (seconds < 1 || seconds === sent) return
    sent = seconds
    sendSession(id, seconds)
  }
  document.addEventListener('visibilitychange', () => {
    if (document.visibilityState === 'hidden') flush()
    else since = performance.now()
  })
  addEventListener('pagehide', flush)
}
