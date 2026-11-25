import { useEffect, useRef, useState } from 'react'
import {
  getWorkerUrl,
  Map as MaplibreMap,
  Marker,
  setWorkerUrl,
  type ExpressionSpecification,
  type FilterSpecification,
  type GeoJSONSource,
  type LngLat,
} from 'maplibre-gl'
import workerUrl from 'maplibre-gl/dist/maplibre-gl-worker.mjs?worker&url'
import 'maplibre-gl/dist/maplibre-gl.css'
import type { Bar, MapBar } from '../api/types'
import { useT } from '../i18n'
import { danceKind } from '../kind'
import { useLayer } from '../mode'
import { barsToGeoJSON, boundsOf, chipFilter, passes, PARIS, type Bounds, type ChipKey } from '../map/geo'
import { BubbleLayer, resultSpecs, type BubbleSpec } from '../map/bubble'
import { still } from '../motion'
import { assignTiers, type Tier } from '../map/tiers'
import { useTheme } from '../theme'
import { thumbOf } from '../photos'
import { recolorMetro } from '../map/metro'
import { RingLayer, type RingStyle } from '../map/rings'
import { focusOn, fitTo, glideTo, inView, lngLatBounds, padding, type CameraTiming } from '../map/camera'
import { applyTheme, styleFont } from '../map/theme'
import { useMetro } from '../map/useMetro'
import { LocateIcon, MetroIcon } from './icons'
import './CityMap.css'

if (getWorkerUrl() === '') setWorkerUrl(workerUrl)

const STYLE = 'https://basemaps.cartocdn.com/gl/voyager-gl-style/style.json'
const LABEL_ZOOM = 13
const ALL_LABELS_ZOOM = 15
const START_CENTER: [number, number] = [2.3488, 48.86]
const START_ZOOM = 12.3
const PAN_MARGIN = 0.2
const PHONE = '(max-width: 767px)'
const STYLE_TIMEOUT = 10000
const SETTLE_MS = 250

type Props = {
  bars: MapBar[]
  results: Bar[]
  chips: ReadonlySet<ChipKey>
  selectedId: string | null
  highlightId: string | null
  active: boolean
  fitKey: string
  anchorKey: string
  onStray: (stray: boolean) => void
  onSelect: (id: string) => void
  onBounds: (b: Bounds) => void
  onFail: () => void
  onLive?: () => void
  padKey?: string
  // places with a party on the chosen night: a turning dashed ring around their marker
  night?: ReadonlySet<string> | null
  // places that are at least a circle (party tonight, liked, deal) and places that stay a dot (disliked)
  boost?: ReadonlySet<string> | null
  sink?: ReadonlySet<string> | null
  // places with a party tonight, marked by a small badge on the pin (drink layer)
  badge?: ReadonlySet<string> | null
}

type Tokens = ReturnType<typeof readTokens>

function readTokens() {
  const css = getComputedStyle(document.documentElement)
  const str = (name: string) => css.getPropertyValue(name).trim()
  const num = (name: string) => parseFloat(str(name))
  return {
    dot: str('--dot'),
    dotTop: str('--dot-top'),
    dotClub: str('--dot-club'),
    stroke: str('--dot-stroke'),
    selected: str('--dot-selected'),
    rMin: num('--dot-r-min'),
    rMax: num('--dot-r-max'),
    rSelected: num('--dot-r-selected'),
    strokeWidth: num('--dot-stroke-width'),
    selectedWidth: num('--dot-selected-width'),
    opacityMin: num('--dot-opacity-min'),
    opacityMax: num('--dot-opacity-max'),
    dim: num('--dot-dim-opacity'),
    rFaded: num('--dot-r-faded'),
    faded: num('--dot-faded-opacity'),
    badge: str('--dot-badge'),
    badgeStroke: str('--dot-badge-stroke'),
    badgeR: num('--dot-badge-r'),
    badgeShift: num('--dot-badge-shift'),
    hit: num('--dot-hit'),
    pale: str('--dot-pale'),
    r2Min: num('--tier2-r-min'),
    r2Max: num('--tier2-r-max'),
    r3Min: num('--tier3-r-min'),
    r3Max: num('--tier3-r-max'),
    stroke2: str('--tier2-stroke'),
    stroke2Width: num('--tier2-stroke-width'),
    tierMs: num('--tier-ms'),
    max1: num('--tier-max-1'),
    max2: num('--tier-max-2'),
    gap2: num('--tier-gap-2'),
    ring: str('--ring'),
    ringWidth: num('--ring-width'),
    ringDash: num('--ring-dash'),
    ringSpace: num('--ring-space'),
    ringGap: num('--ring-gap'),
    ringPeriod: num('--ring-period'),
    bubbleMd: num('--bubble-md'),
    bubbleLg: num('--bubble-lg'),
    bubbleGap: num('--bubble-gap'),
    bubbleOut: num('--bubble-out'),
    bubbleStep: num('--bubble-stagger'),
    cameraMs: num('--camera-ms'),
    fitMs: num('--camera-fit-ms'),
    bubbleFit: (num('--bubble-lg') * num('--bubble-selected-scale')) / 2 + num('--space-1'),
    label: str('--label'),
    halo: str('--label-halo'),
    labelSize: num('--label-size'),
    haloWidth: num('--label-halo-width'),
    labelOffset: num('--label-offset'),
    land: str('--map-land'),
    water: str('--map-water'),
    waterEdge: str('--map-water-edge'),
    waterInk: str('--map-water-ink'),
    waterHalo: str('--map-water-halo'),
    park: str('--map-park'),
    building: str('--map-building'),
    buildingEdge: str('--map-building-edge'),
    road: str('--map-road'),
    roadCase: str('--map-road-case'),
    roadMain: str('--map-road-main'),
    roadMainCase: str('--map-road-main-case'),
    path: str('--map-path'),
    ink: str('--map-ink'),
    casing: str('--metro-casing'),
    metroOpacityMin: num('--metro-opacity-min'),
    metroOpacityMax: num('--metro-opacity-max'),
    metroDim: num('--metro-dim'),
    widthMin: num('--metro-width-min'),
    widthMax: num('--metro-width-max'),
    casingExtra: num('--metro-casing-extra'),
    stationFill: str('--metro-station-fill'),
    stationInk: str('--metro-station-ink'),
    stationR: num('--metro-station-r'),
    stationRHub: num('--metro-station-r-hub'),
    stationWidth: num('--metro-station-width'),
    metroLabelSize: num('--metro-label-size'),
  }
}

function ringStyle(tk: Tokens): RingStyle {
  return { color: tk.ring, width: tk.ringWidth, dash: tk.ringDash, gap: tk.ringSpace, period: tk.ringPeriod }
}

function widen(b: Bounds, m: number): Bounds {
  return { minLng: b.minLng - m, minLat: b.minLat - m, maxLng: b.maxLng + m, maxLat: b.maxLat + m }
}

function addLayers(map: MaplibreMap, tk: Tokens, bars: MapBar[], night: ReadonlySet<string> | null, badge: ReadonlySet<string> | null) {
  const font = styleFont(map)
  map.addSource('bars', { type: 'geojson', data: barsToGeoJSON(bars, night, badge), promoteId: 'id' })
  map.addLayer({ id: 'dots', type: 'circle', source: 'bars' })
  map.addLayer({
    id: 'badges',
    type: 'circle',
    source: 'bars',
    filter: ['==', ['get', 'pty'], 1],
    paint: {
      'circle-color': tk.badge,
      'circle-radius': tk.badgeR,
      'circle-stroke-color': tk.badgeStroke,
      'circle-stroke-width': tk.strokeWidth,
      'circle-translate': [tk.badgeShift, -tk.badgeShift],
    },
  })
  map.addLayer({
    id: 'labels',
    type: 'symbol',
    source: 'bars',
    minzoom: LABEL_ZOOM,
    layout: {
      'text-field': ['get', 'name'],
      'text-size': tk.labelSize,
      'text-anchor': 'top',
      'text-offset': [0, tk.labelOffset],
      'text-optional': true,
      'symbol-sort-key': ['-', 1, ['get', 'quality']],
      ...(font && { 'text-font': font }),
    },
    paint: {
      'text-color': tk.label,
      'text-halo-color': tk.halo,
      'text-halo-width': tk.haloWidth,
    },
  })
}

function applyData(map: MaplibreMap, bars: MapBar[], night: ReadonlySet<string> | null, badge: ReadonlySet<string> | null) {
  map.getSource<GeoJSONSource>('bars')?.setData(barsToGeoJSON(bars, night, badge))
}

function applyFilter(map: MaplibreMap, chips: ReadonlySet<ChipKey>, bubbled: string[] = []) {
  const chip = chipFilter(chips)
  const unbubbled = ['!', ['in', ['get', 'id'], ['literal', bubbled]]]
  map.setFilter('dots', chip as FilterSpecification | null)
  const party = ['==', ['get', 'pty'], 1]
  map.setFilter('badges', (chip ? ['all', chip, party] : party) as FilterSpecification)
  map.setFilter('labels', (chip ? ['all', chip, unbubbled] : unbubbled) as FilterSpecification)
}

function collapseAttribution(map: MaplibreMap) {
  map.getContainer().querySelector<HTMLElement>('.maplibregl-compact-show > .maplibregl-ctrl-attrib-button')?.click()
}

const tierOf: ExpressionSpecification = ['coalesce', ['feature-state', 't'], 3]
const tierWas: ExpressionSpecification = ['coalesce', ['feature-state', 'p'], 3]
const grown: ExpressionSpecification = ['coalesce', ['feature-state', 'g'], 1]

function tierRadius(tk: Tokens, tier: ExpressionSpecification, wide: boolean): ExpressionSpecification {
  return ['match', tier, 1, 0, 2, wide ? tk.r2Max : tk.r2Min, wide ? tk.r3Max : tk.r3Min]
}

function blendRadius(tk: Tokens, wide: boolean): ExpressionSpecification {
  return ['+', ['*', ['-', 1, grown], tierRadius(tk, tierWas, wide)], ['*', grown, tierRadius(tk, tierOf, wide)]]
}

function applyLook(map: MaplibreMap, tk: Tokens, dimmed: boolean, selectedId: string | null) {
  const selected: ExpressionSpecification = ['==', ['get', 'id'], selectedId ?? '']
  const faded: ExpressionSpecification = ['==', ['get', 'ev'], 0]
  const two: ExpressionSpecification = ['==', tierOf, 2]
  const radius = (wide: boolean): ExpressionSpecification => ['case', selected, 0, faded, tk.rFaded, blendRadius(tk, wide)]
  const opacity: ExpressionSpecification = ['case', faded, tk.faded, ['==', tierOf, 3], dimmed ? tk.dim : tk.opacityMax, ['*', grown, tk.opacityMax]]
  map.setPaintProperty('dots', 'circle-radius', ['interpolate', ['linear'], ['zoom'], 11, radius(false), 16, radius(true)])
  map.setPaintProperty('dots', 'circle-color', [
    'case',
    ['all', two, ['==', ['get', 'club'], 1]],
    tk.dotClub,
    two,
    tk.dotTop,
    ['interpolate-hcl', ['linear'], ['coalesce', ['feature-state', 'f'], 1], 0, tk.dotTop, 1, tk.pale],
  ])
  map.setPaintProperty('dots', 'circle-opacity', opacity)
  map.setPaintProperty('dots', 'circle-stroke-opacity', opacity)
  map.setPaintProperty('dots', 'circle-stroke-color', tk.stroke2)
  map.setPaintProperty('dots', 'circle-stroke-width', ['case', two, tk.stroke2Width, 0])
  map.setLayoutProperty('dots', 'circle-sort-key', ['get', 'quality'])
  map.setPaintProperty('labels', 'text-opacity', ['step', ['zoom'], ['case', two, dimmed ? tk.dim : 1, 0], ALL_LABELS_ZOOM, dimmed ? tk.dim : 1])
  map.setPaintProperty('labels', 'text-color', tk.label)
  map.setPaintProperty('labels', 'text-halo-color', tk.halo)
  map.setPaintProperty('badges', 'circle-color', tk.badge)
  map.setPaintProperty('badges', 'circle-stroke-color', tk.badgeStroke)
}

function lookOf(p: Pick<Props, 'highlightId' | 'selectedId'>) {
  return p.highlightId ?? p.selectedId
}

function nearestDot(map: MaplibreMap, x: number, y: number, r: number) {
  let best: string | null = null
  let bestDist = Infinity
  for (const f of map.queryRenderedFeatures([[x - r, y - r], [x + r, y + r]], { layers: ['dots'] })) {
    const id: unknown = f.properties.id
    if (f.geometry.type !== 'Point' || typeof id !== 'string') continue
    const [lng, lat] = f.geometry.coordinates
    const p = map.project([lng, lat])
    const dist = Math.hypot(p.x - x, p.y - y)
    if (dist < bestDist) {
      bestDist = dist
      best = id
    }
  }
  return best
}

function clearBounds(map: MaplibreMap): Bounds {
  const pad = padding(map)
  const box = map.getContainer()
  const right = box.clientWidth - pad.right
  const bottom = box.clientHeight - pad.bottom
  if (right <= pad.left || bottom <= pad.top) {
    const b = map.getBounds()
    return { minLng: b.getWest(), minLat: b.getSouth(), maxLng: b.getEast(), maxLat: b.getNorth() }
  }
  const nw = map.unproject([pad.left, pad.top])
  const se = map.unproject([right, bottom])
  return { minLng: nw.lng, minLat: se.lat, maxLng: se.lng, maxLat: nw.lat }
}

export default function CityMap(props: Props) {
  const { bars, results, chips, selectedId, highlightId, active, fitKey, anchorKey, padKey } = props
  const t = useT()
  const layer = useLayer()
  const kindOf = (kinds: string[] | undefined) => danceKind(kinds, layer)
  const el = useRef<HTMLDivElement>(null)
  const mapRef = useRef<MaplibreMap | null>(null)
  const tokens = useRef<Tokens | null>(null)
  const ready = useRef(false)
  const latest = useRef(props)
  latest.current = props
  const latestKind = useRef(kindOf)
  latestKind.current = kindOf
  const bubbles = useRef<BubbleLayer | null>(null)
  const exploreIds = useRef<string[]>([])
  const pressed = useRef(new Set<number>())
  const waiting = useRef(false)
  const me = useRef<Marker | null>(null)
  const [locating, setLocating] = useState(false)
  const [loaded, setLoaded] = useState(false)
  const [live, setLive] = useState(false)
  const timing = useRef<CameraTiming | null>(null)
  const anchor = useRef<{ center: LngLat; zoom: number } | null>(null)
  const tiers = useRef(new Map<string, Tier>())
  const fades = useRef(new Map<string, number>())
  const grow = useRef(0)
  const theme = useTheme()
  const rings = useRef<RingLayer | null>(null)

  function ringRadius(id: string) {
    const map = mapRef.current
    const tk = tokens.current
    if (!map || !tk) return 0
    if (bubbles.current?.ids().includes(id)) {
      const big = latest.current.results.find((b) => b.id === id && b.rank <= tk.max1)
      return (big ? tk.bubbleLg : tk.bubbleMd) / 2 + tk.ringGap
    }
    const k = Math.min(1, Math.max(0, (map.getZoom() - 11) / 5))
    const tier = tiers.current.get(id) ?? 3
    const r = tier === 2 ? tk.r2Min + (tk.r2Max - tk.r2Min) * k : tk.r3Min + (tk.r3Max - tk.r3Min) * k
    return r + tk.ringGap
  }

  function placeRings() {
    const p = latest.current
    if (!rings.current) return
    const spots = new Map<string, { lng: number; lat: number }>()
    if (p.night) for (const b of p.bars) if (p.night.has(b.id)) spots.set(b.id, b)
    rings.current.set(spots)
  }

  function capture() {
    const map = mapRef.current
    if (!map) return
    anchor.current = { center: map.getCenter(), zoom: map.getZoom() }
    latest.current.onStray(false)
  }

  function checkStray(e: { originalEvent?: unknown }) {
    const map = mapRef.current
    const a = anchor.current
    if (!map || !a) return
    if (!e.originalEvent) return capture()
    const box = map.getContainer()
    const p = map.project(a.center)
    const panned = Math.abs(p.x - box.clientWidth / 2) > box.clientWidth / 3 || Math.abs(p.y - box.clientHeight / 2) > box.clientHeight / 3
    latest.current.onStray(panned || Math.abs(map.getZoom() - a.zoom) >= 1)
  }
  const [metro, toggleMetro] = useMetro(mapRef, tokens, loaded, results.length > 0)

  function restyle() {
    const map = mapRef.current
    if (!map || !ready.current || !tokens.current) return
    applyLook(map, tokens.current, latest.current.results.length > 0, lookOf(latest.current))
  }

  function setTiers(map: MaplibreMap, next: Map<string, { tier: Tier; fade: number }>) {
    const tk = tokens.current!
    const prev = tiers.current
    const moved: string[] = []
    for (const [id, t] of prev) if (t !== 3 && !next.has(id)) next.set(id, { tier: 3, fade: 1 })
    for (const [id, r] of next) {
      const was = prev.get(id) ?? 3
      const state: Record<string, number> = { f: Math.round(r.fade * 20) / 20 }
      if (was !== r.tier) {
        state.t = r.tier
        state.p = was
        state.g = 0
        moved.push(id)
      }
      if (was !== r.tier || fades.current.get(id) !== state.f) map.setFeatureState({ source: 'bars', id }, state)
      fades.current.set(id, state.f)
      prev.set(id, r.tier)
    }
    window.cancelAnimationFrame(grow.current)
    if (moved.length === 0) return
    const done = () => moved.forEach((id) => map.setFeatureState({ source: 'bars', id }, { g: 1 }))
    if (still()) return done()
    const t0 = performance.now()
    const step = (now: number) => {
      const g = Math.min(1, (now - t0) / tk.tierMs)
      for (const id of moved) map.setFeatureState({ source: 'bars', id }, { g })
      if (g < 1) grow.current = window.requestAnimationFrame(step)
    }
    grow.current = window.requestAnimationFrame(step)
  }

  function refreshBubbles() {
    const map = mapRef.current
    const layer = bubbles.current
    const tk = tokens.current
    if (!map || !layer || !ready.current || !tk || !latest.current.active) return
    const p = latest.current
    const look = lookOf(p)
    if (map.isMoving() || pressed.current.size > 0) {
      waiting.current = true
      return layer.mark(look)
    }
    const at = (bar: { lng: number; lat: number }) => map.project([bar.lng, bar.lat])
    let specs: BubbleSpec[]
    let next: Map<string, { tier: Tier; fade: number }>
    if (p.results.length > 0) {
      const top = resultSpecs(p.results, latestKind.current).slice(0, tk.max1)
      const topIds = new Set(top.map((b) => b.id))
      next = new Map(p.results.map((b) => [b.id, { tier: (topIds.has(b.id) ? 1 : 2) as Tier, fade: 0 }]))
      specs = top.map((b) => ({ ...b, size: 'lg' as const }))
    } else {
      const pad = padding(map)
      const loose = { ...pad, left: 0, right: 0 }
      const kept = new Set(exploreIds.current)
      const none = { top: 0, bottom: 0, left: 0, right: 0 }
      const visible = p.bars.filter((bar) => passes(bar, p.chips) && inView(map, bar, none))
      const clear = new Set(visible.filter((bar) => inView(map, bar, kept.has(bar.id) ? loose : pad)).map((bar) => bar.id))
      next = assignTiers(
        visible.map((bar) => ({ id: bar.id, name: bar.name, quality: bar.quality, ...at(bar) })),
        { previous: exploreIds.current, max1: tk.max1, max2: tk.max2, gap1: tk.bubbleGap, gap2: tk.gap2, boost: p.boost, sink: p.sink, clear },
      )
      specs = visible
        .filter((bar) => next.get(bar.id)?.tier === 1)
        .map((bar) => ({ id: bar.id, name: bar.name, lat: bar.lat, lng: bar.lng, photo: bar.cover, size: 'md' as const, kind: latestKind.current(bar.kinds) }))
    }
    const sel = p.selectedId
    const ones = specs.map((b) => b.id)
    if (sel && !specs.some((b) => b.id === sel)) {
      const bar = p.results.find((b) => b.id === sel) ?? p.bars.find((b) => b.id === sel)
      if (bar) {
        const photo = 'photos' in bar ? thumbOf(bar.photos, bar.thumbs, 0) : bar.cover
        specs.push({ id: bar.id, name: bar.name, lat: bar.lat, lng: bar.lng, photo, size: 'md', kind: latestKind.current(bar.kinds) })
        next.set(bar.id, { tier: 1, fade: 0 })
      }
    }
    layer.sync(specs, look)
    exploreIds.current = p.results.length === 0 ? ones : []
    layer.party(p.badge ?? null)
    setTiers(map, next)
    applyFilter(map, p.chips, layer.ids())
  }

  useEffect(() => {
    const tk = readTokens()
    tokens.current = tk
    timing.current = { move: tk.cameraMs, fit: tk.fitMs, comfort: tk.bubbleFit }
    let map: MaplibreMap
    try {
      map = new MaplibreMap({
        container: el.current!,
        style: STYLE,
        center: START_CENTER,
        zoom: START_ZOOM,
        maxBounds: lngLatBounds(widen(PARIS, PAN_MARGIN)),
        dragRotate: false,
        pitchWithRotate: false,
        touchPitch: false,
        attributionControl: { compact: window.matchMedia(PHONE).matches },
      })
    } catch {
      latest.current.onFail()
      return
    }
    map.touchZoomRotate.disableRotation()
    mapRef.current = map
    if (import.meta.env.DEV) Object.assign(window, { __ouMap: map, __ouTiers: tiers.current })
    let styled = false
    let failed = false
    let removed = false
    const fail = () => {
      if (styled || failed || removed) return
      failed = true
      latest.current.onFail()
    }
    const timer = window.setTimeout(fail, STYLE_TIMEOUT)
    bubbles.current = new BubbleLayer(map, (id) => latest.current.onSelect(id), { out: tk.bubbleOut, step: tk.bubbleStep })
    const emitBounds = () => {
      if (!latest.current.active) return
      latest.current.onBounds(clearBounds(map))
      refreshBubbles()
    }
    let settleTimer = 0
    const queue = () => {
      window.clearTimeout(settleTimer)
      settleTimer = window.setTimeout(() => {
        if (map.isMoving() || pressed.current.size > 0) waiting.current = true
        else emitBounds()
      }, SETTLE_MS)
    }
    const box = map.getContainer()
    const press = (e: PointerEvent) => pressed.current.add(e.pointerId)
    const release = (e: PointerEvent) => {
      pressed.current.delete(e.pointerId)
      if (pressed.current.size === 0 && waiting.current) {
        waiting.current = false
        queue()
      }
    }
    box.addEventListener('pointerdown', press)
    window.addEventListener('pointerup', release)
    window.addEventListener('pointercancel', release)

    map.on('error', (e) => {
      const from = e as { sourceId?: unknown; tile?: unknown }
      if (from.sourceId === undefined && from.tile === undefined) fail()
    })
    map.on('style.load', () => {
      performance.mark('map-style')
      styled = true
      window.clearTimeout(timer)
    })
    const firstTiles = (e: { dataType?: string; tile?: unknown }) => {
      if (e.dataType !== 'source' || !e.tile) return
      map.off('data', firstTiles)
      map.once('render', () => performance.mark('map-tiles'))
    }
    map.on('data', firstTiles)
    map.on('load', () => {
      performance.mark('map-live')
      setLive(true)
      latest.current.onLive?.()
      const p = latest.current
      applyTheme(map, tk)
      addLayers(map, tk, p.bars, null, p.badge ?? null)
      rings.current = new RingLayer(map, ringRadius, ringStyle(tk))
      placeRings()
      ready.current = true
      names()
      setLoaded(true)
      applyFilter(map, p.chips)
      if (window.matchMedia(PHONE).matches) collapseAttribution(map)
      applyLook(map, tk, p.results.length > 0, lookOf(p))
      emitBounds()
    })
    const names = () => map.getContainer().classList.toggle('citymap-names', map.getZoom() >= LABEL_ZOOM)
    map.on('zoom', names)
    map.on('movestart', (e) => {
      window.clearTimeout(settleTimer)
      if (e.originalEvent) setLive(true)
    })
    map.on('moveend', queue)
    map.on('moveend', checkStray)
    map.on('click', (e) => {
      if (!ready.current) return
      const id = nearestDot(map, e.point.x, e.point.y, tk.hit)
      if (id) latest.current.onSelect(id)
    })
    map.on('mouseenter', 'dots', () => {
      map.getCanvas().style.cursor = 'pointer'
    })
    map.on('mouseleave', 'dots', () => {
      map.getCanvas().style.cursor = ''
    })

    return () => {
      removed = true
      window.clearTimeout(timer)
      window.clearTimeout(settleTimer)
      box.removeEventListener('pointerdown', press)
      window.removeEventListener('pointerup', release)
      window.removeEventListener('pointercancel', release)
      pressed.current.clear()
      ready.current = false
      bubbles.current?.destroy()
      bubbles.current = null
      rings.current?.destroy()
      rings.current = null
      me.current = null
      mapRef.current = null
      map.remove()
    }
  }, [])

  useEffect(() => {
    const map = mapRef.current
    if (map && ready.current) applyData(map, bars, null, latest.current.badge ?? null)
    refreshBubbles()
    placeRings()
  }, [bars, props.night, props.badge])

  useEffect(() => {
    const map = mapRef.current
    if (map && ready.current) latest.current.onBounds(clearBounds(map))
    refreshBubbles()
  }, [padKey])

  useEffect(() => {
    refreshBubbles()
  }, [chips, props.boost, props.sink])

  useEffect(() => {
    const map = mapRef.current
    if (!map || !ready.current) return
    const tk = readTokens()
    tokens.current = tk
    applyTheme(map, tk)
    recolorMetro(map, tk)
    rings.current?.setStyle(ringStyle(tk))
    applyLook(map, tk, latest.current.results.length > 0, lookOf(latest.current))
  }, [theme])

  useEffect(() => {
    refreshBubbles()
    restyle()
  }, [results])

  useEffect(() => {
    refreshBubbles()
    restyle()
  }, [highlightId])

  useEffect(() => {
    const map = mapRef.current
    const tm = timing.current
    if (!selectedId || !map || !tm) return
    const p = latest.current
    const bar = p.results.find((b) => b.id === selectedId) ?? p.bars.find((b) => b.id === selectedId)
    if (bar) focusOn(map, bar, tm)
  }, [selectedId])

  useEffect(() => {
    refreshBubbles()
    restyle()
  }, [selectedId])

  useEffect(() => {
    const map = mapRef.current
    if (!active || !map || !ready.current) return
    map.resize()
    latest.current.onBounds(clearBounds(map))
    refreshBubbles()
  }, [active])

  useEffect(() => {
    const map = mapRef.current
    const tm = timing.current
    if (!latest.current.active) return
    const b = boundsOf(latest.current.results.slice(0, 5))
    if (!fitKey || !map || !tm || !b) return
    fitTo(map, b, tm)
    map.once('moveend', capture)
  }, [fitKey])

  useEffect(() => {
    if (anchorKey) capture()
    else anchor.current = null
  }, [anchorKey])

  function locate() {
    if (locating || !navigator.geolocation) return
    setLocating(true)
    navigator.geolocation.getCurrentPosition(
      (pos) => {
        setLocating(false)
        const map = mapRef.current
        if (!map) return
        const at: [number, number] = [pos.coords.longitude, pos.coords.latitude]
        if (!me.current) {
          const dot = document.createElement('div')
          dot.className = 'city-me'
          me.current = new Marker({ element: dot })
        }
        me.current.setLngLat(at).addTo(map)
        if (timing.current) glideTo(map, at, timing.current)
      },
      () => setLocating(false),
      { timeout: 10000, maximumAge: 60000 },
    )
  }

  return (
    <div className="citymap" role="region" aria-label={t.mapLabel} data-live={live || undefined}>
      <div className="citymap-canvas" ref={el} />
      <div className="citymap-controls">
        <button
          className="citymap-control"
          type="button"
          onClick={toggleMetro}
          aria-pressed={metro}
          aria-label={metro ? t.metroHide : t.metroShow}
        >
          <MetroIcon />
        </button>
        <button
          className="citymap-control citymap-locate"
          type="button"
          onClick={locate}
          aria-label={t.locate}
          aria-busy={locating}
        >
          <LocateIcon />
        </button>
      </div>
    </div>
  )
}
