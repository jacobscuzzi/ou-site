import type { Map as MaplibreMap } from 'maplibre-gl'
import { still } from '../motion'

export type RingStyle = { color: string; width: number; dash: number; gap: number; period: number }

type Spot = { lng: number; lat: number }

// Dashed rings slowly turning around the places with a party on the chosen night: one 2D canvas over
// the map, drawn on every map frame and on a slow clock, so a hundred venues cost one draw call each.
export class RingLayer {
  private canvas = document.createElement('canvas')
  private ctx = this.canvas.getContext('2d')
  private spots = new Map<string, Spot>()
  private clock = 0
  private last = 0

  constructor(
    private map: MaplibreMap,
    private radius: (id: string) => number,
    private style: RingStyle,
  ) {
    this.canvas.className = 'citymap-rings'
    this.canvas.setAttribute('aria-hidden', 'true')
    const box = map.getCanvasContainer()
    box.insertBefore(this.canvas, map.getCanvas().nextSibling)
    map.on('render', this.draw)
    map.on('resize', this.size)
    this.size()
  }

  setStyle(style: RingStyle) {
    this.style = style
    this.draw()
  }

  set(spots: Map<string, Spot>) {
    this.spots = spots
    window.cancelAnimationFrame(this.clock)
    this.draw()
    if (spots.size > 0 && !still()) this.clock = window.requestAnimationFrame(this.tick)
  }

  private size = () => {
    const c = this.map.getCanvas()
    const dpr = window.devicePixelRatio || 1
    this.canvas.width = c.clientWidth * dpr
    this.canvas.height = c.clientHeight * dpr
    this.canvas.style.width = `${c.clientWidth}px`
    this.canvas.style.height = `${c.clientHeight}px`
    this.draw()
  }

  private tick = (now: number) => {
    if (now - this.last > 60) {
      this.last = now
      this.draw()
    }
    this.clock = window.requestAnimationFrame(this.tick)
  }

  private draw = () => {
    const ctx = this.ctx
    if (!ctx) return
    const dpr = window.devicePixelRatio || 1
    ctx.setTransform(dpr, 0, 0, dpr, 0, 0)
    ctx.clearRect(0, 0, this.canvas.width, this.canvas.height)
    if (this.spots.size === 0) return
    const { color, width, dash, gap, period } = this.style
    const w = this.canvas.width / dpr
    const h = this.canvas.height / dpr
    ctx.strokeStyle = color
    ctx.lineWidth = width
    ctx.setLineDash([dash, gap])
    ctx.lineDashOffset = still() ? 0 : -((performance.now() / period) * (dash + gap) * 4)
    ctx.beginPath()
    for (const [id, s] of this.spots) {
      const r = this.radius(id)
      if (r <= 0) continue
      const p = this.map.project([s.lng, s.lat])
      if (p.x < -r || p.y < -r || p.x > w + r || p.y > h + r) continue
      ctx.moveTo(p.x + r, p.y)
      ctx.arc(p.x, p.y, r, 0, Math.PI * 2)
    }
    ctx.stroke()
  }

  destroy() {
    window.cancelAnimationFrame(this.clock)
    this.map.off('render', this.draw)
    this.map.off('resize', this.size)
    this.canvas.remove()
  }
}
