import type { Bar, SearchResponse } from '../api/types'
import bars from './bars.json'
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

const all: Bar[] = (bars as Omit<Bar, 'compliant' | 'constraintsNotMet' | 'dishes'>[]).map((b) => ({
  dishes: [],
  ...b,
  compliant: true,
  constraintsNotMet: [],
}))
const byId = new Map(all.map((b) => [b.id, b]))
const searches = new Map<string, { query: string; bars: Bar[] }>()

const FIRST = 5
const PAGE = 10
const meta = { parsed: true, rankingVersion: 0 }

export function mockSearch(q: string): SearchResponse {
  const theme = pickTheme(q)
  const ids = themes[theme].length ? themes[theme] : themes.student
  const picked = ids.map((id) => byId.get(id)).filter((b): b is Bar => Boolean(b))
  const ranked = [...picked, ...all.filter((b) => !ids.includes(b.id))].map((b, i) => ({ ...b, rank: i + 1 }))

  if (theme === 'student' && ranked.length >= FIRST) {
    ranked[FIRST - 1] = {
      ...ranked[FIRST - 1],
      compliant: false,
      constraintsNotMet: [{ type: 'max_beer_price', requested: 5, actual: 6.5 }],
    }
  }

  const searchId = Math.random().toString(36).slice(2)
  searches.set(searchId, { query: q, bars: ranked })
  return { searchId, query: q, results: ranked.slice(0, FIRST), hasMore: ranked.length > FIRST, meta }
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
  return {
    searchId,
    query: search.query,
    results: search.bars.slice(start, end),
    hasMore: end < search.bars.length && page < 30,
    meta,
  }
}
