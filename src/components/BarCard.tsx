import { useState, type CSSProperties, type KeyboardEvent } from 'react'
import type { Bar } from '../api/types'
import { cuisineLabel, hintFor, useLang, useT } from '../i18n'
import { foodMode } from '../mode'
import { price } from '../price'
import { tagsFor } from '../tags'
import BarDetail from './BarDetail'
import { BeerIcon, ClockIcon } from './icons'
import Photo from './Photo'
import './BarCard.css'

type Props = { bar: Bar; index: number; selected?: boolean; defaultOpen?: boolean; onSelect?: () => void }

export default function BarCard({ bar, index, selected = false, defaultOpen = false, onSelect }: Props) {
  const [open, setOpen] = useState(defaultOpen)
  const t = useT()
  const lang = useLang()
  const tags = tagsFor(bar, lang)

  function toggle() {
    setOpen((o) => !o)
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
        <Photo className="card-photo-img" src={bar.photos[0]} />
        {bar.rank > 0 && <span className="card-rank">{bar.rank}</span>}
      </div>

      <div className="card-body">
        <div className="card-head">
          <span className="card-name">{bar.name}</span>
          <span className="card-arr">{bar.arrondissement}</span>
        </div>

        <div className="card-chips">
          {bar.openUntil && (
            <span className="chip">
              <span className="chip-icon"><ClockIcon /></span>
              {open ? t.openTill(bar.openUntil) : t.till(bar.openUntil)}
            </span>
          )}
          {foodMode && bar.facts?.cuisine?.[0] && <span className="chip">{cuisineLabel(bar.facts.cuisine[0], lang)}</span>}
          {foodMode && bar.facts?.pricePerPerson !== undefined && (
            <span className="chip chip-pink">{t.perPerson(price(bar.facts.pricePerPerson))}</span>
          )}
          {!foodMode && bar.pintPrice !== null && (
            <span className="chip chip-pink">
              <span className="chip-icon"><BeerIcon /></span>
              {t.pint(price(bar.pintPrice))}
            </span>
          )}
          {tags.map((tag) => (
            <span key={tag.label} className="chip">{tag.label}</span>
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
