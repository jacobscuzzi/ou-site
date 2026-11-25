import { useState, type CSSProperties, type KeyboardEvent } from 'react'
import type { Bar } from '../api/types'
import { hintFor, useT } from '../i18n'
import BarDetail from './BarDetail'
import CardChips from './CardChips'
import Hours from './Hours'
import Photo from './Photo'
import Posts from './Posts'
import { ActionLink } from './Actions'
import EventCard, { DealStrip, EventLine, TonightLine } from './EventCard'
import { useLayer } from '../mode'
import { tonight, type Night } from '../night'
import { openPhotos, thumbOf } from '../photos'
import Marks from './Marks'
import { useDealsShown } from '../deals'
import './BarCard.css'

type Props = { bar: Bar; index: number; selected?: boolean; defaultOpen?: boolean; onSelect?: () => void; onOpen?: () => void; night?: Night | null }

export default function BarCard({ bar, index, selected = false, defaultOpen = false, onSelect, onOpen, night = null }: Props) {
  const [open, setOpen] = useState(defaultOpen)
  const [eventOpen, setEventOpen] = useState(false)
  const t = useT()
  const layer = useLayer()
  const party = layer === 'drink' ? bar.events?.find((e) => e.kind === 'party' && e.night === tonight()) : undefined
  const deals = useDealsShown()
  const deal = deals ? bar.deal : undefined
  const dealAction = deal?.actions.find((a) => a.kind === 'offer' || a.kind === 'booking')
  const matched =
    layer === 'dance' && night ? bar.events?.find((e) => e.kind === 'party' && e.night !== null && e.night >= night.from && e.night <= night.to) : undefined

  function toggle() {
    if (!open) onOpen?.()
    setOpen(!open)
    onSelect?.()
  }

  function onKey(e: KeyboardEvent) {
    if (e.target !== e.currentTarget) return
    if (e.key === 'Enter' || e.key === ' ') {
      e.preventDefault()
      toggle()
    }
  }

  return (
    <article
      className={['card', open && 'card-open', selected && 'card-selected'].filter(Boolean).join(' ')}
      data-id={bar.id}
      style={{ '--i': index } as CSSProperties}
      role="button"
      tabIndex={0}
      aria-expanded={open}
      onClick={toggle}
      onKeyDown={onKey}
    >
      <span className="card-glare" />
      <div className="card-photo">
        <Photo
          className="card-photo-img"
          src={thumbOf(bar.photos, bar.thumbs, 0)}
          onOpen={open ? () => openPhotos(bar.photos, 0, bar.name) : undefined}
          openLabel={t.photosOf(bar.name)}
        />
        {bar.rank > 0 && <span className="card-rank">{bar.rank}</span>}
        <Marks bar={bar} />
      </div>

      <div className="card-body">
        <div className="card-head">
          <span className="card-name">{bar.name}</span>
          <span className="card-arr">{bar.arrondissement}</span>
        </div>

        {open && <Hours bar={bar} />}

        <CardChips bar={bar} open={open} />

        {deal && <DealStrip deal={deal} />}
        {matched && <EventLine event={matched} />}
        {party && <TonightLine event={party} open={eventOpen} onOpen={() => setEventOpen((v) => !v)} />}
        {party && eventOpen && (
          <div className="card-event" onClick={(e) => e.stopPropagation()} onKeyDown={(e) => e.stopPropagation()}>
            <EventCard event={party} kinds={bar.kinds} showPlace={false} />
          </div>
        )}
        {dealAction ? (
          <div className="card-cta">
            <ActionLink action={dealAction} kinds={bar.kinds} main label={t.bookWithDeal} />
          </div>
        ) : (
          bar.actions?.[0] && (
            <div className="card-cta">
              <ActionLink action={bar.actions[0]} kinds={bar.kinds} main />
            </div>
          )
        )}

        {!bar.compliant && bar.constraintsNotMet.length > 0 && (
          <p className="card-hint">
            <span className="card-hint-mark" aria-hidden="true">!</span>
            {hintFor(bar.constraintsNotMet, t)}
          </p>
        )}

        <Posts posts={bar.posts ?? []} place={bar.name} actions={bar.actions ?? []} kinds={bar.kinds} focusable />

        <BarDetail bar={bar} open={open} />
      </div>
    </article>
  )
}
