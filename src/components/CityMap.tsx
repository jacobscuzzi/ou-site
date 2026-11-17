import { useEffect, useRef, useState } from 'react'
import {
  getWorkerUrl,
  Map as MaplibreMap,
  Marker,
  setWorkerUrl,
  type ExpressionSpecification,
  type FilterSpecification,
  type GeoJSONSource,
  type LngLatBoundsLike,
} from 'maplibre-gl'
import workerUrl from 'maplibre-gl/dist/maplibre-gl-worker.mjs?worker&url'
import 'maplibre-gl/dist/maplibre-gl.css'
import type { Bar, MapBar } from '../api/types'
import { useT } from '../i18n'
import { barsToGeoJSON, boundsOf, chipFilter, PARIS, type Bounds, type ChipKey } from '../map/geo'
import { LocateIcon } from './icons'
import './CityMap.css'

if (getWorkerUrl() === '') setWorkerUrl(workerUrl)

const STYLE = 'https://basemaps.cartocdn.com/gl/positron-gl-style/style.json'
const LABEL_ZOOM = 13
const ALL_LABELS_ZOOM = 15
const STREET_ZOOM = 15
const START_CENTER: [number, number] = [2.3488, 48.86]
const START_ZOOM = 12.3
const PAN_MARGIN = 0.08
const STYLE_TIMEOUT = 10000

type Props = {
  bars: MapBar[]
  results: Bar[]
  chips: ReadonlySet<ChipKey>
  selectedId: string | null
  fitKey: string
  onSelect: (id: string) => void
  onBounds: (b: Bounds) => void
  onFail: () => void
}

type Tokens = ReturnType<typeof readTokens>

function readTokens() {
  const css = getComputedStyle(document.documentElement)
  const str = (name: string) => css.getPropertyValue(name).trim()
  const num = (name: string) => parseFloat(str(name))
  return {
    dot: str('--dot'),
    dotTop: str('--dot-top'),
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
    hit: num('--dot-hit'),
    label: str('--label'),
    halo: str('--label-halo'),
    labelSize: num('--label-size'),
    haloWidth: num('--label-halo-width'),
    labelOffset: num('--label-offset'),
  }
}

function padding() {
  const css = getComputedStyle(document.documentElement)
  const num = (name: string) => parseFloat(css.getPropertyValue(name))
  return {
    top: num('--map-pad-top'),
    bottom: num('--map-pad-bottom'),
    left: num('--map-pad-left'),
    right: num('--map-pad-right'),
  }
}

function centreOffset(): [number, number] {
  const p = padding()
  return [(p.left - p.right) / 2, (p.top - p.bottom) / 2]
}

function widen(b: Bounds, m: number): Bounds {
  return { minLng: b.minLng - m, minLat: b.minLat - m, maxLng: b.maxLng + m, maxLat: b.maxLat + m }
}

function lngLatBounds(b: Bounds): LngLatBoundsLike {
  return [
    [b.minLng, b.minLat],
    [b.maxLng, b.maxLat],
  ]
}

function inView(map: MaplibreMap, at: { lat: number; lng: number }) {
  const p = map.project([at.lng, at.lat])
  const box = map.getContainer()
  const pad = padding()
  return p.x >= pad.left && p.x <= box.clientWidth - pad.right && p.y >= pad.top && p.y <= box.clientHeight - pad.bottom
}

function styleFont(map: MaplibreMap) {
  const fonts: string[][] = []
  for (const layer of map.getStyle().layers) {
    if (layer.type !== 'symbol') continue
    const font: unknown = layer.layout?.['text-font']
    if (Array.isArray(font) && font.length > 0 && font.every((f) => typeof f === 'string')) fonts.push(font)
  }
  return fonts.find((font) => !/italic/i.test(font[0])) ?? fonts[0]
}

function addLayers(map: MaplibreMap, tk: Tokens, bars: MapBar[]) {
  const top: ExpressionSpecification = ['==', ['get', 'top'], 1]
  const font = styleFont(map)
  map.addSource('bars', { type: 'geojson', data: barsToGeoJSON(bars) })
  map.addLayer({
    id: 'dots',
    type: 'circle',
    source: 'bars',
    paint: {
      'circle-color': ['case', top, tk.dotTop, tk.dot],
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

function applyData(map: MaplibreMap, bars: MapBar[]) {
  map.getSource<GeoJSONSource>('bars')?.setData(barsToGeoJSON(bars))
}

function applyFilter(map: MaplibreMap, chips: ReadonlySet<ChipKey>) {
  const filter = chipFilter(chips) as FilterSpecification | null
  map.setFilter('dots', filter)
  map.setFilter('labels', filter)
}

function applyLook(map: MaplibreMap, tk: Tokens, dimmed: boolean, selectedId: string | null) {
  const selected: ExpressionSpecification = ['==', ['get', 'id'], selectedId ?? '']
  const base: ExpressionSpecification | number = dimmed
    ? tk.dim
    : ['interpolate', ['linear'], ['get', 'quality'], 0, tk.opacityMin, 1, tk.opacityMax]
  const opacity: ExpressionSpecification = ['case', selected, tk.opacityMax, base]
  map.setPaintProperty('dots', 'circle-radius', [
    'case',
    selected,
    tk.rSelected,
    ['interpolate', ['linear'], ['get', 'quality'], 0, tk.rMin, 1, tk.rMax],
  ])
  map.setPaintProperty('dots', 'circle-opacity', opacity)
  map.setPaintProperty('dots', 'circle-stroke-opacity', opacity)
  map.setPaintProperty('dots', 'circle-stroke-color', ['case', selected, tk.selected, tk.stroke])
  map.setPaintProperty('dots', 'circle-stroke-width', ['case', selected, tk.selectedWidth, tk.strokeWidth])
  map.setLayoutProperty('dots', 'circle-sort-key', ['+', ['get', 'quality'], ['case', selected, 1, 0]])
  map.setPaintProperty('labels', 'text-opacity', dimmed ? tk.dim : 1)
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

export default function CityMap(props: Props) {
  const { bars, results, chips, selectedId, fitKey } = props
  const t = useT()
  const el = useRef<HTMLDivElement>(null)
  const mapRef = useRef<MaplibreMap | null>(null)
  const tokens = useRef<Tokens | null>(null)
  const ready = useRef(false)
  const latest = useRef(props)
  latest.current = props
  const pins = useRef(new Map<string, HTMLDivElement>())
  const me = useRef<Marker | null>(null)
  const [locating, setLocating] = useState(false)

  function restyle() {
    const map = mapRef.current
    if (!map || !ready.current || !tokens.current) return
    applyLook(map, tokens.current, latest.current.results.length > 0, latest.current.selectedId)
  }

  useEffect(() => {
    const tk = readTokens()
    tokens.current = tk
    let map: MaplibreMap
    try {
      map = new MaplibreMap({
        container: el.current!,
        style: STYLE,
        center: START_CENTER,
        zoom: START_ZOOM,
        maxBounds: lngLatBounds(widen(PARIS, PAN_MARGIN)),
        attributionControl: { compact: true },
      })
    } catch {
      latest.current.onFail()
      return
    }
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
    const emitBounds = () => {
      const b = map.getBounds()
      latest.current.onBounds({ minLng: b.getWest(), minLat: b.getSouth(), maxLng: b.getEast(), maxLat: b.getNorth() })
    }

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
      addLayers(map, tk, p.bars)
      ready.current = true
      applyFilter(map, p.chips)
      applyLook(map, tk, p.results.length > 0, p.selectedId)
      emitBounds()
    })
    map.on('moveend', emitBounds)
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
      ready.current = false
      me.current = null
      mapRef.current = null
      map.remove()
    }
  }, [])

  useEffect(() => {
    const map = mapRef.current
    if (map && ready.current) applyData(map, bars)
  }, [bars])

  useEffect(() => {
    const map = mapRef.current
    if (map && ready.current) applyFilter(map, chips)
  }, [chips])

  useEffect(() => {
    const map = mapRef.current
    if (!map) return
    const made = results.map((bar) => {
      const anchor = document.createElement('div')
      const pin = document.createElement('div')
      pin.className = 'city-pin'
      pin.classList.toggle('city-pin-selected', bar.id === latest.current.selectedId)
      pin.textContent = String(bar.rank)
      pin.addEventListener('click', (e) => {
        e.stopPropagation()
        latest.current.onSelect(bar.id)
      })
      anchor.appendChild(pin)
      pins.current.set(bar.id, pin)
      return new Marker({ element: anchor }).setLngLat([bar.lng, bar.lat]).addTo(map)
    })
    restyle()
    return () => {
      for (const marker of made) marker.remove()
      pins.current.clear()
    }
  }, [results])

  useEffect(() => {
    for (const [id, pin] of pins.current) pin.classList.toggle('city-pin-selected', id === selectedId)
    restyle()
    const map = mapRef.current
    if (!map || !selectedId) return
    const p = latest.current
    const bar = p.results.find((b) => b.id === selectedId) ?? p.bars.find((b) => b.id === selectedId)
    if (bar && !inView(map, bar)) map.easeTo({ center: [bar.lng, bar.lat], offset: centreOffset(), duration: 500 })
  }, [selectedId])

  useEffect(() => {
    const map = mapRef.current
    const b = boundsOf(latest.current.results.slice(0, 5))
    if (!map || !b) return
    map.fitBounds(lngLatBounds(b), { padding: padding(), maxZoom: STREET_ZOOM, duration: 600 })
  }, [fitKey])

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
        map.easeTo({ center: at, offset: centreOffset(), zoom: Math.max(map.getZoom(), STREET_ZOOM), duration: 600 })
      },
      () => setLocating(false),
      { timeout: 10000, maximumAge: 60000 },
    )
  }

  return (
    <div className="citymap">
      <div className="citymap-canvas" ref={el} />
      <button
        className="citymap-locate"
        type="button"
        onClick={locate}
        aria-label={t.locate}
        aria-busy={locating}
      >
        <LocateIcon />
      </button>
    </div>
  )
}
