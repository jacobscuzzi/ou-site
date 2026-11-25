import { useEffect, useRef, useState, type CSSProperties } from 'react'
import type { Layer } from '../api/types'
import { useT } from '../i18n'
import { firstLayer, layerEmoji, modeAsked } from '../mode'
import { still } from '../motion'
import './ModeChoice.css'

const ORDER: Layer[] = ['coffee', 'eat', 'drink', 'dance']

type Props = { layers: Layer[]; onPick: (l: Layer) => void }

// First visit: the layer switch itself asks, then the picked option flies into its usual place.
export default function ModeChoice({ layers, onPick }: Props) {
  const t = useT()
  const [leaving, setLeaving] = useState(false)
  const first = useRef<HTMLButtonElement>(null)
  const offered = ORDER.filter((l) => layers.includes(l))

  useEffect(() => {
    first.current?.focus({ preventScroll: true })
  }, [])

  function finish(l: Layer, from: HTMLElement | null) {
    if (leaving) return
    modeAsked()
    setLeaving(true)
    const target = document.querySelector<HTMLElement>('.stage .layer-current')
    const ms = parseFloat(getComputedStyle(document.documentElement).getPropertyValue('--mode-fly'))
    if (!from || !target || still()) {
      onPick(l)
      return
    }
    const a = from.querySelector<HTMLElement>('.mode-emoji')!.getBoundingClientRect()
    const b = target.getBoundingClientRect()
    const dx = b.left + b.width / 2 - (a.left + a.width / 2)
    const dy = b.top + b.height / 2 - (a.top + a.height / 2)
    from.style.setProperty('--fly-x', `${dx}px`)
    from.style.setProperty('--fly-y', `${dy}px`)
    from.dataset.fly = ''
    window.setTimeout(() => onPick(l), ms)
  }

  return (
    <div className="mode" data-leaving={leaving || undefined} onPointerDown={(e) => e.target === e.currentTarget && finish(firstLayer(), null)}>
      <div className="mode-panel" role="dialog" aria-modal="true" aria-labelledby="mode-q">
        <p className="mode-q" id="mode-q">
          {t.modeQuestion}
        </p>
        <div className="mode-options">
          {offered.map((l, i) => (
            <button
              key={l}
              ref={i === 0 ? first : undefined}
              type="button"
              className="mode-option"
              data-layer={l}
              style={{ '--i': i } as CSSProperties}
              onClick={(e) => finish(l, e.currentTarget)}
            >
              <span className="mode-emoji" aria-hidden="true">
                {layerEmoji[l]}
              </span>
              <span className="mode-label">{t.modeOptions[l]}</span>
            </button>
          ))}
        </div>
        <button type="button" className="mode-skip" onClick={() => finish(firstLayer(), null)}>
          {t.modeSkip}
        </button>
      </div>
    </div>
  )
}
