import { actionHref } from '../api/client'
import type { Action } from '../api/types'
import { useT, type Strings } from '../i18n'
import './Actions.css'

export function actionLabel(a: Action, kinds: string[], t: Strings) {
  const l = t.actions
  switch (a.kind) {
    case 'tickets':
      return l.tickets
    case 'offer':
      return l.offer
    case 'booking':
      return kinds.includes('restaurant') ? l.bookTable : l.book
    case 'venue_page':
      return a.provider === 'shotgun' ? l.shotgun : a.provider === 'resident_advisor' ? l.ra : l.venue
    case 'website':
      return l.website
    case 'directions':
      return l.directions
  }
}

type LinkProps = { action: Action; kinds: string[]; main?: boolean; focusable?: boolean }

export function ActionLink({ action, kinds, main = false, focusable = true, label }: LinkProps & { label?: string }) {
  const t = useT()
  return (
    <a
      className={main ? 'action action-main' : 'action'}
      href={actionHref(action)}
      target="_blank"
      rel="noopener"
      tabIndex={focusable ? 0 : -1}
      onClick={(e) => e.stopPropagation()}
    >
      {label ?? actionLabel(action, kinds, t)}
    </a>
  )
}

export default function Actions({ actions, kinds, focusable = true }: { actions: Action[]; kinds: string[]; focusable?: boolean }) {
  const t = useT()
  if (actions.length === 0) return null
  return (
    <div className="actions" role="group" aria-label={t.moreActions}>
      {actions.map((a, i) => (
        <ActionLink key={`${a.kind}-${a.provider}`} action={a} kinds={kinds} main={i === 0} focusable={focusable} />
      ))}
    </div>
  )
}
