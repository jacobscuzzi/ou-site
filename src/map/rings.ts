import type { Map as MaplibreMap } from 'maplibre-gl'
import { still } from '../motion'

export type RingStyle = {
  sparkles: boolean
  metal: [string, string, string] // highlight, body, shadow
  edge: string
  spark: string
  width: number
  period: number // ms for one turn of the shine
}

type Spot = { lng: number; lat: number }

const FRAME_MS = 50

function phaseOf(id: string) {
  let h = 0
  for (const ch of id) h = (h * 31 + ch.charCodeAt(0)) >>> 0
  return (h % 1000) / 1000
}

// Shiny rings around the places with a party on the chosen night (silver, with a few sparks, like a
// disco ball) or with a deal (gold). One 2D canvas over the map, drawn on every map frame and on a slow clock.
export class RingLayer {
  private canvas = document.createElement('canvas')
  private ctx = this.canvas.getContext('2d')
  private spots = new Map<string, Spot & { phase: number }>()
  private clock = 0
  private last = 0

  constructor(
    private map: MaplibreMap,
    private radius: (id: string) => number,
    private style: RingStyle,
  ) {
    this.canvas.className = 'citymap-rings'
    this.canvas.setAttribute('aria-hidden', 'true')
    map.getCanvasContainer().insertBefore(this.canvas, map.getCanvas().nextSibling)
    map.on('render', this.draw)
    map.on('resize', this.size)
    this.size()
  }

  setStyle(style: RingStyle) {
    this.style = style
    this.draw()
  }

  set(spots: Map<string, Spot>) {
    this.spots = new Map([...spots].map(([id, s]) => [id, { ...s, phase: phaseOf(id) }]))
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
    if (now - this.last > FRAME_MS) {
      this.last = now
      this.draw()
    }
    this.clock = window.requestAnimationFrame(this.tick)
  }

  private metal(ctx: CanvasRenderingContext2D, x: number, y: number, turn: number): CanvasGradient | string {
    const [hi, body, shadow] = this.style.metal
    if (!ctx.createConicGradient) return body
    const g = ctx.createConicGradient(turn, x, y)
    const stops: [number, string][] = [
      [0, hi], [0.1, body], [0.24, shadow], [0.38, body], [0.5, hi], [0.6, body], [0.74, shadow], [0.88, body], [1, hi],
    ]
    for (const [at, c] of stops) g.addColorStop(at, c)
    return g
  }

  private spark(ctx: CanvasRenderingContext2D, x: number, y: number, size: number) {
    ctx.beginPath()
    ctx.moveTo(x, y - size)
    ctx.quadraticCurveTo(x, y, x + size, y)
    ctx.quadraticCurveTo(x, y, x, y + size)
    ctx.quadraticCurveTo(x, y, x - size, y)
    ctx.quadraticCurveTo(x, y, x, y - size)
    ctx.fill()
  }

  private draw = () => {
    const ctx = this.ctx
    if (!ctx) return
    const dpr = window.devicePixelRatio || 1
    ctx.setTransform(dpr, 0, 0, dpr, 0, 0)
    ctx.clearRect(0, 0, this.canvas.width, this.canvas.height)
    if (this.spots.size === 0) return
    const { width, period, edge, spark, sparkles } = this.style
    const w = this.canvas.width / dpr
    const h = this.canvas.height / dpr
    const moving = !still()
    const t = moving ? performance.now() : 0
    for (const [id, s] of this.spots) {
      const r = this.radius(id)
      if (r <= 0) continue
      const p = this.map.project([s.lng, s.lat])
      if (p.x < -r - 6 || p.y < -r - 6 || p.x > w + r + 6 || p.y > h + r + 6) continue
      const turn = ((t / period + s.phase) % 1) * Math.PI * 2
      ctx.beginPath()
      ctx.arc(p.x, p.y, r, 0, Math.PI * 2)
      ctx.lineWidth = width + 1.5
      ctx.strokeStyle = edge
      ctx.stroke()
      ctx.lineWidth = width
      ctx.strokeStyle = this.metal(ctx, p.x, p.y, turn)
      ctx.stroke()
      if (!sparkles) continue
      ctx.fillStyle = spark
      for (let i = 0; i < 3; i++) {
        const glow = moving ? (Math.sin(t / 260 + i * 2.1 + s.phase * 6.3) + 1) / 2 : 0.6
        if (glow < 0.35) continue
        const a = turn * 0.6 + i * ((Math.PI * 2) / 3) + s.phase
        const sx = p.x + Math.cos(a) * r
        const sy = p.y + Math.sin(a) * r
        ctx.globalAlpha = glow * 0.35
        this.spark(ctx, sx, sy, 4 + glow * 5)
        ctx.globalAlpha = glow
        this.spark(ctx, sx, sy, 2 + glow * 3)
      }
      ctx.globalAlpha = 1
    }
  }

  destroy() {
    window.cancelAnimationFrame(this.clock)
    this.map.off('render', this.draw)
    this.map.off('resize', this.size)
    this.canvas.remove()
  }
}
