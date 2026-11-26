import type { Bounds } from '../map/geo'
import type { Action, ApiError, Bar, BarsResponse, DaysResponse, EventsResponse, Layer, LayersResponse, PostsResponse, SearchResponse, SignalKind, SignalsResponse } from './types'

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
const layersFailures: Failures = { label: 'Layers', names: {} }
const eventsFailures: Failures = { label: 'Events', names: {} }
const postsFailures: Failures = { label: 'Posts', names: {} }
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

function bboxParam(b: Bounds) {
  return [b.minLng, b.minLat, b.maxLng, b.maxLat].map((n) => n.toFixed(5)).join(',')
}

export function searchBars(
  q: string,
  layer: Layer,
  bbox: Bounds | null,
  night: { from: string; to: string } | null,
  signal?: AbortSignal,
  near?: [number, number] | null,
) {
  const params = new URLSearchParams({ q, layer })
  if (bbox) params.set('bbox', bboxParam(bbox))
  // the device position, only used by the backend when the query asks for places near the user
  if (near) params.set('near', near.map((n) => n.toFixed(5)).join(','))
  if (night && night.from === night.to) params.set('date', night.from)
  else if (night) {
    params.set('from', night.from)
    params.set('to', night.to)
  }
  return get<SearchResponse>(
    `/api/search?${params}`,
    () =>
      inPageMock(async () => {
        const { mockSearch } = await import('../mocks/search')
        const box = bbox && ([bbox.minLng, bbox.minLat, bbox.maxLng, bbox.maxLat] as [number, number, number, number])
        return mockSearch(q, layer, box, 'bar', night)
      }, signal),
    searchFailures,
    signal,
  )
}

export function moreBars(searchId: string, page: number, signal?: AbortSignal) {
  const params = new URLSearchParams({ page: String(page) })
  return get<SearchResponse>(
    `/api/search/${encodeURIComponent(searchId)}/more?${params}`,
    () => inPageMock(async () => (await import('../mocks/search')).mockMore(searchId, page), signal),
    searchFailures,
    signal,
  )
}

export function fetchBars(layer: Layer, signal?: AbortSignal) {
  return get<BarsResponse>(`/api/bars?layer=${layer}`, () => inPageMock(async () => (await import('../mocks/bars')).mockBars(layer), signal), barsFailures, signal)
}

export function fetchLayers(signal?: AbortSignal) {
  return get<LayersResponse>('/api/layers', () => inPageMock(async () => (await import('../mocks/bars')).mockLayers(), signal), layersFailures, signal)
}

export function fetchPosts(ids: string[], signal?: AbortSignal) {
  return get<PostsResponse>(
    `/api/posts?ids=${ids.map(encodeURIComponent).join(',')}`,
    () => inPageMock(async () => (await import('../mocks/bars')).mockPosts(ids), signal),
    postsFailures,
    signal,
  )
}

export function fetchBar(id: string, signal?: AbortSignal) {
  return get<Bar>(
    `/api/bars/${encodeURIComponent(id)}`,
    () => inPageMock(async () => (await import('../mocks/bars')).mockBar(id), signal),
    barFailures,
    signal,
  )
}

export function fetchEvents(layer: Layer, from: string, to: string, signal?: AbortSignal) {
  const params = new URLSearchParams(from === to ? { layer, date: from } : { layer, from, to })
  return get<EventsResponse>(
    `/api/events?${params}`,
    () => inPageMock(async () => (await import('../mocks/events')).mockEvents(layer, from, to), signal),
    eventsFailures,
    signal,
  )
}

export function fetchDays(layer: Layer, from: string, to: string, signal?: AbortSignal) {
  const params = new URLSearchParams({ layer, from, to })
  return get<DaysResponse>(
    `/api/events/days?${params}`,
    () => inPageMock(async () => (await import('../mocks/events')).mockDays(layer, from, to), signal),
    eventsFailures,
    signal,
  )
}

export function actionHref(a: Action) {
  return a.url.startsWith('/') ? `${baseUrl}${a.url}` : a.url
}

// My places: the device cookie travels with these same-origin calls; the mock keeps them on the device.
// source: the bio link the device came in by, sent on the first open only
export async function fetchSignals(signal?: AbortSignal, source?: string): Promise<SignalsResponse> {
  if (useMock) return { signals: [] }
  const query = source ? `?src=${encodeURIComponent(source)}` : ''
  const res = await fetch(`${baseUrl}/api/signals${query}`, { signal, cache: 'no-store' })
  if (!res.ok) throw new Error(`Signals failed (${res.status})`)
  return res.json()
}

export async function putSignal(placeId: string, kind: SignalKind | null) {
  if (useMock) return
  const res = await fetch(`${baseUrl}/api/signals/${encodeURIComponent(placeId)}`, {
    method: 'PUT',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ kind }),
  })
  if (!res.ok && res.status !== 404) throw new Error(`Signal failed (${res.status})`)
}

export async function postReport(report: { placeId?: string; eventId?: string; message: string; context: Record<string, unknown> }) {
  if (useMock) return
  const res = await fetch(`${baseUrl}/api/reports`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(report),
  })
  if (!res.ok) {
    const body: ApiError | null = await res.json().catch(() => null)
    throw new Error(body?.error ?? `Report failed (${res.status})`)
  }
}

// The visible time of this page load, as a beacon: it leaves even while the page is closing.
export function sendSession(id: string, seconds: number) {
  if (useMock || !navigator.sendBeacon) return
  navigator.sendBeacon(`${baseUrl}/api/session`, new Blob([JSON.stringify({ id, seconds })], { type: 'application/json' }))
}
