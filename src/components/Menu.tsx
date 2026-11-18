import { useState } from 'react'
import type { MenuItem } from '../api/types'
import { useT } from '../i18n'
import { price } from '../price'
import './Menu.css'

const COLLAPSED_ROWS = 6

function label(item: string) {
  return item.charAt(0).toUpperCase() + item.slice(1)
}

function groupByCategory(items: MenuItem[]) {
  const groups: { category: MenuItem['category']; items: MenuItem[] }[] = []
  for (const it of items) {
    const last = groups[groups.length - 1]
    if (last?.category === it.category) last.items.push(it)
    else groups.push({ category: it.category, items: [it] })
  }
  return groups
}

export default function Menu({ items, focusable }: { items: MenuItem[]; focusable: boolean }) {
  const t = useT()
  const [expanded, setExpanded] = useState(false)

  if (items.length === 0) return null

  const long = items.length > COLLAPSED_ROWS
  const shown = expanded ? items : items.slice(0, COLLAPSED_ROWS)

  return (
    <section className="menu">
      <h3 className="menu-title">{t.menuTitle}</h3>
      {groupByCategory(shown).map((group) => (
        <div key={group.category} className="menu-group">
          <h4 className="menu-heading">{t.menuCategories[group.category]}</h4>
          <ul className="menu-list">
            {group.items.map((it) => (
              <li key={it.item} className="menu-row">
                <span className="menu-name">{label(it.item)}</span>
                <span className="menu-prices">
                  {it.price !== null && <span className="menu-price">{price(it.price)}</span>}
                  {it.happyHourPrice !== null && (
                    <span className="menu-hh">
                      <span className="menu-hh-tag">{t.menuHappyHour}</span>
                      {price(it.happyHourPrice)}
                    </span>
                  )}
                </span>
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
          {expanded ? t.menuShowLess : t.menuShowAll(items.length)}
        </button>
      )}
      <p className="menu-note">{t.menuNote}</p>
    </section>
  )
}
