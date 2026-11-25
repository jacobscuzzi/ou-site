import { useState, type ReactNode } from 'react'
import type { Bar, SignalKind } from '../api/types'
import { tick } from '../haptic'
import { useT } from '../i18n'
import { useLayer } from '../mode'
import { thumbOf } from '../photos'
import { mark, useMarks } from '../signals'
import { openReport } from '../toast'
import { BookmarkIcon, HeartIcon, MoreIcon, ThumbDownIcon } from './icons'
import './Marks.css'

// Like, want to go, not for me, and the report entry, on the card's photo. Tapping the active one undoes it.
export default function Marks({ bar }: { bar: Bar }) {
  const t = useT()
  const layer = useLayer()
  const marks = useMarks()
  const current = marks[bar.id]?.kind ?? null
  const [pop, setPop] = useState<SignalKind | null>(null)
  const [menu, setMenu] = useState(false)

  function set(kind: SignalKind) {
    const next = current === kind ? null : kind
    tick()
    setPop(next)
    mark(bar.id, next, {
      name: bar.name, lat: bar.lat, lng: bar.lng, layer, photo: thumbOf(bar.photos, bar.thumbs, 0), arrondissement: bar.arrondissement,
    })
  }

  const button = (kind: SignalKind, icon: ReactNode, off: string, on: string) => (
    <button
      type="button"
      className="mark"
      data-kind={kind}
      data-pop={pop === kind || undefined}
      aria-pressed={current === kind}
      aria-label={current === kind ? on : off}
      onAnimationEnd={() => setPop(null)}
      onClick={(e) => {
        e.stopPropagation()
        set(kind)
      }}
      onKeyDown={(e) => e.stopPropagation()}
    >
      {icon}
    </button>
  )

  return (
    <div className="marks" onClick={(e) => e.stopPropagation()}>
      {button('like', <HeartIcon size={18} />, t.like, t.liked)}
      {button('want', <BookmarkIcon />, t.want, t.wanted)}
      {button('dislike', <ThumbDownIcon />, t.dislike, t.disliked)}
      <div className="marks-more">
        <button
          type="button"
          className="mark"
          aria-label={t.moreOptions}
          aria-expanded={menu}
          onClick={(e) => {
            e.stopPropagation()
            setMenu((m) => !m)
          }}
          onKeyDown={(e) => e.stopPropagation()}
        >
          <MoreIcon />
        </button>
        {menu && (
          <div className="marks-menu" role="menu">
            <button
              type="button"
              role="menuitem"
              onClick={(e) => {
                e.stopPropagation()
                setMenu(false)
                openReport({ placeId: bar.id, title: bar.name, context: { layer, from: 'card' } })
              }}
            >
              {t.reportWrong}
            </button>
          </div>
        )}
      </div>
    </div>
  )
}
