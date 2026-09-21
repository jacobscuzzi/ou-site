import type { Bar } from '../api/types'
import { useT } from '../i18n'
import './MiniMap.css'

export function bounds(bars: Bar[]) {
  const lats = bars.map((b) => b.lat)
  const lngs = bars.map((b) => b.lng)
  return {
    minLat: Math.min(...lats),
    maxLat: Math.max(...lats),
    minLng: Math.min(...lngs),
    maxLng: Math.max(...lngs),
  }
}

// map-paris.jpg is a 4x4 grid of zoom 13 tiles starting at 4147/2815
const ZOOM = 13
const TILE = 256
const TILE_X = 4147
const TILE_Y = 2815
const IMAGE = 1024
const INNER = 66

function project(bar: Bar) {
  const n = 2 ** ZOOM * TILE
  const lat = (bar.lat * Math.PI) / 180
  return {
    x: ((bar.lng + 180) / 360) * n - TILE_X * TILE,
    y: ((1 - Math.log(Math.tan(lat) + 1 / Math.cos(lat)) / Math.PI) / 2) * n - TILE_Y * TILE,
  }
}

export default function MiniMap({ bars, onOpen }: { bars: Bar[]; onOpen: () => void }) {
  const t = useT()
  const points = bars.map(project)
  const xs = points.map((p) => p.x)
  const ys = points.map((p) => p.y)
  const side = Math.max(Math.max(...xs) - Math.min(...xs), Math.max(...ys) - Math.min(...ys), 40) * 1.4
  const left = (Math.min(...xs) + Math.max(...xs)) / 2 - side / 2
  const top = (Math.min(...ys) + Math.max(...ys)) / 2 - side / 2
  const scale = INNER / side

  return (
    <button
      className="minimap"
      type="button"
      onClick={onOpen}
      aria-label={t.showMap}
      style={{
        backgroundSize: `${IMAGE * scale}px`,
        backgroundPosition: `${-left * scale}px ${-top * scale}px`,
      }}
    >
      {points.map((p, i) => (
        <span
          key={bars[i].id}
          className="minimap-dot"
          style={{ left: (p.x - left) * scale, top: (p.y - top) * scale }}
        />
      ))}
    </button>
  )
}
