declare global {
  interface Window {
    __ouEvents?: Record<string, string | number>[]
  }
}

// Anonymous product events: no id, no position, nothing about the visitor. Sent only when an
// endpoint is configured (VITE_EVENTS_URL); otherwise kept on the page for tests.
export function logEvent(name: string, props: Record<string, string> = {}) {
  const event = { event: name, ...props, at: Date.now() }
  ;(window.__ouEvents ??= []).push(event)
  const url = import.meta.env.VITE_EVENTS_URL
  if (!url) return
  try {
    navigator.sendBeacon?.(url, new Blob([JSON.stringify(event)], { type: 'application/json' }))
  } catch {
    return
  }
}
