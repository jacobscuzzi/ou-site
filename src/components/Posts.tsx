import type { Post } from '../api/types'
import { useLang, useT } from '../i18n'
import { allowTikTok, useTikTokAllowed } from '../tiktok'
import { HeartIcon, ImagesIcon, PlayIcon } from './icons'
import './Posts.css'

const PARAMS = 'description=0&music_info=0&rel=0&controls=1&progress_bar=1&play_button=1&volume_control=1&fullscreen_button=1'

// The TikToks of a venue or an event in one row that scrolls sideways; the players load once the
// viewer has said yes, and each one only when it comes near the screen.
export default function Posts({ posts, focusable }: { posts: Post[]; focusable: boolean }) {
  const t = useT()
  const lang = useLang()
  const allowed = useTikTokAllowed()

  if (posts.length === 0) return null
  const compact = new Intl.NumberFormat(lang, { notation: 'compact', maximumFractionDigits: 1 })

  return (
    <section className="posts" onClick={(e) => e.stopPropagation()} onKeyDown={(e) => e.stopPropagation()}>
      <h3 className="menu-title">
        {t.postsTitle}
        {posts.length > 1 && <span className="posts-count">{posts.length}</span>}
      </h3>
      <ul className="posts-row" data-single={posts.length === 1 || undefined}>
        {posts.map((p) => (
          <li key={p.postId} className="post">
            {allowed ? (
              <iframe
                className="post-frame"
                src={`https://www.tiktok.com/player/v1/${p.postId}?${PARAMS}`}
                title={t.postLabel(p.author, p.kind)}
                loading="lazy"
                allow="fullscreen; encrypted-media"
                tabIndex={focusable ? 0 : -1}
              />
            ) : (
              <button
                type="button"
                className="post-cover"
                tabIndex={focusable ? 0 : -1}
                aria-label={`${t.showTikToks}. ${t.postLabel(p.author, p.kind)}`}
                onClick={allowTikTok}
              >
                <span className="post-play">{p.kind === 'photo' ? <ImagesIcon /> : <PlayIcon />}</span>
                <span className="post-show">{t.showTikToks}</span>
              </button>
            )}
            <a className="post-meta" href={p.url} target="_blank" rel="noopener noreferrer" tabIndex={focusable ? 0 : -1}>
              <span className="post-author">@{p.author}</span>
              {p.likes !== null && (
                <span className="post-likes">
                  <HeartIcon />
                  {compact.format(p.likes)}
                </span>
              )}
            </a>
          </li>
        ))}
      </ul>
      {!allowed && <p className="posts-note">{t.playerNote}</p>}
    </section>
  )
}
