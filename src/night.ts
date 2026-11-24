import type { Lang } from './i18n'

export type Night = { from: string; to: string }

const DAY = 86_400_000
const DATE = /^\d{4}-\d{2}-\d{2}$/
export const STRIP_DAYS = 14

function parisDay(d: Date) {
  return new Intl.DateTimeFormat('en-CA', { timeZone: 'Europe/Paris', year: 'numeric', month: '2-digit', day: '2-digit' }).format(d)
}

// A night runs from 12:00 to 06:00: before 06:00 it is still the previous day's night.
export function tonight(now = new Date()) {
  return parisDay(new Date(now.getTime() - 6 * 3_600_000))
}

export function addDays(day: string, n: number) {
  return new Date(new Date(`${day}T12:00:00Z`).getTime() + n * DAY).toISOString().slice(0, 10)
}

export function weekday(day: string) {
  const d = new Date(`${day}T12:00:00Z`).getUTCDay()
  return d === 0 ? 7 : d
}

export function nights(from: string, n: number) {
  return Array.from({ length: n }, (_, i) => addDays(from, i))
}

export function weekend(today = tonight()): Night {
  const wd = weekday(today)
  const sunday = addDays(today, 7 - wd)
  return { from: wd >= 5 ? today : addDays(today, 5 - wd), to: sunday }
}

export function sameNight(a: Night | null, b: Night | null) {
  return a?.from === b?.from && a?.to === b?.to
}

function fmt(day: string, lang: Lang, opts: Intl.DateTimeFormatOptions) {
  return new Intl.DateTimeFormat(lang === 'fr' ? 'fr-FR' : 'en-GB', { timeZone: 'UTC', ...opts }).format(new Date(`${day}T12:00:00Z`))
}

export function shortDay(day: string, lang: Lang) {
  const name = fmt(day, lang, { weekday: 'short' }).replace('.', '')
  return name.charAt(0).toUpperCase() + name.slice(1)
}

export function dayNumber(day: string) {
  return Number(day.slice(8, 10))
}

export function longDay(day: string, lang: Lang) {
  return fmt(day, lang, { weekday: 'long', day: 'numeric', month: 'long' })
}

export function shortDate(day: string, lang: Lang) {
  return fmt(day, lang, { day: 'numeric', month: 'short' }).replace('.', '')
}

export function monthTitle(day: string, lang: Lang) {
  const s = fmt(day, lang, { month: 'long', year: 'numeric' })
  return s.charAt(0).toUpperCase() + s.slice(1)
}

export function clockOf(iso: string | null) {
  if (!iso) return null
  const [h, m] = iso.slice(11, 16).split(':')
  return m === '00' ? `${h}h` : `${h}h${m}`
}

export function initialDate(): string | null {
  const asked = new URLSearchParams(location.search).get('date')
  return asked && DATE.test(asked) && asked >= tonight() ? asked : null
}

export function writeDate(date: string | null) {
  const url = new URL(location.href)
  if (date) url.searchParams.set('date', date)
  else url.searchParams.delete('date')
  if (url.href !== location.href) history.replaceState(history.state, '', url)
}
