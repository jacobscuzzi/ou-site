import { lazy, Suspense, useEffect, useMemo, useRef, useState, type ComponentProps, type ComponentType } from 'react'
import { fetchBars, moreBars, searchBars } from './api/client'
import type { Bar, MapBar } from './api/types'
import { initialLang, LangContext, strings, type Lang } from './i18n'
import { topInView, type Bounds, type ChipKey } from './map/geo'
import LangSwitch from './components/LangSwitch'
import SearchBar from './components/SearchBar'
import Suggestions from './components/Suggestions'
import BarList from './components/BarList'
import BarPreview from './components/BarPreview'
import Sheet, { type SheetHeight } from './components/Sheet'
import Chips from './components/Chips'
import ExploreList from './components/ExploreList'
import { BackIcon } from './components/icons'

type MapProps = ComponentProps<typeof import('./components/CityMap').default>

function MapUnavailable({ onFail }: MapProps) {
  useEffect(onFail, [onFail])
  return null
}

const CityMap = lazy<ComponentType<MapProps>>(() => import('./components/CityMap').catch(() => ({ default: MapUnavailable })))

const NO_RESULTS: Bar[] = []
const BARS_RETRIES = 6
const BARS_RETRY_DELAY = 5000

export default function App() {
  const [lang, setLang] = useState<Lang>(initialLang)
  const [value, setValue] = useState('')
  const [query, setQuery] = useState<string | null>(null)
  const [bars, setBars] = useState<Bar[]>([])
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [attempt, setAttempt] = useState(0)
  const [selectedId, setSelectedId] = useState<string | null>(null)
  const [searchId, setSearchId] = useState<string | null>(null)
  const [page, setPage] = useState(0)
  const [hasMore, setHasMore] = useState(false)
  const [loadingMore, setLoadingMore] = useState(false)
  const [moreError, setMoreError] = useState<string | null>(null)
  const [mapFailed, setMapFailed] = useState(false)
  const [mapBars, setMapBars] = useState<MapBar[]>([])
  const [barsState, setBarsState] = useState<'loading' | 'ready' | 'error'>('loading')
  const [barsAttempt, setBarsAttempt] = useState(0)
  const [bounds, setBounds] = useState<Bounds | null>(null)
  const [chips, setChips] = useState<ReadonlySet<ChipKey>>(() => new Set())
  const [sheet, setSheet] = useState<SheetHeight>('peek')
  const abortRef = useRef<AbortController | null>(null)
  const moreRef = useRef<AbortController | null>(null)
  const [reveal, setReveal] = useState<{ id: string; n: number } | null>(null)
  const returnFocus = useRef<string | null>(null)
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
    document.documentElement.classList.toggle('locked', !mapFailed)
  }, [mapFailed])

  useEffect(() => {
    if (mapFailed) return
    const ctrl = new AbortController()
    let tries = 0
    let timer = 0
    const retry = () => {
      if (tries >= BARS_RETRIES) {
        setBarsState('error')
        return
      }
      tries += 1
      timer = window.setTimeout(load, BARS_RETRY_DELAY)
    }
    const load = () => {
      fetchBars(ctrl.signal)
        .then((res) => {
          if (res.bars.length === 0) return retry()
          setMapBars(res.bars)
          setBarsState('ready')
        })
        .catch((err: Error) => {
          if (err.name !== 'AbortError') retry()
        })
    }
    setBarsState('loading')
    load()
    return () => {
      window.clearTimeout(timer)
      ctrl.abort()
    }
  }, [barsAttempt, mapFailed])

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

    searchBars(query, ctrl.signal)
      .then((res) => {
        setBars(res.results)
        setSearchId(res.searchId)
        setHasMore(res.hasMore)
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

  useEffect(() => {
    if (!reveal) return
    const card = document.querySelector<HTMLElement>(`.sheet [data-id="${CSS.escape(reveal.id)}"]`)
    const box = card?.closest<HTMLElement>('.sheet-content')
    if (!card || !box) return
    const top = box.scrollTop + card.getBoundingClientRect().top - box.getBoundingClientRect().top
    box.scrollTo({ top: Math.max(0, top), behavior: 'smooth' })
  }, [reveal])

  function search(q: string) {
    const trimmed = q.trim()
    if (!trimmed) return
    setValue(trimmed)
    setQuery(trimmed)
    setAttempt((n) => n + 1)
    setSelectedId(null)
    setReveal(null)
    setSheet('half')
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
    setQuery(null)
    setValue('')
    setBars([])
    setError(null)
    setLoading(false)
    setSelectedId(null)
    setReveal(null)
    setSheet('peek')
    window.scrollTo({ top: 0 })
  }

  function toggleChip(key: ChipKey) {
    setChips((prev) => {
      const next = new Set(prev)
      if (!next.delete(key)) next.add(key)
      return next
    })
  }

  const results = !loading && !error ? bars : NO_RESULTS
  const hasResults = results.length > 0

  function pickFromMap(id: string) {
    const inResults = hasResults && results.some((b) => b.id === id)
    setReveal((r) => (inResults ? { id, n: (r?.n ?? 0) + 1 } : null))
    setSelectedId(id)
    setSheet((h) => (h === 'peek' || query === null ? 'half' : h))
  }

  function pickFromList(id: string) {
    setReveal(null)
    setSelectedId(id)
    if (query === null) setSheet('half')
  }

  const top = useMemo(() => topInView(mapBars, bounds, chips), [mapBars, bounds, chips])
  const exploreState = barsState !== 'ready' ? barsState : top.length > 0 ? 'ready' : 'empty'
  const previewId = selectedId && (query === null || !results.some((b) => b.id === selectedId)) ? selectedId : null

  useEffect(() => {
    if (previewId) {
      document.querySelector<HTMLElement>('.sheet .back')?.focus({ preventScroll: true })
      return
    }
    const id = returnFocus.current
    returnFocus.current = null
    if (id) document.querySelector<HTMLElement>(`.sheet [data-id="${CSS.escape(id)}"]`)?.focus({ preventScroll: true })
  }, [previewId])

  function back() {
    returnFocus.current = previewId
    setSelectedId(null)
  }

  const heading = <h1 className="visually-hidden">où, {t.tagline}</h1>
  const langSwitch = <LangSwitch lang={lang} onChange={setLang} />
  const searchBar = (
    <SearchBar value={value} submitted={query} loading={loading} onChange={setValue} onSubmit={search} onHome={home}>
      {langSwitch}
    </SearchBar>
  )
  const barList = (pick?: (id: string) => void) => (
    <BarList
      bars={bars}
      loading={loading}
      error={error}
      onRetry={() => setAttempt((n) => n + 1)}
      hasMore={hasMore}
      loadingMore={loadingMore}
      moreError={moreError}
      onMore={loadMore}
      selectedId={pick ? selectedId : null}
      onSelect={pick}
    />
  )

  if (mapFailed) {
    return (
      <LangContext.Provider value={lang}>
        <main className="app">
          {heading}
          {searchBar}
          {query === null ? (
            <section className="start">
              <p className="start-text" aria-hidden="true">
                {t.tagline}
              </p>
              <Suggestions onPick={search} />
            </section>
          ) : (
            <>
              {barList()}
              <p className="credit">{t.credit}</p>
            </>
          )}
        </main>
      </LangContext.Provider>
    )
  }

  return (
    <LangContext.Provider value={lang}>
      <main className="stage" data-sheet={sheet} data-mode={query === null ? 'explore' : 'results'}>
        {heading}
        <div className="top">
          {searchBar}
          <Chips value={chips} onToggle={toggleChip} />
          {query === null && <Suggestions single onPick={search} />}
        </div>
        <Suspense fallback={null}>
          <CityMap
            bars={mapBars}
            results={results}
            chips={chips}
            selectedId={selectedId}
            fitKey={hasResults ? String(attempt) : ''}
            onSelect={pickFromMap}
            onBounds={setBounds}
            onFail={() => setMapFailed(true)}
            padKey={`${sheet}:${query === null}`}
          />
        </Suspense>
        <Sheet
          height={sheet}
          onHeight={setSheet}
          scrollKey={`${query ?? ''}:${attempt}:${previewId ?? ''}`}
          header={
            previewId && (
              <button type="button" className="back" onClick={back}>
                <BackIcon />
                {t.back}
              </button>
            )
          }
        >
          {previewId ? (
            <div className="pane">
              <BarPreview key={previewId} id={previewId} />
            </div>
          ) : query === null ? (
            <div className="pane">
              <ExploreList
                bars={top}
                state={exploreState}
                selectedId={selectedId}
                onSelect={pickFromList}
                onRetry={() => setBarsAttempt((n) => n + 1)}
              />
            </div>
          ) : (
            barList(pickFromList)
          )}
          <p className="credit">{t.credit}</p>
        </Sheet>
      </main>
    </LangContext.Provider>
  )
}
