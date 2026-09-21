import type { ApiError, SearchResponse } from './types'

const useMock = import.meta.env.VITE_USE_MOCK === 'true'
const baseUrl = useMock ? '' : (import.meta.env.VITE_API_URL ?? '').replace(/\/$/, '')

export async function searchBars(q: string, limit = 6, signal?: AbortSignal): Promise<SearchResponse> {
  const params = new URLSearchParams({ q, limit: String(limit) })
  const res = await fetch(`${baseUrl}/api/search?${params}`, { signal })

  if (!res.ok) {
    const body: ApiError | null = await res.json().catch(() => null)
    throw new Error(body?.error ?? `Search failed (${res.status})`)
  }
  return res.json()
}
