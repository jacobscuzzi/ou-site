// The device position, shared by the map's locate button and "near me" searches.
// Kept in memory only, never stored; a position older than FRESH_MS is asked again.

export type Position = [number, number]

const FRESH_MS = 10 * 60 * 1000

let last: { at: Position; t: number } | null = null
const listeners = new Set<(at: Position) => void>()

export function freshHere(): Position | null {
  return last && Date.now() - last.t < FRESH_MS ? last.at : null
}

export function setHere(at: Position) {
  last = { at, t: Date.now() }
  for (const fn of listeners) fn(at)
}

export function onHere(fn: (at: Position) => void) {
  listeners.add(fn)
  return () => {
    listeners.delete(fn)
  }
}

// askHere shows the browser's permission prompt the first time; null when refused, unavailable or too slow.
export function askHere(): Promise<Position | null> {
  if (!navigator.geolocation) return Promise.resolve(null)
  return new Promise((resolve) => {
    navigator.geolocation.getCurrentPosition(
      (pos) => {
        const at: Position = [pos.coords.longitude, pos.coords.latitude]
        setHere(at)
        resolve(at)
      },
      () => resolve(null),
      { timeout: 10000, maximumAge: 60000 },
    )
  })
}
