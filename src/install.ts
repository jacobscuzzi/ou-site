export type InstallKind = 'prompt' | 'android' | 'ios' | 'ios-share' | 'in-app'

type PromptEvent = Event & { prompt: () => Promise<void>; userChoice: Promise<{ outcome: string }> }

const VISITS_KEY = 'ou-visits'
const COUNTED_KEY = 'ou-visit-counted'
const DISMISSED_KEY = 'ou-install-dismissed'
const QUIET_DAYS = 14
const IN_APP = /musical_ly|BytedanceWebview|TikTok|Instagram|FBAN|FBAV/i
const IOS_OTHER = /CriOS|FxiOS|EdgiOS/

let deferred: PromptEvent | null = null
const listeners = new Set<() => void>()

window.addEventListener('beforeinstallprompt', (e) => {
  e.preventDefault()
  deferred = e as PromptEvent
  listeners.forEach((fn) => fn())
})

window.addEventListener('appinstalled', () => {
  deferred = null
  listeners.forEach((fn) => fn())
})

export function onInstallChange(fn: () => void) {
  listeners.add(fn)
  return () => {
    listeners.delete(fn)
  }
}

const ua = navigator.userAgent
export const isAndroid = /Android/i.test(ua)
const isIos = /iPhone|iPad|iPod/i.test(ua) || (/Macintosh/i.test(ua) && navigator.maxTouchPoints > 1)

export const isPhone = isAndroid || isIos

function standalone() {
  return window.matchMedia('(display-mode: standalone)').matches || (navigator as Navigator & { standalone?: boolean }).standalone === true
}

export function installKind(): InstallKind | null {
  if (standalone()) return null
  if (IN_APP.test(ua)) return isAndroid || isIos ? 'in-app' : null
  if (deferred) return 'prompt'
  if (isIos) return IOS_OTHER.test(ua) ? 'ios-share' : 'ios'
  return isAndroid ? 'android' : null
}

export async function promptInstall() {
  const e = deferred
  if (!e) return false
  deferred = null
  await e.prompt()
  const choice = await e.userChoice
  listeners.forEach((fn) => fn())
  return choice.outcome === 'accepted'
}

export function chromeIntent() {
  return `intent://${location.host}${location.pathname}${location.search}#Intent;scheme=https;package=com.android.chrome;end`
}

function countVisit(): number {
  try {
    let n = Number(localStorage.getItem(VISITS_KEY)) || 0
    if (!sessionStorage.getItem(COUNTED_KEY)) {
      sessionStorage.setItem(COUNTED_KEY, '1')
      n += 1
      localStorage.setItem(VISITS_KEY, String(n))
    }
    return n
  } catch {
    return 1
  }
}

export const visits = countVisit()

export function dismissedRecently() {
  try {
    const at = Number(localStorage.getItem(DISMISSED_KEY))
    return at > 0 && Date.now() - at < QUIET_DAYS * 24 * 60 * 60 * 1000
  } catch {
    return false
  }
}

export function dismissInstall() {
  try {
    localStorage.setItem(DISMISSED_KEY, String(Date.now()))
  } catch {
    // storage unavailable, the hint just comes back next visit
  }
}
