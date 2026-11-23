import type { Bar, BarsResponse, Layer, LayersResponse, MapBar, Venue } from '../api/types'
import { available, catalog, inLayer, LAYERS, places, toBar, type MockPlace } from './catalog'

const vibes = ['lively', 'cosy', 'chic', 'party', 'laid_back']
const musics = ['dj', 'jazz', 'techno', 'rock']

function fromFacts(p: MockPlace) {
  const f = p.facts ?? {}
  return [...(f.music ?? []).slice(0, 1), ...(f.vibe ?? []).slice(0, 1), f.terrace ? 'terrace' : undefined, f.dancing ? 'dancing' : undefined]
}

function toMapBar(p: MockPlace): MapBar {
  const i = catalog.indexOf(p)
  const faked = !p.facts
  const terrace = faked ? i % 3 === 0 : p.facts?.terrace === true
  const dancing = faked ? i % 4 === 2 || p.layers.includes('dance') : p.facts?.dancing === true
  const tags = (faked
    ? [
        i % 6 === 5 ? undefined : vibes[i % vibes.length],
        i % 2 === 0 ? musics[(i >> 1) % musics.length] : undefined,
        terrace ? 'terrace' : undefined,
        dancing ? 'dancing' : undefined,
      ]
    : fromFacts(p)
  )
    .filter((t): t is string => Boolean(t))
    .slice(0, 3)
  const cover = i % 20 === 7 ? undefined : p.photos[0]
  return {
    id: p.id,
    name: p.name,
    lat: p.lat,
    lng: p.lng,
    arrondissement: p.arrondissement,
    quality: Math.round((0.2 + ((i * 7) % 15) * 0.05) * 100) / 100,
    pintPrice: i % 15 === 4 ? null : p.pintPrice,
    openUntil: i % 2 === 1 ? null : p.openUntil,
    tags,
    ...(terrace && { terrace: true }),
    ...(dancing && { dancing: true }),
    ...(cover && { cover }),
    ...(p.facts?.cuisine?.[0] && { cuisine: p.facts.cuisine[0] }),
    ...(p.facts?.pricePerPerson !== undefined && { pricePerPerson: p.facts.pricePerPerson }),
  }
}

export function mockBars(layer: Layer | null = null, venue: Venue = 'bar'): BarsResponse {
  return { bars: places(layer, venue).map(toMapBar), updatedAt: new Date().toISOString(), ...(layer && { layer }) }
}

export function mockLayers(): LayersResponse {
  return { layers: LAYERS.map((id) => ({ id, count: inLayer(id).length, available: available(id) })) }
}

export function mockBar(id: string): Bar {
  const place = catalog.find((p) => p.id === id)
  if (!place) {
    const err = new Error('bar not found')
    err.name = 'BarNotFound'
    throw err
  }
  return { ...toBar(place), rank: 0 }
}
