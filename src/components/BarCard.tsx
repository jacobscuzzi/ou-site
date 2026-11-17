import { useState, type CSSProperties, type KeyboardEvent } from 'react'
import type { Bar } from '../api/types'
import { hintFor, useLang, useT } from '../i18n'
import { tagsFor } from '../tags'
import BarDetail, { price } from './BarDetail'
import { BeerIcon, ClockIcon } from './icons'
import Photo from './Photo'
import './BarCard.css'

export default function BarCard({ bar, index }: { bar: Bar; index: number }) {
  const [open, setOpen] = useState(false)
  const t = useT()
  const tags = tagsFor(bar, useLang())

  function onKey(e: KeyboardEvent) {
    if (e.target !== e.currentTarget) return
    if (e.key === 'Enter' || e.key === ' ') {
      e.preventDefault()
      setOpen((o) => !o)
    }
  }

  return (
    <article
      className={open ? 'card card-open' : 'card'}
      style={{ '--i': index } as CSSProperties}
      role="button"
      tabIndex={0}
      aria-expanded={open}
      onClick={() => setOpen((o) => !o)}
      onKeyDown={onKey}
    >
      <span className="card-glare" />
      <div className="card-photo">
        <Photo className="card-photo-img" src={bar.photos[0]} />
        <span className="card-rank">{bar.rank}</span>
      </div>

      <div className="card-body">
        <div className="card-head">
          <span className="card-name">{bar.name}</span>
          <span className="card-arr">{bar.arrondissement}</span>
        </div>

        <div className="card-chips">
          <span className="chip">
            <span className="chip-icon"><ClockIcon /></span>
            {bar.openUntil ? (open ? t.openTill(bar.openUntil) : t.till(bar.openUntil)) : t.closedToday}
          </span>
          {bar.pintPrice !== null && (
            <span className="chip chip-pink">
              <span className="chip-icon"><BeerIcon /></span>
              {t.pint(price(bar.pintPrice))}
            </span>
          )}
          {tags.map((tag) => (
            <span key={tag.label} className="chip">
              <span className="chip-icon chip-emoji">{tag.emoji}</span>
              {tag.label}
            </span>
          ))}
        </div>

        {!bar.compliant && bar.constraintsNotMet.length > 0 && (
          <p className="card-hint">
            <span className="card-hint-mark" aria-hidden="true">!</span>
            {hintFor(bar.constraintsNotMet, t)}
          </p>
        )}

        <BarDetail bar={bar} open={open} />
      </div>
    </article>
  )
}
