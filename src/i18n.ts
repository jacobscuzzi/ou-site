import { createContext, useContext } from 'react'
import type { ConstraintNotMet } from './api/types'

export type Lang = 'en' | 'fr'

function amount(v: string | number, lang: Lang) {
  const n = Number(v)
  if (Number.isNaN(n)) return String(v)
  const text = Number.isInteger(n) ? String(n) : n.toFixed(2)
  return lang === 'fr' ? text.replace('.', ',') : text
}

function clock(v: string | number) {
  return String(v).match(/\d{1,2}:\d{2}/)?.[0] ?? null
}

const levels = {
  en: { cheap: 'cheap', moderate: 'mid-range', expensive: 'upscale' },
  fr: { cheap: 'pas cher', moderate: 'moyen', expensive: 'chic' },
}

function level(v: string | number, lang: Lang) {
  return levels[lang][v as keyof (typeof levels)['en']] ?? String(v)
}

const en = {
  eyebrow: 'Paris, tonight',
  tagline: "Let's find the best bar for you.",
  placeholder: "Describe what you're looking for",
  search: 'Search',
  startOver: 'Start over',
  suggestions: [
    ['A bar to watch the PSG game', 'A bar close by that is fun to go to alone', 'A bar for LGBTQ people', 'A bar that feels super safe'],
    ['A fancy bar with espresso martinis', 'A student bar with cheap beer and great atmosphere', 'A quiet wine bar for a first date', 'Somewhere with live jazz tonight'],
    ['A rooftop with a view for sunset', 'A bar with a big terrace in the 11e', 'A cocktail bar that stays open past 3', 'A pub with a quiz and cheap pints'],
  ],
  thinking: 'Running the numbers',
  picks: (n: number) => `${n} picks for tonight`,
  openTill: (t: string) => `Open today till ${t}`,
  closedToday: 'Closed today',
  till: (t: string) => `Till ${t}`,
  closed: 'Closed',
  pint: (p: string) => `Pint ${p}`,
  happyHour: (from: string, to: string) => `Happy hour ${from}–${to}:`,
  whyHere: 'Why here?',
  openMaps: 'Open in Google Maps',
  errorTitle: 'Something went wrong',
  timeout: 'The search took too long, please try again.',
  retry: 'Try again',
  more: 'Show more bars',
  loadingMore: 'Loading…',
  moreError: "Couldn't load more bars",
  emptyTitle: 'Nothing for that yet',
  emptyText: 'Try describing the evening differently.',
  credit: 'Map data from OpenStreetMap contributors',
  showMap: 'Show results on the map',
  closeMap: 'Close map',
  mapTitle: 'Results on the map',
  switchTo: 'Passer en français',
  hint: (c: ConstraintNotMet) => {
    switch (c.type) {
      case 'max_beer_price':
        return c.actual === null
          ? 'Pint price unknown'
          : `Pint ${amount(c.actual, 'en')} EUR (asked ≤ ${amount(c.requested, 'en')} EUR)`
      case 'price_level': {
        const asked = level(c.requested, 'en')
        const wanted = asked.charAt(0).toUpperCase() + asked.slice(1)
        return c.actual === null
          ? `${wanted} asked, pint price unknown`
          : `${wanted} asked, pint ${amount(c.actual, 'en')} EUR`
      }
      case 'opening':
        return c.requested === 'open now' ? 'Closed right now' : `Closed at the requested time (${clock(c.requested) ?? c.requested})`
      case 'happy_hour_opening': {
        const at = clock(c.requested)
        return at ? `No happy hour at ${at}` : 'No happy hour at the requested time'
      }
      case 'location':
        return `Far from ${c.requested}`
    }
  },
}

const fr: typeof en = {
  eyebrow: 'Paris, ce soir',
  tagline: 'Trouvons le meilleur bar pour toi.',
  placeholder: 'Décris ce que tu cherches',
  search: 'Rechercher',
  startOver: 'Recommencer',
  suggestions: [
    ['Un bar pour regarder le match du PSG', 'Un bar sympa tout près pour y aller seul', 'Un bar pour les personnes LGBTQ', 'Un bar où on se sent en sécurité'],
    ['Un bar chic avec des espresso martinis', 'Un bar étudiant, bière pas chère et bonne ambiance', 'Un bar à vin calme pour un premier rendez-vous', 'Du jazz en live ce soir'],
    ['Un rooftop avec vue pour le coucher du soleil', 'Un bar avec une grande terrasse dans le 11e', 'Un bar à cocktails ouvert après 3h', 'Un pub avec un quiz et des pintes pas chères'],
  ],
  thinking: 'On fait les comptes',
  picks: (n: number) => `${n} adresses pour ce soir`,
  openTill: (t: string) => `Ouvert ce soir jusqu'à ${t}`,
  closedToday: "Fermé aujourd'hui",
  till: (t: string) => `Jusqu'à ${t}`,
  closed: 'Fermé',
  pint: (p: string) => `Pinte ${p}`,
  happyHour: (from: string, to: string) => `Happy hour ${from}–${to} :`,
  whyHere: 'Pourquoi ici ?',
  openMaps: 'Ouvrir dans Google Maps',
  errorTitle: 'Un problème est survenu',
  timeout: 'La recherche a pris trop de temps, réessaie.',
  retry: 'Réessayer',
  more: "Voir plus d'adresses",
  loadingMore: 'Chargement…',
  moreError: "Impossible de charger plus d'adresses",
  emptyTitle: 'Rien pour ça, pour le moment',
  emptyText: 'Essaie de décrire la soirée autrement.',
  credit: 'Données cartographiques OpenStreetMap',
  showMap: 'Voir les résultats sur la carte',
  closeMap: 'Fermer la carte',
  mapTitle: 'Résultats sur la carte',
  switchTo: 'Switch to English',
  hint: (c: ConstraintNotMet) => {
    switch (c.type) {
      case 'max_beer_price':
        return c.actual === null
          ? 'Prix de la pinte inconnu'
          : `Pinte à ${amount(c.actual, 'fr')} € (demandé ≤ ${amount(c.requested, 'fr')} €)`
      case 'price_level':
        return c.actual === null
          ? `Plutôt ${level(c.requested, 'fr')} demandé, prix de la pinte inconnu`
          : `Plutôt ${level(c.requested, 'fr')} demandé, pinte à ${amount(c.actual, 'fr')} €`
      case 'opening':
        return c.requested === 'open now' ? 'Fermé en ce moment' : `Fermé à l'heure demandée (${clock(c.requested) ?? c.requested})`
      case 'happy_hour_opening': {
        const at = clock(c.requested)
        return at ? `Pas de happy hour à ${at}` : "Pas de happy hour à l'heure demandée"
      }
      case 'location':
        return `Loin de ${c.requested}`
    }
  },
}

export const strings: Record<Lang, typeof en> = { en, fr }

export function hintFor(list: ConstraintNotMet[], t: typeof en) {
  return list.slice(0, 2).map(t.hint).join(' · ')
}

export const LangContext = createContext<Lang>('en')

export function useLang() {
  return useContext(LangContext)
}

export function useT() {
  return strings[useLang()]
}

export function initialLang(): Lang {
  try {
    const stored = localStorage.getItem('ou-lang')
    if (stored === 'en' || stored === 'fr') return stored
  } catch {
    // storage unavailable, fall through to the browser language
  }
  return navigator.language.toLowerCase().startsWith('fr') ? 'fr' : 'en'
}
