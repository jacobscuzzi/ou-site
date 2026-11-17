import type { Bar, Facts } from './api/types'
import type { Lang } from './i18n'

type Rule = { re: RegExp; en: string; fr: string }
type Label = { en: string; fr: string }

const rules: Rule[] = [
  { re: /\bdarts?\b|fléchettes/, en: 'Darts', fr: 'Fléchettes' },
  { re: /billiard|pool table|snooker/, en: 'Billiards', fr: 'Billard' },
  { re: /live music|live band|live sets?|live jazz|concert|jam session/, en: 'Live music', fr: 'Musique live' },
  { re: /\bdjs?\b|dancefloor|dance bar|night ?club|basement club|boîte/, en: 'DJ', fr: 'DJ' },
  { re: /lgbt|queer|\bgay\b|lesbi|flinta/, en: 'Queer', fr: 'Queer' },
  { re: /feminist|féministe|run by (three |two )?women/, en: 'Feminist', fr: 'Féministe' },
  { re: /board.?games?|jeux de société|game bar|bar à jeux|game masters/, en: 'Board games', fr: 'Jeux de société' },
  { re: /\bdrag\b|burlesque|cabaret|\bshows?\b|go-go/, en: 'Shows', fr: 'Spectacles' },
  { re: /dance floor|dancefloor|swing|dancing|tea dance/, en: 'Dancing', fr: 'Danse' },
  { re: /cellar|vaulted|\bcave\b|caveau/, en: 'Cellar', fr: 'Cave' },
  { re: /student|étudiant/, en: 'Students', fr: 'Étudiants' },
  { re: /after ?work/, en: 'Afterwork', fr: 'Afterwork' },
  { re: /international|expat|erasmus/, en: 'Internationals', fr: 'Internationaux' },
  { re: /karaoke|karaoké/, en: 'Karaoke', fr: 'Karaoké' },
  { re: /beer pong/, en: 'Beer pong', fr: 'Beer pong' },
  { re: /table football|foosball|baby-?foot|kicker/, en: 'Table football', fr: 'Baby-foot' },
  { re: /arcade|pinball|flipper/, en: 'Arcade', fr: 'Arcade' },
  { re: /terrace|terrasse/, en: 'Terrace', fr: 'Terrasse' },
  { re: /match|sport|big screen|screens\b|grand écran/, en: 'Match nights', fr: 'Soirs de match' },
  { re: /\brock\b/, en: 'Rock', fr: 'Rock' },
  { re: /jazz/, en: 'Jazz', fr: 'Jazz' },
  { re: /cocktail/, en: 'Cocktails', fr: 'Cocktails' },
  { re: /\bwine\b|\bvin\b/, en: 'Wine', fr: 'Vin' },
  { re: /quiz/, en: 'Quiz', fr: 'Quiz' },
  { re: /party|dancing|fête/, en: 'Party', fr: 'Fête' },
  { re: /rooftop/, en: 'Rooftop', fr: 'Rooftop' },
  { re: /burger|pizza|kitchen|\bfood\b/, en: 'Food', fr: 'À manger' },
  { re: /cosy|cozy|relaxed|quiet|calm/, en: 'Cosy', fr: 'Cosy' },
  { re: /neighbourhood|neighborhood|local bar|corner cafe|de quartier/, en: 'Local', fr: 'De quartier' },
  { re: /on tap|craft beer/, en: 'Beers on tap', fr: 'Bières pression' },
  { re: /busy|crowd|packed|lively|animé/, en: 'Lively', fr: 'Animé' },
]

const music: Record<string, Label> = {
  electro: { en: 'Electro', fr: 'Électro' },
  techno: { en: 'Techno', fr: 'Techno' },
  hip_hop: { en: 'Hip-hop', fr: 'Hip-hop' },
  latin: { en: 'Latin', fr: 'Latino' },
  afro: { en: 'Afro', fr: 'Afro' },
  rock: { en: 'Rock', fr: 'Rock' },
  pop: { en: 'Pop', fr: 'Pop' },
  jazz: { en: 'Jazz', fr: 'Jazz' },
  live_band: { en: 'Live music', fr: 'Musique live' },
  dj: { en: 'DJ', fr: 'DJ' },
  karaoke: { en: 'Karaoke', fr: 'Karaoké' },
}

const vibe: Record<string, Label> = {
  cheap: { en: 'Cheap', fr: 'Pas cher' },
  chic: { en: 'Chic', fr: 'Chic' },
  cosy: { en: 'Cosy', fr: 'Cosy' },
  lively: { en: 'Lively', fr: 'Animé' },
  dive: { en: 'Dive bar', fr: 'Rade' },
  romantic: { en: 'Romantic', fr: 'Romantique' },
  party: { en: 'Party', fr: 'Fête' },
  laid_back: { en: 'Laid-back', fr: 'Tranquille' },
  hidden: { en: 'Hidden', fr: 'Caché' },
  touristy: { en: 'Touristy', fr: 'Touristique' },
}

const dancing: Label = { en: 'Dancing', fr: 'Danse' }
const terrace: Label = { en: 'Terrace', fr: 'Terrasse' }
const packed: Label = { en: 'Packed', fr: 'Bondé' }

export type Tag = { label: string }

const tag = (l: Label, lang: Lang): Tag => ({ label: l[lang] })

function tagsFromFacts(facts: Facts, lang: Lang): Tag[] {
  const out: Tag[] = []
  for (const m of facts.music ?? []) if (music[m]) out.push(tag(music[m], lang))
  if (facts.dancing) out.push(tag(dancing, lang))
  for (const v of facts.vibe ?? []) if (vibe[v]) out.push(tag(vibe[v], lang))
  if (facts.terrace) out.push(tag(terrace, lang))
  if (facts.busyLevel === 'packed') out.push(tag(packed, lang))
  return out
}

export function tagsFor(bar: Bar, lang: Lang, max = 3): Tag[] {
  if (bar.facts) {
    const fromFacts = tagsFromFacts(bar.facts, lang)
    if (fromFacts.length > 0) return fromFacts.slice(0, max)
  }
  const text = `${bar.name} ${bar.whyHere}`.toLowerCase()
  return rules
    .filter((r) => r.re.test(text))
    .slice(0, max)
    .map((r) => ({ label: r[lang] }))
}

const named = new Map<string, Label>([
  ...Object.entries(music),
  ...Object.entries(vibe),
  ['dancing', dancing],
  ['terrace', terrace],
  ['packed', packed],
])

export function labelFor(raw: string, lang: Lang): string {
  const known = named.get(raw)
  return known ? known[lang] : raw.replace(/_/g, ' ')
}
