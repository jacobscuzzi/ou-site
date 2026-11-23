import { useState } from 'react'
import type { Post } from '../api/types'
import { useLang, useT } from '../i18n'
import { HeartIcon, ImagesIcon, PlayIcon } from './icons'
import Player from './Player'
import './Posts.css'

export default function Posts({ posts, focusable }: { posts: Post[]; focusable: boolean }) {
  const t = useT()
  const lang = useLang()
  const [playing, setPlaying] = useState<Post | null>(null)

  if (posts.length === 0) return null
  const compact = new Intl.NumberFormat(lang, { notation: 'compact', maximumFractionDigits: 1 })

  return (
    <section className="posts">
      <h3 className="menu-title">{t.postsTitle}</h3>
      <ul className="posts-row">
        {posts.slice(0, 3).map((p) => (
          <li key={p.postId}>
            <button
              type="button"
              className="post"
              tabIndex={focusable ? 0 : -1}
              aria-label={t.postLabel(p.author, p.kind)}
              onClick={(e) => {
                e.stopPropagation()
                setPlaying(p)
              }}
            >
              <span className="post-play">{p.kind === 'photo' ? <ImagesIcon /> : <PlayIcon />}</span>
              <span className="post-author">@{p.author}</span>
              {p.likes !== null && (
                <span className="post-likes">
                  <HeartIcon />
                  {compact.format(p.likes)}
                </span>
              )}
            </button>
          </li>
        ))}
      </ul>
      {playing && <Player post={playing} onClose={() => setPlaying(null)} />}
    </section>
  )
}
