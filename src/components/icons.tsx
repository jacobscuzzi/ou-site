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

export function LocateIcon({ size = 18 }: IconProps) {
  return (
    <svg {...base} width={size} height={size}>
      <path d="M12 2v3M12 19v3M2 12h3M19 12h3" />
      <circle cx="12" cy="12" r="6" />
      <circle cx="12" cy="12" r="2" />
    </svg>
  )
}

export function MetroIcon({ size = 18 }: IconProps) {
  return (
    <svg {...base} width={size} height={size}>
      <circle cx="12" cy="12" r="9" />
      <path d="M7.5 16V8l4.5 5.5L16.5 8v8" />
    </svg>
  )
}

export function BackIcon({ size = 18 }: IconProps) {
  return (
    <svg {...base} width={size} height={size}>
      <path d="M15 5l-7 7 7 7" />
    </svg>
  )
}

export function MapIcon({ size = 24 }: IconProps) {
  return (
    <svg {...base} width={size} height={size}>
      <path d="M9 4L3 6.5v13L9 17l6 3 6-2.5v-13L15 7z" />
      <path d="M9 4v13M15 7v13" />
    </svg>
  )
}

export function DownIcon({ size = 20 }: IconProps) {
  return (
    <svg {...base} width={size} height={size} strokeWidth={2.4}>
      <path d="M6 9l6 6 6-6" />
    </svg>
  )
}

export function SearchIcon({ size = 16 }: IconProps) {
  return (
    <svg {...base} width={size} height={size} strokeWidth={2.4}>
      <circle cx="11" cy="11" r="6.5" />
      <path d="M16 16l4 4" />
    </svg>
  )
}

export function PlayIcon({ size = 14 }: IconProps) {
  return (
    <svg {...base} width={size} height={size} fill="currentColor" stroke="none">
      <path d="M8 5.5v13l10.5-6.5z" />
    </svg>
  )
}

export function ImagesIcon({ size = 14 }: IconProps) {
  return (
    <svg {...base} width={size} height={size}>
      <rect x="3" y="6" width="14" height="14" rx="2" />
      <path d="M7 3h12a2 2 0 0 1 2 2v12" />
    </svg>
  )
}

export function HeartIcon({ size = 10 }: IconProps) {
  return (
    <svg {...base} width={size} height={size}>
      <path d="M12 20s-7-4.4-7-10a4 4 0 0 1 7-2.6A4 4 0 0 1 19 10c0 5.6-7 10-7 10z" />
    </svg>
  )
}

export function CloseIcon({ size = 18 }: IconProps) {
  return (
    <svg {...base} width={size} height={size}>
      <path d="M6 6l12 12M18 6L6 18" />
    </svg>
  )
}

export function CalendarIcon({ size = 18 }: IconProps) {
  return (
    <svg {...base} width={size} height={size}>
      <rect x="3" y="5" width="18" height="16" rx="3" />
      <path d="M3 10h18M8 3v4M16 3v4" />
    </svg>
  )
}

export function NextIcon({ size = 18 }: IconProps) {
  return (
    <svg {...base} width={size} height={size}>
      <path d="M9 6l6 6-6 6" />
    </svg>
  )
}

export function SoundIcon({ on, size = 18 }: IconProps & { on: boolean }) {
  return (
    <svg {...base} width={size} height={size}>
      <path d="M4 9h4l5-4v14l-5-4H4z" />
      {on ? <path d="M16.5 8.5a5 5 0 0 1 0 7M19 6a8.5 8.5 0 0 1 0 12" /> : <path d="M17 9.5l5 5M22 9.5l-5 5" />}
    </svg>
  )
}

export function BookmarkIcon({ size = 18 }: IconProps) {
  return (
    <svg {...base} width={size} height={size}>
      <path d="M7 4h10a1 1 0 0 1 1 1v15l-6-4-6 4V5a1 1 0 0 1 1-1z" />
    </svg>
  )
}

export function ThumbDownIcon({ size = 18 }: IconProps) {
  return (
    <svg {...base} width={size} height={size}>
      <path d="M17 14V4h3v10h-3zM17 4H8.5a2 2 0 0 0-2 1.6l-1.4 7A2 2 0 0 0 7 15h4l-.8 3.6A1.6 1.6 0 0 0 11.8 20l5.2-6" />
    </svg>
  )
}

export function MoreIcon({ size = 18 }: IconProps) {
  return (
    <svg {...base} width={size} height={size}>
      <path d="M6 12h.01M12 12h.01M18 12h.01" strokeWidth={3} />
    </svg>
  )
}
