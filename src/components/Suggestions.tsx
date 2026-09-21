import './Suggestions.css'

const rows = [
  [
    'A bar to watch the PSG game',
    'A bar close by that is fun to go to alone',
    'A bar for LGBTQ people',
    'A bar that feels super safe',
  ],
  [
    'A fancy bar with espresso martinis',
    'A student bar with cheap beer and great atmosphere',
    'A quiet wine bar for a first date',
    'Somewhere with live jazz tonight',
  ],
  [
    'A rooftop with a view for sunset',
    'A bar with a big terrace in the 11e',
    'A cocktail bar that stays open past 3',
    'A pub with a quiz and cheap pints',
  ],
]

export default function Suggestions({ onPick }: { onPick: (q: string) => void }) {
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
