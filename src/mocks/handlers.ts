import { delay, http, HttpResponse } from 'msw'
import type { Bar, SearchResponse } from '../api/types'
import bars from './bars.json'

export const handlers = [
  http.get('/api/search', async ({ request }) => {
    const params = new URL(request.url).searchParams
    const q = params.get('q')?.trim()
    await delay(400)

    if (!q) {
      return HttpResponse.json({ error: 'missing q' }, { status: 400 })
    }

    const limit = Number(params.get('limit')) || 6
    const body: SearchResponse = { query: q, results: (bars as Bar[]).slice(0, limit) }
    return HttpResponse.json(body)
  }),
]
