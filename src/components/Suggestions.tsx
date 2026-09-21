import { useT } from '../i18n'
import './Suggestions.css'

export default function Suggestions({ onPick }: { onPick: (q: string) => void }) {
  const t = useT()

  return (
    <div className="rows">
      {t.suggestions.map((row, i) => (
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
