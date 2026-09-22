import type { ApiError, SearchResponse } from './types'

const useMock = import.meta.env.VITE_USE_MOCK === 'true'
const baseUrl = useMock ? '' : (import.meta.env.VITE_API_URL ?? '').replace(/\/$/, '')

// The mock normally answers through the MSW service worker. When the worker does
// not control the page (hard reload, private mode, in-app browsers) the request
// would reach the static host and 404, so the same mock answers in-page instead.
async function inPageMock(q: string, limit: number, signal?: AbortSignal): Promise<SearchResponse> {
  const { mockSearch } = await import('../mocks/search')
  await new Promise((resolve) => setTimeout(resolve, 400))
  if (signal?.aborted) throw new DOMException('Aborted', 'AbortError')
  return mockSearch(q, limit)
}

export async function searchBars(q: string, limit = 6, signal?: AbortSignal): Promise<SearchResponse> {
  if (useMock && !navigator.serviceWorker?.controller) return inPageMock(q, limit, signal)

  const params = new URLSearchParams({ q, limit: String(limit) })
  const res = await fetch(`${baseUrl}/api/search?${params}`, { signal })

  if (useMock && res.status === 404) return inPageMock(q, limit, signal)

  if (!res.ok) {
    const body: ApiError | null = await res.json().catch(() => null)
    throw new Error(body?.error ?? `Search failed (${res.status})`)
  }
  return res.json()
}
