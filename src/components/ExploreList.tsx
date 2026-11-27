import type { ReactNode } from 'react'
import type { Event, MapBar, Post } from '../api/types'
import { cuisineLabel, useLang, useT } from '../i18n'
import { useLayer } from '../mode'
import { price } from '../price'
import { tagLabel, tagsIn } from '../tags'
import { dealLabel, useDealsShown } from '../deals'
import { BeerIcon, ClockIcon } from './icons'
import KindBadge from './KindBadge'
import Photo from './Photo'
import { ActionLink } from './Actions'
import { TonightLine } from './EventCard'
import Posts from './Posts'
import { Dish, Espresso } from './PriceChips'
import './ExploreList.css'

type Props = {
  bars: MapBar[]
  state: 'loading' | 'ready' | 'empty' | 'error'
  warming: boolean
  selectedId: string | null
  onSelect: (id: string) => void
  onRetry: () => void
  title?: string
  empty?: string
  action?: ReactNode
  // drink layer: the party a bar has tonight, and what a tap on its line does
  eventOf?: (id: string) => Event | undefined
  onEvent?: (e: Event) => void
  postsOf?: (id: string) => Post[] | undefined
}

function Row({ bar, selected, onSelect }: { bar: MapBar; selected: boolean; onSelect: () => void }) {
  const t = useT()
  const lang = useLang()
  const layer = useLayer()
  const eat = layer === 'eat'
  const deals = useDealsShown()

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
          {bar.deal && deals && <span className="chip chip-deal">{dealLabel(bar.dealKind ?? (bar.dealPct ? 'pct' : undefined), bar.dealValue ?? bar.dealPct, lang)}</span>}
          <KindBadge kinds={bar.kinds} />
          {bar.openUntil && (
            <span className="chip">
              <span className="chip-icon"><ClockIcon /></span>
              {t.openUntil(bar.openUntil)}
            </span>
          )}
          {eat && bar.cuisine && <span className="chip">{cuisineLabel(bar.cuisine, lang)}</span>}
          {eat && bar.dishPrice !== undefined && <Dish value={bar.dishPrice} kinds={[...(bar.cuisines ?? []), ...bar.tags]} />}
          {layer === 'coffee' && bar.coffeePrice !== undefined && <Espresso value={bar.coffeePrice} />}
          {(layer === 'drink' || layer === 'dance') && bar.pintPrice !== null && (
            <span className="chip chip-pink">
              <span className="chip-icon"><BeerIcon /></span>
              {price(bar.pintPrice)}
            </span>
          )}
          {tagsIn(bar.tags, layer, 3).map((tag) => (
            <span key={tag} className="chip">{tagLabel(tag, lang)}</span>
          ))}
        </span>
      </span>
    </button>
  )
}

export default function ExploreList({ bars, state, warming, selectedId, onSelect, onRetry, title, empty, action, eventOf, onEvent, postsOf }: Props) {
  const t = useT()

  return (
    <section className="explore">
      <div className="explore-head">
        <h2 className="explore-title">{title ?? t.exploreTitle}</h2>
        {action}
      </div>
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
          {bars.map((bar) => {
            const party = onEvent && eventOf?.(bar.id)
            return (
              <li key={bar.id} className="xrow-item">
                <div className={['xrow-box', bar.action && 'xrow-item-cta', party && 'xrow-item-ev'].filter(Boolean).join(' ')}>
                  <Row bar={bar} selected={bar.id === selectedId} onSelect={() => onSelect(bar.id)} />
                  {party && (
                    <span className="xrow-ev">
                      <TonightLine event={party} onOpen={() => onEvent(party)} />
                    </span>
                  )}
                  {bar.action && (
                    <span className="xrow-cta">
                      <ActionLink action={bar.action} kinds={bar.kinds} />
                    </span>
                  )}
                </div>
                <Posts posts={postsOf?.(bar.id) ?? []} place={bar.name} actions={bar.action ? [bar.action] : []} kinds={bar.kinds} focusable />
              </li>
            )
          })}
        </ul>
      )}
      {state === 'empty' && (
        <div className="explore-note">
          <p className="explore-note-title">{empty ?? t.exploreEmpty}</p>
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
