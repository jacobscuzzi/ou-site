import { useEffect, useRef, useState, type CSSProperties } from 'react'
import { logEvent } from '../api/log'
import { useLang, useT } from '../i18n'
import { pickIntro, variants, type IntroVariant, type Place } from './introVariants'
import Logo from './Logo'
import './Intro.css'

// The intro plays on every page load (Jakob, 25 Nov: it is part of the brand); tests switch it off with ou-intro-off.
const OFF = 'ou-intro-off'
const FONT_WAIT = 400
const LIFT_AT = 1800
const LIFT_MS = 400
const SKIP_MS = 200
const REDUCED_HOLD = 600

export function introWanted(): boolean {
  try {
    return localStorage.getItem(OFF) === null
  } catch {
    return true
  }
}

function fontsReady(v: IntroVariant): Promise<boolean> {
  if (!document.fonts?.load) return Promise.resolve(false)
  const wanted = v.words.map((w) => document.fonts.load(`${w.size}px "ou intro ${w.wet ? 'wet' : 'spray'}"`, w.text))
  const load = Promise.all(wanted)
    .then((sets) => sets.every((s) => s.length > 0))
    .catch(() => false)
  const late = new Promise<boolean>((resolve) => setTimeout(() => resolve(false), FONT_WAIT))
  return Promise.race([load, late])
}

function reducedMotion(): boolean {
  return window.matchMedia?.('(prefers-reduced-motion: reduce)').matches ?? false
}

function place(at: Place) {
  const u = (n?: number) => (n === undefined ? undefined : `calc(${n} * var(--u))`)
  return {
    '--x': u(at.x),
    '--y': u(at.y),
    marginTop: u(at.top),
    marginRight: u(at.right),
    marginBottom: u(at.bottom),
    marginLeft: u(at.left),
  }
}

function Words({ v }: { v: IntroVariant }) {
  return (
    <div className="intro-words" data-layout={v.layout} style={{ '--gap': `calc(${v.gap} * var(--u))`, scale: v.fit?.scale, translate: v.fit && `calc(${v.fit.x} * var(--u)) 0` } as CSSProperties} aria-hidden="true">
      {v.words.map((w) => (
        <span
          key={w.text}
          className="intro-line"
          data-pink={w.pink || undefined}
          data-wet={w.wet || undefined}
          style={
            {
              ...place(w.at),
              fontSize: `calc(${w.size} * var(--u))`,
              rotate: `${w.rotate}deg`,
              animationDelay: `${w.delay}ms`,
              lineHeight: w.height,
              letterSpacing: w.spacing === undefined ? undefined : `${w.spacing}em`,
            } as CSSProperties
          }
        >
          {w.text}
        </span>
      ))}
      <span className="intro-logo" data-hit={v.logo.hit || undefined} style={{ ...place(v.logo.at), animationDelay: `${v.logo.delay}ms` } as CSSProperties}>
        <Logo size={`calc(${v.logo.size} * var(--u))`} asking={v.logo.tilt} />
      </span>
    </div>
  )
}

// The lettering, the logo, then the black screen lifts off the map that loaded underneath.
export default function Intro({ onDone }: { onDone: () => void }) {
  const t = useT()
  const lang = useLang()
  const [v] = useState(() => variants[pickIntro()])
  const [phase, setPhase] = useState<'wait' | 'play' | 'lift'>('wait')
  const done = useRef(onDone)
  done.current = onDone
  const timers = useRef<number[]>([])

  useEffect(() => {
    let live = true
    void fontsReady(v).then((ok) => {
      if (!live) return
      if (!ok) return done.current()
      const hold = reducedMotion() ? REDUCED_HOLD : LIFT_AT
      setPhase('play')
      logEvent('intro_variant', { variant: v.id })
      timers.current.push(window.setTimeout(() => setPhase('lift'), hold))
      timers.current.push(window.setTimeout(() => done.current(), hold + LIFT_MS))
    })
    return () => {
      live = false
      timers.current.forEach((id) => window.clearTimeout(id))
    }
  }, [v])

  function skip() {
    if (phase !== 'play') return
    timers.current.forEach((id) => window.clearTimeout(id))
    setPhase('lift')
    timers.current = [window.setTimeout(() => done.current(), SKIP_MS)]
  }

  if (phase === 'wait') return <div className="intro intro-wait" aria-hidden="true" />
  return (
    <div className="intro" lang={lang} data-variant={v.id} data-phase={phase} onPointerDown={skip} role="button" tabIndex={0} aria-label={t.skipIntro} onKeyDown={skip}>
      <p className="visually-hidden" lang={v.id === 'en' ? 'en' : 'fr'}>
        {v.label}
      </p>
      <Words v={v} />
    </div>
  )
}
