import type { Bar } from '../api/types'
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
  if (loading) return <Thinking />

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
      {bars.map((bar, i) => (
        <BarCard key={bar.id} bar={bar} index={i} />
      ))}
    </div>
  )
}
