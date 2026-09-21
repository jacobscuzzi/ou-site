import { useState, type CSSProperties, type KeyboardEvent } from 'react'
import type { Bar } from '../api/types'
import { BeerIcon, ClockIcon, CocktailIcon, PinIcon } from './icons'
import './BarCard.css'

function price(n: number) {
  return `${n.toFixed(2)} EUR`
}

function hour(t: string) {
  const [h, m] = t.split(':')
  return m === '00' ? `${h}h` : `${h}h${m}`
}

export default function BarCard({ bar, index }: { bar: Bar; index: number }) {
  const [open, setOpen] = useState(false)

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
        <img src={bar.photos[0]} alt="" loading="lazy" />
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
            {bar.openUntil ? `Open today till ${bar.openUntil}` : 'Closed today'}
          </span>
          {bar.pintPrice !== null && (
            <span className="chip chip-pink">
              <span className="chip-icon"><BeerIcon /></span>
              Pint {price(bar.pintPrice)}
            </span>
          )}
        </div>

        <div className="card-detail-wrap" aria-hidden={!open}>
          <div className="card-detail">
            <p className="card-why">
              <strong>Why here? </strong>
              {bar.whyHere}
            </p>
            {bar.happyHour && (
              <div className="card-chips">
                <span className="chip">
                  <span className="chip-icon"><CocktailIcon /></span>
                  Happy hour {hour(bar.happyHour.from)}–{hour(bar.happyHour.to)}:
                  <span className="chip-amount">{price(bar.happyHour.pintPrice)}</span>
                </span>
              </div>
            )}
            <div className="card-foot">
              <span className="card-address">
                <PinIcon />
                {bar.address}
              </span>
              <a
                className="btn-primary"
                href={bar.googleMapsUrl}
                target="_blank"
                rel="noopener noreferrer"
                tabIndex={open ? 0 : -1}
                onClick={(e) => e.stopPropagation()}
              >
                Open in Google Maps
              </a>
            </div>
          </div>
        </div>
      </div>
    </article>
  )
}
