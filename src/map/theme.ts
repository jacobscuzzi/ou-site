import type { Map as MaplibreMap } from 'maplibre-gl'

export type ThemeTokens = {
  land: string
  water: string
  waterEdge: string
  waterInk: string
  waterHalo: string
  park: string
  building: string
  buildingEdge: string
  road: string
  roadCase: string
  roadMain: string
  roadMainCase: string
  path: string
  ink: string
  halo: string
}

type Rule = { match: RegExp; type: string; paint?: [string, string | number][]; hide?: boolean }

function rules(tk: ThemeTokens): Rule[] {
  return [
    { match: /^background$/, type: 'background', paint: [['background-color', tk.land]] },
    { match: /^water$/, type: 'fill', paint: [['fill-color', tk.water]] },
    { match: /^water_shadow$/, type: 'fill', paint: [['fill-color', tk.waterEdge]] },
    { match: /^waterway$/, type: 'line', paint: [['line-color', tk.water]] },
    { match: /^(landcover|landuse|park_.*)$/, type: 'fill', paint: [['fill-color', tk.park], ['fill-opacity', 1]] },
    { match: /^landuse_residential$/, type: 'fill', paint: [['fill-color', tk.land]] },
    { match: /^building$/, type: 'fill', paint: [['fill-color', tk.building]] },
    { match: /^building-top$/, type: 'fill', paint: [['fill-color', tk.building], ['fill-outline-color', tk.buildingEdge]] },
    { match: /^(tunnel|bridge|road)_path/, type: 'line', paint: [['line-color', tk.path]] },
    { match: /^(tunnel|road|bridge)_(pri|trunk|mot)_case/, type: 'line', paint: [['line-color', tk.roadMainCase]] },
    { match: /^(tunnel|road|bridge)_(pri|trunk|mot)_fill/, type: 'line', paint: [['line-color', tk.roadMain]] },
    { match: /^(tunnel|road|bridge)_.*_case/, type: 'line', paint: [['line-color', tk.roadCase]] },
    { match: /^(tunnel|road|bridge)_.*_fill/, type: 'line', paint: [['line-color', tk.road]] },
    { match: /^(tunnel_)?rail/, type: 'line', hide: true },
    { match: /^poi_/, type: 'symbol', hide: true },
    { match: /^(watername_|waterway_label)/, type: 'symbol', paint: [['text-color', tk.waterInk], ['text-halo-color', tk.waterHalo]] },
    { match: /^(place_|roadname_|housenumber)/, type: 'symbol', paint: [['text-color', tk.ink], ['text-halo-color', tk.halo], ['icon-color', tk.ink]] },
  ]
}

function quietly(fn: () => void) {
  try {
    fn()
  } catch {
    // layer missing or property refused, keep the stock look for it
  }
}

export function applyTheme(map: MaplibreMap, tk: ThemeTokens) {
  const set = rules(tk)
  for (const layer of map.getStyle().layers) {
    const rule = set.find((r) => r.type === layer.type && r.match.test(layer.id))
    if (!rule) continue
    if (rule.hide) quietly(() => map.setLayoutProperty(layer.id, 'visibility', 'none'))
    for (const [prop, value] of rule.paint ?? []) {
      if (prop in (layer.paint ?? {})) quietly(() => map.setPaintProperty(layer.id, prop as 'fill-color', value as string))
    }
  }
}

export function styleFont(map: MaplibreMap) {
  const fonts: string[][] = []
  for (const layer of map.getStyle().layers) {
    if (layer.type !== 'symbol') continue
    const font: unknown = layer.layout?.['text-font']
    if (Array.isArray(font) && font.length > 0 && font.every((f) => typeof f === 'string')) fonts.push(font)
  }
  return fonts.find((font) => !/italic/i.test(font[0])) ?? fonts[0]
}
