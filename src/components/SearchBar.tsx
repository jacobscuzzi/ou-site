import { useRef, useState, type FormEvent, type ReactNode } from 'react'
import { useT } from '../i18n'
import { useTypedPlaceholder } from '../typed'
import { ArrowUpIcon, CloseIcon } from './icons'
import Logo from './Logo'
import './SearchBar.css'

type Props = {
  value: string
  submitted: string | null
  loading: boolean
  onChange: (q: string) => void
  onSubmit: (q: string) => void
  onHome: () => void
  onClear: () => void
  homeLabel: string
  children?: ReactNode
}

export default function SearchBar({ value, submitted, loading, onChange, onSubmit, onHome, onClear, homeLabel, children }: Props) {
  const t = useT()
  const [focused, setFocused] = useState(false)
  const input = useRef<HTMLInputElement>(null)
  const clearable = value !== '' || submitted !== null

  // empties the field and ends the search; the cursor stays in the field for the next one
  function clear() {
    onChange('')
    onClear()
    input.current?.focus()
  }
  const cycling = !focused && value === '' && submitted === null
  const typed = useTypedPlaceholder(t.suggestions.flat(), cycling)

  function submit(e: FormEvent) {
    e.preventDefault()
    onSubmit(value.trim() ? value : (typed.full ?? ''))
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
          <Logo size="var(--text-md)" small />
        </button>
        <input
          ref={input}
          className="search-input"
          type="text"
          value={value}
          onChange={(e) => onChange(e.target.value)}
          onFocus={() => {
            setFocused(true)
            focus()
          }}
          onBlur={() => {
            setFocused(false)
            blur()
          }}
          placeholder={cycling ? typed.text : t.placeholder}
          enterKeyHint="search"
          autoComplete="off"
          aria-label={t.placeholder}
        />
        {clearable && (
          <button
            className="search-clear"
            type="button"
            aria-label={t.clearSearch}
            onPointerDown={(e) => e.preventDefault()}
            onClick={clear}
          >
            <CloseIcon size={16} />
          </button>
        )}
        <button className="search-send" type="submit" disabled={loading || (!value.trim() && !typed.full)} aria-label={t.search}>
          <ArrowUpIcon />
        </button>
      </form>
      {children}
    </header>
  )
}
