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
}

export default function BarList({ bars, loading, error, onRetry }: Props) {
  const t = useT()
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
    <div className="list">
      <p className="eyebrow list-eyebrow">{t.picks(bars.length)}</p>
      {bars.map((bar, i) => (
        <BarCard key={bar.id} bar={bar} index={i} />
      ))}
    </div>
  )
}
