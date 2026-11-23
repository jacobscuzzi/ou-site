import { useState } from 'react'
import type { Dish } from '../api/types'
import { useT } from '../i18n'
import { price } from '../price'
import './Menu.css'

const COLLAPSED_ROWS = 6

function bySection(dishes: Dish[]) {
  const groups: { section: string; dishes: Dish[] }[] = []
  for (const d of dishes) {
    const last = groups[groups.length - 1]
    if (last && last.section === d.section) last.dishes.push(d)
    else groups.push({ section: d.section, dishes: [d] })
  }
  return groups
}

export default function Dishes({ dishes, focusable }: { dishes: Dish[]; focusable: boolean }) {
  const t = useT()
  const [expanded, setExpanded] = useState(false)

  if (dishes.length === 0) return null

  const long = dishes.length > COLLAPSED_ROWS
  const shown = expanded ? dishes : dishes.slice(0, COLLAPSED_ROWS)

  return (
    <section className="menu">
      <h3 className="menu-title">{t.menuTitle}</h3>
      {bySection(shown).map((group, i) => (
        <div key={`${group.section}-${i}`} className="menu-group">
          {group.section && <h4 className="menu-heading">{group.section}</h4>}
          <ul className="menu-list">
            {group.dishes.map((d, j) => (
              <li key={`${d.item}-${j}`} className="menu-row">
                <span className="menu-name">
                  {d.item}
                  {d.description && <span className="menu-desc">{d.description}</span>}
                </span>
                <span className="menu-prices">{d.price !== null && <span className="menu-price">{price(d.price)}</span>}</span>
              </li>
            ))}
          </ul>
        </div>
      ))}
      {long && (
        <button
          type="button"
          className="menu-toggle"
          aria-expanded={expanded}
          tabIndex={focusable ? 0 : -1}
          onClick={(e) => {
            e.stopPropagation()
            setExpanded((v) => !v)
          }}
        >
          {expanded ? t.menuShowLess : t.dishesShowAll(dishes.length)}
        </button>
      )}
      <p className="menu-note">{t.dishesNote}</p>
    </section>
  )
}
