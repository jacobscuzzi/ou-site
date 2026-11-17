import { useEffect, useState, type RefObject } from 'react'
import type { Map as MaplibreMap } from 'maplibre-gl'
import { setMetroVisible, type MetroTokens } from './metro'

const KEY = 'ou-metro'

function stored() {
  try {
    return localStorage.getItem(KEY) !== 'off'
  } catch {
    return true
  }
}

export function useMetro(mapRef: RefObject<MaplibreMap | null>, tokens: RefObject<MetroTokens | null>, loaded: boolean) {
  const [on, setOn] = useState(stored)

  useEffect(() => {
    const map = mapRef.current
    const tk = tokens.current
    if (!loaded || !map || !tk) return
    let current = true
    void setMetroVisible(map, on, tk).then((ok) => {
      if (!ok && current) setOn(false)
    })
    return () => {
      current = false
    }
  }, [on, loaded, mapRef, tokens])

  function toggle() {
    const next = !on
    setOn(next)
    try {
      localStorage.setItem(KEY, next ? 'on' : 'off')
    } catch {
      // storage unavailable, the choice just lasts for this visit
    }
  }

  return [on, toggle] as const
}
