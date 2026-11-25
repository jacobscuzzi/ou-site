import { useT } from '../i18n'
import { focusOf, useLayer } from '../mode'
import './FocusToggle.css'

// A glass switch on the side of the map that narrows the layer to one thing (deals in eat).
export default function FocusToggle({ on, onToggle }: { on: boolean; onToggle: () => void }) {
  const t = useT()
  const f = focusOf[useLayer()]
  if (!f) return null
  return (
    <button type="button" className="focus-toggle" aria-pressed={on} aria-label={on ? t.focusDealsOn : t.focusDealsOff} onClick={onToggle}>
      <span className="focus-emoji" aria-hidden="true">
        {f.emoji}
      </span>
      <span className="focus-label">{t.focusDeals}</span>
    </button>
  )
}
