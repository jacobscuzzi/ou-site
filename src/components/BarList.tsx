import type { Bar } from '../api/types'
import BarCard from './BarCard'
import './BarList.css'

type Props = {
  bars: Bar[]
  loading: boolean
  error: string | null
  onRetry: () => void
}

function Skeleton() {
  return (
    <div className="card skeleton" aria-hidden="true">
      <div className="card-photo" />
      <div className="card-body">
        <div className="card-head">
          <span className="skeleton-line" style={{ width: '55%' }} />
          <span className="skeleton-line" style={{ width: '18%' }} />
        </div>
        <div className="card-chips">
          <span className="skeleton-chip" style={{ width: 132 }} />
          <span className="skeleton-chip" style={{ width: 96 }} />
        </div>
      </div>
    </div>
  )
}

export default function BarList({ bars, loading, error, onRetry }: Props) {
  if (loading) {
    return (
      <div className="list" aria-busy="true">
        <Skeleton />
        <Skeleton />
        <Skeleton />
      </div>
    )
  }

  if (error) {
    return (
      <div className="list">
        <div className="notice" role="alert">
          <p className="notice-title">Something went wrong</p>
          <p className="notice-text">{error}</p>
          <button className="btn-secondary" type="button" onClick={onRetry}>
            Try again
          </button>
        </div>
      </div>
    )
  }

  if (bars.length === 0) {
    return (
      <div className="list">
        <div className="notice">
          <p className="notice-title">Nothing for that yet</p>
          <p className="notice-text">Try describing the evening differently.</p>
        </div>
      </div>
    )
  }

  return (
    <div className="list">
      {bars.map((bar) => (
        <BarCard key={bar.id} bar={bar} />
      ))}
    </div>
  )
}
