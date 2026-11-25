import { useEffect, useRef, useState, type CSSProperties, type PointerEvent as ReactPointerEvent } from 'react'
import { useBackClose } from '../backClose'
import { useT } from '../i18n'
import { CloseIcon } from './icons'
import './PhotoViewer.css'

type Props = { photos: string[]; start: number; title: string; onClose: () => void }

const CLOSE_DRAG = 110
const ZOOM = 2.5
const DOUBLE_TAP = 280

type Zoom = { scale: number; x: number; y: number }
const NONE: Zoom = { scale: 1, x: 0, y: 0 }

export default function PhotoViewer({ photos, start, title, onClose }: Props) {
  const t = useT()
  const track = useRef<HTMLDivElement>(null)
  const [index, setIndex] = useState(start)
  const [drop, setDrop] = useState(0)
  const [zoom, setZoom] = useState<Zoom>(NONE)
  const pointers = useRef(new Map<number, { x: number; y: number }>())
  const gesture = useRef<{ kind: 'none' | 'drop' | 'pinch' | 'pan'; x: number; y: number; dist: number; base: Zoom }>({ kind: 'none', x: 0, y: 0, dist: 0, base: NONE })
  const lastTap = useRef(0)
  useBackClose(onClose)

  useEffect(() => {
    const el = track.current
    if (el) el.scrollLeft = start * el.clientWidth
    const key = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose()
      if (e.key === 'ArrowRight' || e.key === 'ArrowLeft') {
        const el = track.current
        if (el) el.scrollBy({ left: (e.key === 'ArrowRight' ? 1 : -1) * el.clientWidth, behavior: 'smooth' })
      }
    }
    document.addEventListener('keydown', key)
    document.documentElement.classList.add('viewer-open')
    return () => {
      document.removeEventListener('keydown', key)
      document.documentElement.classList.remove('viewer-open')
    }
  }, [])

  function onScroll() {
    const el = track.current
    if (!el) return
    const i = Math.round(el.scrollLeft / el.clientWidth)
    if (i !== index) {
      setIndex(i)
      setZoom(NONE)
    }
  }

  function down(e: ReactPointerEvent) {
    pointers.current.set(e.pointerId, { x: e.clientX, y: e.clientY })
    const g = gesture.current
    if (pointers.current.size === 2) {
      const [a, b] = [...pointers.current.values()]
      gesture.current = { kind: 'pinch', x: 0, y: 0, dist: Math.hypot(a.x - b.x, a.y - b.y), base: zoom }
      return
    }
    gesture.current = { ...g, kind: zoom.scale > 1 ? 'pan' : 'none', x: e.clientX, y: e.clientY, base: zoom }
    const now = performance.now()
    if (now - lastTap.current < DOUBLE_TAP) {
      lastTap.current = 0
      const box = (e.currentTarget as HTMLElement).getBoundingClientRect()
      setZoom(zoom.scale > 1 ? NONE : { scale: ZOOM, x: (box.width / 2 - (e.clientX - box.left)) * (ZOOM - 1), y: (box.height / 2 - (e.clientY - box.top)) * (ZOOM - 1) })
      gesture.current.kind = 'none'
    } else lastTap.current = now
  }

  function move(e: ReactPointerEvent) {
    if (!pointers.current.has(e.pointerId)) return
    pointers.current.set(e.pointerId, { x: e.clientX, y: e.clientY })
    const g = gesture.current
    if (g.kind === 'pinch' && pointers.current.size === 2) {
      const [a, b] = [...pointers.current.values()]
      const scale = Math.min(4, Math.max(1, (g.base.scale * Math.hypot(a.x - b.x, a.y - b.y)) / g.dist))
      setZoom({ ...g.base, scale })
      return
    }
    const dx = e.clientX - g.x
    const dy = e.clientY - g.y
    if (g.kind === 'pan') return setZoom({ ...g.base, x: g.base.x + dx, y: g.base.y + dy })
    if (g.kind === 'none' && dy > 12 && Math.abs(dy) > Math.abs(dx) * 1.5) g.kind = 'drop'
    if (g.kind === 'drop') setDrop(Math.max(0, dy))
  }

  function up(e: ReactPointerEvent) {
    pointers.current.delete(e.pointerId)
    const g = gesture.current
    if (g.kind === 'drop') {
      if (drop > CLOSE_DRAG) return onClose()
      setDrop(0)
    }
    if (g.kind === 'pinch' && zoom.scale <= 1.05) setZoom(NONE)
    if (pointers.current.size === 0) gesture.current.kind = 'none'
  }

  return (
    <div className="viewer" role="dialog" aria-modal="true" aria-label={title} style={{ '--drop': `${drop}px` } as CSSProperties} data-drop={drop > 0 || undefined}>
      <div className="viewer-top">
        <span className="viewer-count" aria-live="polite">
          {index + 1}/{photos.length}
        </span>
        <button type="button" className="viewer-close" aria-label={t.close} autoFocus onClick={onClose}>
          <CloseIcon size={20} />
        </button>
      </div>
      <div className="viewer-track" ref={track} onScroll={onScroll} data-zoomed={zoom.scale > 1 || undefined}>
        {photos.map((src, i) => (
          <div className="viewer-slide" key={src} onPointerDown={down} onPointerMove={move} onPointerUp={up} onPointerCancel={up}>
            <img
              src={src}
              alt=""
              draggable={false}
              loading={Math.abs(i - index) <= 1 ? 'eager' : 'lazy'}
              decoding="async"
              style={i === index && zoom.scale > 1 ? { transform: `translate(${zoom.x}px, ${zoom.y}px) scale(${zoom.scale})` } : undefined}
            />
          </div>
        ))}
      </div>
    </div>
  )
}
