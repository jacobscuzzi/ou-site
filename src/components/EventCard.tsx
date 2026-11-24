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

type Props = { event: Event; kinds: string[]; selected?: boolean; onSelect?: () => void; showPlace?: boolean; showDate?: boolean }

export default function EventCard({ event, kinds, selected = false, onSelect, showPlace = true, showDate = !showPlace }: Props) {
  const t = useT()
  const lang = useLang()
  const time = eventTime(event)
  const cost = eventPrice(event, t)
  const main = event.actions[0]

  return (
    <article className={selected ? 'ev ev-selected' : 'ev'} data-id={event.placeId}>
      <button type="button" className="ev-main" onClick={onSelect} disabled={!onSelect}>
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
      </button>
      {(cost || (main && main.kind === 'tickets')) && (
        <div className="ev-foot">
          {cost && <span className="ev-price">{cost}</span>}
          {main && main.kind === 'tickets' && <ActionLink action={main} kinds={kinds} main />}
        </div>
      )}
      <Posts posts={event.posts} focusable />
    </article>
  )
}
