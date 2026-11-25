import { useState } from 'react'
import type { Event } from '../api/types'
import { useLang, useT } from '../i18n'
import { eventTags } from '../eventTags'
import { clockOf, shortDate } from '../night'
import { openPhotos } from '../photos'
import { ActionLink } from './Actions'
import { eventPrice, eventTime } from './EventCard'
import Photo from './Photo'
import Posts from './Posts'
import './EventRow.css'

type Props = {
  event: Event
  kinds: string[]
  showPlace?: boolean
  showDate?: boolean
  focusable?: boolean
  defaultOpen?: boolean
  onShowOnMap?: () => void
}

// A party as one compact row (date, title, a few tags, price); a tap opens the details in place.
export default function EventRow({ event, kinds, showPlace = false, showDate = true, focusable = true, defaultOpen = false, onShowOnMap }: Props) {
  const t = useT()
  const lang = useLang()
  const [open, setOpen] = useState(defaultOpen)
  const tags = eventTags(event, lang)
  const cost = eventPrice(event, t)
  const tickets = event.actions.find((a) => a.kind === 'tickets')
  const pic = event.image ?? event.photo ?? undefined
  const door = event.doorTime && event.doorTime !== event.startsAt?.slice(11, 16) ? event.doorTime : null

  return (
    <article className="erow" data-open={open || undefined} data-id={event.placeId} onClick={(e) => e.stopPropagation()} onKeyDown={(e) => e.stopPropagation()}>
      <button type="button" className="erow-head" aria-expanded={open} tabIndex={focusable ? 0 : -1} onClick={() => setOpen((o) => !o)}>
        <span className="erow-when">
          {event.night && showDate && <span className="erow-date">{shortDate(event.night, lang)}</span>}
          {eventTime(event) && <span className="erow-time">{clockOf(event.startsAt)}</span>}
        </span>
        <span className="erow-main">
          <span className="erow-title">{event.title}</span>
          {showPlace && <span className="erow-place">{event.placeName}</span>}
          {tags.length > 0 && (
            <span className="erow-tags">
              {tags.slice(0, 3).map((g) => (
                <span key={g} className="erow-tag">{g}</span>
              ))}
            </span>
          )}
        </span>
        {cost && <span className="erow-price">{cost}</span>}
      </button>
      {open && (
        <div className="erow-body">
          {pic && (
            <Photo className="erow-photo" src={pic} onOpen={() => openPhotos([pic], 0, event.title)} openLabel={t.photosOf(event.title)} />
          )}
          <p className="erow-facts">
            {eventTime(event) && <span>{eventTime(event)}</span>}
            {door && <span>{t.doorsAt(door)}</span>}
            {event.minAge && <span>{t.minAge(event.minAge)}</span>}
            {cost && <span className="erow-cost">{cost}</span>}
          </p>
          {tags.length > 0 && (
            <div className="erow-alltags">
              {tags.map((g) => (
                <span key={g} className="chip">{g}</span>
              ))}
            </div>
          )}
          {event.lineup.length > 0 && (
            <p className="erow-lineup">
              <strong>{t.lineupTitle} </strong>
              {event.lineup.join(', ')}
            </p>
          )}
          {event.description && <p className="erow-desc">{event.description}</p>}
          <div className="erow-actions">
            {tickets && <ActionLink action={tickets} kinds={kinds} main focusable={focusable} label={t.getTickets} />}
            {onShowOnMap && (
              <button type="button" className="erow-map" onClick={onShowOnMap}>
                {t.showOnMap}
              </button>
            )}
          </div>
          <Posts posts={event.posts} place={event.placeName} actions={event.actions} kinds={kinds} focusable={focusable} />
        </div>
      )}
    </article>
  )
}
