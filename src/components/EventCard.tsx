import { useState, type ReactNode } from 'react'
import type { Event } from '../api/types'
import { useLang, useT, type Strings } from '../i18n'
import { clockOf, shortDate, shortDay } from '../night'
import { genreLabel } from '../eventTags'
import { dealLabel } from '../deals'
import { ActionLink } from './Actions'
import Photo from './Photo'
import Posts from './Posts'
import { openPhotos } from '../photos'
import './EventCard.css'

function euros(n: number) {
  return Number.isInteger(n) ? `${n} EUR` : `${n.toFixed(2)} EUR`
}

export function eventPrice(e: Event, t: Strings) {
  if (e.priceMin === null) return null
  if (e.priceMin === 0 && !e.priceMax) return t.free
  if (e.priceMin === 0) {
    // a free student or early ticket: the price people pay is the cheapest paid one
    const paid = (e.priceTiers ?? []).map((x) => x.price ?? 0).filter((p) => p > 0)
    return t.fromPrice(euros(paid.length > 0 ? Math.min(...paid) : (e.priceMax as number)))
  }
  return e.priceMax && e.priceMax > e.priceMin ? t.fromPrice(euros(e.priceMin)) : euros(e.priceMin)
}

export function eventTime(e: Event) {
  const start = clockOf(e.startsAt)
  const end = clockOf(e.endsAt)
  return start && end ? `${start} – ${end}` : start
}

const SOURCES: Record<string, string> = { thefork: 'TheFork', dealabs: 'Dealabs', editorial: 'Presse', profile: 'où' }

// The deal of a restaurant right under its name: what, where it comes from, until when; conditions on tap.
export function DealStrip({ deal }: { deal: Event }) {
  const t = useT()
  const lang = useLang()
  const [open, setOpen] = useState(false)
  const source = deal.sources.map((s) => SOURCES[s]).find(Boolean)
  return (
    <div className="deal-strip" data-open={open || undefined}>
      <button
        type="button"
        className="deal-strip-head"
        aria-expanded={deal.conditions ? open : undefined}
        onClick={(e) => {
          e.stopPropagation()
          if (deal.conditions) setOpen((o) => !o)
        }}
        onKeyDown={(e) => e.stopPropagation()}
      >
        <span className="deal-strip-pct">{dealLabel(deal.dealKind ?? (deal.discountPct ? 'pct' : undefined), deal.dealValue ?? deal.discountPct, lang)}</span>
        <span className="deal-strip-what">{deal.title}</span>
        <span className="deal-strip-meta">
          {source && <span>{t.dealVia(source)}</span>}
          <span>{deal.validUntil ? t.dealUntil(shortDate(deal.validUntil, lang)) : t.dealRecent}</span>
          {deal.conditions && <span className="deal-strip-more">{t.dealConditions}</span>}
        </span>
      </button>
      {open && deal.conditions && <p className="deal-strip-conditions">{deal.conditions}</p>}
    </div>
  )
}

// The party a search result matched through: "Sat · title · hip-hop · from 15 EUR".
export function EventLine({ event }: { event: Event }) {
  const t = useT()
  const lang = useLang()
  const day = event.night ? shortDay(event.night, lang) : null
  const genre = event.genres.find((g) => g !== 'other')
  const cost = eventPrice(event, t)
  return (
    <p className="event-line">
      {day && <span>{day}</span>}
      <span className="event-line-title">{event.title}</span>
      {genre && <span>{genreLabel(genre, lang)}</span>}
      {cost && <span>{cost}</span>}
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
  const pic = event.image ?? event.photo ?? undefined

  return (
    <article className={selected ? 'ev ev-selected' : 'ev'} data-id={event.placeId}>
      <div className="ev-head">
        <Photo
          className="ev-photo"
          src={pic}
          onOpen={pic && !onSelect ? () => openPhotos([pic], 0, event.title) : undefined}
          openLabel={t.photosOf(event.title)}
        />
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
                <span key={g} className="chip">{genreLabel(g, lang)}</span>
              ))}
              {event.lineup.length > 0 && <span className="ev-lineup">{event.lineup.slice(0, 3).join(', ')}</span>}
            </span>
          )}
        </Main>
      </div>
      {(cost || (main && main.kind === 'tickets')) && (
        <div className="ev-foot">
          {cost && <span className="ev-price">{cost}</span>}
          {main && main.kind === 'tickets' && <ActionLink action={main} kinds={kinds} main focusable={focusable} />}
        </div>
      )}
      <Posts posts={event.posts} place={event.placeName} actions={event.actions} kinds={kinds} focusable={focusable} />
    </article>
  )
}
