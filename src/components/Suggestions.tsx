import './Suggestions.css'

const suggestions = [
  'A bar to watch the PSG game',
  'A bar close by that is fun to go to alone',
  'A bar for LGBTQ people',
  'A bar that feels super safe',
  'A fancy bar with espresso martinis',
  'A student bar with cheap beer and great atmosphere',
  'A quiet wine bar for a first date',
  'A rooftop with a view for sunset',
  'A bar with a big terrace in the 11e',
  'Somewhere with live jazz tonight',
]

export default function Suggestions({ onPick }: { onPick: (q: string) => void }) {
  return (
    <section className="start">
      <h1 className="start-title">Où ce soir ?</h1>
      <p className="start-text">Describe the evening you want, or start from one of these.</p>
      <ul className="cloud">
        {suggestions.map((s) => (
          <li key={s}>
            <button className="bubble" type="button" onClick={() => onPick(s)}>
              <span className="bubble-glare" />
              <span className="bubble-text">{s}</span>
            </button>
          </li>
        ))}
      </ul>
    </section>
  )
}
