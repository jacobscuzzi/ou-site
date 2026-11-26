import { lazy, Suspense, useCallback, useEffect, useMemo, useRef, useState, type ComponentProps, type ComponentType, type FocusEvent } from 'react'
import { fetchBars, fetchDays, fetchEvents, fetchLayers, fetchPosts, moreBars, searchBars } from './api/client'
import type { Bar, Event, Layer, MapBar, Post } from './api/types'
import { initialLang, LangContext, strings } from './i18n'
import { initialLayer, LayerContext, modeWanted, rememberLayer } from './mode'
import { tick } from './haptic'
import { layerChips, topInView, withChip, type Bounds, type ChipKey } from './map/geo'
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
import DayStrip from './components/DayStrip'
import EventCard from './components/EventCard'
import MonthSheet from './components/MonthSheet'
import EventList from './components/EventList'
import Intro, { introWanted } from './components/Intro'
import ModeChoice from './components/ModeChoice'
import PhotoViewer from './components/PhotoViewer'
import AgendaSheet from './components/AgendaSheet'
import FocusToggle from './components/FocusToggle'
import MyPlaces from './components/MyPlaces'
import ReportSheet from './components/ReportSheet'
import { idsOf, syncMarks, useMarks } from './signals'
import { onOpenReport, onToast, toast } from './toast'
import { askHere, freshHere } from './here'
import { DEAL_WORDS, DealsContext } from './deals'
import { HeartIcon } from './components/icons'
import { onOpenPhotos } from './photos'
import { onTagSearch } from './tags'
import { useTheme } from './theme'
import { initialDate, longDay, nights, sameNight, shortDate, STRIP_DAYS, tonight, weekend, writeDate, type Night } from './night'
import { BackIcon, CalendarIcon, DownIcon, MapIcon, SearchIcon } from './components/icons'
import { useSheetHistory } from './sheetHistory'

type MapProps = ComponentProps<typeof import('./components/CityMap').default>

function MapUnavailable({ onFail }: MapProps) {
  useEffect(onFail, [onFail])
  return null
}

// started at load, not at first render, so the map chunk downloads alongside the app
const cityMap = import('./components/CityMap').catch(() => ({ default: MapUnavailable }))
const CityMap = lazy<ComponentType<MapProps>>(() => cityMap)

type View = 'map' | 'search'

const one = (day: string): Night => ({ from: day, to: day })
// Nights and the day calendar belong to the dance layer only.
const nightLayer = (l: Layer) => l === 'dance'

const NO_RESULTS: Bar[] = []
const BARS_RETRIES = 6
const BARS_RETRY_DELAY = 5000
const BARS_TIMEOUT = 10000
const QUIET_MS = 900
const LAYERS_RETRIES = 2
const LAYERS_RETRY_DELAY = 1500
const LAYERS_TIMEOUT = 5000
const lang = initialLang()
const desktop = '(min-width: 768px)'

export default function App() {
  const [start] = useState(initialLayer)
  const [intro, setIntro] = useState(introWanted)
  const [asking, setAsking] = useState(modeWanted)
  const [mapLive, setMapLive] = useState(false)
  const [agendaOpen, setAgendaOpen] = useState(false)
  const [dealsOn, setDealsOn] = useState(false)
  const [mineOpen, setMineOpen] = useState(false)
  const [report, setReport] = useState<Parameters<Parameters<typeof onOpenReport>[0]>[0] | null>(null)
  const [toastText, setToastText] = useState<string | null>(null)
  const marks = useMarks()
  const [pendingShow, setPendingShow] = useState<string | null>(null)
  const theme = useTheme()
  const [viewer, setViewer] = useState<{ photos: string[]; index: number; title: string } | null>(null)
  const [layer, setLayer] = useState<Layer>(start.layer)
  const [layers, setLayers] = useState<Layer[] | null>(null)
  const [moved, setMoved] = useState(0)
  const [value, setValue] = useState('')
  const [query, setQuery] = useState<string | null>(null)
  const [bars, setBars] = useState<Bar[]>([])
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [attempt, setAttempt] = useState(0)
  const askedHere = useRef<string | null>(null) // the query a location prompt was already shown for
  const [selectedId, setSelectedId] = useState<string | null>(null)
  const [highlightId, setHighlightId] = useState<string | null>(null)
  const [searchId, setSearchId] = useState<string | null>(null)
  const [page, setPage] = useState(0)
  const [hasMore, setHasMore] = useState(false)
  const [loadingMore, setLoadingMore] = useState(false)
  const [moreError, setMoreError] = useState<string | null>(null)
  const [view, setView] = useState<View>('map')
  const [mapUsed, setMapUsed] = useState(true)
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
  const [asked] = useState(initialDate)
  const [night, setNight] = useState<Night | null>(() => (start.layer === 'dance' ? one(asked ?? tonight()) : null))
  const nightRef = useRef(night)
  nightRef.current = night
  const [counts, setCounts] = useState<Record<string, number> | null>(null)
  const [nightEvents, setNightEvents] = useState<Event[]>([])
  const [nightPlaces, setNightPlaces] = useState<MapBar[]>([])
  const [tonightEvents, setTonightEvents] = useState<Event[]>([])
  const [eventView, setEventView] = useState<Event | null>(null)
  // TikToks of the places the explore list shows (the map entries carry none), kept per place
  const [rowPosts, setRowPosts] = useState<ReadonlyMap<string, Post[]>>(() => new Map())
  const [eventsState, setEventsState] = useState<'loading' | 'ready' | 'error'>('loading')
  const [eventsAttempt, setEventsAttempt] = useState(0)
  const [monthOpen, setMonthOpen] = useState(false)
  const stripStart = tonight()
  const abortRef = useRef<AbortController | null>(null)
  const moreRef = useRef<AbortController | null>(null)
  const [reveal, setReveal] = useState<{ id: string; n: number } | null>(null)
  const returnFocus = useRef<string | null>(null)
  const quietUntil = useRef(0)
  const t = strings[layer][lang]
  const ready = layers !== null
  const layerRef = useRef(layer)
  layerRef.current = layer
  const areaRef = useRef(area)
  areaRef.current = area
  const mode: View = mapFailed ? 'search' : view
  const shownMode = useRef(mode)

  useSheetHistory(sheet, mode === 'map', () => setSheet('peek'))

  useEffect(() => {
    document.documentElement.lang = lang
  }, [])

  useEffect(() => onOpenPhotos(setViewer), [])
  useEffect(() => onOpenReport(setReport), [])
  useEffect(() => {
    const ctrl = new AbortController()
    syncMarks(ctrl.signal).catch(() => undefined)
    return () => ctrl.abort()
  }, [])
  useEffect(() => {
    let timer = 0
    const off = onToast((text) => {
      setToastText(text)
      window.clearTimeout(timer)
      timer = window.setTimeout(() => setToastText(null), 2600)
    })
    return () => {
      off()
      window.clearTimeout(timer)
    }
  }, [])

  const tagSearch = useRef<(label: string) => void>(() => undefined)
  useEffect(() => onTagSearch((label) => tagSearch.current(label)), [])

  useEffect(() => {
    const ctrl = new AbortController()
    const fallback: Layer[] = start.asked && start.layer !== 'drink' ? ['drink', start.layer] : ['drink']
    let tries = 0
    let timer = 0
    const settle = (list: Layer[]) => {
      const offered = list.length > 0 ? list : fallback
      setLayers(offered)
      if (!offered.includes(layerRef.current)) applyLayer('drink')
    }
    const load = () => {
      const attemptCtrl = new AbortController()
      const abort = () => attemptCtrl.abort()
      const limit = window.setTimeout(abort, LAYERS_TIMEOUT)
      ctrl.signal.addEventListener('abort', abort)
      fetchLayers(attemptCtrl.signal)
        .then((res) => !ctrl.signal.aborted && settle(res.layers.filter((l) => l.available).map((l) => l.id)))
        .catch(() => {
          if (ctrl.signal.aborted) return
          tries += 1
          if (tries < LAYERS_RETRIES) timer = window.setTimeout(load, LAYERS_RETRY_DELAY)
          else settle([])
        })
        .finally(() => {
          window.clearTimeout(limit)
          ctrl.signal.removeEventListener('abort', abort)
        })
    }
    load()
    return () => {
      window.clearTimeout(timer)
      ctrl.abort()
    }
  }, [])

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
    if (!ready) return
    load()
    return () => {
      window.clearTimeout(timer)
      ctrl.abort()
    }
  }, [barsAttempt, layer, ready])

  useEffect(() => {
    if (query === null) return
    if (!ready) {
      setLoading(true)
      return
    }
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

    searchBars(query, layerRef.current, areaRef.current, pickedNight(), ctrl.signal, freshHere())
      .then((res) => {
        // "near me" without a position: ask for it once per query, then search again with it
        if (res.meta.needsLocation && askedHere.current !== query) {
          askedHere.current = query
          void askHere().then((at) => {
            if (at) setAttempt((n) => n + 1)
            else toast(strings[layerRef.current][lang].locationNeeded)
          })
        }
        if (res.meta.layerSwitched && res.layer) {
          applyLayer(res.layer)
          setMoved((n) => n + 1)
        }
        const range = res.meta.dateRange
        const searched = res.layer ?? layerRef.current
        if (range && searched === 'dance') setNight(one(range.from))
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
  }, [query, attempt, ready])

  useEffect(() => {
    if (!ready || layer !== 'dance') return
    const ctrl = new AbortController()
    fetchDays('dance', stripStart, nights(stripStart, STRIP_DAYS)[STRIP_DAYS - 1], ctrl.signal)
      .then((res) => setCounts(Object.fromEntries(res.days.map((d) => [d.date, d.count]))))
      .catch(() => undefined)
    return () => ctrl.abort()
  }, [layer, ready, stripStart])

  useEffect(() => {
    if (!ready || !night || !nightLayer(layer)) return
    const ctrl = new AbortController()
    setEventsState('loading')
    fetchEvents(layer, night.from, night.to, ctrl.signal)
      .then((res) => {
        setNightEvents(res.events)
        setNightPlaces(res.places ?? [])
        setEventsState('ready')
      })
      .catch((err: Error) => {
        if (err.name !== 'AbortError') setEventsState('error')
      })
    return () => ctrl.abort()
  }, [layer, night?.from, night?.to, ready, eventsAttempt])

  // Drink has no night picker: a bar with a party tonight only gets a badge and a line.
  useEffect(() => {
    if (!ready || layer !== 'drink') return
    const ctrl = new AbortController()
    const day = tonight()
    fetchEvents('dance', day, day, ctrl.signal)
      .then((res) => setTonightEvents(res.events))
      .catch(() => undefined)
    return () => ctrl.abort()
  }, [layer, ready])

  useEffect(() => {
    if (layer === 'dance') writeDate(night && night.from === night.to && night.from !== tonight() ? night.from : null)
  }, [layer, night])

  useEffect(() => {
    if (!reveal) return
    const card = document.querySelector<HTMLElement>(`.sheet [data-id="${CSS.escape(reveal.id)}"]`)
    const box = card?.closest<HTMLElement>('.sheet-content')
    if (!card || !box) return
    const top = box.scrollTop + card.getBoundingClientRect().top - box.getBoundingClientRect().top
    box.scrollTo({ top: Math.max(0, top), behavior: 'smooth' })
  }, [reveal])

  // A night the user picked goes with the search; the default night (tonight in dance) does not,
  // so a day named in the query still moves the picker.
  function pickedNight(): Night | null {
    const n = nightRef.current
    if (!n || !nightLayer(layerRef.current)) return null
    return layerRef.current === 'dance' && sameNight(n, one(tonight())) ? null : n
  }

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
        const fresh = await searchBars(query, layer, area, pickedNight(), ctrl.signal, freshHere())
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

  // a tapped tag: the same search, kept to the part of the map in view
  tagSearch.current = (label: string) => {
    search(label)
    if (bounds && mode === 'map') setArea(bounds)
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
    setDealsOn(false)
    setEventView(null)
    setNight((n) => (next === 'dance' ? (n && n.from === n.to ? n : one(asked ?? tonight())) : null))
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
    setChips((prev) => withChip(prev, key))
  }

  // this device's dislikes sink to the end of its own results, they are not removed
  const results = useMemo(() => {
    if (loading || error) return NO_RESULTS
    const nope = idsOf(marks, 'dislike')
    if (nope.size === 0 || !bars.some((b) => nope.has(b.id))) return bars
    return [...bars.filter((b) => !nope.has(b.id)), ...bars.filter((b) => nope.has(b.id))]
  }, [loading, error, bars, marks])
  const hasResults = results.length > 0

  const follow = useCallback((id: string) => {
    if (performance.now() >= quietUntil.current) setHighlightId(id)
  }, [])

  function choose(id: string) {
    quietUntil.current = performance.now() + QUIET_MS
    setEventView(null)
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

  const dealsShown = dealsOn && query === null
  const dealIds = useMemo(() => (dealsShown ? new Set(mapBars.filter((b) => b.deal).map((b) => b.id)) : null), [dealsShown, mapBars])
  const noDealIds = useMemo(() => (dealIds ? new Set(mapBars.filter((b) => !dealIds.has(b.id)).map((b) => b.id)) : null), [dealIds, mapBars])
  const top = useMemo(
    () => topInView(dealIds ? mapBars.filter((b) => dealIds.has(b.id)) : mapBars, bounds, chips),
    [mapBars, bounds, chips, dealIds],
  )
  const hasEvents = layer !== 'dance' || (counts !== null && Object.values(counts).some((n) => n > 0))
  const showNight = night !== null && nightLayer(layer) && hasEvents
  const nightIds = useMemo(
    () => (showNight && eventsState === 'ready' ? new Set(nightEvents.map((e) => e.placeId)) : null),
    [showNight, eventsState, nightEvents],
  )
  // On a night of the dance layer the map also shows the bars outside the layer that have a party.
  const shownBars = useMemo(() => {
    if (!nightIds || nightPlaces.length === 0) return mapBars
    const known = new Set(mapBars.map((b) => b.id))
    const extra = nightPlaces.filter((b) => !known.has(b.id))
    return extra.length > 0 ? [...mapBars, ...extra] : mapBars
  }, [mapBars, nightIds, nightPlaces])
  const tonightOf = useMemo(() => {
    const byPlace = new Map<string, Event>()
    if (layer === 'drink') for (const e of tonightEvents) if (!byPlace.has(e.placeId)) byPlace.set(e.placeId, e)
    return byPlace
  }, [layer, tonightEvents])
  const badgeIds = useMemo(() => (tonightOf.size > 0 ? new Set(tonightOf.keys()) : null), [tonightOf])
  const kindsOf = (id: string) => shownBars.find((b) => b.id === id)?.kinds ?? []
  const markMap = useMemo(() => new Map(Object.entries(marks).map(([id, m]) => [id, m.kind])), [marks])
  // liked and want-to-go places are at least circles, disliked ones stay dots
  const boostIds = useMemo(() => {
    const base = dealIds ?? nightIds
    const mine = [...idsOf(marks, 'like'), ...idsOf(marks, 'want')]
    return mine.length === 0 ? base : new Set([...(base ?? []), ...mine])
  }, [dealIds, nightIds, marks])
  const sinkIds = useMemo(() => {
    const nope = idsOf(marks, 'dislike')
    return nope.size === 0 ? noDealIds : new Set([...(noDealIds ?? []), ...nope])
  }, [noDealIds, marks])
  // while searching only the results carry the ring of their party
  const ringIds = useMemo(
    () => (hasResults && nightIds ? new Set(results.filter((b) => nightIds.has(b.id)).map((b) => b.id)) : nightIds),
    [hasResults, nightIds, results],
  )

  useEffect(() => {
    if (!pendingShow || !shownBars.some((b) => b.id === pendingShow)) return
    setPendingShow(null)
    pickFromMap(pendingShow)
  }, [pendingShow, shownBars])

  const missingPosts = top
    .map((b) => b.id)
    .filter((id) => !rowPosts.has(id))
    .slice(0, 30)
    .join(',')
  useEffect(() => {
    if (!missingPosts) return
    const ids = missingPosts.split(',')
    const ctrl = new AbortController()
    const timer = setTimeout(() => {
      fetchPosts(ids, ctrl.signal)
        .then((res) =>
          setRowPosts((prev) => {
            const next = new Map(prev)
            for (const id of ids) next.set(id, res.posts[id] ?? [])
            return next
          }),
        )
        .catch(() => undefined)
    }, 300)
    return () => {
      clearTimeout(timer)
      ctrl.abort()
    }
  }, [missingPosts])

  function openEvent(e: Event) {
    quietUntil.current = performance.now() + QUIET_MS
    setHighlightId(null)
    setSelectedId(e.placeId)
    setEventView(e)
    setSheet((h) => (h === 'peek' ? 'half' : h))
  }
  const stripDays = useMemo(() => {
    const days = nights(stripStart, STRIP_DAYS)
    return night && night.from === night.to && !days.includes(night.from) && night.from > stripStart ? [...days, night.from] : days
  }, [stripStart, night])

  function nightTitle() {
    if (!night) return ''
    const when =
      night.from === night.to
        ? night.from === tonight()
          ? t.whenTonight
          : t.whenOn(longDay(night.from, lang))
        : sameNight(night, weekend())
          ? t.whenWeekend
          : `${shortDate(night.from, lang)} – ${shortDate(night.to, lang)}`
    return eventsState === 'ready' ? t.eventsTitle(when, nightEvents.length) : when.charAt(0).toUpperCase() + when.slice(1)
  }

  function pickNight(n: Night | null) {
    setNight(n)
    setSelectedId(null)
    setHighlightId(null)
  }

  function closeMonth() {
    setMonthOpen(false)
    document.querySelector<HTMLElement>('.strip-cal')?.focus({ preventScroll: true })
  }
  const exploreState = barsState !== 'ready' ? barsState : top.length > 0 ? 'ready' : 'empty'
  const previewId = selectedId && (query === null || !results.some((b) => b.id === selectedId)) ? selectedId : null

  useEffect(() => {
    if (previewId || eventView) {
      document.querySelector<HTMLElement>('.sheet .back')?.focus({ preventScroll: true })
      return
    }
    const id = returnFocus.current
    returnFocus.current = null
    if (!id) return
    const row = document.querySelector<HTMLElement>(`.sheet [data-id="${CSS.escape(id)}"]`)
    ;(row ?? document.querySelector<HTMLElement>('.sheet'))?.focus({ preventScroll: true })
  }, [previewId, eventView])

  function topFocus(e: FocusEvent<HTMLElement>) {
    if ((e.target as HTMLElement).matches('.search-input')) setSuggesting(true)
    if (sheet !== 'full' || window.matchMedia(desktop).matches) return
    if (!(e.target as HTMLElement).matches(':focus-visible')) return
    if ((e.target as HTMLElement).closest('.search')) return
    setSheet('half')
  }

  function back() {
    returnFocus.current = eventView?.placeId ?? previewId
    setEventView(null)
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
  const offered = layers ?? [layer]
  const tonightCount = counts?.[stripStart] ?? 0
  const layerSwitch = (
    <>
      {layer === 'dance' && hasEvents && (
        <button type="button" className="agenda-fab" aria-label={t.agendaOpen(tonightCount)} onClick={() => setAgendaOpen(true)}>
          {tonightCount > 0 && (
            <span className="agenda-ring" aria-hidden="true">
              <span className="agenda-spark" />
            </span>
          )}
          <CalendarIcon />
          {tonightCount > 0 && <span className="agenda-fab-count" aria-hidden="true">{tonightCount}</span>}
        </button>
      )}
      <LayerSwitch layer={layer} layers={offered} moved={moved} onChange={chooseLayer} />
    </>
  )
  const searchBar = (onHome: () => void, homeLabel: string) => (
    <SearchBar value={value} submitted={query} loading={loading} onChange={setValue} onSubmit={search} onHome={onHome} onClear={home} homeLabel={homeLabel}>
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
      onOpen={() => setPlaceOpened(true)}
      night={layer === 'dance' && query !== null ? night : null}
    />
  )

  const stage = mapUsed && !mapFailed && (
    <main
      className="stage"
      data-view="map"
      hidden={mode !== 'map'}
      onPointerDown={() => setSuggesting(false)}
      data-sheet={sheet}
      data-mode={query === null ? 'explore' : 'results'}
      data-strip={(nightLayer(layer) && hasEvents) || undefined}
    >
      {heading}
      <div className="top" onFocusCapture={topFocus} onPointerDown={(e) => e.stopPropagation()}>
        {searchBar(showSearch, t.classicSearch)}
        {layer === 'dance' && night && hasEvents && (
          <DayStrip days={stripDays} counts={counts} value={night} onPick={pickNight} onCalendar={() => setMonthOpen(true)} />
        )}
        <Chips bars={mapBars} value={chips} onToggle={toggleChip} />
        {query === null && suggesting && <Suggestions single onPick={search} />}
        <button type="button" className="mine-fab" aria-label={t.myPlaces} onClick={() => setMineOpen(true)}>
          <HeartIcon size={20} />
        </button>
        {query !== null && stray && !loading && (
          <button type="button" className="search-here" onClick={searchHere}>
            <SearchIcon />
            {t.searchHere}
          </button>
        )}
      </div>
      {!mapLive && (
        <img
          className="map-start"
          src={theme === 'dark' ? '/map-start-dark.webp' : '/map-start-light.webp'}
          alt=""
          aria-hidden="true"
          decoding="async"
          onLoad={() => performance.getEntriesByName('map-start').length === 0 && performance.mark('map-start')}
        />
      )}
      <Suspense fallback={null}>
        <CityMap
          onLive={() => setMapLive(true)}
          bars={shownBars}
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
          padKey={`${sheet}:${query === null}:${layer}`}
          night={dealIds ?? ringIds}
          boost={boostIds}
          sink={sinkIds}
          marks={markMap}
          dealMode={dealsShown}
          badge={badgeIds}
        />
      </Suspense>
      {query === null && <FocusToggle on={dealsOn} onToggle={() => setDealsOn((v) => !v)} />}
      {sheet !== 'peek' && (
        <button type="button" className="sheet-down" onClick={() => setSheet('peek')} aria-label={t.backToMap}>
          <DownIcon />
        </button>
      )}
      <Sheet
        height={sheet}
        onHeight={setSheet}
        scrollKey={`${query ?? ''}:${attempt}:${previewId ?? ''}:${eventView?.id ?? ''}`}
        header={
          (previewId || eventView) && (
            <button type="button" className="back" onClick={back}>
              <BackIcon />
              {t.back}
            </button>
          )
        }
      >
        {eventView ? (
          <div className="pane">
            <EventCard event={eventView} kinds={kindsOf(eventView.placeId)} />
          </div>
        ) : previewId ? (
          <div className="pane">
            <BarPreview key={previewId} id={previewId} />
          </div>
        ) : query === null && showNight ? (
          <div className="pane">
            <EventList
              title={nightTitle()}
              events={nightEvents}
              state={eventsState}
              kindsOf={kindsOf}
              selectedId={selectedId}
              onSelect={pickFromList}
              onRetry={() => setEventsAttempt((n) => n + 1)}
              withDate={night !== null && night.from !== night.to}
            />
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
              title={dealsShown ? t.dealsTitle(top.length) : undefined}
              empty={dealsShown ? t.dealsEmpty : undefined}
              eventOf={(id) => tonightOf.get(id)}
              postsOf={(id) => rowPosts.get(id)}
              onEvent={layer === 'drink' ? openEvent : undefined}
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
                <Logo size="var(--text-hero)" asking="left" />
              </h1>
              <p className="start-text">{t.tagline}</p>
              <SearchBar value={value} submitted={query} loading={loading} onChange={setValue} onSubmit={search} onHome={home} onClear={home} homeLabel={t.startOver} />
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
        <DealsContext.Provider value={dealsShown || (query !== null && DEAL_WORDS.test(query))}>
        {stage}
        {classic}
        {viewer && <PhotoViewer photos={viewer.photos} start={viewer.index} title={viewer.title} onClose={() => setViewer(null)} />}
        {intro && <Intro onDone={() => setIntro(false)} />}
        {!intro && asking && mode === 'map' && (
          <ModeChoice
            layers={offered}
            onPick={(l) => {
              rememberLayer(l)
              chooseLayer(l)
              setAsking(false)
            }}
          />
        )}
        <InstallHint placeOpened={placeOpened} />
        {mineOpen && (
          <MyPlaces
            onClose={() => setMineOpen(false)}
            onOpen={(id, snap) => {
              setMineOpen(false)
              setView('map')
              if (snap.layer !== layer) chooseLayer(snap.layer)
              setPendingShow(id)
            }}
          />
        )}
        {report && <ReportSheet {...report} onClose={() => setReport(null)} />}
        {toastText && (
          <p className="toast" role="status">
            {toastText}
          </p>
        )}
        {agendaOpen && (
          <AgendaSheet
            days={nights(stripStart, STRIP_DAYS)}
            counts={counts}
            day={night?.from ?? stripStart}
            bounds={bounds}
            kindsOf={kindsOf}
            onDay={(d) => pickNight(one(d))}
            onShow={(e) => {
              setAgendaOpen(false)
              if (e.night) pickNight(one(e.night))
              setView('map')
              setPendingShow(e.placeId)
            }}
            onClose={() => setAgendaOpen(false)}
          />
        )}
        {monthOpen && (
          <MonthSheet
            layer="dance"
            value={night?.from ?? null}
            onPick={(d) => {
              pickNight(one(d))
              closeMonth()
            }}
            onClose={closeMonth}
          />
        )}
        </DealsContext.Provider>
      </LayerContext.Provider>
    </LangContext.Provider>
  )
}
