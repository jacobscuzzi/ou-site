import { useState, type CSSProperties, type KeyboardEvent } from 'react'
import type { Bar } from '../api/types'
import { hintFor, useT } from '../i18n'
import BarDetail from './BarDetail'
import CardChips from './CardChips'
import Photo from './Photo'
import './BarCard.css'

type Props = { bar: Bar; index: number; selected?: boolean; defaultOpen?: boolean; onSelect?: () => void }

export default function BarCard({ bar, index, selected = false, defaultOpen = false, onSelect }: Props) {
  const [open, setOpen] = useState(defaultOpen)
  const t = useT()

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

        <CardChips bar={bar} open={open} />

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
