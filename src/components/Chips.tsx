import { useT } from '../i18n'
import { CHEAP_PINT, layerChips, type ChipKey } from '../map/geo'
import { useLayer } from '../mode'
import './Chips.css'

type Props = { value: ReadonlySet<ChipKey>; onToggle: (k: ChipKey) => void }

export default function Chips({ value, onToggle }: Props) {
  const t = useT()
  const labels: Record<ChipKey, string> = {
    open: t.chipOpen,
    terrace: t.chipTerrace,
    dancing: t.chipDancing,
    cheap: t.chipCheap(CHEAP_PINT),
  }
  const items = layerChips[useLayer()].map((key) => [key, labels[key]] as const)

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
