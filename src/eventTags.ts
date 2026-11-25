import type { Event, PriceBucket } from './api/types'
import type { Lang } from './i18n'

type Label = { en: string; fr: string }

export const GENRES = ['techno', 'hard_techno', 'house', 'disco', 'hip_hop', 'afro', 'latin', 'pop', 'dnb', 'rnb', 'electro', 'queer', 'live', 'open_format', 'other'] as const
export const VIBES = ['queer', 'student', 'underground', 'chic', 'open_air', 'afterparty', 'big_room', 'intimate'] as const
export const BUCKETS: PriceBucket[] = ['free', 'low', 'mid', 'high']

const genres: Record<string, Label> = {
  techno: { en: 'Techno', fr: 'Techno' },
  hard_techno: { en: 'Hard techno', fr: 'Hard techno' },
  house: { en: 'House', fr: 'House' },
  disco: { en: 'Disco', fr: 'Disco' },
  hip_hop: { en: 'Hip-hop', fr: 'Hip-hop' },
  afro: { en: 'Afro', fr: 'Afro' },
  latin: { en: 'Latin', fr: 'Latino' },
  pop: { en: 'Pop', fr: 'Pop' },
  dnb: { en: 'DnB & bass', fr: 'DnB & bass' },
  rnb: { en: 'R&B', fr: 'R&B' },
  electro: { en: 'Electro', fr: 'Électro' },
  queer: { en: 'Queer party', fr: 'Soirée queer' },
  live: { en: 'Live', fr: 'Live' },
  open_format: { en: 'Open format', fr: 'Généraliste' },
  other: { en: 'Other', fr: 'Autre' },
}

const vibes: Record<string, Label> = {
  queer: { en: 'Queer', fr: 'Queer' },
  student: { en: 'Students', fr: 'Étudiants' },
  underground: { en: 'Underground', fr: 'Underground' },
  chic: { en: 'Chic', fr: 'Chic' },
  open_air: { en: 'Open air', fr: 'Plein air' },
  afterparty: { en: 'Afterparty', fr: 'After' },
  big_room: { en: 'Big room', fr: 'Grande salle' },
  intimate: { en: 'Intimate', fr: 'Intimiste' },
}

const buckets: Record<PriceBucket, Label> = {
  free: { en: 'Free', fr: 'Gratuit' },
  low: { en: 'Up to 12 EUR', fr: "Jusqu'à 12 EUR" },
  mid: { en: '12 to 25 EUR', fr: '12 à 25 EUR' },
  high: { en: 'Over 25 EUR', fr: 'Plus de 25 EUR' },
}

const words = (id: string) => id.replace(/_/g, ' ').replace(/^./, (c) => c.toUpperCase())

export const genreLabel = (g: string, lang: Lang) => genres[g]?.[lang] ?? words(g)
export const vibeLabel = (v: string, lang: Lang) => vibes[v]?.[lang] ?? words(v)
export const bucketLabel = (b: PriceBucket, lang: Lang) => buckets[b][lang]

// Genres first, then the vibes the genres do not already say (a queer party is not queer twice).
export function eventTags(e: Event, lang: Lang, max = 10): string[] {
  const out = e.genres.map((g) => genreLabel(g, lang))
  for (const v of e.vibes ?? []) if (!(v === 'queer' && e.genres.includes('queer'))) out.push(vibeLabel(v, lang))
  return out.slice(0, max)
}
