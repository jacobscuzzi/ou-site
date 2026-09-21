import { useEffect, useRef } from 'react'
import { Map as MaplibreMap, Marker, setWorkerUrl } from 'maplibre-gl'
import workerUrl from 'maplibre-gl/dist/maplibre-gl-worker.mjs?worker&url'
import 'maplibre-gl/dist/maplibre-gl.css'
import type { Bar } from '../api/types'
import { BeerIcon, ClockIcon } from './icons'
import { bounds } from './MiniMap'
import './MapView.css'

setWorkerUrl(workerUrl)

const STYLE = 'https://basemaps.cartocdn.com/gl/positron-gl-style/style.json'

type Props = {
  bars: Bar[]
  selectedId: string
  onSelect: (id: string) => void
  onClose: () => void
}

export default function MapView({ bars, selectedId, onSelect, onClose }: Props) {
  const mapEl = useRef<HTMLDivElement>(null)
  const stripEl = useRef<HTMLDivElement>(null)
  const mapRef = useRef<MaplibreMap | null>(null)
  const pins = useRef(new Map<string, HTMLDivElement>())
  const onSelectRef = useRef(onSelect)
  onSelectRef.current = onSelect

  useEffect(() => {
    const box = bounds(bars)
    const map = new MaplibreMap({
      container: mapEl.current!,
      style: STYLE,
      bounds: [
        [box.minLng, box.minLat],
        [box.maxLng, box.maxLat],
      ],
      fitBoundsOptions: { padding: { top: 120, bottom: 170, left: 40, right: 40 }, maxZoom: 15 },
      attributionControl: { compact: true },
    })
    mapRef.current = map

    for (const bar of bars) {
      const el = document.createElement('div')
      el.className = 'pin'
      el.textContent = String(bar.rank)
      el.addEventListener('click', () => onSelectRef.current(bar.id))
      pins.current.set(bar.id, el)
      new Marker({ element: el }).setLngLat([bar.lng, bar.lat]).addTo(map)
    }

    return () => {
      map.remove()
      pins.current.clear()
    }
  }, [bars])

  const lastSelected = useRef(selectedId)

  useEffect(() => {
    for (const [id, el] of pins.current) el.classList.toggle('pin-selected', id === selectedId)
    const card = stripEl.current?.querySelector<HTMLElement>(`[data-id="${selectedId}"]`)
    if (selectedId === lastSelected.current) {
      card?.scrollIntoView({ inline: 'center', block: 'nearest' })
      return
    }
    lastSelected.current = selectedId
    const bar = bars.find((b) => b.id === selectedId)
    if (bar) mapRef.current?.easeTo({ center: [bar.lng, bar.lat], offset: [0, -40], duration: 500 })
    card?.scrollIntoView({ inline: 'center', block: 'nearest', behavior: 'smooth' })
  }, [selectedId, bars])

  useEffect(() => {
    const html = document.documentElement
    const previous = html.style.overflow
    html.style.overflow = 'hidden'
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose()
    }
    window.addEventListener('keydown', onKey)
    return () => {
      html.style.overflow = previous
      window.removeEventListener('keydown', onKey)
    }
  }, [onClose])

  useEffect(() => {
    const strip = stripEl.current!
    let timer = 0
    const onScroll = () => {
      window.clearTimeout(timer)
      timer = window.setTimeout(() => {
        const middle = strip.scrollLeft + strip.clientWidth / 2
        let best: HTMLElement | null = null
        let bestDist = Infinity
        for (const card of strip.querySelectorAll<HTMLElement>('.strip-card')) {
          const dist = Math.abs(card.offsetLeft + card.offsetWidth / 2 - middle)
          if (dist < bestDist) {
            bestDist = dist
            best = card
          }
        }
        if (best?.dataset.id) onSelectRef.current(best.dataset.id)
      }, 120)
    }
    strip.addEventListener('scroll', onScroll, { passive: true })
    return () => {
      strip.removeEventListener('scroll', onScroll)
      window.clearTimeout(timer)
    }
  }, [])

  return (
    <div className="mapview" role="dialog" aria-label="Results on the map">
      <div className="mapview-map" ref={mapEl} />
      <button className="mapview-close" type="button" onClick={onClose} aria-label="Close map">
        <span aria-hidden="true">×</span>
      </button>
      <div className="strip" ref={stripEl}>
        {bars.map((bar) => (
          <button
            key={bar.id}
            type="button"
            data-id={bar.id}
            className={bar.id === selectedId ? 'strip-card strip-card-selected' : 'strip-card'}
            onClick={() => onSelect(bar.id)}
          >
            <span className="strip-glare" />
            <span className="strip-photo">
              <img src={bar.photos[0]} alt="" loading="lazy" />
              <span className="strip-rank">{bar.rank}</span>
            </span>
            <span className="strip-body">
              <span className="strip-name">{bar.name}</span>
              <span className="strip-arr">{bar.arrondissement}</span>
              <span className="strip-chips">
                <span className="chip chip-sm">
                  <span className="chip-icon"><ClockIcon /></span>
                  {bar.openUntil ? `Till ${bar.openUntil}` : 'Closed'}
                </span>
                {bar.pintPrice !== null && (
                  <span className="chip chip-sm chip-pink">
                    <span className="chip-icon"><BeerIcon /></span>
                    {bar.pintPrice.toFixed(2)} EUR
                  </span>
                )}
              </span>
            </span>
          </button>
        ))}
      </div>
    </div>
  )
}
