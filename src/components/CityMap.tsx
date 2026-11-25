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
import { BubbleLayer, exploreSpecs, resultSpecs } from '../map/bubble'
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
  padKey?: string
  night?: ReadonlySet<string> | null
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

function widen(b: Bounds, m: number): Bounds {
  return { minLng: b.minLng - m, minLat: b.minLat - m, maxLng: b.maxLng + m, maxLat: b.maxLat + m }
}

function addLayers(map: MaplibreMap, tk: Tokens, bars: MapBar[], night: ReadonlySet<string> | null, badge: ReadonlySet<string> | null) {
  const top: ExpressionSpecification = ['==', ['get', 'top'], 1]
  const font = styleFont(map)
  map.addSource('bars', { type: 'geojson', data: barsToGeoJSON(bars, night, badge) })
  map.addLayer({
    id: 'dots',
    type: 'circle',
    source: 'bars',
    paint: {
      'circle-color': ['case', ['==', ['get', 'club'], 1], tk.dotClub, top, tk.dotTop, tk.dot],
    },
  })
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
      'text-field': ['step', ['zoom'], ['case', top, ['get', 'name'], ''], ALL_LABELS_ZOOM, ['get', 'name']],
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

function applyLook(map: MaplibreMap, tk: Tokens, dimmed: boolean, selectedId: string | null) {
  const selected: ExpressionSpecification = ['==', ['get', 'id'], selectedId ?? '']
  const faded: ExpressionSpecification = ['==', ['get', 'ev'], 0]
  const base: ExpressionSpecification | number = dimmed
    ? tk.dim
    : ['interpolate', ['linear'], ['get', 'quality'], 0, tk.opacityMin, 1, tk.opacityMax]
  const opacity: ExpressionSpecification = ['case', selected, tk.opacityMax, faded, tk.faded, base]
  map.setPaintProperty('dots', 'circle-radius', [
    'case',
    selected,
    tk.rSelected,
    faded,
    tk.rFaded,
    ['interpolate', ['linear'], ['get', 'quality'], 0, tk.rMin, 1, tk.rMax],
  ])
  map.setPaintProperty('dots', 'circle-opacity', opacity)
  map.setPaintProperty('dots', 'circle-stroke-opacity', opacity)
  map.setPaintProperty('dots', 'circle-stroke-color', ['case', selected, tk.selected, tk.stroke])
  map.setPaintProperty('dots', 'circle-stroke-width', ['case', selected, tk.selectedWidth, tk.strokeWidth])
  map.setLayoutProperty('dots', 'circle-sort-key', ['+', ['get', 'quality'], ['case', selected, 1, 0]])
  map.setPaintProperty('labels', 'text-opacity', dimmed ? tk.dim : 1)
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
  const timing = useRef<CameraTiming | null>(null)
  const anchor = useRef<{ center: LngLat; zoom: number } | null>(null)

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

  function refreshBubbles() {
    const map = mapRef.current
    const layer = bubbles.current
    if (!map || !layer || !ready.current || !tokens.current || !latest.current.active) return
    const p = latest.current
    if (p.results.length > 0) {
      exploreIds.current = []
      layer.sync(resultSpecs(p.results, latestKind.current), lookOf(p))
      layer.party(p.badge ?? null)
      return applyFilter(map, p.chips, layer.ids())
    }
    if (map.isMoving() || pressed.current.size > 0) {
      waiting.current = true
      return layer.mark(lookOf(p))
    }
    const pad = padding(map)
    const loose = { ...pad, left: 0, right: 0 }
    const kept = new Set(exploreIds.current)
    const visible = p.bars.filter(
      (bar) => passes(bar, p.chips) && (!p.night || p.night.has(bar.id)) && inView(map, bar, kept.has(bar.id) ? loose : pad),
    )
    layer.sync(exploreSpecs(map, visible, exploreIds.current, tokens.current.bubbleGap, latestKind.current), lookOf(p))
    exploreIds.current = layer.ids()
    layer.party(p.badge ?? null)
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
      styled = true
      window.clearTimeout(timer)
    })
    map.on('load', () => {
      const p = latest.current
      applyTheme(map, tk)
      addLayers(map, tk, p.bars, p.night ?? null, p.badge ?? null)
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
    map.on('movestart', () => window.clearTimeout(settleTimer))
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
      me.current = null
      mapRef.current = null
      map.remove()
    }
  }, [])

  useEffect(() => {
    const map = mapRef.current
    if (map && ready.current) applyData(map, bars, latest.current.night ?? null, latest.current.badge ?? null)
    refreshBubbles()
  }, [bars, props.night, props.badge])

  useEffect(() => {
    const map = mapRef.current
    if (map && ready.current) latest.current.onBounds(clearBounds(map))
    refreshBubbles()
  }, [padKey])

  useEffect(() => {
    refreshBubbles()
  }, [chips])

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
    <div className="citymap" role="region" aria-label={t.mapLabel}>
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
