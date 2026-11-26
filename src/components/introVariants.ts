export type IntroId = 'en' | 'fr1' | 'fr2'

// Sizes and offsets are px of the 390 px design frame, scaled with the viewport by --u.
export type Word = {
  text: string
  size: number
  rotate: number
  delay: number
  pink?: boolean
  wet?: boolean
  height?: number
  spacing?: number
  at: Place
}

export type Place = { top?: number; right?: number; bottom?: number; left?: number; x?: number; y?: number }

export type IntroLogo = { size: number; tilt?: 'left' | 'right'; hit: boolean; delay: number; at: Place }

export type IntroVariant = {
  id: IntroId
  label: string
  layout: 'stack' | 'stage'
  gap: number
  fit?: { scale: number; x: number }
  words: Word[]
  logo: IntroLogo
}

export const variants: Record<IntroId, IntroVariant> = {
  en: {
    id: 'en',
    label: 'Where the fuck in Paris? où',
    layout: 'stack',
    gap: 4,
    words: [
      { text: 'Where', size: 92, rotate: -5, delay: 0, at: {} },
      { text: 'the', size: 70, rotate: 3, delay: 200, at: { left: 120 } },
      { text: 'fuck', size: 132, rotate: -4, delay: 400, pink: true, wet: true, height: 1, at: {} },
      { text: 'in Paris?', size: 68, rotate: 2, delay: 600, height: 1, at: {} },
    ],
    logo: { size: 76, hit: false, delay: 1000, at: { top: 52 } },
  },
  fr1: {
    id: 'fr1',
    label: 'Alors on va où ?',
    layout: 'stack',
    gap: 6,
    words: [
      { text: 'Alors', size: 96, rotate: -5, delay: 0, at: { right: 60, bottom: -10 } },
      { text: 'on va', size: 104, rotate: 3, delay: 220, pink: true, at: { left: 70 } },
    ],
    logo: { size: 221, tilt: 'left', hit: true, delay: 500, at: { top: 24, bottom: 4, left: 8 } },
  },
  fr2: {
    id: 'fr2',
    label: 'Ça bouge où ?',
    layout: 'stage',
    gap: 0,
    words: [
      { text: 'Ça', size: 82, rotate: -11, delay: 0, height: 1, at: { x: 30, y: 232 } },
      { text: 'bouge', size: 122, rotate: -7, delay: 220, pink: true, height: 1, spacing: -0.02, at: { x: 6, y: 300 } },
    ],
    logo: { size: 218, tilt: 'right', hit: true, delay: 500, at: { x: 67, y: 406 } },
    fit: { scale: 0.91, x: -16 },
  },
}

export const french: IntroId[] = ['fr1', 'fr2']

const PICKED = 'ou-intro-fr'

function flagged(): IntroId | null {
  const local = import.meta.env?.DEV || ['localhost', '127.0.0.1'].includes(location.hostname)
  if (!local) return null
  const asked = new URLSearchParams(location.search).get('intro')
  return asked === 'en' || asked === 'fr1' || asked === 'fr2' ? asked : null
}

// Every visitor, French or English, gets one of the French intros at random on the first visit and keeps it.
// The English intro stays reachable with ?intro=en for testing.
export function pickIntro(random = Math.random): IntroId {
  const forced = flagged()
  if (forced) return forced
  try {
    const kept = localStorage.getItem(PICKED)
    if (kept === 'fr1' || kept === 'fr2') return kept
    const id = french[random() < 0.5 ? 0 : 1]
    localStorage.setItem(PICKED, id)
    return id
  } catch {
    return french[random() < 0.5 ? 0 : 1]
  }
}
