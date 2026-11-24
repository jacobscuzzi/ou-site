import type { Event } from '../api/types'
import { useT } from '../i18n'
import EventCard from './EventCard'
import './ExploreList.css'

type Props = {
  title: string
  events: Event[]
  state: 'loading' | 'ready' | 'error'
  kindsOf: (placeId: string) => string[]
  selectedId: string | null
  onSelect: (placeId: string) => void
  onRetry: () => void
  withDate?: boolean
}

export default function EventList({ title, events, state, kindsOf, selectedId, onSelect, onRetry, withDate = false }: Props) {
  const t = useT()

  return (
    <section className="explore">
      <h2 className="explore-title">{title}</h2>
      {state === 'loading' && (
        <ul className="explore-list" aria-hidden="true">
          {[0, 1, 2].map((i) => (
            <li key={i} className="xrow-skeleton" />
          ))}
        </ul>
      )}
      {state === 'ready' && events.length > 0 && (
        <ul className="explore-list">
          {events.map((e) => (
            <li key={e.id}>
              <EventCard event={e} kinds={kindsOf(e.placeId)} selected={e.placeId === selectedId} onSelect={() => onSelect(e.placeId)} showDate={withDate} />
            </li>
          ))}
        </ul>
      )}
      {state === 'ready' && events.length === 0 && (
        <div className="explore-note">
          <p className="explore-note-title">{t.eventsEmpty}</p>
          <p className="explore-note-hint">{t.eventsEmptyHint}</p>
        </div>
      )}
      {state === 'error' && (
        <div className="explore-note" role="alert">
          <p className="explore-note-title">{t.eventsError}</p>
          <button type="button" className="btn-primary" onClick={onRetry}>{t.retry}</button>
        </div>
      )}
    </section>
  )
}
