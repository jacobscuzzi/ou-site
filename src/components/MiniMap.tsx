import type { Bar } from '../api/types'
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

export default function MiniMap({ bars, onOpen }: { bars: Bar[]; onOpen: () => void }) {
  const box = bounds(bars)
  const spanLat = box.maxLat - box.minLat || 0.01
  const spanLng = box.maxLng - box.minLng || 0.01

  return (
    <button className="minimap" type="button" onClick={onOpen} aria-label="Show results on the map">
      {bars.map((bar) => (
        <span
          key={bar.id}
          className="minimap-dot"
          style={{
            left: `${15 + ((bar.lng - box.minLng) / spanLng) * 70}%`,
            top: `${15 + ((box.maxLat - bar.lat) / spanLat) * 70}%`,
          }}
        />
      ))}
    </button>
  )
}
