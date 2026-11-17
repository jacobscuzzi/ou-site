import { delay, http, HttpResponse } from 'msw'
import { mockMore, mockSearch } from './search'

export const handlers = [
  http.get('/api/search', async ({ request }) => {
    const q = new URL(request.url).searchParams.get('q')?.trim()
    await delay(400)

    if (!q || q.length > 500) {
      return HttpResponse.json({ error: 'missing q' }, { status: 400 })
    }

    return HttpResponse.json(mockSearch(q))
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
]
