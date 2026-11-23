import { delay, http, HttpResponse } from 'msw'
import type { Venue } from '../api/types'
import { mockBar, mockBars, mockLayers } from './bars'
import { isLayer, parseBbox } from './catalog'
import { mockMore, mockSearch } from './search'

const venues: Venue[] = ['bar', 'restaurant', 'cafe', 'all']

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
    if (!venues.includes(venue as Venue)) return bad('unknown venue')
    if (box === 'bad') return bad('malformed bbox')

    return HttpResponse.json(mockSearch(q, layer, box, venue as Venue))
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
    const layer = new URL(request.url).searchParams.get('layer')
    await delay(400)
    if (layer !== null && !isLayer(layer)) return bad('unknown layer')
    return HttpResponse.json(mockBars(layer))
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
