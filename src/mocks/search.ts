import type { Bar, Layer, SearchResponse, Venue } from '../api/types'
import { available, catalog, inBox, places, toBar, wishLayer, type Box } from './catalog'
import { mockWhen, placeEvents } from './events'
import themes from './themes.json'

type Theme = keyof typeof themes

const rules: [Theme, RegExp][] = [
  ['lgbtq', /lgbt|queer|\bgay\b|lesbi/],
  ['jazz', /jazz|live music|concert|musique live|\blive\b/],
  ['rooftop', /rooftop|sunset|\bview\b|\bvue\b|coucher du soleil|toit/],
  ['late', /past 3|after 3|apr[eè]s 3|3h\b|3 ?am|open late|tard|toute la nuit|all night/],
  ['espresso', /espresso|martini|cocktail|fancy|chic|classy|speakeasy/],
  ['wine', /\bwine\b|\bvins?\b|first date|rendez-vous|\bdate\b|romantic|romantique/],
  ['psg', /\bpsg\b|match|football|\bfoot\b|\bgame\b|sport|\bscreen/],
  ['quiz', /quiz|\bpub\b|pints?\b|pintes?\b/],
  ['terrace11', /terrace|terrasse|11e|oberkampf|charonne|bastille/],
  ['alone', /alone|\bseul|\bsolo\b|by myself|on my own|bartender|comptoir/],
  ['safe', /\bsafe\b|s[ée]curit|welcoming|women|femmes?\b|feminist|f[ée]ministe|calm\b|tranquille/],
  ['student', /student|[ée]tudiant|cheap|pas ch[eè]re?|beer|bi[eè]re|atmosphere|ambiance|party|f[eê]te/],
]

function pickTheme(q: string): Theme {
  const text = q.toLowerCase()
  let best: Theme = 'student'
  let bestScore = 0
  for (const [theme, re] of rules) {
    const score = (text.match(new RegExp(re.source, 'g')) ?? []).length
    if (score > bestScore) {
      best = theme
      bestScore = score
    }
  }
  return best
}

type Stored = { query: string; venue: Venue; layer: Layer | null; switched: boolean; bars: Bar[]; range?: { from: string; to: string } }

const searches = new Map<string, Stored>()

const FIRST = 5
const PAGE = 10

function rank(q: string, layer: Layer | null, venue: Venue): Bar[] {
  const pool = places(layer, venue).map(toBar)
  if ((layer !== null && layer !== 'drink') || (layer === null && venue !== 'bar')) return [...pool].sort((a, b) => Number(Boolean(b.facts)) - Number(Boolean(a.facts)))
  const theme = pickTheme(q)
  const ids = themes[theme].length ? themes[theme] : themes.student
  const picked = ids.map((id) => pool.find((b) => b.id === id)).filter((b): b is Bar => Boolean(b))
  const ranked = [...picked, ...pool.filter((b) => !ids.includes(b.id))]
  if (theme === 'student' && ranked.length >= FIRST) {
    ranked[FIRST - 1] = {
      ...ranked[FIRST - 1],
      compliant: false,
      constraintsNotMet: [{ type: 'max_beer_price', requested: 5, actual: 6.5 }],
    }
  }
  return ranked
}

function body(searchId: string, s: Stored, results: Bar[], hasMore: boolean): SearchResponse {
  return {
    searchId,
    query: s.query,
    venue: s.venue,
    ...(s.layer && { layer: s.layer }),
    results,
    hasMore,
    meta: {
      parsed: true,
      rankingVersion: 0,
      ...(s.layer && { layerSwitched: s.switched }),
      ...(s.range && { dateRange: s.range }),
    },
  }
}

export function mockSearch(
  q: string,
  layer: Layer | null = null,
  box: Box | null = null,
  venue: Venue = 'bar',
  night: { from: string; to: string } | null = null,
): SearchResponse {
  const wish = layer && wishLayer(q)
  const switched = Boolean(wish && wish !== layer && available(wish))
  const searched = switched ? wish : layer
  const range = night ?? mockWhen(q)
  const dealsOnly = /\b(deals?|bons? plans?|promos?|discounts?|r[ée]ductions?)\b/i.test(q)
  const ranked = rank(q, searched, venue)
    .filter((b) => !box || inBox(b, box))
    .filter((b) => !dealsOnly || b.deal)
    .map((b, i) => {
      const place = range && catalog.find((p) => p.id === b.id)
      return { ...b, rank: i + 1, ...(place && { events: placeEvents(place, range.from) }) }
    })
  const searchId = Math.random().toString(36).slice(2)
  const stored = { query: q, venue, layer: searched, switched, bars: ranked, range }
  searches.set(searchId, stored)
  return body(searchId, stored, ranked.slice(0, FIRST), ranked.length > FIRST)
}

export function mockMore(searchId: string, page: number): SearchResponse {
  const search = searches.get(searchId)
  if (!search) {
    const err = new Error('search expired')
    err.name = 'SearchExpired'
    throw err
  }
  const start = FIRST + (page - 1) * PAGE
  const end = start + PAGE
  return body(searchId, search, search.bars.slice(start, end), end < search.bars.length && page < 30)
}
