import { foodMode } from '../mode'
import type { ApiError, Bar, BarsResponse } from './types'

const venue = foodMode ? 'restaurant' : null

const useMock = import.meta.env.VITE_USE_MOCK === 'true'
const baseUrl = useMock ? '' : (import.meta.env.VITE_API_URL ?? '').replace(/\/$/, '')

// The mock normally answers through the MSW service worker. When the worker does
// not control the page (hard reload, private mode, in-app browsers) the request
// would reach the static host and 404, so the same mock answers in-page instead.
async function inPageMock<T>(run: () => Promise<T>, signal?: AbortSignal) {
  await new Promise((resolve) => setTimeout(resolve, 400))
  if (signal?.aborted) throw new DOMException('Aborted', 'AbortError')
  return run()
}

type Failures = { label: string; names: Record<number, string> }

const searchFailures: Failures = { label: 'Search', names: { 410: 'SearchExpired' } }
const barsFailures: Failures = { label: 'Bars', names: { 503: 'BarsLoading' } }
const barFailures: Failures = { label: 'Bar', names: { 404: 'BarNotFound', 503: 'BarsLoading' } }

async function get<T>(path: string, fallback: () => Promise<T>, failures: Failures, signal?: AbortSignal): Promise<T> {
  if (useMock && !navigator.serviceWorker?.controller) return fallback()

  const res = await fetch(`${baseUrl}${path}`, { signal })

  if (useMock && res.status === 404) return fallback()

  if (!res.ok) {
    const body: ApiError | null = await res.json().catch(() => null)
    const err = new Error(body?.error ?? `${failures.label} failed (${res.status})`)
    const name = failures.names[res.status]
    if (name) err.name = name
    throw err
  }
  return res.json()
}

export function searchBars(q: string, signal?: AbortSignal) {
  const params = new URLSearchParams({ q })
  if (venue) params.set('venue', venue)
  return get(`/api/search?${params}`, () => inPageMock(async () => (await import('../mocks/search')).mockSearch(q), signal), searchFailures, signal)
}

export function moreBars(searchId: string, page: number, signal?: AbortSignal) {
  const params = new URLSearchParams({ page: String(page) })
  return get(
    `/api/search/${encodeURIComponent(searchId)}/more?${params}`,
    () => inPageMock(async () => (await import('../mocks/search')).mockMore(searchId, page), signal),
    searchFailures,
    signal,
  )
}

export function fetchBars(signal?: AbortSignal) {
  return get<BarsResponse>(venue ? `/api/bars?venue=${venue}` : '/api/bars',() => inPageMock(async () => (await import('../mocks/bars')).mockBars(), signal), barsFailures, signal)
}

export function fetchBar(id: string, signal?: AbortSignal) {
  return get<Bar>(
    `/api/bars/${encodeURIComponent(id)}`,
    () => inPageMock(async () => (await import('../mocks/bars')).mockBar(id), signal),
    barFailures,
    signal,
  )
}
