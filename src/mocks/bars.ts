import type { Bar, BarsResponse, MapBar } from '../api/types'
import bars from './bars.json'

const all = bars as Omit<Bar, 'compliant' | 'constraintsNotMet' | 'dishes'>[]

const vibes = ['lively', 'cosy', 'chic', 'party', 'laid_back']
const musics = ['dj', 'jazz', 'techno', 'rock']

function toMapBar(b: (typeof all)[number], i: number): MapBar {
  const terrace = i % 3 === 0
  const dancing = i % 4 === 2
  const tags = [
    i % 6 === 5 ? undefined : vibes[i % vibes.length],
    i % 2 === 0 ? musics[(i >> 1) % musics.length] : undefined,
    terrace ? 'terrace' : undefined,
    dancing ? 'dancing' : undefined,
  ]
    .filter((t): t is string => Boolean(t))
    .slice(0, 3)
  const cover = i % 20 === 7 ? undefined : b.photos[0]
  return {
    id: b.id,
    name: b.name,
    lat: b.lat,
    lng: b.lng,
    arrondissement: b.arrondissement,
    quality: Math.round((0.2 + ((i * 7) % 15) * 0.05) * 100) / 100,
    pintPrice: i % 15 === 4 ? null : b.pintPrice,
    openUntil: i % 2 === 1 ? null : b.openUntil,
    tags,
    ...(terrace && { terrace: true }),
    ...(dancing && { dancing: true }),
    ...(cover && { cover }),
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
  return { dishes: [], ...bar, rank: 0, compliant: true, constraintsNotMet: [] }
}
