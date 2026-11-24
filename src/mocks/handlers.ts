import { delay, http, HttpResponse } from 'msw'
import { mockBar, mockBars, mockLayers } from './bars'
import { isLayer, isVenue, parseBbox } from './catalog'
import { mockDays, mockEvents, validDate } from './events'
import { mockMore, mockSearch } from './search'

function bad(error: string) {
  return HttpResponse.json({ error }, { status: 400 })
}

export const handlers = [
  http.get('/api/search', async ({ request }) => {
    const params = new URL(request.url).searchParams
    const q = params.get('q')?.trim()
    const layer = params.get('layer')
    const venue = params.get('venue') ?? 'bar'
    const box = parseBbox(params.get('bbox'))
    await delay(400)

    if (!q || q.length > 500) return bad('missing q')
    if (layer !== null && !isLayer(layer)) return bad('unknown layer')
    if (layer === null && !isVenue(venue)) return bad('unknown venue')
    if (box === 'bad') return bad('malformed bbox')

    return HttpResponse.json(mockSearch(q, layer, box, isVenue(venue) ? venue : 'bar'))
  }),

  http.get('/api/search/:id/more', async ({ request, params }) => {
    const page = Number(new URL(request.url).searchParams.get('page'))
    await delay(400)

    if (!Number.isInteger(page) || page < 1 || page > 30) {
      return HttpResponse.json({ error: 'page must be 1..30' }, { status: 400 })
    }

    try {
      return HttpResponse.json(mockMore(String(params.id), page))
    } catch {
      return HttpResponse.json({ error: 'search expired' }, { status: 410 })
    }
  }),

  http.get('/api/layers', async () => {
    await delay(200)
    return HttpResponse.json(mockLayers())
  }),

  http.get('/api/bars', async ({ request }) => {
    const params = new URL(request.url).searchParams
    const layer = params.get('layer')
    const venue = params.get('venue') ?? 'bar'
    await delay(400)
    if (layer !== null && !isLayer(layer)) return bad('unknown layer')
    if (layer === null && !isVenue(venue)) return bad('unknown venue')
    return HttpResponse.json(mockBars(layer, isVenue(venue) ? venue : 'bar'))
  }),

  http.get('/api/events', async ({ request }) => {
    const params = new URL(request.url).searchParams
    const layer = params.get('layer')
    const date = params.get('date')
    const from = params.get('from') ?? date
    const to = params.get('to') ?? date
    await delay(300)
    if (layer !== null && !isLayer(layer)) return bad('unknown layer')
    if (!validDate(from) || !validDate(to) || (from && to && from > to)) return bad('bad date')
    return HttpResponse.json(mockEvents(layer, from, to))
  }),

  http.get('/api/events/days', async ({ request }) => {
    const params = new URL(request.url).searchParams
    const layer = params.get('layer')
    const from = params.get('from')
    const to = params.get('to')
    await delay(200)
    if (layer !== null && !isLayer(layer)) return bad('unknown layer')
    if (!validDate(from) || !validDate(to)) return bad('bad date')
    return HttpResponse.json(mockDays(layer, from, to))
  }),

  http.get('/api/bars/:id', async ({ params }) => {
    await delay(200)
    try {
      return HttpResponse.json(mockBar(String(params.id)))
    } catch {
      return HttpResponse.json({ error: 'bar not found' }, { status: 404 })
    }
  }),
]
