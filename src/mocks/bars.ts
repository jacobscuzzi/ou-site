import type { Bar, BarsResponse, Layer, LayersResponse, MapBar, PostsResponse, Venue } from '../api/types'
import { mockActions, placeDeal } from './events'
import { available, catalog, inLayer, kindOf, LAYERS, opening, places, toBar, type MockPlace } from './catalog'

const vibes = ['lively', 'cosy', 'chic', 'party', 'laid_back']
const musics = ['dj', 'jazz', 'techno', 'rock']
// the mock's facts as tag ids of the catalogue (src/tagCatalog.json)
const asTag: Record<string, string> = {
  lively: 'lively', party: 'lively', cosy: 'cosy', chic: 'chic', laid_back: 'laid_back', dj: 'dj', jazz: 'live_music',
  rock: 'live_music', techno: 'techno', terrace: 'terrace', dancing: 'dance_floor', live_band: 'live_music',
}

function fromFacts(p: MockPlace) {
  const f = p.facts ?? {}
  return [...(f.music ?? []).slice(0, 1), ...(f.vibe ?? []).slice(0, 1), f.terrace ? 'terrace' : undefined, f.dancing ? 'dancing' : undefined]
}

export function toMapBar(p: MockPlace): MapBar {
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
  const music = faked ? tags.filter((m) => musics.includes(m)) : (p.facts?.music ?? [])
  const tagIds = tags.map((t) => asTag[t]).filter((t): t is string => Boolean(t))
  return {
    id: p.id,
    name: p.name,
    lat: p.lat,
    lng: p.lng,
    arrondissement: p.arrondissement,
    quality: Math.round((0.2 + ((i * 7) % 15) * 0.05) * 100) / 100,
    pintPrice: i % 15 === 4 ? null : p.pintPrice,
    openUntil: opening(p).openUntil,
    kinds: [kindOf(p)],
    tags: tagIds,
    ...(terrace && { terrace: true }),
    ...(dancing && { dancing: true }),
    ...(cover && { cover }),
    ...(p.facts?.cuisine?.[0] && { cuisine: p.facts.cuisine[0], cuisines: p.facts.cuisine }),
    ...(music.length > 0 && { music }),
    ...(p.facts?.pricePerPerson !== undefined && { pricePerPerson: p.facts.pricePerPerson }),
    ...(p.facts?.coffeePrice !== undefined && { coffeePrice: p.facts.coffeePrice }),
    ...(p.facts?.dishPrice !== undefined && { dishPrice: p.facts.dishPrice }),
    ...(placeDeal(p) && { deal: true }),
    action: mockActions(p)[0],
  }
}

export function mockBars(layer: Layer | null = null, venue: Venue = 'bar'): BarsResponse {
  const mode = (b: MapBar): MapBar => (layer === 'dance' ? { ...b, danceMode: b.kinds.includes('club') ? 'club' : 'party_bar' } : b)
  return { bars: places(layer, venue).map(toMapBar).map(mode), updatedAt: new Date().toISOString(), ...(layer && { layer }) }
}

export function mockLayers(): LayersResponse {
  return { layers: LAYERS.map((id) => ({ id, count: inLayer(id).length, available: available(id) })) }
}

export function mockPosts(ids: string[]): PostsResponse {
  const out: PostsResponse['posts'] = {}
  for (const id of ids.slice(0, 30)) {
    const p = catalog.find((x) => x.id === id)
    if (p && p.posts.length > 0) out[id] = p.posts
  }
  return { posts: out }
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
