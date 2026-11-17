import { useEffect, useRef, useState, type FocusEvent, type PointerEvent, type ReactNode } from 'react'
import { useT } from '../i18n'
import './Sheet.css'

export type SheetHeight = 'peek' | 'half' | 'full'

type Props = {
  height: SheetHeight
  onHeight: (h: SheetHeight) => void
  header?: ReactNode
  scrollKey?: string
  children: ReactNode
}

type Sample = { y: number; t: number }
type Drag = { id: number; y: number; h0: number; moved: boolean; samples: Sample[] }

const order: SheetHeight[] = ['peek', 'half', 'full']
const DRAG_START = 6
const FLICK = 0.5
const WINDOW = 90
const desktop = '(min-width: 768px)'
const focusVisible = CSS.supports('selector(:focus-visible)')

function velocity(samples: Sample[], now: number) {
  const first = samples[0]
  const last = samples[samples.length - 1]
  if (now - last.t > WINDOW || last.t === first.t) return 0
  return (first.y - last.y) / (last.t - first.t)
}

export default function Sheet({ height, onHeight, header, scrollKey, children }: Props) {
  const t = useT()
  const root = useRef<HTMLElement>(null)
  const marks = useRef<Record<SheetHeight, HTMLElement | null>>({ peek: null, half: null, full: null })
  const drag = useRef<Drag | null>(null)
  const swallow = useRef(false)
  const [dragging, setDragging] = useState(false)
  const content = useRef<HTMLDivElement>(null)

  useEffect(() => {
    content.current?.scrollTo({ top: 0 })
  }, [scrollKey])

  const px = (h: SheetHeight) => marks.current[h]?.offsetHeight ?? 0
  const place = (h: number) => {
    const el = root.current
    if (el) el.style.transform = `translateY(${px('full') - h}px)`
  }

  const down = (e: PointerEvent<HTMLElement>) => {
    if (window.matchMedia(desktop).matches || !e.isPrimary) return
    if (e.pointerType === 'mouse' && e.button !== 0) return
    if (height === 'full' && (e.target as HTMLElement).closest('.sheet-content')) return
    drag.current = { id: e.pointerId, y: e.clientY, h0: px(height), moved: false, samples: [{ y: e.clientY, t: e.timeStamp }] }
  }

  const move = (e: PointerEvent<HTMLElement>) => {
    const d = drag.current
    if (!d || d.id !== e.pointerId) return
    if (!d.moved) {
      if (Math.abs(e.clientY - d.y) < DRAG_START) return
      d.moved = true
      e.currentTarget.setPointerCapture(e.pointerId)
      setDragging(true)
    }
    d.samples = [...d.samples.filter((s) => e.timeStamp - s.t <= WINDOW), { y: e.clientY, t: e.timeStamp }]
    place(Math.min(px('full'), Math.max(px('peek'), d.h0 + d.y - e.clientY)))
  }

  const up = (e: PointerEvent<HTMLElement>) => {
    const d = drag.current
    if (!d || d.id !== e.pointerId) return
    drag.current = null
    if (!d.moved) return
    swallow.current = true
    setTimeout(() => (swallow.current = false))
    setDragging(false)
    if (root.current) root.current.style.transform = ''
    const i = order.indexOf(height)
    const v = velocity(d.samples, e.timeStamp)
    if (Math.abs(v) > FLICK) {
      onHeight(order[Math.min(order.length - 1, Math.max(0, i + (v > 0 ? 1 : -1)))])
      return
    }
    const h = Math.min(px('full'), Math.max(px('peek'), d.h0 + d.y - e.clientY))
    onHeight(order.reduce((a, b) => (Math.abs(px(b) - h) < Math.abs(px(a) - h) ? b : a)))
  }

  const cancel = (e: PointerEvent<HTMLElement>) => {
    if (drag.current?.id !== e.pointerId) return
    drag.current = null
    setDragging(false)
    if (root.current) root.current.style.transform = ''
  }

  const focusIn = (e: FocusEvent<HTMLElement>) => {
    if (height === 'full' || window.matchMedia(desktop).matches) return
    if (focusVisible && !e.target.matches(':focus-visible')) return
    onHeight('full')
  }

  const cycle = () => onHeight(order[(order.indexOf(height) + 1) % order.length])

  return (
    <section
      ref={root}
      className={dragging ? 'sheet sheet-dragging' : 'sheet'}
      data-height={height}
      onPointerDown={down}
      onPointerMove={move}
      onPointerUp={up}
      onPointerCancel={cancel}
      onClickCapture={(e) => {
        if (swallow.current) e.stopPropagation()
      }}
    >
      {order.map((h) => (
        <i key={h} ref={(el) => void (marks.current[h] = el)} className={`sheet-mark sheet-mark-${h}`} aria-hidden="true" />
      ))}
      <button type="button" className="sheet-handle" aria-label={t.sheetHandle[height]} aria-expanded={height !== 'peek'} onClick={cycle}>
        <span className="sheet-grip" />
      </button>
      {header && <div className="sheet-header">{header}</div>}
      <div ref={content} className="sheet-content" onFocusCapture={focusIn}>
        {children}
      </div>
    </section>
  )
}
