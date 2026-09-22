import { delay, http, HttpResponse } from 'msw'
import { mockSearch } from './search'

export const handlers = [
  http.get('/api/search', async ({ request }) => {
    const params = new URL(request.url).searchParams
    const q = params.get('q')?.trim()
    await delay(400)

    if (!q) {
      return HttpResponse.json({ error: 'missing q' }, { status: 400 })
    }

    const limit = Number(params.get('limit')) || 6
    return HttpResponse.json(mockSearch(q, limit))
  }),
]
