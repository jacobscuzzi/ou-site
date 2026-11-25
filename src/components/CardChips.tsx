import type { Bar } from '../api/types'
import { useLang, useT } from '../i18n'
import { useLayer } from '../mode'
import { price } from '../price'
import { searchTag, tagLabel, tagsIn } from '../tags'
import { BeerIcon, ClockIcon } from './icons'
import KindBadge from './KindBadge'

const coffeeItem = /espresso|expresso|caf[eé]|coffee|filtre|filter|flat white|cappuccino|latte/

function coffeePrice(bar: Bar) {
  const prices = bar.menu.filter((m) => coffeeItem.test(m.item) && m.price !== null).map((m) => m.price as number)
  return prices.length > 0 ? Math.min(...prices) : null
}

function Pint({ value }: { value: number }) {
  const t = useT()
  return (
    <span className="chip chip-pink">
      <span className="chip-icon"><BeerIcon /></span>
      {t.pint(price(value))}
    </span>
  )
}

export default function CardChips({ bar, open }: { bar: Bar; open: boolean }) {
  const t = useT()
  const lang = useLang()
  const layer = useLayer()
  const facts = bar.facts ?? {}
  const tags = tagsIn(bar.tags, layer, open ? 10 : 3)
  const cup = layer === 'coffee' ? coffeePrice(bar) : null

  return (
    <div className="card-chips">
      <KindBadge kinds={bar.kinds} />
      {bar.openUntil && !open && (
        <span className="chip">
          <span className="chip-icon"><ClockIcon /></span>
          {t.till(bar.openUntil)}
        </span>
      )}
      {layer === 'eat' && facts.pricePerPerson !== undefined && (
        <span className="chip chip-pink">{t.perPerson(price(facts.pricePerPerson))}</span>
      )}
      {cup !== null && <span className="chip chip-pink">{t.coffeePrice(price(cup))}</span>}
      {(layer === 'drink' || layer === 'dance') && bar.pintPrice !== null && <Pint value={bar.pintPrice} />}
      {tags.map((id) =>
        open ? (
          <button
            key={id}
            type="button"
            className="chip chip-tag"
            aria-label={t.searchTag(tagLabel(id, lang))}
            onClick={(e) => {
              e.stopPropagation()
              searchTag(id, lang)
            }}
            onKeyDown={(e) => e.stopPropagation()}
          >
            {tagLabel(id, lang)}
          </button>
        ) : (
          <span key={id} className="chip">{tagLabel(id, lang)}</span>
        ),
      )}
    </div>
  )
}
