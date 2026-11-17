import type { FormEvent, ReactNode } from 'react'
import { useT } from '../i18n'
import { ArrowUpIcon } from './icons'
import Logo from './Logo'
import './SearchBar.css'

type Props = {
  value: string
  submitted: string | null
  loading: boolean
  onChange: (q: string) => void
  onSubmit: (q: string) => void
  onHome: () => void
  homeLabel: string
  children?: ReactNode
}

export default function SearchBar({ value, submitted, loading, onChange, onSubmit, onHome, homeLabel, children }: Props) {
  const t = useT()

  function submit(e: FormEvent) {
    e.preventDefault()
    onSubmit(value)
  }

  function focus() {
    if (submitted !== null && value === submitted) onChange('')
  }

  function blur() {
    if (submitted !== null && value.trim() === '') onChange(submitted)
  }

  return (
    <header className="search">
      <form className="search-pill" onSubmit={submit}>
        <span className="search-glare" />
        <button className="search-brand" type="button" onClick={onHome} aria-label={homeLabel}>
          <Logo size="var(--text-md)" />
        </button>
        <input
          className="search-input"
          type="text"
          value={value}
          onChange={(e) => onChange(e.target.value)}
          onFocus={focus}
          onBlur={blur}
          placeholder={t.placeholder}
          enterKeyHint="search"
          autoComplete="off"
          aria-label={t.placeholder}
        />
        <button className="search-send" type="submit" disabled={loading || !value.trim()} aria-label={t.search}>
          <ArrowUpIcon />
        </button>
      </form>
      {children}
    </header>
  )
}
