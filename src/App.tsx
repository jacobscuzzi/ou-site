import { useEffect, useRef, useState } from 'react'
import { searchBars } from './api/client'
import type { Bar } from './api/types'
import SearchBar from './components/SearchBar'
import BarList from './components/BarList'

const DEFAULT_QUERY = 'A student bar with cheap beer and great atmosphere'

export default function App() {
  const [query, setQuery] = useState(DEFAULT_QUERY)
  const [bars, setBars] = useState<Bar[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [attempt, setAttempt] = useState(0)
  const abortRef = useRef<AbortController | null>(null)

  useEffect(() => {
    abortRef.current?.abort()
    const ctrl = new AbortController()
    abortRef.current = ctrl
    setLoading(true)
    setError(null)

    searchBars(query, 6, ctrl.signal)
      .then((res) => {
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
    setQuery(q)
    setAttempt((n) => n + 1)
    window.scrollTo({ top: 0 })
  }

  return (
    <main className="app">
      <div className="glow" aria-hidden="true">
        <div className="glow-column">
          <span />
          <span />
          <span />
          <span />
        </div>
      </div>
      <div className="content">
        <SearchBar initialQuery={DEFAULT_QUERY} loading={loading} onSearch={search} />
        <BarList bars={bars} loading={loading} error={error} onRetry={() => setAttempt((n) => n + 1)} />
      </div>
    </main>
  )
}
