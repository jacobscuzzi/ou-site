import type { MapBar } from '../api/types'
import type * as GeoJSON from 'geojson'

export type Bounds = { minLng: number; minLat: number; maxLng: number; maxLat: number }

export type ChipKey = 'open' | 'terrace' | 'dancing' | 'cheap'

export const CHEAP_PINT = 5

export const PARIS: Bounds = { minLng: 2.224, minLat: 48.815, maxLng: 2.47, maxLat: 48.903 }

const checks: Record<ChipKey, (bar: MapBar) => boolean> = {
  open: (bar) => bar.openUntil !== null,
  terrace: (bar) => bar.terrace === true,
  dancing: (bar) => bar.dancing === true,
  cheap: (bar) => bar.pintPrice !== null && bar.pintPrice < CHEAP_PINT,
}

export function passes(bar: MapBar, chips: ReadonlySet<ChipKey>): boolean {
  for (const chip of chips) if (!checks[chip](bar)) return false
  return true
}

export function inBounds(bar: { lat: number; lng: number }, b: Bounds): boolean {
  return bar.lng >= b.minLng && bar.lng <= b.maxLng && bar.lat >= b.minLat && bar.lat <= b.maxLat
}

function byQuality(a: MapBar, b: MapBar) {
  return b.quality - a.quality || a.name.localeCompare(b.name)
}

export function topInView(bars: MapBar[], b: Bounds | null, chips: ReadonlySet<ChipKey>, n = 10): MapBar[] {
  return bars
    .filter((bar) => passes(bar, chips) && (b === null || inBounds(bar, b)))
    .sort(byQuality)
    .slice(0, n)
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
  const top = new Set(
    [...bars]
      .sort(byQuality)
      .slice(0, Math.ceil(bars.length / 4))
      .map((bar) => bar.id),
  )
  return {
    type: 'FeatureCollection',
    features: bars.map((bar) => ({
      type: 'Feature',
      geometry: { type: 'Point', coordinates: [bar.lng, bar.lat] },
      properties: {
        id: bar.id,
        name: bar.name,
        quality: bar.quality,
        open: flag(checks.open(bar)),
        terrace: flag(checks.terrace(bar)),
        dancing: flag(checks.dancing(bar)),
        cheap: flag(checks.cheap(bar)),
        top: flag(top.has(bar.id)),
      },
    })),
  }
}

export function chipFilter(chips: ReadonlySet<ChipKey>): unknown[] | null {
  if (chips.size === 0) return null
  return ['all', ...[...chips].map((chip) => ['==', ['get', chip], 1])]
}
