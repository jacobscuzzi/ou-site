import type { FormEvent, ReactNode } from 'react'
import { useT } from '../i18n'
import { ArrowUpIcon } from './icons'
import Logo from './Logo'
import './SearchBar.css'

type Props = {
  value: string
  loading: boolean
  onChange: (q: string) => void
  onSubmit: (q: string) => void
  onHome: () => void
  children?: ReactNode
}

export default function SearchBar({ value, loading, onChange, onSubmit, onHome, children }: Props) {
  const t = useT()

  function submit(e: FormEvent) {
    e.preventDefault()
    onSubmit(value)
  }

  return (
    <header className="search">
      <form className="search-pill" onSubmit={submit}>
        <span className="search-glare" />
        <button className="search-brand" type="button" onClick={onHome} aria-label={t.startOver}>
          <Logo size="var(--text-md)" />
        </button>
        <input
          className="search-input"
          type="text"
          value={value}
          onChange={(e) => onChange(e.target.value)}
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
