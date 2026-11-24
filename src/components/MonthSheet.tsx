import { useEffect, useRef, useState } from 'react'
import { fetchDays } from '../api/client'
import type { Layer } from '../api/types'
import { useLang, useT } from '../i18n'
import { addDays, dayNumber, longDay, monthTitle, shortDay, tonight, weekday } from '../night'
import { BackIcon, CloseIcon, NextIcon } from './icons'
import './MonthSheet.css'

type Props = { layer: Layer; value: string | null; onPick: (day: string) => void; onClose: () => void }

function monthStart(day: string) {
  return `${day.slice(0, 7)}-01`
}

function monthEnd(start: string) {
  const [y, m] = start.split('-').map(Number)
  return new Date(Date.UTC(y, m, 0)).toISOString().slice(0, 10)
}

function shiftMonth(start: string, n: number) {
  const [y, m] = start.split('-').map(Number)
  return new Date(Date.UTC(y, m - 1 + n, 1)).toISOString().slice(0, 10)
}

export default function MonthSheet({ layer, value, onPick, onClose }: Props) {
  const t = useT()
  const lang = useLang()
  const today = tonight()
  const [month, setMonth] = useState(monthStart(value ?? today))
  const [counts, setCounts] = useState<Record<string, number>>({})
  const closeRef = useRef<HTMLButtonElement>(null)
  const end = monthEnd(month)
  const from = month < today ? today : month
  const thisMonth = monthStart(today)

  useEffect(() => {
    closeRef.current?.focus()
    const onKey = (e: KeyboardEvent) => e.key === 'Escape' && onClose()
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [onClose])

  useEffect(() => {
    if (from > end) return
    const ctrl = new AbortController()
    fetchDays(layer, from, end, ctrl.signal)
      .then((res) => setCounts((c) => ({ ...c, ...Object.fromEntries(res.days.map((d) => [d.date, d.count])) })))
      .catch(() => undefined)
    return () => ctrl.abort()
  }, [layer, from, end])

  const blanks = weekday(month) - 1
  const days: string[] = []
  for (let d = month; d <= end; d = addDays(d, 1)) days.push(d)
  const heads = Array.from({ length: 7 }, (_, i) => shortDay(addDays('2026-11-23', i), lang))

  return (
    <div className="month-scrim" onPointerDown={onClose}>
      <div className="month" role="dialog" aria-modal="true" aria-label={t.monthTitle} onPointerDown={(e) => e.stopPropagation()}>
        <div className="month-head">
          <button type="button" className="month-nav" aria-label={t.prevMonth} disabled={month <= thisMonth} onClick={() => setMonth(shiftMonth(month, -1))}>
            <BackIcon />
          </button>
          <h2 className="month-title">{monthTitle(month, lang)}</h2>
          <button type="button" className="month-nav" aria-label={t.nextMonth} onClick={() => setMonth(shiftMonth(month, 1))}>
            <NextIcon />
          </button>
          <button type="button" className="month-nav" ref={closeRef} aria-label={t.close} onClick={onClose}>
            <CloseIcon />
          </button>
        </div>
        <div className="month-grid">
          {heads.map((h) => (
            <span key={h} className="month-wd" aria-hidden="true">{h}</span>
          ))}
          {Array.from({ length: blanks }, (_, i) => (
            <span key={`b${i}`} />
          ))}
          {days.map((d) => {
            const past = d < today
            const n = counts[d]
            return (
              <button
                key={d}
                type="button"
                className={d === value ? 'month-day month-day-on' : 'month-day'}
                disabled={past}
                aria-pressed={d === value}
                aria-label={`${longDay(d, lang)}${n !== undefined ? `, ${t.partiesCount(n)}` : ''}`}
                onClick={() => onPick(d)}
              >
                <span>{dayNumber(d)}</span>
                <span className={n ? 'month-count' : 'month-count month-count-none'} aria-hidden="true">{past || n === undefined ? '' : n}</span>
              </button>
            )
          })}
        </div>
      </div>
    </div>
  )
}
