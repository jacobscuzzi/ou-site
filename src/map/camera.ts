import type { LngLatBoundsLike, Map as MaplibreMap } from 'maplibre-gl'
import type { Bounds } from './geo'

export type CameraTiming = { move: number; fit: number; comfort: number }

type Pad = { top: number; bottom: number; left: number; right: number }
type Point = { lat: number; lng: number }

export const STREET_ZOOM = 15
const ZOOM_STEP = 2

const easeOut = (t: number) => 1 - (1 - t) ** 3

export function padding(map: MaplibreMap): Pad {
  const probe = document.createElement('div')
  probe.style.cssText = 'position:fixed;visibility:hidden;pointer-events:none'
  probe.style.padding = 'var(--map-pad-top) var(--map-pad-right) var(--map-pad-bottom) var(--map-pad-left)'
  map.getContainer().appendChild(probe)
  const css = getComputedStyle(probe)
  const pad = {
    top: parseFloat(css.paddingTop) || 0,
    bottom: parseFloat(css.paddingBottom) || 0,
    left: parseFloat(css.paddingLeft) || 0,
    right: parseFloat(css.paddingRight) || 0,
  }
  probe.remove()
  return pad
}

export function centreOffset(map: MaplibreMap): [number, number] {
  const p = padding(map)
  return [(p.left - p.right) / 2, (p.top - p.bottom) / 2]
}

export function lngLatBounds(b: Bounds): LngLatBoundsLike {
  return [
    [b.minLng, b.minLat],
    [b.maxLng, b.maxLat],
  ]
}

export function inView(map: MaplibreMap, at: Point, pad = padding(map), margin = 0) {
  const box = map.getContainer()
  const width = box.clientWidth - pad.left - pad.right
  const height = box.clientHeight - pad.top - pad.bottom
  const m = Math.max(0, Math.min(margin, width / 4, height / 4))
  const p = map.project([at.lng, at.lat])
  return p.x >= pad.left + m && p.x <= box.clientWidth - pad.right - m && p.y >= pad.top + m && p.y <= box.clientHeight - pad.bottom - m
}

export function focusOn(map: MaplibreMap, at: Point, timing: CameraTiming) {
  if (inView(map, at, padding(map), timing.comfort)) return
  const zoom = map.getZoom()
  map.easeTo({
    center: [at.lng, at.lat],
    offset: centreOffset(map),
    zoom: zoom < STREET_ZOOM ? Math.min(STREET_ZOOM, zoom + ZOOM_STEP) : zoom,
    duration: timing.move,
    easing: easeOut,
  })
}

export function fitTo(map: MaplibreMap, b: Bounds, timing: CameraTiming) {
  const p = padding(map)
  const extra = timing.comfort
  map.fitBounds(lngLatBounds(b), {
    padding: { top: p.top + extra, bottom: p.bottom + extra, left: p.left + extra, right: p.right + extra },
    maxZoom: STREET_ZOOM,
    duration: timing.fit,
    easing: easeOut,
  })
}

export function glideTo(map: MaplibreMap, at: [number, number], timing: CameraTiming) {
  map.easeTo({ center: at, offset: centreOffset(map), zoom: Math.max(map.getZoom(), STREET_ZOOM), duration: timing.move, easing: easeOut })
}
