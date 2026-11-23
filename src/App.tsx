import { lazy, Suspense, useCallback, useEffect, useMemo, useRef, useState, type ComponentProps, type ComponentType, type FocusEvent } from 'react'
import { fetchBars, fetchLayers, moreBars, searchBars } from './api/client'
import type { Bar, Layer, MapBar } from './api/types'
import { initialLang, LangContext, strings } from './i18n'
import { initialLayer, LayerContext, rememberLayer } from './mode'
import { tick } from './haptic'
import { layerChips, topInView, type Bounds, type ChipKey } from './map/geo'
import Logo from './components/Logo'
import LayerSwitch from './components/LayerSwitch'
import SearchBar from './components/SearchBar'
import Suggestions from './components/Suggestions'
import BarList from './components/BarList'
import BarPreview from './components/BarPreview'
import Sheet, { type SheetHeight } from './components/Sheet'
import Chips from './components/Chips'
import ExploreList from './components/ExploreList'
import InstallHint from './components/InstallHint'
import { BackIcon, DownIcon, MapIcon, SearchIcon } from './components/icons'
import { useSheetHistory } from './sheetHistory'

type MapProps = ComponentProps<typeof import('./components/CityMap').default>

function MapUnavailable({ onFail }: MapProps) {
  useEffect(onFail, [onFail])
  return null
}

const CityMap = lazy<ComponentType<MapProps>>(() => import('./components/CityMap').catch(() => ({ default: MapUnavailable })))

type View = 'map' | 'search'

const NO_RESULTS: Bar[] = []
const VIEW_KEY = 'ou-view'
const BARS_RETRIES = 6
const BARS_RETRY_DELAY = 5000
const BARS_TIMEOUT = 10000
const QUIET_MS = 900
const LAYERS_RETRIES = 3
const lang = initialLang()
const desktop = '(min-width: 768px)'

function initialView(): View {
  try {
    return localStorage.getItem(VIEW_KEY) === 'search' ? 'search' : 'map'
  } catch {
    return 'map'
  }
}

export default function App() {
  const [layer, setLayer] = useState<Layer>(initialLayer)
  const [layers, setLayers] = useState<Layer[] | null>(null)
  const [moved, setMoved] = useState(0)
  const [value, setValue] = useState('')
  const [query, setQuery] = useState<string | null>(null)
  const [bars, setBars] = useState<Bar[]>([])
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [attempt, setAttempt] = useState(0)
  const [selectedId, setSelectedId] = useState<string | null>(null)
  const [highlightId, setHighlightId] = useState<string | null>(null)
  const [searchId, setSearchId] = useState<string | null>(null)
  const [page, setPage] = useState(0)
  const [hasMore, setHasMore] = useState(false)
  const [loadingMore, setLoadingMore] = useState(false)
  const [moreError, setMoreError] = useState<string | null>(null)
  const [view, setView] = useState<View>(initialView)
  const [mapUsed, setMapUsed] = useState(() => initialView() === 'map')
  const [mapEntries, setMapEntries] = useState(0)
  const [mapFailed, setMapFailed] = useState(false)
  const [suggesting, setSuggesting] = useState(false)
  const [mapBars, setMapBars] = useState<MapBar[]>([])
  const [barsState, setBarsState] = useState<'loading' | 'ready' | 'error'>('loading')
  const [barsAttempt, setBarsAttempt] = useState(0)
  const [barsWarming, setBarsWarming] = useState(false)
  const [bounds, setBounds] = useState<Bounds | null>(null)
  const [chips, setChips] = useState<ReadonlySet<ChipKey>>(() => new Set())
  const [sheet, setSheet] = useState<SheetHeight>('peek')
  const [placeOpened, setPlaceOpened] = useState(false)
  const [stray, setStray] = useState(false)
  const [area, setArea] = useState<Bounds | null>(null)
  const abortRef = useRef<AbortController | null>(null)
  const moreRef = useRef<AbortController | null>(null)
  const [reveal, setReveal] = useState<{ id: string; n: number } | null>(null)
  const returnFocus = useRef<string | null>(null)
  const quietUntil = useRef(0)
  const t = strings[layer][lang]
  const layerRef = useRef(layer)
  layerRef.current = layer
  const areaRef = useRef(area)
  areaRef.current = area
  const mode: View = mapFailed ? 'search' : view
  const shownMode = useRef(mode)

  useSheetHistory(sheet, () => setSheet('peek'))

  useEffect(() => {
    document.documentElement.lang = lang
  }, [])

  useEffect(() => {
    const ctrl = new AbortController()
    let tries = 0
    let timer = 0
    const load = () =>
      fetchLayers(ctrl.signal)
        .then((res) => setLayers(res.layers.filter((l) => l.available).map((l) => l.id)))
        .catch((err: Error) => {
          if (err.name === 'AbortError') return
          tries += 1
          if (tries < LAYERS_RETRIES) timer = window.setTimeout(load, BARS_RETRY_DELAY)
          else setLayers([])
        })
    load()
    return () => {
      window.clearTimeout(timer)
      ctrl.abort()
    }
  }, [])

  useEffect(() => {
    if (layers && layers.length > 0 && !layers.includes(layer)) setLayer('drink')
  }, [layers, layer])

  useEffect(() => {
    try {
      localStorage.setItem(VIEW_KEY, view)
    } catch {
      // storage unavailable, the choice just lasts for this visit
    }
  }, [view])

  useEffect(() => {
    document.documentElement.classList.toggle('locked', mode === 'map')
    if (shownMode.current === mode) return
    shownMode.current = mode
    window.scrollTo({ top: 0 })
    document.querySelector<HTMLElement>(`[data-view="${mode}"] h1`)?.focus({ preventScroll: true })
  }, [mode])

  useEffect(() => {
    const ctrl = new AbortController()
    let tries = 0
    let timer = 0
    const retry = () => {
      setBarsWarming(true)
      if (tries >= BARS_RETRIES) {
        setBarsState('error')
        return
      }
      tries += 1
      timer = window.setTimeout(load, BARS_RETRY_DELAY)
    }
    const load = () => {
      const attemptCtrl = new AbortController()
      let timedOut = false
      const abort = () => attemptCtrl.abort()
      const limit = window.setTimeout(() => {
        timedOut = true
        abort()
      }, BARS_TIMEOUT)
      ctrl.signal.addEventListener('abort', abort)
      fetchBars(layer, attemptCtrl.signal)
        .then((res) => {
          if (res.bars.length === 0) return retry()
          setMapBars(res.bars)
          setBarsWarming(false)
          setBarsState('ready')
        })
        .catch((err: Error) => {
          if (err.name !== 'AbortError' || timedOut) retry()
        })
        .finally(() => {
          window.clearTimeout(limit)
          ctrl.signal.removeEventListener('abort', abort)
        })
    }
    setBarsState('loading')
    setBarsWarming(false)
    load()
    return () => {
      window.clearTimeout(timer)
      ctrl.abort()
    }
  }, [barsAttempt, layer])

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

    searchBars(query, layerRef.current, areaRef.current, ctrl.signal)
      .then((res) => {
        if (res.meta.layerSwitched && res.layer) {
          applyLayer(res.layer)
          setMoved((n) => n + 1)
        }
        setBars(res.results)
        setSearchId(res.searchId)
        setHasMore(res.hasMore)
        setLoading(false)
      })
      .catch((err: Error) => {
        if (err.name === 'AbortError' && !timedOut) return
        setError(timedOut ? strings[layerRef.current][lang].timeout : err.message)
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
    setArea(null)
    setSuggesting(false)
    setAttempt((n) => n + 1)
    setSelectedId(null)
    setHighlightId(null)
    setReveal(null)
    setSheet('half')
    ;(document.activeElement as HTMLElement | null)?.blur()
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
        const fresh = await searchBars(query, layer, area, ctrl.signal)
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
    setArea(null)
    setStray(false)
    setValue('')
    setBars([])
    setError(null)
    setLoading(false)
    setSelectedId(null)
    setHighlightId(null)
    setReveal(null)
    setSheet('peek')
    window.scrollTo({ top: 0 })
  }

  function searchHere() {
    if (!bounds || query === null) return
    setArea(bounds)
    setStray(false)
    setSelectedId(null)
    setHighlightId(null)
    setReveal(null)
    setAttempt((n) => n + 1)
  }

  function applyLayer(next: Layer) {
    setLayer(next)
    setChips((prev) => new Set([...prev].filter((c) => layerChips[next].includes(c))))
  }

  function chooseLayer(next: Layer) {
    if (next === layer) return
    rememberLayer(next)
    applyLayer(next)
    setSelectedId(null)
    setHighlightId(null)
    setReveal(null)
    if (query !== null) setAttempt((n) => n + 1)
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

  const follow = useCallback((id: string) => {
    if (performance.now() >= quietUntil.current) setHighlightId(id)
  }, [])

  function choose(id: string) {
    quietUntil.current = performance.now() + QUIET_MS
    setHighlightId(null)
    setSelectedId(id)
    setPlaceOpened(true)
    tick()
  }

  function pickFromMap(id: string) {
    const inResults = hasResults && results.some((b) => b.id === id)
    setReveal((r) => (inResults ? { id, n: (r?.n ?? 0) + 1 } : null))
    choose(id)
    setSheet((h) => (h === 'peek' || query === null ? 'half' : h))
  }

  function pickFromList(id: string) {
    setReveal(null)
    choose(id)
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
    if (!id) return
    const row = document.querySelector<HTMLElement>(`.sheet [data-id="${CSS.escape(id)}"]`)
    ;(row ?? document.querySelector<HTMLElement>('.sheet'))?.focus({ preventScroll: true })
  }, [previewId])

  function topFocus(e: FocusEvent<HTMLElement>) {
    if ((e.target as HTMLElement).matches('.search-input')) setSuggesting(true)
    if (sheet !== 'full' || window.matchMedia(desktop).matches) return
    if (!(e.target as HTMLElement).matches(':focus-visible')) return
    if ((e.target as HTMLElement).closest('.search')) return
    setSheet('half')
  }

  function back() {
    returnFocus.current = previewId
    setSelectedId(null)
  }

  function showSearch() {
    setView('search')
  }

  function showMap() {
    setView('map')
    setMapUsed(true)
    if (hasResults) setMapEntries((n) => n + 1)
  }

  const heading = <h1 className="visually-hidden" tabIndex={-1}>où, {t.tagline}</h1>
  const offered = layers && layers.length > 0 ? layers : [layer]
  const layerSwitch = <LayerSwitch layer={layer} layers={offered} moved={moved} onChange={chooseLayer} />
  const searchBar = (onHome: () => void, homeLabel: string) => (
    <SearchBar value={value} submitted={query} loading={loading} onChange={setValue} onSubmit={search} onHome={onHome} homeLabel={homeLabel}>
      {layerSwitch}
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
      onFirst={pick && follow}
    />
  )

  const stage = mapUsed && !mapFailed && (
    <main className="stage" data-view="map" hidden={mode !== 'map'} onPointerDown={() => setSuggesting(false)} data-sheet={sheet} data-mode={query === null ? 'explore' : 'results'}>
      {heading}
      <div className="top" onFocusCapture={topFocus} onPointerDown={(e) => e.stopPropagation()}>
        {searchBar(showSearch, t.classicSearch)}
        <Chips value={chips} onToggle={toggleChip} />
        {query === null && suggesting && <Suggestions single onPick={search} />}
        {query !== null && stray && !loading && (
          <button type="button" className="search-here" onClick={searchHere}>
            <SearchIcon />
            {t.searchHere}
          </button>
        )}
      </div>
      <Suspense fallback={null}>
        <CityMap
          bars={mapBars}
          results={results}
          chips={chips}
          selectedId={selectedId}
          highlightId={highlightId}
          active={mode === 'map'}
          fitKey={hasResults && !area ? `${attempt}:${mapEntries}` : ''}
          anchorKey={query !== null && !loading ? `${attempt}` : ''}
          onStray={setStray}
          onSelect={pickFromMap}
          onBounds={setBounds}
          onFail={() => setMapFailed(true)}
          padKey={`${sheet}:${query === null}`}
        />
      </Suspense>
      {sheet !== 'peek' && (
        <button type="button" className="sheet-down" onClick={() => setSheet('peek')} aria-label={t.backToMap}>
          <DownIcon />
        </button>
      )}
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
              warming={barsWarming}
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
  )

  const classic = mode === 'search' && (
    <main className="app" data-view="search">
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
      <div className={mapFailed ? 'content' : 'content app-fab'}>
        {query === null ? (
          <section className="start">
            <div className="start-corner">{layerSwitch}</div>
            <div className="start-hero">
              <p className="eyebrow">{t.eyebrow}</p>
              <h1 className="start-title" tabIndex={-1}>
                <Logo size="var(--text-hero)" /> ?
              </h1>
              <p className="start-text">{t.tagline}</p>
              <SearchBar value={value} submitted={query} loading={loading} onChange={setValue} onSubmit={search} onHome={home} homeLabel={t.startOver} />
            </div>
            <Suggestions onPick={search} />
          </section>
        ) : (
          <>
            {heading}
            {searchBar(home, t.startOver)}
            {barList()}
            <p className="credit">{t.credit}</p>
          </>
        )}
      </div>
      {!mapFailed && (
        <button type="button" className="map-fab" onClick={showMap} aria-label={t.showMap}>
          <MapIcon />
        </button>
      )}
    </main>
  )

  return (
    <LangContext.Provider value={lang}>
      <LayerContext.Provider value={layer}>
        {stage}
        {classic}
        <InstallHint placeOpened={placeOpened} />
      </LayerContext.Provider>
    </LangContext.Provider>
  )
}
