import { useEffect, useRef } from 'react'
import { useLang, useT } from '../i18n'
import { dayNumber, longDay, shortDay, type Night } from '../night'
import { CalendarIcon } from './icons'
import './DayStrip.css'

type Props = {
  days: string[]
  counts: Record<string, number> | null
  value: Night | null
  onPick: (n: Night) => void
  onCalendar?: () => void
}

export default function DayStrip({ days, counts, value, onPick, onCalendar }: Props) {
  const t = useT()
  const lang = useLang()
  const box = useRef<HTMLDivElement>(null)
  const first = days[0]

  useEffect(() => {
    const el = box.current?.querySelector<HTMLElement>('[aria-pressed="true"]')
    el?.scrollIntoView({ block: 'nearest', inline: 'nearest' })
  }, [value?.from])

  return (
    <div className="strip" role="group" aria-label={t.nightsLabel}>
      <div className="strip-days" ref={box}>
        {days.map((day) => {
          const on = value?.from === day && value.to === day
          const n = counts?.[day]
          return (
            <button
              key={day}
              type="button"
              className={on ? 'strip-day strip-day-on' : 'strip-day'}
              aria-pressed={on}
              aria-label={`${day === first ? t.tonight : longDay(day, lang)}${n !== undefined ? `, ${t.partiesCount(n)}` : ''}`}
              onClick={() => onPick({ from: day, to: day })}
            >
              <span className="strip-name">{day === first ? t.tonight : shortDay(day, lang)}</span>
              {day !== first && <span className="strip-num">{dayNumber(day)}</span>}
              <span className={n ? 'strip-count' : 'strip-count strip-count-none'} aria-hidden="true">
                {n === undefined ? '' : n}
              </span>
            </button>
          )
        })}
      </div>
      {onCalendar && (
        <button type="button" className="strip-cal" aria-label={t.moreDates} onClick={onCalendar}>
          <CalendarIcon />
        </button>
      )}
    </div>
  )
}
