import { useEffect, useState } from 'react'
import { searchBars } from './api/client'
import type { Bar } from './api/types'

const DEFAULT_QUERY = 'A student bar with cheap beer and great atmosphere'

export default function App() {
  const [bars, setBars] = useState<Bar[]>([])
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    const ctrl = new AbortController()
    searchBars(DEFAULT_QUERY, 6, ctrl.signal)
      .then((res) => setBars(res.results))
      .catch((err) => {
        if (err.name !== 'AbortError') setError(err.message)
      })
    return () => ctrl.abort()
  }, [])

  return (
    <main className="app">
      {error && <p>{error}</p>}
      <ol>
        {bars.map((bar) => (
          <li key={bar.id}>{bar.name}</li>
        ))}
      </ol>
    </main>
  )
}
