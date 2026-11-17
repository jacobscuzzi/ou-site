import { useT } from '../i18n'
import type { ChipKey } from '../map/geo'
import './Chips.css'

type Props = { value: ReadonlySet<ChipKey>; onToggle: (k: ChipKey) => void }

export default function Chips({ value, onToggle }: Props) {
  const t = useT()
  const items: [ChipKey, string][] = [
    ['open', t.chipOpen],
    ['terrace', t.chipTerrace],
    ['dancing', t.chipDancing],
    ['cheap', t.chipCheap],
  ]

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
