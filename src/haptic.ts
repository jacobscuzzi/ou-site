const TICK_MS = 8

export function tick() {
  try {
    if (window.matchMedia('(pointer: coarse)').matches) navigator.vibrate?.(TICK_MS)
  } catch {
    // vibration is a nicety, never worth an error
  }
}
