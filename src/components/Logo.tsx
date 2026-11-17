import type { CSSProperties } from 'react'
import './Logo.css'

export default function Logo({ size }: { size: string }) {
  return (
    <span className="logo" style={{ '--f': size } as CSSProperties} aria-label="où">
      ou
    </span>
  )
}
