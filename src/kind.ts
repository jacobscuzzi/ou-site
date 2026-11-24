import type { Layer } from './api/types'

export type DanceKind = 'club' | 'bar'

export function danceKind(kinds: string[] | undefined, layer: Layer): DanceKind | null {
  if (layer !== 'dance' || !kinds) return null
  if (kinds.includes('club')) return 'club'
  return kinds.includes('bar') ? 'bar' : null
}
