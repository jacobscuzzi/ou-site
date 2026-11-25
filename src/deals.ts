import { createContext, useContext } from 'react'
import type { DealKind } from './api/types'
import type { Lang } from './i18n'

const euros = (v: number) => (Number.isInteger(v) ? `${v} €` : `${v.toFixed(2).replace('.', ',')} €`)

// The short words of a deal on its badge: a percentage is one kind of deal among others.
export function dealLabel(kind: DealKind | undefined, value: number | undefined | null, lang: Lang): string {
  switch (kind) {
    case 'pct':
      return value ? `-${value}%` : lang === 'fr' ? 'Bon plan' : 'Deal'
    case 'bogo':
      return lang === 'fr' ? '2 pour 1' : '2 for 1'
    case 'off':
      return value ? `-${euros(value)}` : lang === 'fr' ? 'Réduction' : 'Money off'
    case 'menu':
      return value ? `Menu ${euros(value)}` : 'Menu'
    case 'free':
      return lang === 'fr' ? 'Offert' : 'Free'
    default:
      return lang === 'fr' ? 'Bon plan' : 'Deal'
  }
}

// Deals show only when the deals toggle is on, or when the search asked for deals.
export const DealsContext = createContext(false)

export function useDealsShown() {
  return useContext(DealsContext)
}

export const DEAL_WORDS = /\b(deals?|bons? plans?|promos?|promotions?|discounts?|r[ée]ductions?)\b|-\s?\d{1,2} ?%/i
