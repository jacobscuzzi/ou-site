import type { Layer, MapBar } from '../api/types'
import type * as GeoJSON from 'geojson'

export type Bounds = { minLng: number; minLat: number; maxLng: number; maxLat: number }

const cuisineGroups = {
  asian: ['japanese', 'chinese', 'korean', 'vietnamese', 'thai'],
  street: ['burger', 'street_food', 'american', 'mexican', 'latin_american'],
  italian: ['italian', 'pizza'],
  brunch: ['brunch'],
  oriental: ['middle_eastern', 'lebanese', 'north_african', 'turkish', 'greek'],
  indian: ['indian'],
  african: ['african', 'caribbean'],
  french: ['french'],
}

const musicGroups = {
  techno: ['techno', 'electro'],
  hiphop: ['hip_hop', 'afro'],
  latin: ['latin'],
  live: ['live_band', 'jazz'],
  karaoke: ['karaoke'],
}

type CuisineChip = keyof typeof cuisineGroups
type MusicChip = keyof typeof musicGroups

export type ChipKey = 'open' | 'terrace' | 'dancing' | 'cheap' | 'budget' | 'clubs' | 'dancebars' | CuisineChip | MusicChip

export const CHEAP_PINT = 5
export const CHEAP_MEAL = 15

const cuisineChips = Object.keys(cuisineGroups) as CuisineChip[]
const musicChips = Object.keys(musicGroups) as MusicChip[]

export const layerChips: Record<Layer, ChipKey[]> = {
  drink: ['open', 'terrace', 'dancing', 'cheap'],
  eat: ['open', 'terrace', 'budget', ...cuisineChips],
  dance: ['open', 'clubs', 'dancebars', ...musicChips, 'cheap'],
  coffee: ['open', 'terrace'],
}

// Chips of one family widen each other (Asian or Italian); everything else narrows.
const families: ChipKey[][] = [cuisineChips, musicChips, ['clubs', 'dancebars']]

export const PARIS: Bounds = { minLng: 2.224, minLat: 48.815, maxLng: 2.47, maxLat: 48.903 }

const checks: Record<ChipKey, (bar: MapBar) => boolean> = {
  open: (bar) => bar.openUntil !== null,
  terrace: (bar) => bar.terrace === true,
  dancing: (bar) => bar.dancing === true,
  cheap: (bar) => bar.pintPrice !== null && bar.pintPrice < CHEAP_PINT,
  budget: (bar) => bar.pricePerPerson !== undefined && bar.pricePerPerson < CHEAP_MEAL,
  clubs: (bar) => bar.kinds?.includes('club') === true,
  dancebars: (bar) => bar.kinds?.includes('bar') === true && !bar.kinds.includes('club'),
  ...group(cuisineGroups, (bar) => bar.cuisines ?? (bar.cuisine ? [bar.cuisine] : [])),
  ...group(musicGroups, (bar) => bar.music ?? bar.tags),
}

function group<K extends string>(groups: Record<K, string[]>, values: (bar: MapBar) => string[]) {
  const out = {} as Record<K, (bar: MapBar) => boolean>
  for (const key of Object.keys(groups) as K[]) out[key] = (bar) => values(bar).some((v) => groups[key].includes(v))
  return out
}

function split(chips: ReadonlySet<ChipKey>) {
  const any = families.map((f) => f.filter((c) => chips.has(c))).filter((f) => f.length > 0)
  const all = [...chips].filter((c) => !families.some((f) => f.includes(c)))
  return { all, any }
}

export function passes(bar: MapBar, chips: ReadonlySet<ChipKey>): boolean {
  const { all, any } = split(chips)
  return all.every((c) => checks[c](bar)) && any.every((f) => f.some((c) => checks[c](bar)))
}

export function offeredChips(layer: Layer, bars: MapBar[], active: ReadonlySet<ChipKey>): ChipKey[] {
  if (bars.length === 0) return layerChips[layer].filter((c) => active.has(c) || !families.some((f) => f.includes(c)))
  return layerChips[layer].filter((c) => active.has(c) || bars.some(checks[c]))
}

export function inBounds(bar: { lat: number; lng: number }, b: Bounds): boolean {
  return bar.lng >= b.minLng && bar.lng <= b.maxLng && bar.lat >= b.minLat && bar.lat <= b.maxLat
}

export function cleanName(name: string): string {
  return name.replace(/[\p{Extended_Pictographic}\u200d\ufe0f]/gu, '').trim()
}

function byQuality(a: { quality: number; name: string }, b: { quality: number; name: string }) {
  return b.quality - a.quality || a.name.localeCompare(b.name)
}

export function topInView(bars: MapBar[], b: Bounds | null, chips: ReadonlySet<ChipKey>, n = 10): MapBar[] {
  return bars
    .filter((bar) => passes(bar, chips) && (b === null || inBounds(bar, b)))
    .sort(byQuality)
    .slice(0, n)
}

export function spreadPick<T extends { quality: number; name: string }>(
  items: T[],
  at: (item: T) => { x: number; y: number },
  n: number,
  gap: number,
  seed: T[] = [],
): T[] {
  const chosen = [...seed]
  for (const item of [...items].sort(byQuality)) {
    if (chosen.length >= n) break
    const p = at(item)
    const clear = chosen.every((c) => {
      const q = at(c)
      return Math.hypot(p.x - q.x, p.y - q.y) >= gap
    })
    if (clear) chosen.push(item)
  }
  return chosen
}

export function stablePick<T extends { id: string; quality: number; name: string }>(
  candidates: T[],
  previous: readonly string[],
  at: (item: T) => { x: number; y: number },
  n: number,
  gap: number,
): string[] {
  const had = new Set(previous)
  const kept = spreadPick(candidates.filter((c) => had.has(c.id)), at, n, gap)
  return spreadPick(candidates.filter((c) => !had.has(c.id)), at, n, gap, kept).map((c) => c.id)
}

export function boundsOf(points: { lat: number; lng: number }[]): Bounds | null {
  if (points.length === 0) return null
  const lats = points.map((p) => p.lat)
  const lngs = points.map((p) => p.lng)
  return {
    minLng: Math.min(...lngs),
    minLat: Math.min(...lats),
    maxLng: Math.max(...lngs),
    maxLat: Math.max(...lats),
  }
}

const flag = (v: boolean) => (v ? 1 : 0)

export function barsToGeoJSON(bars: MapBar[]): GeoJSON.FeatureCollection<GeoJSON.Point> {
  const ranked = bars.map((bar) => bar.quality).sort((a, b) => b - a)
  const threshold = ranked[Math.ceil(ranked.length / 4) - 1] ?? Infinity
  return {
    type: 'FeatureCollection',
    features: bars.map((bar) => ({
      type: 'Feature',
      geometry: { type: 'Point', coordinates: [bar.lng, bar.lat] },
      properties: {
        id: bar.id,
        name: cleanName(bar.name),
        quality: bar.quality,
        ...Object.fromEntries((Object.keys(checks) as ChipKey[]).map((chip) => [chip, flag(checks[chip](bar))])),
        top: flag(bar.quality >= threshold),
        club: flag(bar.kinds?.includes('club') === true),
      },
    })),
  }
}

export function chipFilter(chips: ReadonlySet<ChipKey>): unknown[] | null {
  if (chips.size === 0) return null
  const on = (chip: ChipKey) => ['==', ['get', chip], 1]
  const { all, any } = split(chips)
  return ['all', ...all.map(on), ...any.map((f) => ['any', ...f.map(on)])]
}
