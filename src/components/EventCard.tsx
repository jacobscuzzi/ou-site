import type { ReactNode } from 'react'
import type { Event } from '../api/types'
import { useLang, useT, type Strings } from '../i18n'
import { labelFor } from '../tags'
import { clockOf, shortDate } from '../night'
import { ActionLink } from './Actions'
import Posts from './Posts'
import './EventCard.css'

function euros(n: number) {
  return Number.isInteger(n) ? `${n} EUR` : `${n.toFixed(2)} EUR`
}

export function eventPrice(e: Event, t: Strings) {
  if (e.priceMin === null) return null
  if (e.priceMin === 0 && !e.priceMax) return t.free
  return e.priceMax && e.priceMax > e.priceMin ? t.fromPrice(euros(e.priceMin)) : euros(e.priceMin)
}

export function eventTime(e: Event) {
  const start = clockOf(e.startsAt)
  const end = clockOf(e.endsAt)
  return start && end ? `${start} – ${end}` : start
}

export function DealLine({ deal }: { deal: Event }) {
  const t = useT()
  const lang = useLang()
  return (
    <p className="deal-line">
      <span className="deal-badge">{t.dealBadge}</span>
      <span className="deal-title">{deal.title}</span>
      <span className="deal-until">{deal.validUntil ? t.dealUntil(shortDate(deal.validUntil, lang)) : t.dealRecent}</span>
    </p>
  )
}

// One line for a bar with a party tonight (drink layer): the tap opens the event card.
export function TonightLine({ event, onOpen, open, focusable = true }: { event: Event; onOpen: () => void; open?: boolean; focusable?: boolean }) {
  const t = useT()
  const time = clockOf(event.startsAt)
  return (
    <button
      type="button"
      className="tonight-line"
      aria-label={t.seeEvent(event.title)}
      aria-expanded={open}
      tabIndex={focusable ? 0 : -1}
      onClick={(e) => {
        e.stopPropagation()
        onOpen()
      }}
      onKeyDown={(e) => e.stopPropagation()}
    >
      <span className="tonight-badge">{t.tonight}</span>
      {time && <span className="tonight-time">{time}</span>}
      <span className="tonight-title">{event.title}</span>
    </button>
  )
}

function Main({ className, onSelect, focusable, children }: { className: string; onSelect?: () => void; focusable: boolean; children: ReactNode }) {
  if (!onSelect) return <div className={className}>{children}</div>
  return (
    <button type="button" className={className} onClick={onSelect} tabIndex={focusable ? 0 : -1}>
      {children}
    </button>
  )
}

type Props = {
  event: Event
  kinds: string[]
  selected?: boolean
  onSelect?: () => void
  showPlace?: boolean
  showDate?: boolean
  focusable?: boolean
}

export default function EventCard({ event, kinds, selected = false, onSelect, showPlace = true, showDate = !showPlace, focusable = true }: Props) {
  const t = useT()
  const lang = useLang()
  const time = eventTime(event)
  const cost = eventPrice(event, t)
  const main = event.actions[0]

  return (
    <article className={selected ? 'ev ev-selected' : 'ev'} data-id={event.placeId}>
      <Main className="ev-main" onSelect={onSelect} focusable={focusable}>
        <span className="ev-when">
          {event.night && showDate && <span className="ev-date">{shortDate(event.night, lang)}</span>}
          {time && <span className="ev-time">{time}</span>}
          {event.regular && <span className="ev-regular">{t.regularNight}</span>}
        </span>
        <span className="ev-title">{event.title}</span>
        {showPlace && <span className="ev-place">{event.placeName}</span>}
        {(event.genres.length > 0 || event.lineup.length > 0) && (
          <span className="ev-tags">
            {event.genres.slice(0, 2).map((g) => (
              <span key={g} className="chip">{labelFor(g, lang)}</span>
            ))}
            {event.lineup.length > 0 && <span className="ev-lineup">{event.lineup.slice(0, 3).join(', ')}</span>}
          </span>
        )}
      </Main>
      {(cost || (main && main.kind === 'tickets')) && (
        <div className="ev-foot">
          {cost && <span className="ev-price">{cost}</span>}
          {main && main.kind === 'tickets' && <ActionLink action={main} kinds={kinds} main focusable={focusable} />}
        </div>
      )}
      <Posts posts={event.posts} focusable={focusable} />
    </article>
  )
}
