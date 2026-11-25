import { useEffect, useRef, useState } from 'react'
import { fetchBar } from '../api/client'
import type { Layer, SignalKind } from '../api/types'
import { useBackClose } from '../backClose'
import { useT } from '../i18n'
import { layerEmoji } from '../mode'
import { thumbOf } from '../photos'
import { mark, remember, useMarks, type Mark, type Snapshot } from '../signals'
import { CloseIcon } from './icons'
import Photo from './Photo'
import './MyPlaces.css'

const KIND_LAYER: Record<string, Layer> = { club: 'dance', restaurant: 'eat', cafe: 'coffee', bar: 'drink' }

function layerOfKinds(kinds: string[]): Layer {
  return KIND_LAYER[kinds.find((k) => KIND_LAYER[k]) ?? 'bar']
}

type Props = { onOpen: (id: string, snap: Snapshot) => void; onClose: () => void }

function Row({ id, m, onOpen, undo }: { id: string; m: Mark; onOpen?: () => void; undo?: () => void }) {
  const t = useT()
  const s = m.snap
  if (!s) return <li className="mine-row mine-row-loading" aria-hidden="true" />
  const body = (
    <>
      <Photo className="mine-photo" src={s.photo} />
      <span className="mine-text">
        <span className="mine-name">{s.name}</span>
        <span className="mine-where">
          <span aria-hidden="true">{layerEmoji[s.layer]}</span> {s.arrondissement}
        </span>
      </span>
    </>
  )
  return (
    <li className="mine-row" data-id={id}>
      {onOpen ? (
        <button type="button" className="mine-open" onClick={onOpen}>
          {body}
        </button>
      ) : (
        <span className="mine-open">{body}</span>
      )}
      {undo && (
        <button type="button" className="mine-undo" onClick={undo}>
          {t.undo}
        </button>
      )}
    </li>
  )
}

// The device's favorites and want-to-go places across all layers, newest first; dislikes folded away.
export default function MyPlaces({ onOpen, onClose }: Props) {
  const t = useT()
  const marks = useMarks()
  const [tab, setTab] = useState<SignalKind>('like')
  const closeRef = useRef<HTMLButtonElement>(null)
  useBackClose(onClose)

  useEffect(() => {
    closeRef.current?.focus({ preventScroll: true })
    const key = (e: KeyboardEvent) => e.key === 'Escape' && onClose()
    window.addEventListener('keydown', key)
    return () => window.removeEventListener('keydown', key)
  }, [])

  // a place marked on another device comes without its snapshot: fetch it once
  const missing = Object.entries(marks).filter(([, m]) => !m.snap).map(([id]) => id).join(',')
  useEffect(() => {
    if (!missing) return
    const ctrl = new AbortController()
    for (const id of missing.split(',')) {
      fetchBar(id, ctrl.signal)
        .then((b) =>
          remember(id, {
            name: b.name, lat: b.lat, lng: b.lng, layer: layerOfKinds(b.kinds), photo: thumbOf(b.photos, b.thumbs, 0), arrondissement: b.arrondissement,
          }),
        )
        .catch(() => undefined)
    }
    return () => ctrl.abort()
  }, [missing])

  const list = (kind: SignalKind) => Object.entries(marks).filter(([, m]) => m.kind === kind).sort((a, b) => b[1].at.localeCompare(a[1].at))
  const shown = list(tab)
  const nope = list('dislike')

  return (
    <div className="mine-scrim" onPointerDown={(e) => e.target === e.currentTarget && onClose()}>
      <section className="mine" role="dialog" aria-modal="true" aria-labelledby="mine-title">
        <header className="mine-head">
          <h2 className="mine-title" id="mine-title">
            {t.myPlaces}
          </h2>
          <button ref={closeRef} type="button" className="mine-close" aria-label={t.close} onClick={onClose}>
            <CloseIcon />
          </button>
        </header>
        <div className="mine-tabs" role="tablist">
          {(['like', 'want'] as const).map((k) => (
            <button key={k} type="button" role="tab" className="mine-tab" aria-selected={tab === k} onClick={() => setTab(k)}>
              {k === 'like' ? t.favorites : t.wantToGo}
              <span className="mine-count">{list(k).length}</span>
            </button>
          ))}
        </div>
        <div className="mine-list" role="tabpanel">
          {shown.length === 0 ? (
            <p className="mine-empty">{tab === 'like' ? t.emptyFavorites : t.emptyWant}</p>
          ) : (
            <ul>
              {shown.map(([id, m]) => (
                <Row key={id} id={id} m={m} onOpen={m.snap && (() => onOpen(id, m.snap!))} />
              ))}
            </ul>
          )}
          {nope.length > 0 && (
            <details className="mine-nope">
              <summary>{t.notForMe(nope.length)}</summary>
              <ul>
                {nope.map(([id, m]) => (
                  <Row key={id} id={id} m={m} undo={() => mark(id, null)} />
                ))}
              </ul>
            </details>
          )}
        </div>
      </section>
    </div>
  )
}
