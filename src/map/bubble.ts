import { Marker, type Map as MaplibreMap } from 'maplibre-gl'
import type { Bar, MapBar } from '../api/types'
import { cleanName, spreadPick } from './geo'

export type BubbleSize = 'lg' | 'md' | 'sm'

export type BubbleSpec = {
  id: string
  name: string
  lat: number
  lng: number
  photo?: string
  rank?: number
  size: BubbleSize
}

type Item = { marker: Marker; el: HTMLButtonElement; photo: HTMLSpanElement }

const TOP_RANKS = 5
const EXPLORE_MAX = 6
const PHASES = 5

export function resultSpecs(results: Bar[]): BubbleSpec[] {
  return results.map((bar) => ({
    id: bar.id,
    name: bar.name,
    lat: bar.lat,
    lng: bar.lng,
    photo: bar.photos[0],
    rank: bar.rank,
    size: bar.rank <= TOP_RANKS ? 'lg' : 'sm',
  }))
}

export function exploreSpecs(map: MaplibreMap, visible: MapBar[], gap: number): BubbleSpec[] {
  const at = (bar: MapBar) => map.project([bar.lng, bar.lat])
  return spreadPick(visible, at, EXPLORE_MAX, gap).map((bar) => ({
    id: bar.id,
    name: bar.name,
    lat: bar.lat,
    lng: bar.lng,
    photo: bar.cover,
    size: 'md',
  }))
}

function phase(id: string) {
  let h = 0
  for (const ch of id) h = (h * 31 + ch.charCodeAt(0)) % PHASES
  return h
}

function fillPhoto(photo: HTMLSpanElement, spec: BubbleSpec) {
  photo.replaceChildren()
  photo.classList.remove('spot-letter')
  const letter = () => {
    photo.replaceChildren()
    photo.classList.add('spot-letter')
    photo.textContent = [...cleanName(spec.name)][0]?.toUpperCase() ?? ''
  }
  if (!spec.photo) return letter()
  const img = document.createElement('img')
  img.alt = ''
  img.loading = 'lazy'
  img.decoding = 'async'
  img.addEventListener('error', letter)
  img.src = spec.photo
  photo.appendChild(img)
}

function fillBadge(el: HTMLButtonElement, rank?: number) {
  const body = el.firstElementChild!
  let badge = body.querySelector('.spot-badge')
  if (rank === undefined) return badge?.remove()
  if (!badge) {
    badge = document.createElement('span')
    badge.className = 'spot-badge'
    body.appendChild(badge)
  }
  badge.textContent = String(rank)
}

function createItem(spec: BubbleSpec, onSelect: (id: string) => void): Item {
  const anchor = document.createElement('div')
  const el = document.createElement('button')
  const body = document.createElement('span')
  const photo = document.createElement('span')
  el.type = 'button'
  el.className = 'spot'
  body.className = 'spot-body'
  photo.className = 'spot-photo'
  el.style.setProperty('--bubble-phase', String(phase(spec.id)))
  body.appendChild(photo)
  el.appendChild(body)
  anchor.appendChild(el)
  el.addEventListener('click', (e) => {
    e.stopPropagation()
    onSelect(spec.id)
  })
  return { marker: new Marker({ element: anchor }).setLngLat([spec.lng, spec.lat]), el, photo }
}

export class BubbleLayer {
  private items = new Map<string, Item>()
  private photos = new Map<string, string | undefined>()

  constructor(
    private map: MaplibreMap,
    private onSelect: (id: string) => void,
  ) {}

  sync(specs: BubbleSpec[], selectedId: string | null) {
    const keep = new Set(specs.map((s) => s.id))
    for (const [id, item] of this.items) {
      if (keep.has(id)) continue
      item.marker.remove()
      this.items.delete(id)
      this.photos.delete(id)
    }
    for (const spec of specs) {
      let item = this.items.get(spec.id)
      if (!item) {
        item = createItem(spec, this.onSelect)
        item.marker.addTo(this.map)
        this.items.set(spec.id, item)
      }
      if (!this.photos.has(spec.id) || this.photos.get(spec.id) !== spec.photo) {
        fillPhoto(item.photo, spec)
        this.photos.set(spec.id, spec.photo)
      }
      item.el.dataset.size = spec.size
      item.el.setAttribute('aria-label', spec.rank === undefined ? spec.name : `${spec.rank}. ${spec.name}`)
      item.el.toggleAttribute('data-selected', spec.id === selectedId)
      fillBadge(item.el, spec.rank)
    }
  }

  destroy() {
    for (const item of this.items.values()) item.marker.remove()
    this.items.clear()
    this.photos.clear()
  }
}
