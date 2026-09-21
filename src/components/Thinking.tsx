import type { CSSProperties } from 'react'
import { BeerIcon } from './icons'
import './Thinking.css'

const beers = [
  { dx: -120, dy: -90, delay: 0, size: 22 },
  { dx: 110, dy: -110, delay: 0.15, size: 18 },
  { dx: -70, dy: -140, delay: 0.3, size: 26 },
  { dx: 140, dy: -50, delay: 0.45, size: 20 },
  { dx: -150, dy: -30, delay: 0.6, size: 16 },
  { dx: 60, dy: -150, delay: 0.75, size: 24 },
  { dx: -30, dy: -120, delay: 0.9, size: 18 },
  { dx: 130, dy: -130, delay: 1.05, size: 20 },
]

export default function Thinking() {
  return (
    <div className="thinking" role="status" aria-live="polite">
      <div className="thinking-panel">
        <span className="thinking-glare" />
        <span className="thinking-text">
          Running the numbers
          <span className="thinking-dots" aria-hidden="true">
            <i />
            <i />
            <i />
          </span>
        </span>
        <span className="thinking-beers" aria-hidden="true">
          {beers.map((b, i) => (
            <span
              key={i}
              className="thinking-beer"
              style={{ '--dx': `${b.dx}px`, '--dy': `${b.dy}px`, '--delay': `${b.delay}s` } as CSSProperties}
            >
              <BeerIcon size={b.size} />
            </span>
          ))}
        </span>
      </div>
    </div>
  )
}
