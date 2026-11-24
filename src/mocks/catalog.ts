import type { Bar, Layer, OpeningPeriod, Post, Venue } from '../api/types'
import { currentPeriod, parisNow } from '../hours'
import bars from './bars.json'
import extra from './places.json'
import { mockActions, placeDeal, placeEvents } from './events'

export type MockPlace = Omit<Bar, 'compliant' | 'constraintsNotMet' | 'kinds' | 'hours' | 'openNow' | 'events' | 'deal' | 'actions'> & { layers: Layer[] }

const danceBars = new Set([
  'red-factory-paris',
  'workshow-paris',
  'cafe-charbon',
  'la-mutinerie',
  'raidd-bar',
  'rosa-bonheur-buttes-chaumont',
  'harmony-bar-de-nuit',
  'caveau-de-la-huchette',
])

const tiktok = (author: string, postId: string, kind: Post['kind'], likes: number | null): Post => ({
  platform: 'tiktok',
  postId,
  url: `https://www.tiktok.com/@${author}/${kind}/${postId}`,
  author,
  likes,
  kind,
})

const posts: Record<string, Post[]> = {
  'experimental-cocktail-club': [
    tiktok('sk_afia1', '7587788796016594198', 'photo', 877),
    tiktok('getlit.paris', '7656193801349877025', 'photo', 247),
    tiktok('tasty_bylaura', '7643377685233831176', 'video', 40),
  ],
  'cafe-charbon': [tiktok('nicolastheparisian', '7672815858439261473', 'video', 926)],
  'le-perchoir-menilmontant': [tiktok('louka_.c', '7647527797480557857', 'video', 3180)],
  'rosa-bonheur-buttes-chaumont': [tiktok('timsurtiktok99', '7649444200856948000', 'video', 558)],
  'dirty-lemon': [tiktok('the_fatmap', '7640066650405965088', 'photo', null)],
}

const drink: MockPlace[] = (bars as Omit<MockPlace, 'layers' | 'dishes' | 'posts'>[]).map((b) => ({
  ...b,
  dishes: [],
  posts: posts[b.id] ?? [],
  layers: danceBars.has(b.id) ? ['drink', 'dance'] : ['drink'],
}))

export const catalog: MockPlace[] = [...drink, ...(extra as MockPlace[])]

export const LAYERS: Layer[] = ['drink', 'eat', 'dance', 'coffee']

export function isLayer(v: string | null): v is Layer {
  return v !== null && (LAYERS as string[]).includes(v)
}

export function inLayer(layer: Layer) {
  return catalog.filter((p) => p.layers.includes(layer))
}

export const VENUES: Venue[] = ['bar', 'restaurant', 'cafe', 'all']

export function isVenue(v: string): v is Venue {
  return (VENUES as string[]).includes(v)
}

export function kindOf(p: MockPlace) {
  if (p.layers.includes('drink')) return 'bar'
  if (p.layers.includes('eat')) return 'restaurant'
  if (p.layers.includes('coffee')) return 'cafe'
  return 'club'
}

export function places(layer: Layer | null, venue: Venue) {
  if (layer) return inLayer(layer)
  if (venue === 'all') return catalog
  return catalog.filter((p) => {
    const kind = kindOf(p)
    return kind === venue || (venue === 'bar' && kind === 'club')
  })
}

export function available(layer: Layer) {
  return layer !== 'coffee' || new URLSearchParams(location.search).has('mock-coffee')
}

const EVERY_DAY = [1, 2, 3, 4, 5, 6, 7] as const
const CLUB_NIGHTS = [4, 5, 6] as const

// The json openUntil is the usual closing time; the week is built around it.
function weekOf(p: MockPlace): OpeningPeriod[] | undefined {
  const i = catalog.indexOf(p)
  const close = p.openUntil
  if (!close || i % 17 === 5) return undefined
  const kind = kindOf(p)
  const days = kind === 'club' ? CLUB_NIGHTS : EVERY_DAY.filter((d) => i % 5 !== 1 || d !== 1)
  return days.flatMap((day): OpeningPeriod[] => {
    if (kind === 'restaurant') return [{ day, open: '12:00', close: '14:30' }, { day, open: '19:00', close }]
    const open = kind === 'club' ? '23:00' : kind === 'cafe' ? '08:00' : i % 3 === 0 ? '10:00' : '17:00'
    return [{ day, open, close }]
  })
}

export function opening(p: MockPlace): Pick<Bar, 'openUntil' | 'openNow' | 'hours'> {
  const hours = weekOf(p)
  if (!hours) return { openUntil: null }
  const now = currentPeriod(hours, parisNow())
  return { openUntil: now?.close ?? null, openNow: now !== null, hours }
}

export function toBar(place: MockPlace): Bar {
  const { layers: _, ...p } = place
  const deal = placeDeal(place)
  return {
    ...p,
    ...opening(place),
    kinds: [kindOf(place)],
    compliant: true,
    constraintsNotMet: [],
    events: placeEvents(place),
    ...(deal && { deal }),
    actions: mockActions(place),
  }
}

const wishes: [Layer, RegExp][] = [
  ['eat', /ramen|pizza|burger|d[iî]ner|dinner|restaurant|manger|\beat\b|lunch|d[ée]jeuner|bistro|sushi|libanais|lebanese/],
  ['coffee', /brunch|coffee|caf[ée] (pour|to)|espresso|flat white|laptop|travailler/],
  ['dance', /club techno|techno club|night ?club|bo[iî]te|clubbing|danser toute la nuit|dance all night/],
]

export function wishLayer(q: string): Layer | null {
  const text = q.toLowerCase()
  return wishes.find(([, re]) => re.test(text))?.[0] ?? null
}

export type Box = [number, number, number, number]

export function parseBbox(raw: string | null): Box | null | 'bad' {
  if (raw === null) return null
  const n = raw.split(',').map(Number)
  if (n.length !== 4 || n.some((v) => !Number.isFinite(v))) return 'bad'
  const [minLng, minLat, maxLng, maxLat] = n
  if (minLng < -180 || maxLng > 180 || minLat < -90 || maxLat > 90 || minLng >= maxLng || minLat >= maxLat) return 'bad'
  return [minLng, minLat, maxLng, maxLat]
}

export function inBox(p: { lat: number; lng: number }, b: Box) {
  return p.lng >= b[0] && p.lng <= b[2] && p.lat >= b[1] && p.lat <= b[3]
}
