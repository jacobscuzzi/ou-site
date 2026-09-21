import { useEffect, useRef, useState } from 'react'
import { searchBars } from './api/client'
import type { Bar } from './api/types'
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
        <SearchBar value={value} loading={loading} onChange={setValue} onSubmit={search} onHome={home} />
        {query === null ? (
          <Suggestions onPick={search} />
        ) : (
          <BarList bars={bars} loading={loading} error={error} onRetry={() => setAttempt((n) => n + 1)} />
        )}
      </div>
    </main>
  )
}
