import { lazy, Suspense, useEffect, useRef, useState } from 'react'
import { moreBars, searchBars } from './api/client'
import type { Bar } from './api/types'
import { initialLang, LangContext, strings, type Lang } from './i18n'
import Logo from './components/Logo'
import LangSwitch from './components/LangSwitch'
import SearchBar from './components/SearchBar'
import Suggestions from './components/Suggestions'
import BarList from './components/BarList'
import MiniMap from './components/MiniMap'

const MapView = lazy(() => import('./components/MapView'))

export default function App() {
  const [lang, setLang] = useState<Lang>(initialLang)
  const [value, setValue] = useState('')
  const [query, setQuery] = useState<string | null>(null)
  const [bars, setBars] = useState<Bar[]>([])
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [attempt, setAttempt] = useState(0)
  const [mapOpen, setMapOpen] = useState(false)
  const [selectedId, setSelectedId] = useState('')
  const [searchId, setSearchId] = useState<string | null>(null)
  const [page, setPage] = useState(0)
  const [hasMore, setHasMore] = useState(false)
  const [loadingMore, setLoadingMore] = useState(false)
  const [moreError, setMoreError] = useState<string | null>(null)
  const abortRef = useRef<AbortController | null>(null)
  const moreRef = useRef<AbortController | null>(null)
  const t = strings[lang]

  useEffect(() => {
    document.documentElement.lang = lang
    try {
      localStorage.setItem('ou-lang', lang)
    } catch {
      // storage unavailable, the choice just lasts for this visit
    }
  }, [lang])

  useEffect(() => {
    if (query === null) return
    abortRef.current?.abort()
    const ctrl = new AbortController()
    abortRef.current = ctrl
    let timedOut = false
    const timer = setTimeout(() => {
      timedOut = true
      ctrl.abort()
    }, 15000)
    moreRef.current?.abort()
    setLoading(true)
    setError(null)
    setSearchId(null)
    setPage(0)
    setHasMore(false)
    setLoadingMore(false)
    setMoreError(null)

    const minWait = new Promise((resolve) => setTimeout(resolve, 1200))
    Promise.all([searchBars(query, ctrl.signal), minWait])
      .then(([res]) => {
        setBars(res.results)
        setSearchId(res.searchId)
        setHasMore(res.hasMore)
        setSelectedId(res.results[0]?.id ?? '')
        setLoading(false)
      })
      .catch((err: Error) => {
        if (err.name === 'AbortError' && !timedOut) return
        setError(timedOut ? strings[lang].timeout : err.message)
        setLoading(false)
      })
      .finally(() => clearTimeout(timer))

    return () => {
      clearTimeout(timer)
      ctrl.abort()
    }
  }, [query, attempt])

  function search(q: string) {
    const trimmed = q.trim()
    if (!trimmed) return
    setMapOpen(false)
    setValue(trimmed)
    setQuery(trimmed)
    setAttempt((n) => n + 1)
    window.scrollTo({ top: 0 })
  }

  async function loadMore() {
    if (loadingMore || !hasMore || !searchId || query === null) return
    const next = page + 1
    if (next > 30) {
      setHasMore(false)
      return
    }
    const ctrl = new AbortController()
    moreRef.current = ctrl
    setLoadingMore(true)
    setMoreError(null)
    try {
      let res
      try {
        res = await moreBars(searchId, next, ctrl.signal)
      } catch (err) {
        if ((err as Error).name !== 'SearchExpired') throw err
        const fresh = await searchBars(query, ctrl.signal)
        setSearchId(fresh.searchId)
        res = await moreBars(fresh.searchId, next, ctrl.signal)
      }
      const results = res.results
      setBars((prev) => {
        const seen = new Set(prev.map((b) => b.id))
        return [...prev, ...results.filter((b) => !seen.has(b.id))]
      })
      setPage(next)
      setHasMore(res.hasMore && next < 30)
      setLoadingMore(false)
    } catch (err) {
      if ((err as Error).name === 'AbortError') return
      setMoreError((err as Error).message)
      setLoadingMore(false)
    }
  }

  function home() {
    abortRef.current?.abort()
    moreRef.current?.abort()
    setSearchId(null)
    setPage(0)
    setHasMore(false)
    setLoadingMore(false)
    setMoreError(null)
    setMapOpen(false)
    setQuery(null)
    setValue('')
    setBars([])
    setError(null)
    setLoading(false)
    window.scrollTo({ top: 0 })
  }

  const langSwitch = <LangSwitch lang={lang} onChange={setLang} />
  const hasResults = !loading && !error && bars.length > 0

  return (
    <LangContext.Provider value={lang}>
      <main className="app">
        <div className={query === null ? 'backdrop' : 'backdrop backdrop-map-on'} aria-hidden="true">
          <div className="backdrop-column">
            <img className="backdrop-map" src="/map-paris.jpg" alt="" />
            <span className="backdrop-veil" />
            <span className="glow" />
            <span className="glow" />
            <span className="glow" />
            <span className="glow" />
          </div>
        </div>
        <div className="content">
          {query === null ? (
            <section className="start">
              <div className="start-corner">{langSwitch}</div>
              <div className="start-hero">
                <p className="eyebrow">{t.eyebrow}</p>
                <h1 className="start-title">
                  <Logo size="var(--text-hero)" /> ?
                </h1>
                <p className="start-text">{t.tagline}</p>
                <SearchBar value={value} submitted={query} loading={loading} onChange={setValue} onSubmit={search} onHome={home} />
              </div>
              <Suggestions onPick={search} />
            </section>
          ) : (
            <>
              <SearchBar value={value} submitted={query} loading={loading} onChange={setValue} onSubmit={search} onHome={home}>
                {langSwitch}
              </SearchBar>
              <BarList
                bars={bars}
                loading={loading}
                error={error}
                onRetry={() => setAttempt((n) => n + 1)}
                hasMore={hasMore}
                loadingMore={loadingMore}
                moreError={moreError}
                onMore={loadMore}
              />
              <p className="credit">{t.credit}</p>
              {hasResults && !mapOpen && <MiniMap bars={bars} onOpen={() => setMapOpen(true)} />}
              {hasResults && mapOpen && (
                <Suspense fallback={null}>
                  <MapView bars={bars} selectedId={selectedId} onSelect={setSelectedId} onClose={() => setMapOpen(false)} />
                </Suspense>
              )}
            </>
          )}
        </div>
      </main>
    </LangContext.Provider>
  )
}
