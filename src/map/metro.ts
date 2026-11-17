import type { Map as MaplibreMap } from 'maplibre-gl'
import type * as GeoJSON from 'geojson'
import { styleFont } from './theme'

export type MetroTokens = {
  casing: string
  widthMin: number
  widthMax: number
  casingExtra: number
  stationFill: string
  stationInk: string
  stationR: number
  stationRHub: number
  stationWidth: number
  metroLabelSize: number
  halo: string
  haloWidth: number
}

const SOURCE = 'metro'
const IDS = ['metro-casing', 'metro-lines', 'metro-stations', 'metro-names']
const BELOW = 'dots'
const LINE_ZOOM = [10, 17]
const STATION_ZOOM = 12.5
const NAME_ZOOM = 14
const ATTRIBUTION = 'Île-de-France Mobilités'

let loading: Promise<GeoJSON.FeatureCollection | null> | null = null

function load() {
  loading ??= fetch(`${import.meta.env.BASE_URL}metro.json`)
    .then((res) => (res.ok ? (res.json() as Promise<GeoJSON.FeatureCollection>) : null))
    .catch(() => null)
    .then((data) => {
      if (!data) loading = null
      return data
    })
  return loading
}

function width(tk: MetroTokens, extra: number): unknown {
  const [lo, hi] = LINE_ZOOM
  return ['interpolate', ['linear'], ['zoom'], lo, tk.widthMin + extra, hi, tk.widthMax + extra]
}

function addMetro(map: MaplibreMap, tk: MetroTokens, data: GeoJSON.FeatureCollection) {
  const font = styleFont(map)
  const lines = ['==', ['geometry-type'], 'LineString'] as never
  const stations = ['==', ['geometry-type'], 'Point'] as never
  const before = map.getLayer(BELOW) ? BELOW : undefined
  const round = { 'line-cap': 'round', 'line-join': 'round' } as const
  map.addSource(SOURCE, { type: 'geojson', data, attribution: ATTRIBUTION })
  map.addLayer({ id: IDS[0], type: 'line', source: SOURCE, filter: lines, layout: round, paint: { 'line-color': tk.casing, 'line-width': width(tk, tk.casingExtra) as never } }, before)
  map.addLayer({ id: IDS[1], type: 'line', source: SOURCE, filter: lines, layout: round, paint: { 'line-color': ['get', 'color'], 'line-width': width(tk, 0) as never } }, before)
  map.addLayer(
    {
      id: IDS[2],
      type: 'circle',
      source: SOURCE,
      filter: stations,
      minzoom: STATION_ZOOM,
      paint: {
        'circle-color': tk.stationFill,
        'circle-stroke-color': tk.stationInk,
        'circle-stroke-width': tk.stationWidth,
        'circle-radius': ['case', ['>', ['get', 'n'], 1], tk.stationRHub, tk.stationR],
      },
    },
    before,
  )
  map.addLayer(
    {
      id: IDS[3],
      type: 'symbol',
      source: SOURCE,
      filter: stations,
      minzoom: NAME_ZOOM,
      layout: {
        'text-field': ['get', 'name'],
        'text-size': tk.metroLabelSize,
        'text-anchor': 'left',
        'text-offset': [0.9, 0],
        'text-optional': true,
        ...(font && { 'text-font': font }),
      },
      paint: { 'text-color': tk.stationInk, 'text-halo-color': tk.halo, 'text-halo-width': tk.haloWidth },
    },
    before,
  )
}

export async function setMetroVisible(map: MaplibreMap, on: boolean, tk: MetroTokens): Promise<boolean> {
  try {
    if (!map.getSource(SOURCE)) {
      if (!on) return true
      const data = await load()
      if (!data) return false
      if (!map.getSource(SOURCE)) addMetro(map, tk, data)
    }
    for (const id of IDS) map.setLayoutProperty(id, 'visibility', on ? 'visible' : 'none')
    return true
  } catch {
    return false
  }
}
