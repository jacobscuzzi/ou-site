import { Marker, type Map as MaplibreMap } from 'maplibre-gl'
import type { Bar } from '../api/types'
import type { DanceKind } from '../kind'
import { cleanName } from './geo'
import { still } from '../motion'

export type BubbleSize = 'lg' | 'md' | 'sm'

export type BubbleSpec = {
  id: string
  name: string
  lat: number
  lng: number
  photo?: string
  rank?: number
  size: BubbleSize
  kind?: DanceKind | null
}

type Item = { marker: Marker; el: HTMLButtonElement; photo: HTMLSpanElement; name: HTMLSpanElement }

const TOP_RANKS = 5
const PHASES = 5
const STAGGER_MAX = 8
const LEAVE_SLACK = 30

export type BubbleTiming = { out: number; step: number }

export function resultSpecs(results: Bar[], kindOf: (kinds: string[] | undefined) => DanceKind | null): BubbleSpec[] {
  return results.map((bar) => ({
    id: bar.id,
    name: bar.name,
    lat: bar.lat,
    lng: bar.lng,
    photo: bar.thumbs?.[0] || bar.photos[0],
    rank: bar.rank,
    size: bar.rank <= TOP_RANKS ? 'lg' : 'sm',
    kind: kindOf(bar.kinds),
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
  // a bubble is on screen the moment it exists: no lazy loading, first in the queue
  img.loading = 'eager'
  img.decoding = 'async'
  img.setAttribute('fetchpriority', 'high')
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
  const name = document.createElement('span')
  el.type = 'button'
  el.className = 'spot'
  body.className = 'spot-body'
  photo.className = 'spot-photo'
  name.className = 'spot-name'
  el.style.setProperty('--bubble-phase', String(phase(spec.id)))
  body.appendChild(photo)
  el.append(body, name)
  anchor.appendChild(el)
  el.addEventListener('click', (e) => {
    e.stopPropagation()
    onSelect(spec.id)
  })
  return { marker: new Marker({ element: anchor }).setLngLat([spec.lng, spec.lat]), el, photo, name }
}

export class BubbleLayer {
  private items = new Map<string, Item>()
  private leaving = new Map<string, { item: Item; timer: number }>()
  private photos = new Map<string, string | undefined>()

  constructor(
    private map: MaplibreMap,
    private onSelect: (id: string) => void,
    private timing: BubbleTiming,
  ) {}

  sync(specs: BubbleSpec[], selectedId: string | null) {
    const keep = new Set(specs.map((s) => s.id))
    for (const [id, item] of this.items) if (!keep.has(id)) this.retire(id, item)
    let fresh = 0
    for (const spec of specs) {
      let item = this.items.get(spec.id) ?? this.revive(spec.id)
      if (!item) item = this.enter(spec, fresh++)
      if (!this.photos.has(spec.id) || this.photos.get(spec.id) !== spec.photo) {
        fillPhoto(item.photo, spec)
        this.photos.set(spec.id, spec.photo)
      }
      item.name.textContent = cleanName(spec.name)
      item.el.dataset.size = spec.size
      if (spec.kind) item.el.dataset.kind = spec.kind
      else delete item.el.dataset.kind
      item.el.setAttribute('aria-label', spec.rank === undefined ? spec.name : `${spec.rank}. ${spec.name}`)
      fillBadge(item.el, spec.rank)
    }
    this.mark(selectedId)
    this.stack(specs)
  }

  // A party tonight at the place (drink layer): a small dot on the bubble, like the badge on the pin.
  party(ids: ReadonlySet<string> | null) {
    for (const [id, item] of this.items) item.el.toggleAttribute('data-party', ids?.has(id) === true)
  }

  // the deal of the place in the deals focus: "-30%" or the money emoji
  deal(labels: ReadonlyMap<string, string> | null) {
    for (const [id, item] of this.items) {
      const body = item.el.firstElementChild!
      let tag = body.querySelector<HTMLElement>('.spot-deal')
      const text = labels?.get(id)
      if (!text) {
        tag?.remove()
        continue
      }
      if (!tag) {
        tag = document.createElement('span')
        tag.className = 'spot-deal'
        body.appendChild(tag)
      }
      tag.textContent = text
    }
  }

  // this device's heart or bookmark on the photo bubbles
  marks(marks: ReadonlyMap<string, string> | null) {
    for (const [id, item] of this.items) {
      const kind = marks?.get(id)
      if (kind === 'like' || kind === 'want') item.el.dataset.mark = kind
      else delete item.el.dataset.mark
    }
  }

  mark(selectedId: string | null) {
    for (const [id, item] of this.items) item.el.toggleAttribute('data-selected', id === selectedId)
  }

  private enter(spec: BubbleSpec, order: number) {
    const item = createItem(spec, this.onSelect)
    this.items.set(spec.id, item)
    if (still()) {
      item.marker.addTo(this.map)
      return item
    }
    item.el.dataset.enter = ''
    item.el.style.setProperty('--spot-delay', `${Math.min(order, STAGGER_MAX) * this.timing.step}ms`)
    item.marker.addTo(this.map)
    requestAnimationFrame(() => requestAnimationFrame(() => item.el.removeAttribute('data-enter')))
    return item
  }

  private retire(id: string, item: Item) {
    this.items.delete(id)
    if (still()) {
      item.marker.remove()
      this.photos.delete(id)
      return
    }
    item.el.dataset.leave = ''
    const timer = window.setTimeout(() => {
      item.marker.remove()
      this.leaving.delete(id)
      this.photos.delete(id)
    }, this.timing.out + LEAVE_SLACK)
    this.leaving.set(id, { item, timer })
  }

  private revive(id: string) {
    const gone = this.leaving.get(id)
    if (!gone) return undefined
    window.clearTimeout(gone.timer)
    this.leaving.delete(id)
    gone.item.el.removeAttribute('data-leave')
    gone.item.el.style.setProperty('--spot-delay', '0ms')
    this.items.set(id, gone.item)
    return gone.item
  }

  private stack(specs: BubbleSpec[]) {
    const ranked = specs.filter((s) => s.rank !== undefined).sort((a, b) => (b.rank ?? 0) - (a.rank ?? 0))
    const els = ranked.flatMap((s) => this.items.get(s.id)?.marker.getElement() ?? [])
    const parent = els[0]?.parentElement
    if (!parent) return
    const now = [...parent.children].filter((el) => els.includes(el as HTMLElement))
    if (now.every((el, i) => el === els[i])) return
    for (const el of els) parent.appendChild(el)
  }

  ids() {
    return [...this.items.keys()]
  }

  destroy() {
    for (const item of this.items.values()) item.marker.remove()
    for (const { item, timer } of this.leaving.values()) {
      window.clearTimeout(timer)
      item.marker.remove()
    }
    this.items.clear()
    this.leaving.clear()
    this.photos.clear()
  }
}
