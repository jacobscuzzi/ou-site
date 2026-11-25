import { useT } from '../i18n'
import type { MapBar } from '../api/types'
import { CHEAP_ESPRESSO, CHEAP_FAST_FOOD, CHEAP_MEAL, CHEAP_PINT, offeredChips, type ChipKey } from '../map/geo'
import { useLayer } from '../mode'
import './Chips.css'

type Props = { bars: MapBar[]; value: ReadonlySet<ChipKey>; onToggle: (k: ChipKey) => void }

export default function Chips({ bars, value, onToggle }: Props) {
  const t = useT()
  const labels: Record<ChipKey, string> = {
    open: t.chipOpen,
    terrace: t.chipTerrace,
    dancing: t.chipDancing,
    cheap: t.chipCheap(CHEAP_PINT),
    meal: t.chipMeal(CHEAP_MEAL),
    fastfood: t.chipFastFood(CHEAP_FAST_FOOD),
    espresso: t.chipEspresso(CHEAP_ESPRESSO),
    ...t.chipGroups,
  }
  const items = offeredChips(useLayer(), bars, value).map((key) => [key, labels[key]] as const)

  return (
    <div className="chips" role="group" aria-label={t.chipsLabel}>
      {items.map(([key, label]) => (
        <button
          key={key}
          type="button"
          className={value.has(key) ? 'filter filter-on' : 'filter'}
          aria-pressed={value.has(key)}
          onClick={() => onToggle(key)}
        >
          {label}
        </button>
      ))}
    </div>
  )
}
