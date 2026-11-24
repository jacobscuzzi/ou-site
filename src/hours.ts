import type { Bar, OpeningPeriod } from './api/types'

const DAY = 1440
const WEEK = 7 * DAY
const DAYS = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun']

const paris = new Intl.DateTimeFormat('en-GB', { timeZone: 'Europe/Paris', weekday: 'short', hour: 'numeric', minute: 'numeric', hourCycle: 'h23' })

export type Clock = { day: number; minute: number }

export function parisNow(now = new Date()): Clock {
  const parts = paris.formatToParts(now)
  const part = (type: string) => parts.find((p) => p.type === type)?.value ?? ''
  return { day: DAYS.indexOf(part('weekday')) + 1, minute: Number(part('hour')) * 60 + Number(part('minute')) }
}

function minutes(hhmm: string) {
  const [h, m] = hhmm.split(':').map(Number)
  return h * 60 + m
}

function span(p: OpeningPeriod) {
  const open = minutes(p.open)
  const close = minutes(p.close)
  const start = (p.day - 1) * DAY + open
  return { start, end: start + (close > open ? close - open : close + DAY - open) }
}

export function currentPeriod(hours: OpeningPeriod[], at: Clock) {
  const m = (at.day - 1) * DAY + at.minute
  return (
    hours.find((p) => {
      const { start, end } = span(p)
      return (m >= start && m < end) || (m + WEEK >= start && m + WEEK < end)
    }) ?? null
  )
}

export type Opening = { day: number; open: string; inDays: number }

export function nextOpening(hours: OpeningPeriod[], at: Clock): Opening | null {
  const m = (at.day - 1) * DAY + at.minute
  let best: Opening | null = null
  let wait = Infinity
  for (const p of hours) {
    const w = (span(p).start - m + WEEK) % WEEK
    if (w === 0 || w >= wait) continue
    wait = w
    best = { day: p.day, open: p.open, inDays: (p.day - at.day + 7) % 7 }
  }
  return best
}

export type OpenStatus = { state: 'open'; until: string | null } | { state: 'closed'; next: Opening | null } | { state: 'unknown' }

export function openStatus(bar: Pick<Bar, 'hours' | 'openNow' | 'openUntil'>, at: Clock): OpenStatus {
  const open = bar.openNow ?? (bar.hours ? currentPeriod(bar.hours, at) !== null : bar.openUntil ? true : undefined)
  if (open === undefined) return { state: 'unknown' }
  if (open) return { state: 'open', until: bar.openUntil }
  return { state: 'closed', next: bar.hours ? nextOpening(bar.hours, at) : null }
}
