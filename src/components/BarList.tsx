import { useEffect, useRef } from 'react'
import type { Bar } from '../api/types'
import { useT } from '../i18n'
import BarCard from './BarCard'
import Thinking from './Thinking'
import './BarList.css'

type Props = {
  bars: Bar[]
  loading: boolean
  error: string | null
  onRetry: () => void
  hasMore: boolean
  loadingMore: boolean
  moreError: string | null
  onMore: () => void
  selectedId?: string | null
  onSelect?: (id: string) => void
  onFirst?: (id: string) => void
  onOpen?: () => void
}

const FIRST_PAGE = 5
const MOSTLY = 0.5

export default function BarList({ bars, loading, error, onRetry, hasMore, loadingMore, moreError, onMore, selectedId, onSelect, onFirst, onOpen }: Props) {
  const t = useT()
  const list = useRef<HTMLDivElement>(null)

  useEffect(() => {
    const box = list.current
    const root = box?.closest('.sheet-content')
    if (!box || !root || !onFirst) return
    const seen = new Set<string>()
    const watch = new IntersectionObserver(
      (entries) => {
        for (const e of entries) {
          const id = (e.target as HTMLElement).dataset.id
          if (!id) continue
          if (e.intersectionRatio >= MOSTLY) seen.add(id)
          else seen.delete(id)
        }
        const first = bars.find((b) => seen.has(b.id))
        if (first) onFirst(first.id)
      },
      { root, threshold: MOSTLY },
    )
    for (const card of box.querySelectorAll('[data-id]')) watch.observe(card)
    return () => watch.disconnect()
  }, [bars, onFirst, loading, error])

  if (loading) return <Thinking />

  if (error) {
    return (
      <div className="list">
        <div className="notice" role="alert">
          <p className="notice-title">{t.errorTitle}</p>
          <p className="notice-text">{error}</p>
          <button className="btn-secondary" type="button" onClick={onRetry}>
            {t.retry}
          </button>
        </div>
      </div>
    )
  }

  if (bars.length === 0) {
    return (
      <div className="list">
        <div className="notice">
          <p className="notice-title">{t.emptyTitle}</p>
          <p className="notice-text">{t.emptyText}</p>
        </div>
      </div>
    )
  }

  return (
    <div className="list" ref={list} aria-busy={loadingMore}>
      <p className="eyebrow list-eyebrow">{t.picks(bars.length)}</p>
      {bars.map((bar, i) => (
        <BarCard
          key={bar.id}
          bar={bar}
          index={i < FIRST_PAGE ? i : (i - FIRST_PAGE) % 10}
          selected={bar.id === selectedId}
          onSelect={onSelect && (() => onSelect(bar.id))}
          onOpen={onOpen}
        />
      ))}
      {moreError ? (
        <div className="notice list-more-error" role="alert">
          <p className="notice-title">{t.moreError}</p>
          <p className="notice-text">{moreError}</p>
          <button className="btn-secondary" type="button" onClick={onMore}>
            {t.retry}
          </button>
        </div>
      ) : (
        hasMore && (
          <div className="list-more">
            <button className="btn-secondary" type="button" onClick={onMore} disabled={loadingMore}>
              {loadingMore ? t.loadingMore : t.more}
            </button>
          </div>
        )
      )}
    </div>
  )
}
