import { lazy, Suspense, useEffect, useRef, useState } from 'react'
import type { Action, Post } from '../api/types'
import { useLang, useT } from '../i18n'
import { layerEmoji, useLayer } from '../mode'
import { HeartIcon, PlayIcon } from './icons'
import './Posts.css'

const TikTokFeed = lazy(() => import('./TikTokFeed'))

type Props = { posts: Post[]; place: string; actions?: Action[]; kinds?: string[]; focusable: boolean }

export function PostStill({ post, className }: { post: Post; className: string }) {
  const layer = useLayer()
  if (post.thumb) return <img className={className} src={post.thumb} alt="" loading="lazy" decoding="async" />
  return (
    <span className={`${className} post-blank`}>
      <span className="post-blank-emoji">{layerEmoji[layer]}</span>
      <span className="post-blank-author">@{post.author}</span>
    </span>
  )
}

// The TikToks of a place or a party as one stacked preview; nothing loads from TikTok until it is
// tapped, then the feed opens over everything.
export default function Posts({ posts, place, actions = [], kinds = [], focusable }: Props) {
  const t = useT()
  const lang = useLang()
  const [open, setOpen] = useState(false)
  const opener = useRef<HTMLButtonElement>(null)
  const wasOpen = useRef(false)

  useEffect(() => {
    if (wasOpen.current && !open) opener.current?.focus({ preventScroll: true })
    wasOpen.current = open
  }, [open])

  if (posts.length === 0) return null
  // the server's order: posts about this place alone first, then the most liked
  const sorted = posts
  const top = sorted[0]
  const compact = new Intl.NumberFormat(lang, { notation: 'compact', maximumFractionDigits: 1 })

  return (
    <section className="posts" onClick={(e) => e.stopPropagation()} onKeyDown={(e) => e.stopPropagation()}>
      <button type="button" ref={opener} className="posts-preview" tabIndex={focusable ? 0 : -1} onClick={() => setOpen(true)}>
        <span className="posts-stack" data-n={Math.min(sorted.length, 3)}>
          {sorted.slice(0, 3).map((p) => (
            <PostStill key={p.postId} post={p} className="posts-still" />
          ))}
          <span className="posts-play">
            <PlayIcon />
          </span>
          {sorted.length > 1 && <span className="posts-badge">{sorted.length}</span>}
        </span>
        <span className="posts-text">
          <span className="posts-title">{t.watchPosts(sorted.length)}</span>
          <span className="posts-meta">
            <span className="post-author">@{top.author}</span>
            {top.likes !== null && (
              <span className="post-likes">
                <HeartIcon />
                {compact.format(top.likes)}
              </span>
            )}
          </span>
        </span>
      </button>
      {open && (
        <Suspense fallback={null}>
          <TikTokFeed
            posts={sorted}
            place={place}
            actions={actions}
            kinds={kinds}
            onClose={() => setOpen(false)}
          />
        </Suspense>
      )}
    </section>
  )
}
