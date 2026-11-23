import { useEffect, useRef, useState, type CSSProperties, type KeyboardEvent } from 'react'
import type { Layer } from '../api/types'
import { useT } from '../i18n'
import { layerEmoji } from '../mode'
import './LayerSwitch.css'

type Props = { layer: Layer; layers: Layer[]; moved: number; onChange: (l: Layer) => void }

export default function LayerSwitch({ layer, layers, moved, onChange }: Props) {
  const t = useT()
  const [open, setOpen] = useState(false)
  const root = useRef<HTMLDivElement>(null)
  const button = useRef<HTMLButtonElement>(null)
  const others = layers.filter((l) => l !== layer)
  const name = t.layerNames[layer]

  useEffect(() => {
    if (!open) return
    root.current?.querySelector<HTMLElement>('.layer-option')?.focus()
    const away = (e: PointerEvent) => {
      if (!root.current?.contains(e.target as Node)) setOpen(false)
    }
    document.addEventListener('pointerdown', away)
    return () => document.removeEventListener('pointerdown', away)
  }, [open])

  function close() {
    setOpen(false)
    button.current?.focus()
  }

  function pick(l: Layer) {
    close()
    onChange(l)
  }

  function onKey(e: KeyboardEvent) {
    if (e.key === 'Escape') {
      e.preventDefault()
      close()
      return
    }
    const items = [...(root.current?.querySelectorAll<HTMLElement>('.layer-option') ?? [])]
    const at = items.indexOf(document.activeElement as HTMLElement)
    const step = { ArrowDown: 1, ArrowRight: 1, ArrowUp: -1, ArrowLeft: -1 }[e.key]
    if (step !== undefined && items.length > 0) {
      e.preventDefault()
      items[(at + step + items.length) % items.length].focus()
    } else if (e.key === 'Home' || e.key === 'End') {
      e.preventDefault()
      items[e.key === 'Home' ? 0 : items.length - 1]?.focus()
    } else if (e.key === 'Tab') {
      setOpen(false)
    }
  }

  return (
    <div className="layer" ref={root} onBlur={(e) => !root.current?.contains(e.relatedTarget) && setOpen(false)}>
      <button
        ref={button}
        key={moved}
        type="button"
        className={moved > 0 ? 'layer-current layer-moved' : 'layer-current'}
        aria-haspopup="menu"
        aria-expanded={open}
        aria-controls={open ? 'layer-menu' : undefined}
        aria-label={t.layerMenu(name)}
        aria-disabled={others.length === 0 || undefined}
        onClick={() => others.length > 0 && setOpen((o) => !o)}
        onKeyDown={(e) => {
          if (e.key === 'ArrowDown' && others.length > 0) {
            e.preventDefault()
            setOpen(true)
          }
        }}
      >
        <span className="layer-emoji" aria-hidden="true">{layerEmoji[layer]}</span>
      </button>
      {open && (
        <div className="layer-menu" id="layer-menu" role="menu" aria-label={t.layerMenu(name)} onKeyDown={onKey}>
          {others.map((l, i) => (
            <button
              key={l}
              type="button"
              role="menuitem"
              className="layer-option"
              style={{ '--i': i } as CSSProperties}
              tabIndex={-1}
              onClick={() => pick(l)}
            >
              <span className="layer-name">{t.layerNames[l]}</span>
              <span className="layer-dot">
                <span className="layer-emoji" aria-hidden="true">{layerEmoji[l]}</span>
              </span>
            </button>
          ))}
        </div>
      )}
      <span className="visually-hidden" aria-live="polite">{moved > 0 ? t.layerSwitched(name) : ''}</span>
    </div>
  )
}
