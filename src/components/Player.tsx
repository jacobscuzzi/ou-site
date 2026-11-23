import { useEffect, useRef } from 'react'
import { createPortal } from 'react-dom'
import type { Post } from '../api/types'
import { useT } from '../i18n'
import { CloseIcon } from './icons'
import './Player.css'

const PARAMS = 'description=1&music_info=1&rel=0'

export default function Player({ post, onClose }: { post: Post; onClose: () => void }) {
  const t = useT()
  const ref = useRef<HTMLDialogElement>(null)
  const opener = useRef(document.activeElement as HTMLElement | null)

  useEffect(() => {
    const dialog = ref.current
    dialog?.showModal()
    const back = opener.current
    return () => back?.focus({ preventScroll: true })
  }, [])

  return createPortal(
    <dialog
      ref={ref}
      className="player"
      aria-labelledby="player-title"
      onClose={onClose}
      onClick={(e) => {
        e.stopPropagation()
        if (e.target === e.currentTarget) ref.current?.close()
      }}
      onKeyDown={(e) => e.stopPropagation()}
    >
      <div className="player-box">
        <div className="player-head">
          <h2 id="player-title" className="player-title">TikTok · @{post.author}</h2>
          <button type="button" className="player-close" aria-label={t.close} onClick={() => ref.current?.close()}>
            <CloseIcon />
          </button>
        </div>
        <iframe
          className="player-frame"
          src={`https://www.tiktok.com/player/v1/${post.postId}?${PARAMS}`}
          title={t.postLabel(post.author, post.kind)}
          allow="fullscreen"
        />
        <p className="player-note">{t.playerNote}</p>
        <a className="btn-secondary player-link" href={post.url} target="_blank" rel="noopener noreferrer">
          {t.openTikTok}
        </a>
      </div>
    </dialog>,
    document.body,
  )
}
