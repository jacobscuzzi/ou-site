import { useEffect, useState } from 'react'
import { useT } from '../i18n'
import './Suggestions.css'

const wideQuery = '(min-width: 768px)'

function useWide() {
  const [wide, setWide] = useState(() => window.matchMedia(wideQuery).matches)
  useEffect(() => {
    const media = window.matchMedia(wideQuery)
    const update = () => setWide(media.matches)
    media.addEventListener('change', update)
    return () => media.removeEventListener('change', update)
  }, [])
  return wide
}

export default function Suggestions({ onPick }: { onPick: (q: string) => void }) {
  const t = useT()
  const wide = useWide()
  const flat = t.suggestions.flat()
  const rows = wide ? [flat.slice(0, 6), flat.slice(6)] : t.suggestions

  return (
    <div className="rows">
      {rows.map((row, i) => (
        <div key={i} className={i % 2 ? 'row row-right' : 'row'}>
          <div className="row-track">
            {[0, 1].map((copy) => (
              <div key={copy} className="row-group" aria-hidden={copy === 1}>
                {row.map((s) => (
                  <button key={s} className="bubble" type="button" tabIndex={copy ? -1 : 0} onClick={() => onPick(s)}>
                    <span className="bubble-glare" />
                    <span className="bubble-text">{s}</span>
                  </button>
                ))}
              </div>
            ))}
          </div>
        </div>
      ))}
    </div>
  )
}
