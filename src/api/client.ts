import type { ApiError, SearchResponse } from './types'

const useMock = import.meta.env.VITE_USE_MOCK === 'true'
const baseUrl = useMock ? '' : (import.meta.env.VITE_API_URL ?? '').replace(/\/$/, '')

// The mock normally answers through the MSW service worker. When the worker does
// not control the page (hard reload, private mode, in-app browsers) the request
// would reach the static host and 404, so the same mock answers in-page instead.
async function inPageMock(run: (m: typeof import('../mocks/search')) => SearchResponse, signal?: AbortSignal) {
  const mock = await import('../mocks/search')
  await new Promise((resolve) => setTimeout(resolve, 400))
  if (signal?.aborted) throw new DOMException('Aborted', 'AbortError')
  return run(mock)
}

async function get(path: string, fallback: () => Promise<SearchResponse>, signal?: AbortSignal): Promise<SearchResponse> {
  if (useMock && !navigator.serviceWorker?.controller) return fallback()

  const res = await fetch(`${baseUrl}${path}`, { signal })

  if (useMock && res.status === 404) return fallback()

  if (!res.ok) {
    const body: ApiError | null = await res.json().catch(() => null)
    const err = new Error(body?.error ?? `Search failed (${res.status})`)
    if (res.status === 410) err.name = 'SearchExpired'
    throw err
  }
  return res.json()
}

export function searchBars(q: string, signal?: AbortSignal) {
  const params = new URLSearchParams({ q })
  return get(`/api/search?${params}`, () => inPageMock((m) => m.mockSearch(q), signal), signal)
}

export function moreBars(searchId: string, page: number, signal?: AbortSignal) {
  const params = new URLSearchParams({ page: String(page) })
  return get(
    `/api/search/${encodeURIComponent(searchId)}/more?${params}`,
    () => inPageMock((m) => m.mockMore(searchId, page), signal),
    signal,
  )
}
