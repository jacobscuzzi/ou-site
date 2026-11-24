import { useState } from 'react'
import type { Bar } from '../api/types'
import { openStatus, parisNow, type OpenStatus } from '../hours'
import { useT, type Strings } from '../i18n'
import { DownIcon } from './icons'
import './Hours.css'

const WEEK = [1, 2, 3, 4, 5, 6, 7]

function detail(s: OpenStatus, t: Strings) {
  if (s.state === 'open') return s.until ? t.hoursUntil(s.until) : t.hoursAllDay
  if (s.state !== 'closed' || !s.next) return null
  if (s.next.inDays === 0) return t.hoursOpens(s.next.open)
  if (s.next.inDays === 1) return t.hoursOpensTomorrow(s.next.open)
  return t.hoursOpensDay(t.days[s.next.day - 1], s.next.open)
}

export default function Hours({ bar }: { bar: Bar }) {
  const t = useT()
  const [week, setWeek] = useState(false)
  const now = parisNow()
  const status = openStatus(bar, now)
  const rest = detail(status, t)
  const hours = bar.hours
  const line = (
    <>
      <span className="hours-dot" aria-hidden="true" />
      <strong className="hours-state">{t.hoursState[status.state]}</strong>
      {rest && <span className="hours-rest">{rest}</span>}
    </>
  )

  if (!hours) return <p className={`hours hours-line hours-${status.state}`}>{line}</p>

  return (
    <div className={`hours hours-${status.state}`} onClick={(e) => e.stopPropagation()}>
      <button type="button" className="hours-line" aria-expanded={week} onClick={() => setWeek(!week)}>
        {line}
        <span className={week ? 'hours-toggle hours-toggle-on' : 'hours-toggle'}>
          <span className="visually-hidden">{t.hoursWeek}</span>
          <DownIcon size={16} />
        </span>
      </button>
      {week && (
        <table className="hours-week">
          <caption className="visually-hidden">{t.hoursWeek}</caption>
          <tbody>
            {WEEK.map((day) => {
              const periods = hours.filter((p) => p.day === day)
              return (
                <tr key={day} className={day === now.day ? 'hours-today' : undefined}>
                  <th scope="row">{t.days[day - 1]}</th>
                  <td>
                    {periods.length === 0
                      ? t.hoursDayClosed
                      : periods.map((p) => (p.open === p.close ? t.hoursAllDay : `${p.open}–${p.close}`)).join(', ')}
                  </td>
                </tr>
              )
            })}
          </tbody>
        </table>
      )}
    </div>
  )
}
