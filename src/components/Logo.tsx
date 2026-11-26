import type { CSSProperties } from 'react'
import { solid, spray } from './logoPaths'
import { question, questionRight } from './logoQuestion'
import './Logo.css'

// The spray texture turns muddy under ~24 px, small logos use the solid cut of the same letters.
export default function Logo({ size, small = false, asking }: { size: string; small?: boolean; asking?: 'left' | 'right' }) {
  const g = asking === 'left' ? question : asking === 'right' ? questionRight : small ? solid : spray
  const [, , w, h] = g.viewBox.split(' ').map(Number)
  return (
    <svg className="logo" viewBox={g.viewBox} style={{ '--f': size, aspectRatio: `${w} / ${h}` } as CSSProperties} role="img" aria-label={asking ? 'où ?' : 'où'}>
      <g transform={g.tilt}>
        <path d={g.path} fill="currentColor" />
        <rect {...g.accent} className="logo-accent" />
      </g>
    </svg>
  )
}
