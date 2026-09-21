import { useState, type FormEvent } from 'react'
import { ArrowUpIcon } from './icons'
import './SearchBar.css'

type Props = {
  initialQuery: string
  loading: boolean
  onSearch: (q: string) => void
}

export default function SearchBar({ initialQuery, loading, onSearch }: Props) {
  const [value, setValue] = useState(initialQuery)

  function submit(e: FormEvent) {
    e.preventDefault()
    const q = value.trim()
    if (q) onSearch(q)
  }

  return (
    <header className="search">
      <form className="search-pill" onSubmit={submit}>
        <span className="search-glare" />
        <span className="search-brand">où</span>
        <input
          className="search-input"
          type="text"
          value={value}
          onChange={(e) => setValue(e.target.value)}
          placeholder="Describe your evening"
          enterKeyHint="search"
          autoComplete="off"
          aria-label="Describe your evening"
        />
        <button className="search-send" type="submit" disabled={loading || !value.trim()} aria-label="Search">
          <ArrowUpIcon />
        </button>
      </form>
    </header>
  )
}
