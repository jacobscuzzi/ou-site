import { useEffect, useMemo, useRef, useState } from 'react'
import { fetchEvents } from '../api/client'
import type { Event, PriceBucket } from '../api/types'
import { useBackClose } from '../backClose'
import { BUCKETS, bucketLabel, genreLabel, vibeLabel } from '../eventTags'
import { useLang, useT } from '../i18n'
import { inBounds, type Bounds } from '../map/geo'
import DayStrip from './DayStrip'
import EventRow from './EventRow'
import { CloseIcon } from './icons'
import './AgendaSheet.css'

type Props = {
  days: string[]
  counts: Record<string, number> | null
  day: string
  bounds: Bounds | null
  kindsOf: (placeId: string) => string[]
  onDay: (day: string) => void
  onShow: (e: Event) => void
  onClose: () => void
}

type Filters = { genres: Set<string>; buckets: Set<PriceBucket>; vibes: Set<string>; area: boolean }
const NONE: Filters = { genres: new Set(), buckets: new Set(), vibes: new Set(), area: false }

function toggle<T>(set: Set<T>, v: T): Set<T> {
  const next = new Set(set)
  if (!next.delete(v)) next.add(v)
  return next
}

// The parties of one night with filters; picking one shows it on the map.
export default function AgendaSheet({ days, counts, day, bounds, kindsOf, onDay, onShow, onClose }: Props) {
  const t = useT()
  const lang = useLang()
  const [events, setEvents] = useState<Event[] | null>(null)
  const [failed, setFailed] = useState(false)
  const [filters, setFilters] = useState<Filters>(NONE)
  const closeRef = useRef<HTMLButtonElement>(null)
  useBackClose(onClose)

  useEffect(() => {
    closeRef.current?.focus({ preventScroll: true })
    const key = (e: KeyboardEvent) => e.key === 'Escape' && onClose()
    window.addEventListener('keydown', key)
    return () => window.removeEventListener('keydown', key)
  }, [])

  useEffect(() => {
    const ctrl = new AbortController()
    setEvents(null)
    setFailed(false)
    fetchEvents('dance', day, day, ctrl.signal)
      .then((res) => setEvents(res.events))
      .catch((err: Error) => err.name !== 'AbortError' && setFailed(true))
    return () => ctrl.abort()
  }, [day])

  const offered = useMemo(() => {
    const count = (pick: (e: Event) => string[]) => {
      const n = new Map<string, number>()
      for (const e of events ?? []) for (const v of pick(e)) n.set(v, (n.get(v) ?? 0) + 1)
      return [...n.entries()].sort((a, b) => b[1] - a[1]).map(([v]) => v)
    }
    return {
      genres: count((e) => e.genres.filter((g) => g !== 'other')),
      vibes: count((e) => e.vibes ?? []),
      buckets: BUCKETS.filter((b) => (events ?? []).some((e) => e.priceBucket === b)),
    }
  }, [events])

  const shown = (events ?? []).filter(
    (e) =>
      (filters.genres.size === 0 || e.genres.some((g) => filters.genres.has(g))) &&
      (filters.buckets.size === 0 || (e.priceBucket && filters.buckets.has(e.priceBucket))) &&
      (filters.vibes.size === 0 || (e.vibes ?? []).some((v) => filters.vibes.has(v))) &&
      (!filters.area || !bounds || inBounds(e, bounds)),
  )
  // the most popular parties first (venue quality, then reach), start time breaks ties
  shown.sort((a, b) => (b.popularity ?? 0) - (a.popularity ?? 0) || (a.startsAt ?? '').localeCompare(b.startsAt ?? ''))
  const active = filters.genres.size + filters.buckets.size + filters.vibes.size + (filters.area ? 1 : 0)

  const chip = (on: boolean, label: string, onClick: () => void, key: string) => (
    <button key={key} type="button" className="agenda-chip" aria-pressed={on} onClick={onClick}>
      {label}
    </button>
  )

  return (
    <div className="agenda-scrim" onPointerDown={(e) => e.target === e.currentTarget && onClose()}>
      <section className="agenda" role="dialog" aria-modal="true" aria-labelledby="agenda-title">
        <header className="agenda-head">
          <h2 className="agenda-title" id="agenda-title">
            {t.agendaTitle}
            {events && <span className="agenda-count">{t.agendaCount(shown.length)}</span>}
          </h2>
          <button ref={closeRef} type="button" className="agenda-close" aria-label={t.close} onClick={onClose}>
            <CloseIcon />
          </button>
        </header>
        <DayStrip days={days} counts={counts} value={{ from: day, to: day }} onPick={(n) => onDay(n.from)} />
        <div className="agenda-filters">
          <div className="agenda-row" role="group" aria-label={t.agendaGenre}>
            {chip(filters.area, t.agendaArea, () => setFilters((f) => ({ ...f, area: !f.area })), 'area')}
            {offered.genres.map((g) => chip(filters.genres.has(g), genreLabel(g, lang), () => setFilters((f) => ({ ...f, genres: toggle(f.genres, g) })), g))}
          </div>
          <div className="agenda-row" role="group" aria-label={`${t.agendaPrice}, ${t.agendaVibe}`}>
            {offered.buckets.map((b) => chip(filters.buckets.has(b), bucketLabel(b, lang), () => setFilters((f) => ({ ...f, buckets: toggle(f.buckets, b) })), b))}
            {offered.vibes.map((v) => chip(filters.vibes.has(v), vibeLabel(v, lang), () => setFilters((f) => ({ ...f, vibes: toggle(f.vibes, v) })), `v-${v}`))}
          </div>
        </div>
        <div className="agenda-list">
          {!events && !failed && (
            <ul className="agenda-skeleton" aria-hidden="true">
              {[0, 1, 2, 3].map((i) => (
                <li key={i} />
              ))}
            </ul>
          )}
          {failed && (
            <p className="agenda-note" role="alert">
              {t.eventsError}
            </p>
          )}
          {events && shown.length === 0 && (
            <div className="agenda-note">
              <p>{events.length === 0 ? t.eventsEmpty : t.agendaEmpty}</p>
              {active > 0 && (
                <button type="button" className="btn-primary" onClick={() => setFilters(NONE)}>
                  {t.agendaClear}
                </button>
              )}
            </div>
          )}
          {shown.map((e) => (
            <EventRow key={e.id} event={e} kinds={kindsOf(e.placeId)} showPlace showDate={false} onShowOnMap={() => onShow(e)} />
          ))}
        </div>
      </section>
    </div>
  )
}
