import { useEffect, useRef, useState } from 'react'
import { createPortal } from 'react-dom'
import type { Action, Post } from '../api/types'
import { useBackClose } from '../backClose'
import { useLang, useT } from '../i18n'
import Actions from './Actions'
import { ArrowUpIcon, CloseIcon, HeartIcon, SoundIcon } from './icons'
import { PostStill } from './Posts'
import './TikTokFeed.css'

const PARAMS = 'autoplay=1&rel=0&description=0&music_info=0'
const SETTLE_MS = 300
const LOAD_MS = 6000

type Props = { posts: Post[]; place: string; actions: Action[]; kinds: string[]; start?: number; onClose: () => void }

type PlayerEvent = { type?: string; value?: unknown; errorCode?: number }

function playerEvent(data: unknown): PlayerEvent | null {
  let d = data
  if (typeof d === 'string') {
    try {
      d = JSON.parse(d)
    } catch {
      return null
    }
  }
  return d && typeof d === 'object' ? (d as PlayerEvent) : null
}

// Full-screen vertical feed of a place's TikToks. Only the slide the viewer rests on gets a player;
// every other slide shows its still.
export default function TikTokFeed({ posts, place, actions, kinds, start = 0, onClose }: Props) {
  const t = useT()
  const lang = useLang()
  const dialog = useRef<HTMLDialogElement>(null)
  const track = useRef<HTMLDivElement>(null)
  const frame = useRef<HTMLIFrameElement>(null)
  const [active, setActive] = useState(start)
  const [mounted, setMounted] = useState<number | null>(null)
  const [failed, setFailed] = useState<Set<number>>(new Set())
  const [swiped, setSwiped] = useState(false)
  const [sound, setSound] = useState(true)
  const activeRef = useRef(start)
  const soundRef = useRef(sound)
  const playing = useRef(false)
  const unmuted = useRef(false)
  soundRef.current = sound
  const withEnd = posts.length > 1 && actions.length > 0
  const compact = new Intl.NumberFormat(lang, { notation: 'compact', maximumFractionDigits: 1 })

  useBackClose(onClose)

  useEffect(() => {
    dialog.current?.showModal()
    const body = document.body.style.overflow
    document.body.style.overflow = 'hidden'
    const el = track.current
    if (el && start > 0) el.scrollTop = start * el.clientHeight
    return () => {
      document.body.style.overflow = body
    }
  }, [start])

  useEffect(() => {
    const el = track.current
    if (!el) return
    let timer = 0
    const settle = () => {
      clearTimeout(timer)
      timer = window.setTimeout(() => setMounted(activeRef.current < posts.length ? activeRef.current : null), SETTLE_MS)
    }
    const seen = new IntersectionObserver(
      (entries) => {
        for (const e of entries) {
          if (!e.isIntersecting) continue
          const i = Number((e.target as HTMLElement).dataset.i)
          if (i === activeRef.current) continue
          activeRef.current = i
          setActive(i)
          setMounted(null)
          setSwiped(true)
          settle()
        }
      },
      { root: el, threshold: 0.6 },
    )
    el.querySelectorAll('.feed-slide').forEach((s) => seen.observe(s))
    el.addEventListener('scroll', settle, { passive: true })
    settle()
    return () => {
      clearTimeout(timer)
      seen.disconnect()
      el.removeEventListener('scroll', settle)
    }
  }, [posts.length])

  useEffect(() => {
    if (swiped) setSound(false)
  }, [swiped])

  useEffect(() => {
    if (mounted === null) return
    const timer = window.setTimeout(() => setFailed((f) => new Set(f).add(mounted)), LOAD_MS)
    const loaded = () => clearTimeout(timer)
    const el = frame.current
    el?.addEventListener('load', loaded)
    return () => {
      clearTimeout(timer)
      el?.removeEventListener('load', loaded)
    }
  }, [mounted])

  useEffect(() => {
    const send = (type: string) => frame.current?.contentWindow?.postMessage({ type, value: null, 'x-tiktok-player': true }, '*')
    const onMessage = (e: MessageEvent) => {
      if (!e.origin.endsWith('tiktok.com') || e.source !== frame.current?.contentWindow) return
      const m = playerEvent(e.data)
      if (m?.type === 'onPlayerReady') {
        playing.current = false
        unmuted.current = false
        send(soundRef.current ? 'unMute' : 'mute')
        send('play')
      } else if (m?.type === 'onStateChange' && m.value === 1 && !playing.current) {
        playing.current = true
        if (soundRef.current) {
          unmuted.current = true
          send('unMute')
        }
      } else if (m?.type === 'onStateChange' && m.value === 2 && unmuted.current) {
        unmuted.current = false
        setSound(false)
        send('mute')
        send('play')
      } else if (m?.type === 'onPlayerError' && (m.errorCode === 3002 || (m.value as PlayerEvent | null)?.errorCode === 3002)) {
        setSound(false)
        send('mute')
        send('play')
      } else if (m?.type === 'onMute' && typeof m.value === 'boolean' && playing.current) {
        if (!m.value) unmuted.current = false
        setSound(!m.value)
      }
    }
    window.addEventListener('message', onMessage)
    return () => window.removeEventListener('message', onMessage)
  }, [])

  function toggleSound() {
    const next = !sound
    setSound(next)
    frame.current?.contentWindow?.postMessage({ type: next ? 'unMute' : 'mute', value: null, 'x-tiktok-player': true }, '*')
  }

  function go(i: number) {
    const el = track.current
    const last = posts.length - (withEnd ? 0 : 1)
    if (!el || i < 0 || i > last) return
    el.scrollTo({ top: i * el.clientHeight, behavior: 'smooth' })
  }

  const onVideo = active < posts.length

  return createPortal(
    <dialog
      ref={dialog}
      className="feed"
      aria-label={t.feedLabel(place)}
      onClose={onClose}
      onClick={(e) => e.stopPropagation()}
      onKeyDown={(e) => {
        e.stopPropagation()
        if (e.key === 'ArrowDown' || e.key === 'ArrowUp') {
          e.preventDefault()
          go(active + (e.key === 'ArrowDown' ? 1 : -1))
        }
      }}
    >
      <div className="feed-head">
        <h2 className="feed-place">{place}</h2>
        {mounted === active && !failed.has(active) && posts[active].kind === 'video' && (
          <button type="button" className="feed-icon" aria-pressed={sound} aria-label={sound ? t.soundOff : t.soundOn} onClick={toggleSound}>
            <SoundIcon on={sound} />
          </button>
        )}
        <button type="button" className="feed-icon" aria-label={t.close} autoFocus onClick={() => dialog.current?.close()}>
          <CloseIcon />
        </button>
      </div>

      {posts.length > 1 && onVideo && (
        <div className="feed-progress" aria-label={t.feedPosition(active + 1, posts.length)}>
          <span className="feed-dots" aria-hidden="true">
            {posts.map((p, i) => (
              <span key={p.postId} className="feed-dot" data-on={i === active || undefined} />
            ))}
          </span>
          <span className="feed-count" aria-hidden="true">
            {active + 1}/{posts.length}
          </span>
        </div>
      )}

      <div className="feed-track" ref={track}>
        {posts.map((p, i) => (
          <section key={p.postId} className="feed-slide" data-i={i} aria-label={t.postLabel(p.author, p.kind)}>
            <div className="feed-stage">
              <PostStill post={p} className="feed-still" />
              {mounted === i && !failed.has(i) && (
                <iframe
                  ref={frame}
                  className="feed-frame"
                  src={`https://www.tiktok.com/player/v1/${p.postId}?${PARAMS}`}
                  title={t.postLabel(p.author, p.kind)}
                  allow="autoplay; fullscreen; encrypted-media"
                />
              )}
              {failed.has(i) && (
                <a className="feed-fallback btn-primary" href={p.url} target="_blank" rel="noopener noreferrer">
                  {t.watchOnTikTok}
                </a>
              )}
            </div>
            <div className="feed-meta">
              <span className="feed-author">@{p.author}</span>
              {p.likes !== null && (
                <span className="feed-likes">
                  <HeartIcon size={12} />
                  {compact.format(p.likes)}
                </span>
              )}
              <a className="feed-open" href={p.url} target="_blank" rel="noopener noreferrer">
                {t.openOnTikTok}
              </a>
            </div>
            {i === 0 && posts.length > 1 && !swiped && <p className="feed-hint">
                <ArrowUpIcon size={14} />
                {t.swipeMore}
              </p>}
          </section>
        ))}
        {withEnd && (
          <section className="feed-slide feed-end" data-i={posts.length}>
            <h3 className="feed-end-title">{t.feedEnd}</h3>
            <p className="feed-end-place">{place}</p>
            <Actions actions={actions} kinds={kinds} />
          </section>
        )}
      </div>
    </dialog>,
    document.body,
  )
}
