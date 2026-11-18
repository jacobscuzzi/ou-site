import type { MapBar } from '../api/types'
import { useLang, useT } from '../i18n'
import { price } from '../price'
import { labelFor } from '../tags'
import { BeerIcon, ClockIcon } from './icons'
import Photo from './Photo'
import './ExploreList.css'

type Props = {
  bars: MapBar[]
  state: 'loading' | 'ready' | 'empty' | 'error'
  warming: boolean
  selectedId: string | null
  onSelect: (id: string) => void
  onRetry: () => void
  title?: string
}

function Row({ bar, selected, onSelect }: { bar: MapBar; selected: boolean; onSelect: () => void }) {
  const t = useT()
  const lang = useLang()

  return (
    <button
      type="button"
      className={selected ? 'xrow xrow-selected' : 'xrow'}
      data-id={bar.id}
      aria-current={selected || undefined}
      onClick={onSelect}
    >
      <Photo className="xrow-photo" src={bar.cover} />
      <span className="xrow-body">
        <span className="xrow-head">
          <span className="xrow-name">{bar.name}</span>
          <span className="xrow-arr">{bar.arrondissement}</span>
        </span>
        <span className="xrow-chips">
          {bar.openUntil && (
            <span className="chip">
              <span className="chip-icon"><ClockIcon /></span>
              {t.openUntil(bar.openUntil)}
            </span>
          )}
          {bar.pintPrice !== null && (
            <span className="chip chip-pink">
              <span className="chip-icon"><BeerIcon /></span>
              {price(bar.pintPrice)}
            </span>
          )}
          {bar.tags.slice(0, 3).map((tag) => (
            <span key={tag} className="chip">{labelFor(tag, lang)}</span>
          ))}
        </span>
      </span>
    </button>
  )
}

export default function ExploreList({ bars, state, warming, selectedId, onSelect, onRetry, title }: Props) {
  const t = useT()

  return (
    <section className="explore">
      <h2 className="explore-title">{title ?? t.exploreTitle}</h2>
      {state === 'loading' && (
        <div className="explore-status" role="status">
          <span className="visually-hidden">{t.exploreLoading}</span>
          {warming && <p className="explore-warming">{t.exploreWarming}</p>}
          <ul className="explore-list" aria-hidden="true">
            {[0, 1, 2].map((i) => (
              <li key={i} className="xrow-skeleton" />
            ))}
          </ul>
        </div>
      )}
      {state === 'ready' && (
        <ul className="explore-list">
          {bars.map((bar) => (
            <li key={bar.id}>
              <Row bar={bar} selected={bar.id === selectedId} onSelect={() => onSelect(bar.id)} />
            </li>
          ))}
        </ul>
      )}
      {state === 'empty' && (
        <div className="explore-note">
          <p className="explore-note-title">{t.exploreEmpty}</p>
          <p className="explore-note-hint">{t.exploreEmptyHint}</p>
        </div>
      )}
      {state === 'error' && (
        <div className="explore-note" role="alert">
          <p className="explore-note-title">{t.exploreError}</p>
          <button type="button" className="btn-primary" onClick={onRetry}>{t.retry}</button>
        </div>
      )}
    </section>
  )
}
