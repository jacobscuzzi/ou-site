import type { FormEvent } from 'react'
import { ArrowUpIcon } from './icons'
import Logo from './Logo'
import './SearchBar.css'

type Props = {
  value: string
  loading: boolean
  onChange: (q: string) => void
  onSubmit: (q: string) => void
  onHome: () => void
}

export default function SearchBar({ value, loading, onChange, onSubmit, onHome }: Props) {
  function submit(e: FormEvent) {
    e.preventDefault()
    onSubmit(value)
  }

  return (
    <header className="search">
      <form className="search-pill" onSubmit={submit}>
        <span className="search-glare" />
        <button className="search-brand" type="button" onClick={onHome} aria-label="Start over">
          <Logo size="var(--text-md)" />
        </button>
        <input
          className="search-input"
          type="text"
          value={value}
          onChange={(e) => onChange(e.target.value)}
          placeholder="Describe what you're looking for"
          enterKeyHint="search"
          autoComplete="off"
          aria-label="Describe what you are looking for"
        />
        <button className="search-send" type="submit" disabled={loading || !value.trim()} aria-label="Search">
          <ArrowUpIcon />
        </button>
      </form>
    </header>
  )
}
