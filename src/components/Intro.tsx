import { useEffect, useRef, useState } from 'react'
import { useT } from '../i18n'
import Logo from './Logo'
import './Intro.css'

const KEY = 'ou-intro-seen'
const FONT_WAIT = 400
const LIFT_AT = 1800
const LIFT_MS = 400
const SKIP_MS = 200

export function introWanted(): boolean {
  try {
    return localStorage.getItem(KEY) === null && !new URLSearchParams(location.search).has('layer')
  } catch {
    return false
  }
}

function seen() {
  try {
    localStorage.setItem(KEY, '1')
  } catch {
    // storage unavailable, the intro may show again next time
  }
}

function fontsReady(): Promise<boolean> {
  if (!document.fonts?.load) return Promise.resolve(false)
  const load = Promise.all([document.fonts.load('92px "ou intro spray"', 'Where'), document.fonts.load('132px "ou intro wet"', 'fuck')])
    .then((sets) => sets.every((s) => s.length > 0))
    .catch(() => false)
  const late = new Promise<boolean>((resolve) => setTimeout(() => resolve(false), FONT_WAIT))
  return Promise.race([load, late])
}

// First visit only: the lettering, the logo, then the black screen lifts off the map that loaded underneath.
export default function Intro({ onDone }: { onDone: () => void }) {
  const t = useT()
  const [phase, setPhase] = useState<'wait' | 'play' | 'lift'>('wait')
  const done = useRef(onDone)
  done.current = onDone
  const timers = useRef<number[]>([])

  useEffect(() => {
    let live = true
    void fontsReady().then((ok) => {
      if (!live) return
      if (!ok) return done.current()
      seen()
      setPhase('play')
      timers.current.push(window.setTimeout(() => setPhase('lift'), LIFT_AT))
      timers.current.push(window.setTimeout(() => done.current(), LIFT_AT + LIFT_MS))
    })
    return () => {
      live = false
      timers.current.forEach((id) => window.clearTimeout(id))
    }
  }, [])

  function skip() {
    if (phase !== 'play') return
    timers.current.forEach((id) => window.clearTimeout(id))
    setPhase('lift')
    timers.current = [window.setTimeout(() => done.current(), SKIP_MS)]
  }

  if (phase === 'wait') return <div className="intro intro-wait" aria-hidden="true" />
  return (
    <div className="intro" data-phase={phase} onPointerDown={skip} role="button" tabIndex={0} aria-label={t.skipIntro} onKeyDown={skip}>
      <p className="visually-hidden">{t.introLabel}</p>
      <div className="intro-words" aria-hidden="true">
        <span className="intro-line intro-where">Where</span>
        <span className="intro-line intro-the">the</span>
        <span className="intro-line intro-fuck">fuck</span>
        <span className="intro-line intro-paris">in Paris?</span>
        <span className="intro-logo">
          <Logo size="calc(76 * var(--u))" />
        </span>
      </div>
    </div>
  )
}
