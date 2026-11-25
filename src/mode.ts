import { createContext, useContext } from 'react'
import type { Layer } from './api/types'

export const LAYERS: Layer[] = ['drink', 'eat', 'dance', 'coffee']

export const layerEmoji: Record<Layer, string> = {
  drink: '\u{1F37A}',
  eat: '\u{1F37D}\u{FE0F}',
  dance: '\u{1F483}',
  coffee: '\u{2615}',
}

const KEY = 'ou-layer'
const DANCE_NIGHTS = ['Thu', 'Fri', 'Sat']
const MORNING_AFTER = ['Fri', 'Sat', 'Sun']

const paris = new Intl.DateTimeFormat('en-GB', { timeZone: 'Europe/Paris', weekday: 'short', hour: 'numeric', hourCycle: 'h23' })

export function defaultLayer(now = new Date()): Layer {
  const parts = paris.formatToParts(now)
  const hour = Number(parts.find((p) => p.type === 'hour')?.value)
  const day = parts.find((p) => p.type === 'weekday')?.value ?? ''
  if (hour >= 6 && hour < 11) return 'coffee'
  if (hour >= 11 && hour < 15) return 'eat'
  if (hour >= 15 && hour < 18) return 'coffee'
  if (hour >= 18 && hour < 23) return 'drink'
  const danceNight = hour >= 23 ? DANCE_NIGHTS.includes(day) : MORNING_AFTER.includes(day)
  return danceNight ? 'dance' : 'drink'
}

// The layer a first visitor lands in when they skip the question.
export function firstLayer(now = new Date()): Layer {
  const parts = paris.formatToParts(now)
  const hour = Number(parts.find((p) => p.type === 'hour')?.value)
  const day = parts.find((p) => p.type === 'weekday')?.value ?? ''
  if (hour >= 6 && hour < 11) return 'coffee'
  if ((hour >= 11 && hour < 15) || (hour >= 18 && hour < 21)) return 'eat'
  if ((hour >= 15 && hour < 18) || (hour >= 21 && hour < 23)) return 'drink'
  const danceNight = hour >= 23 ? DANCE_NIGHTS.includes(day) : MORNING_AFTER.includes(day)
  return danceNight ? 'dance' : 'drink'
}

const ASKED = 'ou-mode-asked'

export function modeWanted(): boolean {
  try {
    return localStorage.getItem(ASKED) === null && stored() === null && fromUrl() === null
  } catch {
    return false
  }
}

export function modeAsked() {
  try {
    localStorage.setItem(ASKED, '1')
  } catch {
    // storage unavailable, the question may come back next visit
  }
}

export function isLayer(v: string | null): v is Layer {
  return v !== null && (LAYERS as string[]).includes(v)
}

function fromUrl(): Layer | null {
  const params = new URLSearchParams(location.search)
  const layer = params.get('layer')
  if (isLayer(layer)) return layer
  const mode = params.get('mode')
  if (mode === 'food') return 'eat'
  if (mode === 'drink') return 'drink'
  return null
}

export function rememberLayer(layer: Layer) {
  try {
    localStorage.setItem(KEY, layer)
  } catch {
    // storage unavailable, the pick lasts until the page reloads
  }
}

function stored(): Layer | null {
  try {
    const v = localStorage.getItem(KEY)
    return isLayer(v) ? v : null
  } catch {
    return null
  }
}

export function initialLayer(): { layer: Layer; asked: boolean } {
  const asked = fromUrl()
  if (asked) {
    rememberLayer(asked)
    return { layer: asked, asked: true }
  }
  return { layer: stored() ?? defaultLayer(), asked: false }
}

export const LayerContext = createContext<Layer>('drink')

export function useLayer() {
  return useContext(LayerContext)
}
