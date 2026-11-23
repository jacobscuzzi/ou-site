import type { Bar } from '../api/types'
import { cuisineLabel, useLang, useT } from '../i18n'
import { useLayer } from '../mode'
import { price } from '../price'
import { labelFor, tagsFor } from '../tags'
import { BeerIcon, ClockIcon } from './icons'

const coffeeItem = /espresso|expresso|caf[eé]|coffee|filtre|filter|flat white|cappuccino|latte/
const specialty = /specialty|spécialité|roaster|torréfact/i
const laptop = /work|laptop/

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
  const text = `${bar.whyHere} ${bar.description?.en ?? ''}`
  const extra: string[] = []

  if (layer === 'coffee') {
    if (specialty.test(text)) extra.push(t.specialty)
    if (facts.goodFor?.some((g) => laptop.test(g))) extra.push(t.laptop)
  }
  if (layer === 'dance') {
    for (const m of (facts.music ?? []).slice(0, 2)) extra.push(labelFor(m, lang))
    if (facts.crowdAge) extra.push(t.crowdAge(facts.crowdAge))
    if (facts.busyLevel && t.busy[facts.busyLevel]) extra.push(t.busy[facts.busyLevel])
  }
  const tags = layer === 'dance' && extra.length > 0 ? [] : tagsFor(bar, lang, layer === 'coffee' ? 3 - extra.length : 3).map((tag) => tag.label)
  const cup = layer === 'coffee' ? coffeePrice(bar) : null

  return (
    <div className="card-chips">
      {bar.openUntil && (
        <span className="chip">
          <span className="chip-icon"><ClockIcon /></span>
          {open ? t.openTill(bar.openUntil) : t.till(bar.openUntil)}
        </span>
      )}
      {layer === 'eat' && facts.cuisine?.[0] && <span className="chip">{cuisineLabel(facts.cuisine[0], lang)}</span>}
      {layer === 'eat' && facts.pricePerPerson !== undefined && (
        <span className="chip chip-pink">{t.perPerson(price(facts.pricePerPerson))}</span>
      )}
      {cup !== null && <span className="chip chip-pink">{t.coffeePrice(price(cup))}</span>}
      {(layer === 'drink' || layer === 'dance') && bar.pintPrice !== null && <Pint value={bar.pintPrice} />}
      {[...extra, ...tags].map((label) => (
        <span key={label} className="chip">{label}</span>
      ))}
    </div>
  )
}
