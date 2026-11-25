import type { Action, DaysResponse, Event, EventsResponse, Layer, Post } from '../api/types'
import { toMapBar } from './bars'
import { catalog, inLayer, kindOf, type MockPlace } from './catalog'

const DAY = 86_400_000

const venuePages: Record<string, Action> = {
  'rex-club': { kind: 'venue_page', provider: 'shotgun', url: 'https://shotgun.live/fr/venues/rex-club' },
  badaboum: { kind: 'venue_page', provider: 'shotgun', url: 'https://shotgun.live/fr/venues/badaboum-club' },
  'la-machine-du-moulin-rouge': { kind: 'venue_page', provider: 'shotgun', url: 'https://shotgun.live/fr/venues/la-machine-du-moulin-rouge' },
  djoon: { kind: 'venue_page', provider: 'resident_advisor', url: 'https://ra.co/clubs/1386' },
}

const bookings: Record<string, Action> = {
  'kodawari-ramen': { kind: 'booking', provider: 'thefork', url: 'https://www.thefork.fr/restaurant/kodawari-ramen-r619367' },
  'le-servan': { kind: 'booking', provider: 'zenchef', url: 'https://bookings.zenchef.com/results?rid=1' },
  'east-mamma': { kind: 'booking', provider: 'thefork', url: 'https://www.thefork.fr/restaurant/east-mamma-r355239' },
  'cafe-charbon': { kind: 'booking', provider: 'privateaser', url: 'https://www.privateaser.com/lieu/1-cafe-charbon' },
  'la-mutinerie': { kind: 'booking', provider: 'privateaser', url: 'https://www.privateaser.com/lieu/2-la-mutinerie' },
}

export function mockActions(p: MockPlace): Action[] {
  const directions: Action = {
    kind: 'directions',
    provider: 'maps',
    url: `https://www.google.com/maps/dir/?api=1&destination=${p.lat},${p.lng}`,
  }
  const website: Action[] = catalog.indexOf(p) % 3 === 0 ? [{ kind: 'website', provider: 'website', url: 'https://example.com/' }] : []
  const kind = kindOf(p)
  if (kind === 'club') return [...(venuePages[p.id] ? [venuePages[p.id]] : []), ...website, directions]
  if (kind === 'cafe') return [directions, ...website]
  return [...(bookings[p.id] ? [bookings[p.id]] : []), ...website, directions]
}

function paris(d: Date) {
  return new Intl.DateTimeFormat('en-CA', { timeZone: 'Europe/Paris', year: 'numeric', month: '2-digit', day: '2-digit' }).format(d)
}

export function tonight(now = new Date()) {
  const hour = Number(new Intl.DateTimeFormat('en-GB', { timeZone: 'Europe/Paris', hour: '2-digit', hourCycle: 'h23' }).format(now))
  const day = paris(now)
  return hour < 6 ? addDays(day, -1) : day
}

function addDays(day: string, n: number) {
  const d = new Date(`${day}T12:00:00Z`)
  return new Date(d.getTime() + n * DAY).toISOString().slice(0, 10)
}

function weekday(day: string) {
  const d = new Date(`${day}T12:00:00Z`).getUTCDay()
  return d === 0 ? 7 : d
}

function at(day: string, hm: string, plus = 0) {
  const d = plus ? addDays(day, plus) : day
  return `${d}T${hm}:00${parisOffset(d)}`
}

function parisOffset(day: string) {
  const d = new Date(`${day}T12:00:00Z`)
  const hour = Number(new Intl.DateTimeFormat('en-GB', { timeZone: 'Europe/Paris', hour: '2-digit', hour12: false }).format(d))
  return hour === 14 ? '+02:00' : '+01:00'
}

const titles = ['Techno All Night', 'House Sessions', 'Afro Club', 'Disco Fever', 'Warehouse', 'Rap Night']
const genres = [['techno'], ['house'], ['afro', 'hip_hop'], ['disco'], ['techno', 'electro'], ['hip_hop']]
const vibes = [['underground'], [], ['student'], ['queer'], ['underground', 'big_room'], []]
const tiles: Post[] = [
  { platform: 'tiktok', postId: '7672815858439261473', url: 'https://www.tiktok.com/@nicolastheparisian/video/7672815858439261473', author: 'nicolastheparisian', likes: 926, kind: 'video', thumb: '/photos/tt/7672815858439261473.webp' },
  { platform: 'tiktok', postId: '7649444200856948000', url: 'https://www.tiktok.com/@timsurtiktok99/video/7649444200856948000', author: 'timsurtiktok99', likes: 558, kind: 'video', thumb: '/photos/tt/7649444200856948000.webp' },
]

function party(p: MockPlace, night: string, n: number): Event {
  const i = (catalog.indexOf(p) + n) % titles.length
  const ticket = `https://shotgun.live/fr/events/${p.id}-${night}`
  const club = kindOf(p) === 'club'
  return {
    id: `mock-${p.id}-${night}`,
    kind: 'party',
    placeId: p.id,
    placeName: p.name,
    title: titles[i],
    night,
    startsAt: at(night, club ? '23:30' : '21:00'),
    endsAt: at(night, club ? '06:00' : '02:00', 1),
    regular: false,
    genres: genres[i],
    lineup: club ? ['Ana Lua', 'DJ Pépite'].slice(0, 1 + (n % 2)) : [],
    priceMin: club ? 10 + (i % 3) * 5 : 0,
    priceMax: club ? 20 + (i % 3) * 5 : null,
    discountPct: null,
    conditions: null,
    validUntil: null,
    image: null,
    photo: p.photos[0] ?? null,
    lat: p.lat,
    lng: p.lng,
    sources: n % 3 === 0 ? ['shotgun', 'resident_advisor', 'tiktok'] : ['shotgun'],
    posts: n % 3 === 0 ? tiles.slice(0, 1 + (i % 2)) : p.posts,
    actions: [{ kind: 'tickets', provider: 'shotgun', url: ticket }, ...mockActions(p)],
    description: `${titles[i]} at ${p.name}. Resident DJs all night, doors early for the warm-up.`,
    vibes: vibes[i],
    priceBucket: club ? (i % 3 === 2 ? 'mid' : 'low') : 'free',
    doorTime: club ? '23:00' : '21:00',
    minAge: club ? 18 : null,
    priceTiers: club ? [{ name: 'Early', price: 10 + (i % 3) * 5 }, { name: 'Regular', price: 20 + (i % 3) * 5 }] : [],
  }
}

function regular(p: MockPlace, night: string): Event {
  return {
    id: `mock-${p.id}-regular:${night}`,
    kind: 'party',
    placeId: p.id,
    placeName: p.name,
    title: 'Soirée DJ',
    night,
    startsAt: at(night, '22:00'),
    endsAt: at(night, '04:00', 1),
    regular: true,
    genres: ['electro'],
    lineup: [],
    priceMin: null,
    priceMax: null,
    discountPct: null,
    conditions: null,
    validUntil: null,
    image: null,
    photo: p.photos[0] ?? null,
    lat: p.lat,
    lng: p.lng,
    sources: ['profile'],
    posts: p.posts,
    actions: mockActions(p),
  }
}

function partiesOn(night: string): Event[] {
  const wd = weekday(night)
  const clubs = inLayer('dance').filter((p) => kindOf(p) === 'club')
  const bars = inLayer('dance').filter((p) => kindOf(p) !== 'club')
  const out: Event[] = []
  const busy = wd === 6 ? clubs.length : wd === 5 ? 3 : wd === 4 ? 2 : wd === 7 ? 1 : 0
  clubs.slice(0, busy).forEach((p, n) => out.push(party(p, night, n)))
  if (wd === 6) bars.slice(0, 3).forEach((p, n) => out.push(party(p, night, n + busy)))
  // a bar outside the dance layer with a party: the dance map shows it that night, drink badges it
  const pubs = inLayer('drink').filter((p) => !p.layers.includes('dance'))
  pubs.slice(wd % 3, (wd % 3) + 2).forEach((p, n) => out.push(party(p, night, n + busy + 3)))
  const charbon = catalog.find((p) => p.id === 'cafe-charbon')
  if (charbon && (wd === 4 || wd === 5)) out.push(regular(charbon, night))
  return out.sort((a, b) => (a.startsAt ?? '').localeCompare(b.startsAt ?? '') || a.placeName.localeCompare(b.placeName))
}

function dealsOn(night: string, layer: Layer): Event[] {
  const today = tonight()
  const list: [string, string, number | null, string | null, number][] = [
    ['kodawari-ramen', '-30 % sur la carte', 30, 'Hors boissons, du lundi au jeudi', 10],
    ['east-mamma', "Jusqu'à -50 % · TheFork Festival", 50, null, 0],
    ['ten-belles', 'Un cookie offert avec un café', null, 'Avant 10 h', 5],
    ['telescope', 'Filtre à 3 EUR', null, null, 3],
  ]
  return list
    .map(([id, title, pct, conditions, days]) => {
      const p = catalog.find((x) => x.id === id)!
      const until = days > 0 ? addDays(today, days) : null
      return { p, title, pct, conditions, until }
    })
    .filter(({ p, until }) => p.layers.includes(layer) && (until === null || until >= night))
    .map(({ p, title, pct, conditions, until }) => ({
      id: `mock-deal-${p.id}`,
      kind: 'deal' as const,
      placeId: p.id,
      placeName: p.name,
      title,
      night,
      startsAt: null,
      endsAt: null,
      regular: false,
      genres: [],
      lineup: [],
      priceMin: null,
      priceMax: null,
      discountPct: pct,
      conditions,
      validUntil: until,
      image: null,
      photo: p.photos[0] ?? null,
      lat: p.lat,
      lng: p.lng,
      sources: [pct ? 'thefork' : 'editorial'],
      posts: [],
      actions: [{ kind: 'offer' as const, provider: pct ? 'thefork' : 'editorial', url: 'https://www.thefork.fr/' }, ...mockActions(p)],
    }))
    .sort((a, b) => (b.discountPct ?? 0) - (a.discountPct ?? 0))
}

function eventsOn(night: string, layer: Layer | null): Event[] {
  if (layer === 'eat' || layer === 'coffee') return dealsOn(night, layer)
  const all = partiesOn(night)
  if (layer === 'drink') return all.filter((e) => catalog.find((p) => p.id === e.placeId)?.layers.includes('drink'))
  return all
}

function nights(from: string, to: string) {
  const out: string[] = []
  for (let d = from; d <= to && out.length < 62; d = addDays(d, 1)) out.push(d)
  return out
}

export function mockEvents(layer: Layer | null, from: string | null, to: string | null): EventsResponse {
  const a = from ?? tonight()
  const b = to ?? a
  const seen = new Set<string>()
  const events = nights(a, b)
    .flatMap((n) => eventsOn(n, layer))
    .filter((e) => {
      if (e.kind !== 'deal') return true
      if (seen.has(e.id)) return false
      seen.add(e.id)
      return true
    })
  const places =
    layer === 'dance'
      ? [...new Set(events.map((e) => e.placeId))]
          .map((id) => catalog.find((p) => p.id === id)!)
          .filter((p) => !p.layers.includes('dance'))
          .map(toMapBar)
      : []
  return { events, from: a, to: b, ...(layer && { layer }), places }
}

export function mockDays(layer: Layer | null, from: string | null, to: string | null): DaysResponse {
  const a = from ?? tonight()
  const b = to ?? addDays(a, 13)
  return { days: nights(a, b).map((date) => ({ date, count: eventsOn(date, layer).length })), ...(layer && { layer }) }
}

export function placeEvents(p: MockPlace, from = tonight()): Event[] {
  return nights(from, addDays(from, 30))
    .flatMap((n) => partiesOn(n))
    .filter((e) => e.placeId === p.id)
    .slice(0, 3)
}

export function placeDeal(p: MockPlace): Event | undefined {
  const layer = p.layers.find((l) => l === 'eat' || l === 'coffee')
  return layer ? dealsOn(tonight(), layer).find((e) => e.placeId === p.id) : undefined
}

const DATE = /^\d{4}-\d{2}-\d{2}$/

export function mockWhen(q: string): { from: string; to: string } | undefined {
  const t = q.toLowerCase()
  const today = tonight()
  const wd = weekday(today)
  const next = (target: number, skip: boolean) => addDays(today, ((target - wd + 7) % 7) || (skip ? 7 : 0))
  if (/week-?end/.test(t)) return { from: wd >= 6 || wd === 7 ? today : next(5, false), to: next(7, false) }
  if (/ce soir|tonight/.test(t)) return { from: today, to: today }
  if (/demain|tomorrow/.test(t)) return { from: addDays(today, 1), to: addDays(today, 1) }
  const days = ['lundi', 'mardi', 'mercredi', 'jeudi', 'vendredi', 'samedi', 'dimanche']
  const en = ['monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday', 'sunday']
  const i = days.findIndex((d, k) => new RegExp(`\\b(${d}|${en[k]})\\b`).test(t))
  if (i >= 0) {
    const d = next(i + 1, /prochain/.test(t) && i + 1 === wd)
    return { from: d, to: d }
  }
  return undefined
}

export function validDate(s: string | null) {
  return s === null || DATE.test(s)
}
