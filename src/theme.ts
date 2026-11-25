import { useEffect, useState } from 'react'

export type Theme = 'light' | 'dark'

// The theme lives in one attribute, html[data-theme], set from prefers-color-scheme by index.html.
// A manual toggle later only has to set data-theme-lock and data-theme.
export function currentTheme(): Theme {
  return document.documentElement.dataset.theme === 'dark' ? 'dark' : 'light'
}

export function onTheme(fn: (t: Theme) => void) {
  const obs = new MutationObserver(() => fn(currentTheme()))
  obs.observe(document.documentElement, { attributes: true, attributeFilter: ['data-theme'] })
  return () => obs.disconnect()
}

export function useTheme(): Theme {
  const [theme, setTheme] = useState(currentTheme)
  useEffect(() => onTheme(setTheme), [])
  return theme
}
