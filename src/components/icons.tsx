type IconProps = { size?: number }

const base = {
  fill: 'none',
  stroke: 'currentColor',
  strokeWidth: 2,
  strokeLinecap: 'round' as const,
  strokeLinejoin: 'round' as const,
  viewBox: '0 0 24 24',
  'aria-hidden': true,
}

export function ClockIcon({ size = 10 }: IconProps) {
  return (
    <svg {...base} width={size} height={size}>
      <circle cx="12" cy="12" r="9" />
      <path d="M12 7v5l3 2" />
    </svg>
  )
}

export function BeerIcon({ size = 10 }: IconProps) {
  return (
    <svg {...base} width={size} height={size}>
      <path d="M6 4h10v16H6z" />
      <path d="M16 9h2a2 2 0 0 1 2 2v4a2 2 0 0 1-2 2h-2" />
      <path d="M9 9v7M12 9v7" />
    </svg>
  )
}

export function CocktailIcon({ size = 10 }: IconProps) {
  return (
    <svg {...base} width={size} height={size}>
      <path d="M4 4h16l-8 9z" />
      <path d="M12 13v7M8 20h8" />
    </svg>
  )
}

export function PinIcon({ size = 12 }: IconProps) {
  return (
    <svg {...base} width={size} height={size}>
      <path d="M12 21s-6-5.4-6-11a6 6 0 0 1 12 0c0 5.6-6 11-6 11z" />
      <circle cx="12" cy="10" r="2.5" />
    </svg>
  )
}

export function ArrowUpIcon({ size = 18 }: IconProps) {
  return (
    <svg {...base} width={size} height={size} strokeWidth={2.6}>
      <path d="M12 19V5M5 12l7-7 7 7" />
    </svg>
  )
}
