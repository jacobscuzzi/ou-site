import { useEffect, useRef, useState } from 'react'
import { searchBars } from './api/client'
import type { Bar } from './api/types'
import Logo from './components/Logo'
import SearchBar from './components/SearchBar'
import Suggestions from './components/Suggestions'
import BarList from './components/BarList'

export default function App() {
  const [value, setValue] = useState('')
  const [query, setQuery] = useState<string | null>(null)
  const [bars, setBars] = useState<Bar[]>([])
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [attempt, setAttempt] = useState(0)
  const abortRef = useRef<AbortController | null>(null)

  useEffect(() => {
    if (query === null) return
    abortRef.current?.abort()
    const ctrl = new AbortController()
    abortRef.current = ctrl
    setLoading(true)
    setError(null)

    const minWait = new Promise((resolve) => setTimeout(resolve, 1200))
    Promise.all([searchBars(query, 6, ctrl.signal), minWait])
      .then(([res]) => {
        setBars(res.results)
        setLoading(false)
      })
      .catch((err: Error) => {
        if (err.name === 'AbortError') return
        setError(err.message)
        setLoading(false)
      })

    return () => ctrl.abort()
  }, [query, attempt])

  function search(q: string) {
    const trimmed = q.trim()
    if (!trimmed) return
    setValue(trimmed)
    setQuery(trimmed)
    setAttempt((n) => n + 1)
    window.scrollTo({ top: 0 })
  }

  function home() {
    abortRef.current?.abort()
    setQuery(null)
    setValue('')
    setBars([])
    setError(null)
    setLoading(false)
    window.scrollTo({ top: 0 })
  }

  const searchBar = <SearchBar value={value} loading={loading} onChange={setValue} onSubmit={search} onHome={home} />

  return (
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
            <h1 className="start-title">
              <Logo size="var(--text-hero)" /> ce soir ?
            </h1>
            <p className="start-text">Let&apos;s find the best bar for you.</p>
            {searchBar}
            <Suggestions onPick={search} />
          </section>
        ) : (
          <>
            {searchBar}
            <BarList bars={bars} loading={loading} error={error} onRetry={() => setAttempt((n) => n + 1)} />
            <p className="credit">Map data from OpenStreetMap contributors</p>
          </>
        )}
      </div>
    </main>
  )
}
