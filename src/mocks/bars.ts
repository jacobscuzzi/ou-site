import type { Bar, BarsResponse, MapBar } from '../api/types'
import bars from './bars.json'

const all = bars as Omit<Bar, 'compliant' | 'constraintsNotMet'>[]

function toMapBar(b: (typeof all)[number], i: number): MapBar {
  const tags = [b.facts?.vibe?.[0], b.facts?.music?.[0], b.facts?.terrace && 'terrace', b.facts?.dancing && 'dancing']
    .filter((t): t is string => Boolean(t))
    .slice(0, 3)
  return {
    id: b.id,
    name: b.name,
    lat: b.lat,
    lng: b.lng,
    arrondissement: b.arrondissement,
    quality: Math.round((0.2 + ((i * 7) % 15) * 0.05) * 100) / 100,
    pintPrice: b.pintPrice,
    openUntil: b.openUntil,
    tags,
    ...(b.facts?.terrace && { terrace: true }),
    ...(b.facts?.dancing && { dancing: true }),
    ...(b.photos[0] && { cover: b.photos[0] }),
  }
}

export function mockBars(): BarsResponse {
  return { bars: all.map(toMapBar), updatedAt: new Date().toISOString() }
}

export function mockBar(id: string): Bar {
  const bar = all.find((b) => b.id === id)
  if (!bar) {
    const err = new Error('bar not found')
    err.name = 'BarNotFound'
    throw err
  }
  return { ...bar, rank: 0, compliant: true, constraintsNotMet: [] }
}
