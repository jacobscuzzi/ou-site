import { useEffect, useState } from 'react'
import { fetchBar } from '../api/client'
import type { Bar } from '../api/types'
import { useT } from '../i18n'
import BarCard from './BarCard'
import './BarPreview.css'

type Failure = 'warming' | 'missing' | 'other'
type State = { bar: Bar | null; failure: Failure | null }

function failureOf(err: Error): Failure {
  if (err.name === 'BarsLoading') return 'warming'
  if (err.name === 'BarNotFound') return 'missing'
  return 'other'
}

export default function BarPreview({ id }: { id: string }) {
  const t = useT()
  const [attempt, setAttempt] = useState(0)
  const [state, setState] = useState<State>({ bar: null, failure: null })

  useEffect(() => {
    const ctrl = new AbortController()
    setState({ bar: null, failure: null })
    fetchBar(id, ctrl.signal)
      .then((bar) => setState({ bar, failure: null }))
      .catch((err: Error) => {
        if (err.name !== 'AbortError') setState({ bar: null, failure: failureOf(err) })
      })
    return () => ctrl.abort()
  }, [id, attempt])

  if (state.bar) return <BarCard bar={state.bar} index={0} defaultOpen />

  if (state.failure) {
    const text = { warming: t.barWarming, missing: t.barMissing, other: t.barError }[state.failure]
    return (
      <div className="preview-note" role="alert">
        <p className="preview-note-title">{text}</p>
        {state.failure !== 'missing' && (
          <button type="button" className="btn-primary" onClick={() => setAttempt((n) => n + 1)}>
            {t.retry}
          </button>
        )}
      </div>
    )
  }

  return (
    <div role="status" aria-label={t.barLoading}>
      <div className="preview-skeleton" aria-hidden="true" />
    </div>
  )
}
