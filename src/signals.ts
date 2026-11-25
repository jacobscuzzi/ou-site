import { useSyncExternalStore } from 'react'
import { fetchSignals, putSignal } from './api/client'
import type { Layer, SignalKind } from './api/types'

// What the device keeps of a place it marked, so "My places" can show it in any layer.
export type Snapshot = { name: string; lat: number; lng: number; layer: Layer; photo?: string; arrondissement?: string }
export type Mark = { kind: SignalKind; at: string; snap?: Snapshot }

const KEY = 'ou-signals'
let marks: Record<string, Mark> = read()
const listeners = new Set<() => void>()

function read(): Record<string, Mark> {
  try {
    return JSON.parse(localStorage.getItem(KEY) ?? '{}') ?? {}
  } catch {
    return {}
  }
}

function save() {
  try {
    localStorage.setItem(KEY, JSON.stringify(marks))
  } catch {
    // storage full or off: the marks still live on the server
  }
  listeners.forEach((fn) => fn())
}

export function useMarks(): Record<string, Mark> {
  return useSyncExternalStore(
    (fn) => {
      listeners.add(fn)
      return () => listeners.delete(fn)
    },
    () => marks,
  )
}

// Optimistic: the device shows it at once; a failed call puts the previous state back.
export function mark(placeId: string, kind: SignalKind | null, snap?: Snapshot) {
  const before = marks[placeId]
  const next = { ...marks }
  if (kind) next[placeId] = { kind, at: new Date().toISOString(), snap: snap ?? before?.snap }
  else delete next[placeId]
  marks = next
  save()
  putSignal(placeId, kind).catch(() => {
    marks = { ...marks }
    if (before) marks[placeId] = before
    else delete marks[placeId]
    save()
  })
}

export function remember(placeId: string, snap: Snapshot) {
  const m = marks[placeId]
  if (!m || (m.snap && m.snap.name === snap.name && m.snap.photo === snap.photo)) return
  marks = { ...marks, [placeId]: { ...m, snap } }
  save()
}

// On load the server's list and the device's mirror meet: the newer state of each place wins,
// and what only the device knows is sent up (the cookie may be newer than the marks).
export async function syncMarks(signal?: AbortSignal) {
  const res = await fetchSignals(signal)
  const server = new Map(res.signals.map((s) => [s.placeId, s]))
  const next = { ...marks }
  for (const [id, s] of server) {
    const local = next[id]
    if (!local || s.updatedAt > local.at) next[id] = { kind: s.kind, at: s.updatedAt, snap: local?.snap }
  }
  marks = next
  save()
  for (const [id, m] of Object.entries(marks)) {
    const s = server.get(id)
    if (!s || (s.kind !== m.kind && m.at > s.updatedAt)) void putSignal(id, m.kind).catch(() => undefined)
  }
}

export function idsOf(all: Record<string, Mark>, kind: SignalKind): Set<string> {
  return new Set(Object.entries(all).filter(([, m]) => m.kind === kind).map(([id]) => id))
}
