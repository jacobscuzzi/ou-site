import { useSyncExternalStore } from 'react'

// TikTok embeds load content and cookies from TikTok, so they wait for one yes from the viewer;
// the answer is kept in this browser.
const KEY = 'ou-tiktok'
const listeners = new Set<() => void>()
let allowed = read()

function read() {
  try {
    return localStorage.getItem(KEY) === 'yes'
  } catch {
    return false
  }
}

export function allowTikTok() {
  allowed = true
  try {
    localStorage.setItem(KEY, 'yes')
  } catch {
    // private window: the yes lasts for this visit
  }
  listeners.forEach((l) => l())
}

function subscribe(l: () => void) {
  listeners.add(l)
  return () => listeners.delete(l)
}

export function useTikTokAllowed() {
  return useSyncExternalStore(subscribe, () => allowed)
}
